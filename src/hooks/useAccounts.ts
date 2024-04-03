import { useQuery } from '@tanstack/react-query'

type Account = {
  registry: `0x${string}` // '0x02101dfb77fde026414827fdc604ddaf224f0921'
  salt: string //  '0'
  standard: string // 'ERC6551'
  tokenAddress: `0x${string}` // '0x2404d7226b50c9497e32faa0c7bc005a4e7d507c'
  tokenId: string //  '1'
  id: string //  '26083515f4c92b9d497c633806908bf50fd64062be2d5d5527963a621be812bb'
  deployer: `0x${string}` // '0xa4660bf742d8b4e5d145c93a1241ce1fbb27119a'
  address: {
    addresses: `0x${string}`[]
  }
}

type AccountsReturn = {
  TokenBalances: {
    TokenBalance: [
      {
        tokenNfts: {
          erc6551Accounts: Account[] | null
        } | null
      }
    ]
  }
}

export const useAccounts = ({
  chain,
  owner,
}: {
  chain: string | undefined
  owner: `0x${string}` | undefined
}) =>
  useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!chain || !owner) return null

      const query = new URLSearchParams({ chain, owner }).toString()

      const res = await fetch('/api/accounts?' + query)
      const json = (await res.json()) as AccountsReturn

      const withoutNulls = json.TokenBalances.TokenBalance.filter(
        (x) => x.tokenNfts?.erc6551Accounts
      )

      const onlyNeeded = withoutNulls.flatMap(
        (x) => x.tokenNfts?.erc6551Accounts
      ) as Required<Account>[]

      return onlyNeeded
    },
    enabled: !!(chain && owner),
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
