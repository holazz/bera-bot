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

const contractAddress = '0xC5Cb3459723B828B3974f7E58899249C2be3B33d'
async function getCalls(signer: Wallet, bHoneyBalance?: BigNumber) {
  if (!bHoneyBalance) {
    bHoneyBalance = await getTokenBalance(signer, tokens.bHONEY, signer.address)
  }
  return {
    contract: new Contract(contractAddress, [
      {
        type: 'function',
        name: 'stake',
        inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'stake',
    args: [bHoneyBalance],
  }
}

async function _sendTransaction(signer: Wallet) {
  const bHoneyBalance = await getTokenBalance(
    signer,
    tokens.bHONEY,
    signer.address,
  )
  if (bHoneyBalance.isZero()) {
    logger.error(signer.address, 'bHONEY 余额不足')
    return
  }
  const allowance = await getAllowance(signer, tokens.bHONEY, contractAddress)
  if (allowance.lt(bHoneyBalance)) {
    logger.info(signer.address, `等待授权 bHONEY...`)
    const approveTx = await approveToken(
      signer,
      tokens.bHONEY,
      contractAddress,
      constants.MaxInt256,
    )
    logger.info(signer.address, `授权 bHONEY 完成 ${approveTx.hash}`)
  }
  const calls = await getCalls(signer, bHoneyBalance)
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Station')} 质押 bHONEY 赚取 BGT`,
  value: 'stakeBHoney',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
