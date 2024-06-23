import axios from 'axios'
import { BigNumber, utils } from 'ethers'

export async function getBeraPrice(): Promise<number> {
  const res = await axios.post(
    'https://api.goldsky.com/api/public/project_clq1h5ct0g4a201x18tfte5iv/subgraphs/bex-subgraph/v1/gn',
    {
      operationName: 'GetTokenHoneyPrice',
      variables: { id: '0x7507c1dc16935b82698e4c63f2746a2fcf994df8' },
      query:
        'query GetTokenHoneyPrice($id: String) {\n  tokenHoneyPrice(id: $id) {\n    id\n    price\n    __typename\n  }\n}',
    },
  )
  return Number(res.data.data.tokenHoneyPrice.price)
}

export async function getBexSwapRoute(
  fromAsset: string,
  toAsset: string,
  amount: BigNumber,
) {
  const res = await axios.get(
    'https://bartio-bex-router.berachain-devnet.com/dex/route',
    {
      params: {
        fromAsset,
        toAsset,
        amount,
      },
    },
  )
  return res.data.steps
}

export async function getValidators() {
  const res = await axios.get(
    'https://bartio-pol-indexer.berachain-devnet.com/berachain/v1alpha1/beacon/validators',
    {
      params: {
        sortBy: 'votingpower',
        sortOrder: 'desc',
        page: 1,
        pageSize: 20,
        query: '',
      },
    },
  )
  return res.data.validators.filter((v: any) => v.commission === 0)
}

export async function getUserValidators(address: string) {
  const res = await axios.get(
    `https://bartio-pol-indexer.berachain-devnet.com/berachain/v1alpha1/beacon/user/${address}/validators`,
  )
  return res.data.userValidators
}

export async function getUserDelegateAmount(
  address: string,
): Promise<BigNumber> {
  const res = await axios.post(
    'https://api.goldsky.com/api/public/project_clq1h5ct0g4a201x18tfte5iv/subgraphs/bgt-staker-subgraph/v1/gn',
    {
      operationName: 'GetUserValidatorInformation',
      variables: { address },
      query:
        'query GetUserValidatorInformation($address: String!) {\n  userValidatorInformations(where: {user: $address}) {\n    id\n    amountQueued\n    amountDeposited\n    latestBlock\n    user\n    coinbase\n    __typename\n  }\n}',
    },
  )
  return res.data.data.userValidatorInformations.reduce(
    (acc: any, cur: any) =>
      (BigNumber.isBigNumber(acc) ? acc : utils.parseEther(acc))
        .add(utils.parseEther(cur.amountDeposited))
        .add(utils.parseEther(cur.amountQueued)),
    '0',
  )
}

export async function getLatestTransaction(address: string) {
  const res = await axios.get(
    'https://cdn.testnet.routescan.io/api/evm/all/transactions',
    {
      params: {
        count: false,
        fromAddresses: address,
        includedChainIds: 80084,
        limit: 1,
        sort: 'desc',
      },
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MTkxMTk4MTYsImV4cCI6MTcxOTI5MjYxNiwiaXNzIjoiUm91dGVzY2FuQXBpIiwic3ViIjoiMy4wLjIwLjIwMiJ9.8QLo55mfJa5H_wYssJkcnnN11UW6m-iD1yO1J46nOf0',
      },
    },
  )
  return res.data.items
}
