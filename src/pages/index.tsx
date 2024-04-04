import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWalletClient } from 'wagmi'
import { useState, useEffect } from 'react'

import { createWeb3Wallet } from '@/lib/web3WalletClient/Web3WalletClient'
import { destroyClient } from '@/lib/web3WalletClient/Web3WalletClient'

export default function Home() {
  const account = useAccount()
  const { data: wallet } = useWalletClient()

  const [tbaAddress, setTbaAddress] = useState<`0x${string}`>()
  const [wcUri, setWcUri] = useState<string>()

  useEffect(() => {
    const func = async () => {
      await destroyClient()
    }
    func()
  }, [])

  useEffect(() => {
    const func = async () => {
      if (wallet && wcUri && tbaAddress && account.chain) {
        await createWeb3Wallet(wallet, wcUri, tbaAddress, account.chain.id)
      }
    }
    func()
  }, [wallet, wcUri, tbaAddress, account.chain])

  if (!account.address)
    return (
      <>
        Connect your wallet on the same chain tba is on: <ConnectButton />
      </>
    )

  if (!tbaAddress)
    return (
      <>
        Paste your tokenbound account address:
        <input
          onChange={(e) => {
            setTbaAddress(e.target.value as `0x${string}`)
          }}
        />
      </>
    )

  if (!wcUri) {
    return (
      <>
        Copy the WalletConnect connection string here (WalletConnect & click
        copy button):
        <input
          onChange={(e) => {
            setWcUri(e.target.value)
          }}
        />
      </>
    )
  }

  return `${tbaAddress} Connected! Now interact with the dApp without closing this tab. For correct operation disable tab energy saving mode in browsers`
}
