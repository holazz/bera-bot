import 'dotenv/config'
import { Contract } from 'ethers'
import { estimateGasFee, generateModuleTitle, sendTransaction } from '../utils'
import logger from '../utils/logger'
import { getUserValidators } from '../api'
import type { Wallet } from 'ethers'

function getCalls(validatorId: string) {
  return {
    contract: new Contract('0xbDa130737BDd9618301681329bF2e46A016ff9Ad', [
      {
        type: 'function',
        name: 'activateBoost',
        inputs: [
          { name: 'validator', type: 'address', internalType: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'activateBoost',
    args: [validatorId],
  }
}

async function _sendTransaction(signer: Wallet) {
  const userValidators = await getUserValidators(signer.address)
  if (userValidators.length === 0) {
    logger.error(signer.address, '代理队列为空')
    return
  }
  const currentBlock = await signer.provider?.getBlockNumber()
  const readyValidatorIds = userValidators
    .filter(
      (v: any) => currentBlock - Number(v.userValidator.latestBlock) > 8200,
    )
    .map((v: any) => v.validator.id)

  if (readyValidatorIds.length === 0) {
    logger.error(signer.address, '代理队列未准备好')
    return
  }
  const callsArray = await Promise.all(
    readyValidatorIds.map(async (validatorId: string) => getCalls(validatorId)),
  )
  const nonce = await signer.getTransactionCount()
  return Promise.all(
    callsArray.map((calls, index) =>
      sendTransaction(signer, { ...calls, options: { nonce: nonce + index } }),
    ),
  )
}

export default {
  title: `${generateModuleTitle('Station')} 确认委托 BGT`,
  value: 'activateBoost',
  estimateGasFee: (signer: Wallet) =>
    estimateGasFee(
      signer,
      getCalls('0x35c1e9c7803b47af738f37beada3c7c35eed73d4'),
    ),
  sendTransaction: _sendTransaction,
}
