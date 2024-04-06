import '@rainbow-me/rainbowkit/styles.css'

import type { AppProps } from 'next/app'

import { WagmiProvider } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { WALLETCONNECT_PROJECT_ID_DAPP } from '@/constants'

const wagmiConfig = getDefaultConfig({
  appName: '6551 Connector',
  projectId: WALLETCONNECT_PROJECT_ID_DAPP!,
  chains: [mainnet, sepolia],
  ssr: true,
})

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
