import 'dotenv/config'
import { Contract } from 'ethers'
import { estimateGasFee, generateModuleTitle, sendTransaction } from '../utils'
import type { Wallet } from 'ethers'

function getCalls(signer: Wallet) {
  return {
    contract: new Contract('0xC5Cb3459723B828B3974f7E58899249C2be3B33d', [
      {
        type: 'function',
        name: 'getReward',
        inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'nonpayable',
      },
    ]),
    functionName: 'getReward',
    args: [signer.address],
    options: {
      gasLimit: 1000000n,
    },
  }
}

export default {
  title: `${generateModuleTitle('Station')} 领取 BGT`,
  value: 'claimBGT',
  estimateGasFee: (signer: Wallet) => estimateGasFee(signer, getCalls(signer)),
  sendTransaction: (signer: Wallet) =>
    sendTransaction(signer, getCalls(signer)),
}
