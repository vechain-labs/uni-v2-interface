import { Connex } from '@vechain/connex'
import ABI_GET_IN from './abis/router/getAmountsIn.json'
import ABI_GET_OUT from './abis/router/getAmountsOut.json'
import ABI_SWAP_EFET from './abis/router/swapETHForExactTokens.json'
import ABI_SWAP_EEFT from './abis/router/swapExactETHForTokens.json'
import ABI_SWAP_ETFE from './abis/router/swapExactTokensForETH.json'
import ABI_SWAP_TFEE from './abis/router/swapTokensForExactETH.json'
import ABI_ADD_LIQUIDITY_ETH from './abis/router/addLiquidityETH.json'
import ABI_REMOVE_LIQUIDITY_ETH from './abis/router/removeLiquidityETH.json'
import { toWei } from '../utils'
import BigNumber from 'bignumber.js'
export default class Router {
  private account: Connex.Thor.Account.Visitor

  constructor (address: string, connex: Connex) {
    this.account = connex.thor.account(address)
  }

  get address (): string {
    return this.account.address
  }

  async getAmountsIn (amount: string, path: string[]): Promise<BigNumber> {
    const decoded = (await this.account.method(ABI_GET_IN).call(toWei(amount), path)).decoded
    return new BigNumber(decoded[0][0])
  }

  async getAmountsOut (amount: string, path: string[]): Promise<BigNumber> {
    const m = this.account.method(ABI_GET_OUT)
    const decoded = (await m.call(toWei(amount), path)).decoded
    return new BigNumber(decoded[0][1])
  }

  addLiquidityETH (val: string
    , token: string
    , amountTokenDesired: string
    , amountTokenMin: string
    , amountETHMin: string
    , to: string
    , deadline: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_ADD_LIQUIDITY_ETH).value(toWei(val))
      .asClause(
        token,
        toWei(amountTokenDesired),
        toWei(amountTokenMin),
        toWei(amountETHMin),
        to,
        deadline)
  }

  removeLiquidityETH (
    token: string,
    liquidity: string,
    amountTokenMin: string,
    amountETHMin: string,
    to: string,
    deadline: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_REMOVE_LIQUIDITY_ETH)
      .asClause(token, liquidity, amountTokenMin, amountETHMin, to, deadline)
  }

  swapETHForExactTokens (value: string, amountOut: string, path: string[], to: string, deadline: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_SWAP_EFET).value(toWei(value)).asClause(toWei(amountOut), path, to, deadline)
  }

  swapExactETHForTokens (value: string, amountOutMin: string, path: string[], to: string, deadline: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_SWAP_EEFT).value(toWei(value)).asClause(toWei(amountOutMin), path, to, deadline)
  }

  swapExactTokensForETH (amountIn: string, amountOutMin: string, path: string[], to: string, deadline: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_SWAP_ETFE).asClause(toWei(amountIn), toWei(amountOutMin), path, to, deadline)
  }

  swapTokensForExactETH (amountOut: string, amountInMax: string, path: string[], to: string, deadline: string): Connex.Vendor.TxMessage[0] {
    return this.account.method(ABI_SWAP_TFEE).asClause(toWei(amountOut), toWei(amountInMax), path, to, deadline)
  }
}
