import type { NextApiRequest, NextApiResponse } from 'next'

import { init, fetchQuery } from '@airstack/node'

init(process.env.AIRSTACK_KEY!)

const QUERY = `
query Accounts ($chain: TokenBlockchain!, $owner: Identity!) {
	TokenBalances(input: {filter: {owner: {_eq: $owner}}, blockchain: $chain}) {
		TokenBalance {
			tokenNfts {
				erc6551Accounts {
					registry
					salt
					standard
					tokenAddress
					tokenId
					id
					deployer
					address {
						addresses
					}
				}
			}
		}
	}
}
`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chain, owner } = req.query

  if (!chain || !owner) {
    res.status(400).send('Bad input')
    return
  }

  const { data, error } = await fetchQuery(QUERY, { chain, owner })

  if (error) {
    res.status(500).json(error)
    return
  }

  res.json(data)
}
