import 'dotenv/config'
import { Contract, providers, utils } from 'ethers'
import c from 'picocolors'
import { resolvedWallets } from '../configs/wallets'
import { getBeraPrice, getLatestTransaction } from '../api'
import dayjs from './dayjs'
import type { BigNumber, Wallet } from 'ethers'
import type { Calls } from '../types'

export function getProvider() {
  return new providers.JsonRpcProvider('https://bartio.rpc.berachain.com')
}

export function getTokenDecimals(
  signerOrProvider: providers.JsonRpcProvider | Wallet,
  tokenAddress: string,
): Promise<number> {
  const contract = new Contract(
    tokenAddress,
    ['function decimals() view returns (uint8)'],
    signerOrProvider,
  )
  return contract.decimals()
}

export function getTokenBalance(
  signerOrProvider: providers.JsonRpcProvider | Wallet,
  tokenAddress: string,
  address: string,
): Promise<BigNumber> {
  const contract = new Contract(
    tokenAddress,
    ['function balanceOf(address owner) view returns (uint256)'],
    signerOrProvider,
  )
  return contract.balanceOf(address)
}

export async function getAllowance(
  signer: Wallet,
  tokenAddress: string,
  spender: string,
) {
  const contract = new Contract(
    tokenAddress,
    [
      'function allowance(address owner, address spender) view returns (uint256)',
    ],
    signer,
  )
  return contract.allowance(signer.address, spender)
}

export async function approveToken(
  signer: Wallet,
  tokenAddress: string,
  spender: string,
  amount: BigNumber,
) {
  const contract = new Contract(
    tokenAddress,
    ['function approve(address spender, uint256 amount)'],
    signer,
  )
  const tx = await contract.approve(spender, amount)
  await tx.wait()
  return tx
}

export async function estimateGasFee(signer: Wallet, calls: Calls) {
  const { contract, functionName, args, options } = calls
  const [gas, gasPrice, beraPrice] = await Promise.all([
    signer.estimateGas({
      to: contract.address,
      data: contract.interface.encodeFunctionData(functionName, args),
      ...options,
    }),
    signer.getGasPrice(),
    getBeraPrice(),
  ])
  return Number(
    (Number(gas) * Number(utils.formatEther(gasPrice)) * beraPrice).toFixed(2),
  )
}

export async function sendTransaction(signer: Wallet, calls: Calls) {
  const nonce = await signer.getTransactionCount()
  const { contract, functionName, args, options } = calls
  const { hash } = options
    ? await contract.connect(signer)[functionName](...args, options)
    : await contract.connect(signer)[functionName](...args)
  return { address: signer.address, nonce, tx: hash }
}

export async function getLatestTransactionAge(address: string) {
  let res
  try {
    res = await getLatestTransaction(address)
  } catch {
    res = []
  }
  const { timestamp } = res[0] || { timestamp: 0 }
  const age = dayjs(timestamp).fromNow()
  const color = dayjs().diff(timestamp, 'day') >= 7 ? c.red : c.green
  return c.bold(color(age))
}

export function tokenToUSD(amount: number | string, tokenPrice: number) {
  return Number((Number(amount) * tokenPrice).toFixed(2))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function generateWalletTitle(address: string) {
  const wallet = resolvedWallets.find(
    (w) => w.address.toLowerCase() === address.toLowerCase(),
  )!
  return `${wallet.label} ${c.dim(`(${shortenAddress(wallet.address)})`)}`
}

export function generateModuleTitle(title: string) {
  return `${c.bold(title)} ${c.dim('›')}`
}

export function getRandomElementFromArray(array: any[]) {
  if (array.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * array.length)
  return array[randomIndex]
}

export function retry<T>(
  fn: (...args: any[]) => Promise<T>,
  times = 0,
  delay = 0,
) {
  return (...args: any[]): Promise<T> =>
    new Promise((resolve, reject) => {
      const attempt = async () => {
        try {
          resolve(await fn(...args))
        } catch (err) {
          if (times-- <= 0) {
            reject(err)
          } else {
            setTimeout(attempt, delay)
          }
        }
      }
      attempt()
    })
}
