import { useWalletClient } from 'wagmi'

import { TokenboundClient } from '@tokenbound/sdk'

import { sepolia } from 'viem/chains'

export default function Home() {
  const { data: wallet } = useWalletClient()

  const deploy = async () => {
    await wallet?.switchChain({ id: sepolia.id })

    const sdk = new TokenboundClient({
      chainId: sepolia.id,
    })

    const tx = await sdk.prepareCreateAccount({
      tokenContract: '0x123',
      tokenId: '1',
      chainId: sepolia.id,
    })

    await wallet?.sendTransaction({ ...tx, chain: sepolia })
  }

  return (
    <button
      onClick={() => {
        deploy()
      }}
    >
      deploy
    </button>
  )
}
