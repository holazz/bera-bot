import 'dotenv/config'
import { Contract } from 'ethers'
import tokens from '../constants/tokens'
import {
  estimateGasFee,
  generateModuleTitle,
  getTokenBalance,
  sendTransaction,
} from '../utils'
import logger from '../utils/logger'
import type { BigNumber, Wallet } from 'ethers'

async function getCalls(signer: Wallet, honeyBalance?: BigNumber) {
  if (!honeyBalance) {
    honeyBalance = await getTokenBalance(signer, tokens.HONEY, signer.address)
  }
  return {
    contract: new Contract('0x1306D3c36eC7E38dd2c128fBe3097C2C2449af64', [
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
  const honeyBalance = await getTokenBalance(
    signer,
    tokens.HONEY,
    signer.address,
  )
  if (honeyBalance.isZero()) {
    logger.error(signer.address, 'HONEY 余额不足')
    return
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
