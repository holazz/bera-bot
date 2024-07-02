import 'dotenv/config'
import { Contract, constants } from 'ethers'
import tokens from '../constants/tokens'
import {
  approveToken,
  estimateGasFee,
  generateModuleTitle,
  getAllowance,
  getTokenBalance,
  sendTransaction,
} from '../utils'
import logger from '../utils/logger'
import type { BigNumber, Wallet } from 'ethers'

const contractAddress = '0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64'

async function getCalls(signer: Wallet, honeyBalance?: BigNumber) {
  if (!honeyBalance) {
    honeyBalance = (await getTokenBalance(signer, tokens.HONEY, signer.address))
      .mul(Number(process.env.HONEY_PERCENTAGE) * 100)
      .div(100)
  }
  return {
    contract: new Contract(contractAddress, [
      {
        type: 'function',
        name: 'deposit',
        inputs: [
          { name: 'assets', type: 'uint256', internalType: 'uint256' },
          { name: 'receiver', type: 'address', internalType: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'deposit',
    args: [honeyBalance, signer.address],
    options: {
      gasLimit: 1000000n,
    },
  }
}

async function _sendTransaction(signer: Wallet) {
  const honeyBalance = (
    await getTokenBalance(signer, tokens.HONEY, signer.address)
  )
    .mul(Number(process.env.HONEY_PERCENTAGE) * 100)
    .div(100)
  if (honeyBalance.isZero()) {
    logger.error(signer.address, 'HONEY 余额不足')
    return
  }
  const allowance = await getAllowance(signer, tokens.HONEY, contractAddress)
  if (allowance.lt(honeyBalance)) {
    logger.info(signer.address, `等待授权 HONEY...`)
    const approveTx = await approveToken(
      signer,
      tokens.HONEY,
      contractAddress,
      constants.MaxInt256,
    )
    logger.info(signer.address, `授权 HONEY 完成 ${approveTx.hash}`)
  }
  const calls = await getCalls(signer, honeyBalance)
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Bears')} 存入 HONEY 获得 bHONEY`,
  value: 'depositHoney',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
