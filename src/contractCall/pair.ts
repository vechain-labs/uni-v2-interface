import ABI_BALANCE_OF from './abis/pair/balanceOf.json'
import ABI_TOTAL_SUPPLY from './abis/pair/totalSupply.json'
import ABI_RESERVES from './abis/pair/getReserves.json'
import ABI_APPROVE from './abis/token/approve.json'
import ABI_CLAIM from './abis/pair/claimVTHO.json'
import ABI_USER_VTHO from './abis/pair/userGeneratedVTHO.json'
import { fromWei } from '../utils'

export default class Pair {
  // private connex: Connex
  private account: Connex.Thor.Account.Visitor

  constructor (address: string, connex: Connex) {
    // this.connex = connex
    this.account = connex.thor.account(address)
  }

  approve (addr: string, amount: string): Connex.Vendor.TxMessage[0] {
    const item = this.account.method(ABI_APPROVE).asClause(addr, amount)
    return {
      ...item,
      comment: `Approve for ${fromWei(amount)} LP transfer`
    }
  }

  async balanceOf (addr: string): Promise<string> {
    const balance: string = (
      await this.account.method(ABI_BALANCE_OF).call(addr)
    ).decoded[0]

    return balance
  }

  async totalSupply (): Promise<string> {
    const total: string = (await this.account.method(ABI_TOTAL_SUPPLY).call())
      .decoded[0]

    return total
  }

  async getReserves (): Promise<[string, string]> {
    const decoded = await (
      await this.account.method(ABI_RESERVES).call()
    ).decoded

    return [decoded[0], decoded[1]]
  }

  async getUserVTHO (addr: string): Promise<string> {
    const amount = await (
      await this.account.method(ABI_USER_VTHO).call(addr)
    ).decoded[0]

    return amount
  }

  claim (addr: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_CLAIM).asClause(addr)
  }
}
