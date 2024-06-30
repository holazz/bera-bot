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

const contractAddress = '0xAd1782b2a7020631249031618fB1Bd09CD926b31'

async function getCalls(signer: Wallet, usdcBalance?: BigNumber) {
  if (!usdcBalance) {
    usdcBalance = await getTokenBalance(signer, tokens.USDC, signer.address)
  }
  return {
    contract: new Contract(contractAddress, [
      {
        type: 'function',
        name: 'mint',
        inputs: [
          { name: 'asset', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'receiver', type: 'address', internalType: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'mint',
    args: [tokens.USDC, usdcBalance, signer.address],
  }
}

async function _sendTransaction(signer: Wallet) {
  const usdcBalance = await getTokenBalance(signer, tokens.USDC, signer.address)
  if (usdcBalance.isZero()) {
    logger.error(signer.address, 'USDC 余额不足')
    return
  }
  const allowance = await getAllowance(signer, tokens.USDC, contractAddress)
  if (allowance.lt(usdcBalance)) {
    logger.info(signer.address, `等待授权 USDC...`)
    const approveTx = await approveToken(
      signer,
      tokens.USDC,
      contractAddress,
      constants.MaxInt256,
    )
    logger.info(signer.address, `授权 USDC 完成 ${approveTx.hash}`)
  }
  const calls = await getCalls(signer, usdcBalance)
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Honey')} Mint HONEY`,
  value: 'mintHoney',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
