import 'dotenv/config'
import { Contract } from 'ethers'
import {
  estimateGasFee,
  generateModuleTitle,
  getRandomElementFromArray,
  getTokenBalance,
  sendTransaction,
} from '../utils'
import logger from '../utils/logger'
import tokens from '../constants/tokens'
import { getUserDelegateAmount, getUserValidators, getValidators } from '../api'
import type { BigNumber, Wallet } from 'ethers'

async function getCalls(signer: Wallet, availableBGT?: BigNumber) {
  if (!availableBGT) {
    availableBGT = await getTokenBalance(signer, tokens.BGT, signer.address)
  }
  const userValidators = await getUserValidators(signer.address)
  let validatorId = getRandomElementFromArray(userValidators)?.validator.id
  if (userValidators.length === 0) {
    const validators = await getValidators()
    validatorId = getRandomElementFromArray(validators).id
  }
  return {
    contract: new Contract('0xbDa130737BDd9618301681329bF2e46A016ff9Ad', [
      {
        type: 'function',
        name: 'queueBoost',
        inputs: [
          { name: 'validator', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint128', internalType: 'uint128' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'queueBoost',
    args: [validatorId, availableBGT],
  }
}

async function _sendTransaction(signer: Wallet) {
  const bgtBalance = await getTokenBalance(signer, tokens.BGT, signer.address)
  const userDelegateAmount = await getUserDelegateAmount(signer.address)
  const availableBGT = bgtBalance.sub(userDelegateAmount)
  if (availableBGT.isZero()) {
    logger.error(signer.address, 'BGT 可用余额不足')
    return
  }
  const calls = await getCalls(signer, availableBGT)
  return sendTransaction(signer, calls)
}

export default {
  title: `${generateModuleTitle('Station')} 加入委托 BGT 队列`,
  value: 'queueBoost',
  estimateGasFee: async (signer: Wallet) =>
    estimateGasFee(signer, await getCalls(signer)),
  sendTransaction: _sendTransaction,
}
