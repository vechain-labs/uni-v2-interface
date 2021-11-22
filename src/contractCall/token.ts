import { Connex } from '@vechain/connex'
import ABI_APPROVE from './abis/token/approve.json'
import { fromWei } from '../utils'

export default class Token {
  private account: Connex.Thor.Account.Visitor

  constructor (address: string, connex: Connex) {
    this.account = connex.thor.account(address)
  }

  approve (addr: string, amount: string): Connex.Vendor.TxMessage[0] {
    const item = this.account.method(ABI_APPROVE).asClause(addr, amount)
    return {
      ...item,
      comment: `Approve for ${fromWei(amount)} VTHO transfer`
    }
  }
}
