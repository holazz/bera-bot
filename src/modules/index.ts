import bexSwap from './bex-swap'
import mintHoney from './mint-honey'
import depositHoney from './deposit-honey'
import stakeBHoney from './stake-bhoney'
import claimBGT from './claim-bgt'
import queueBoost from './queue-boost'
import activateBoost from './activate-boost'
import erc20Approval from './erc20-approval'

export default [
  bexSwap,
  mintHoney,
  depositHoney,
  stakeBHoney,
  claimBGT,
  queueBoost,
  activateBoost,
  ...erc20Approval,
]
