import { Core } from '@walletconnect/core'

import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet'
import { buildApprovedNamespaces } from '@walletconnect/utils'
import { getSdkError } from '@walletconnect/utils'

import { TokenboundClient } from '@tokenbound/sdk'

import KeyValueStorage from './KeyValueStorage'
import clearLocalStorage from './clearLocalStorage'

import type { WalletClient } from 'viem'

import { WALLETCONNECT_PROJECT_ID_WALLET } from '@/constants'

let isInitialized = false

export let web3wallet: IWeb3Wallet
export let walletClient: WalletClient

export const createWeb3Wallet = async (
  wallet: WalletClient,
  wcUri: string,
  tbaAddress: `0x${string}`,
  chainId: number
) => {
  if (isInitialized) return

  isInitialized = true

  const protocol = new URL(wcUri).searchParams.get('relay-protocol')

  if (!protocol) {
    return
  }

  walletClient = wallet
  web3wallet = await Web3Wallet.init({
    core: new Core({
      projectId: WALLETCONNECT_PROJECT_ID_WALLET,
      storage: new KeyValueStorage(),
    }),
    metadata: {
      name: 'App',
      description: '6551 Connector',
      url: '',
      icons: [],
    },
  })

  console.debug('initialized Web3WalletClient instance')

  web3wallet.on('session_proposal', async (sessionProposal) => {
    console.debug('received session proposal', sessionProposal)

    const { id, params } = sessionProposal

    let approvedNamespaces:
      | ReturnType<typeof buildApprovedNamespaces>
      | undefined

    try {
      approvedNamespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: {
          eip155: {
            chains: [
              // 'eip155:1',
              `eip155:${chainId}`,
            ],
            methods: [...params.optionalNamespaces.eip155.methods],
            events: ['accountsChanged', 'chainChanged'],
            accounts: [
              // `eip155:1:${tbaAddress}`,
              `eip155:${chainId}:${tbaAddress}`,
            ],
          },
        },
      })
    } catch (e) {
      console.error('incompatible WC session namespaces', e)
      return
    }

    try {
      await web3wallet.approveSession({
        id,
        namespaces: approvedNamespaces,
      })
      console.debug('approved session proposal')
    } catch (e) {
      console.error('failed to approve session proposal', e)
      return
    }

    try {
      await changeChain(chainId)
    } catch (e) {
      console.error('failed to switch dApp chain to NFT chain', e)
      return
    }
  })

  web3wallet.on('session_request', async (event) => {
    const { topic, params, id } = event
    const { request } = params

    console.debug('new request', event)

    if (request.method === 'eth_sendTransaction') {
      const receivedCall = request.params[0]
      const cleanedCall = {
        to: receivedCall.to,
        value: receivedCall.value ?? 0,
        data: receivedCall.data ?? '0x',
      }

      const tokenboundClient = new TokenboundClient({ chainId })
      const tx = await tokenboundClient.prepareExecution({
        account: tbaAddress,
        to: cleanedCall.to as `0x${string}`,
        value: BigInt(cleanedCall.value),
        data: cleanedCall.data as `0x${string}`,
      })

      console.debug('prepared the tx', tx)

      try {
        const sentTxHash = await walletClient.sendTransaction({
          ...tx,
          chain: walletClient.chain,
          account: walletClient.account!,
        })

        console.debug('sent the tx', sentTxHash)

        await web3wallet.respondSessionRequest({
          topic,
          response: {
            jsonrpc: '2.0',
            id,
            result: sentTxHash,
          },
        })

        console.debug('responded to session request')
      } catch (e) {
        console.error('tx failed')
        console.error(e)

        await web3wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: {
              code: 5000,
              message: 'Tx failed.',
            },
          },
        })
      }
    } else if (request.method === 'personal_sign') {
      await handlePersonalSign(walletClient, topic, id, request.params[0])
    } else {
      await web3wallet.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: getSdkError('INVALID_METHOD'),
        },
      })
    }
  })

  try {
    await web3wallet.core.pairing.pair({
      uri: wcUri,
    })
  } catch (e) {
    console.error('WC session pairing failed', e)
  }
}

async function handlePersonalSign(
  walletClient: WalletClient,
  topic: string,
  id: number,
  hexMessage: `0x{string}`
) {
  console.debug('signing')
  try {
    const signature = await walletClient.signMessage({
      message: { raw: hexMessage },
      account: walletClient.account!,
    })

    console.log('signed', signature)

    await web3wallet.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result: signature,
      },
    })

    console.debug('responded to session request')
  } catch (e) {
    console.error('tx failed')
    console.error(e)

    await web3wallet.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: 'Tx failed.',
        },
      },
    })
  }
}

const changeChain = async (chainId: number) => {
  const sessions = web3wallet.getActiveSessions()
  const firstSession = sessions[Object.keys(sessions)[0]]

  await web3wallet.emitSessionEvent({
    topic: firstSession.topic,
    event: {
      name: 'chainChanged',
      data: chainId,
    },
    chainId: 'eip155:' + chainId,
  })
}

export const destroyClient = async () => {
  await disconnectIfConnected()

  web3wallet = undefined!
  walletClient = undefined!
  isInitialized = false

  await clearLocalStorage()
}

const disconnectIfConnected = async () => {
  if (!web3wallet) return

  const sessions = web3wallet.getActiveSessions()

  if (!sessions) return

  const firstSession = sessions[Object.keys(sessions)[0]]

  if (!firstSession) return

  await web3wallet.disconnectSession({
    topic: firstSession.topic,
    reason: getSdkError('USER_DISCONNECTED'),
  })
}
