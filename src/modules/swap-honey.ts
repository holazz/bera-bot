import 'dotenv/config'
import { Contract, utils } from 'ethers'
import tokens from '../constants/tokens'
import ABI from '../abi/bex/abi.json'
import { estimateGasFee, generateModuleTitle, sendTransaction } from '../utils'
import { getBexSwapRoute } from '../api'
import logger from '../utils/logger'
import type { BigNumber, Wallet } from 'ethers'

async function getCalls(signer: Wallet, amountIn?: BigNumber, steps?: any) {
  if (!amountIn) {
    amountIn = (await signer.getBalance()).mul(80).div(100)
  }
  if (!steps) {
    steps = await getBexSwapRoute(tokens.BERA, tokens.HONEY, amountIn)
  }

  const contract = new Contract(
    '0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D',
    ABI,
  )
  const preview = await contract
    .connect(signer)
    .previewMultiSwap(steps, amountIn)
  return {
    contract,
    functionName: 'multiSwap',
    args: [steps, amountIn, preview[0]],
    options: {
      value: amountIn,
      gasLimit: 1000000n,
    },
  }
}

async function _sendTransaction(signer: Wallet) {
  const beraBalance = await signer.getBalance()
  if (beraBalance.lt(utils.parseEther('0.5'))) {
    logger.error(signer.address, 'BERA 余额太少')
    return
  }
  const amountIn = beraBalance.mul(80).div(100)
  const steps = await getBexSwapRoute(tokens.BERA, tokens.HONEY, amountIn)
  if (!steps) {
    logger.error(signer.address, '未找到兑换路径')
    return
  }
  const calls = await getCalls(signer, amountIn, steps)
  if (calls.args[2].lt(calls.args[1].mul(10))) {
    logger.error(signer.address, '兑换率太低')
    return
  }
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Bex')} BERA 兑换成 HONEY`,
  value: 'swapHoney',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
