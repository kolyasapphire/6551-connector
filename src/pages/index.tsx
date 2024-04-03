import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWalletClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { useAccounts } from '@/hooks/useAccounts'

import { createWeb3Wallet } from '@/lib/web3WalletClient/Web3WalletClient'

export default function Home() {
  const account = useAccount()
  const { data: wallet } = useWalletClient()

  const [tbaAddress, setTbaAddress] = useState<`0x${string}`>()
  const [wcUri, setWcUri] = useState<string>()

  const tbas = useAccounts({
    owner: account.address,
    chain: account.chain?.name.toLowerCase(),
  })

  useEffect(() => {
    const func = async () => {
      if (wallet && wcUri && tbaAddress && account.chain) {
        await createWeb3Wallet(wallet, wcUri, tbaAddress, account.chain.id)
      }
    }
    func()
  }, [wallet, wcUri, tbaAddress, account.chain])

  if (!account.address) return <ConnectButton />

  if (tbas && !tbaAddress)
    return (
      <>
        Choose your tokenbound account:
        {tbas.data?.map((x) => (
          <div key={x.id}>
            <button
              onClick={() => {
                setTbaAddress(x?.address.addresses[0])
              }}
            >
              {x?.address.addresses[0]}
            </button>
          </div>
        ))}
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

  return `${tbaAddress} Connected! Now interact with the dApp without closing this tab`
}
