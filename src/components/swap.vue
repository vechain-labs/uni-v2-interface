<template>
  <el-card shadow="never" class="swap-form">
    <el-form @submit.stop.prevent="onSubmit" label-position="top">
      <el-form-item :error="fromError" :show-message="!!fromError" class="grey-form-item">
          <template #label>
            <template v-if="account && account.balance">
              Balance:
              <Amount :balance="account && account[fromCurrency === 'vet' ? 'balance' : 'energy']" />
            </template>
            <span v-else />
          </template>

        <el-input
          class="cus-input"
          ref="from"
          v-number
          placeholder="0.0"
          v-model="from"
          @input="onChange('amountOut')"
        >
          <template #prepend>
            <el-row justify="center" align="middle">
              <el-col :span="12">
                <component :is="fromCurrency === 'vet' ? 'vet' : 'vtho'" />
              </el-col>
              <el-col :span="12" style="font-size: 18px">{{ fromPrepend }}</el-col>
            </el-row>
          </template>
        </el-input>
      </el-form-item>
      <el-row justify="center">
        <el-link @click="change" href="javascript:;" :underline="false">
          <el-icon :size="20">
            <bottom />
          </el-icon>
        </el-link>
      </el-row>
      <el-form-item :error="toError" :show-message="!!toError" class="grey-form-item" style="margin-top: 5px;">
        <template #label>
          <template v-if="account && account.balance">
            Balance:
            <Amount :balance="account && account[fromCurrency === 'vet' ? 'energy' : 'balance']" />
          </template>
          <span v-else />
        </template>
        <el-input
          placeholder="0.0"
          v-number
          class="cus-input"
          v-model="to"
          @input="onChange('amountIn')"
        >
          <template #prepend>
            <el-row justify="center" align="middle">
              <el-col :span="10">
                <component :is="fromCurrency === 'vet' ? 'vtho' : 'vet'" />
              </el-col>
              <el-col :span="14" style="font-size: 18px">{{ toPrepend }}</el-col>
            </el-row>
          </template>
        </el-input>
      </el-form-item>
      <el-row align="middle" style="margin-top: 20px">
        <el-col :span="12" :xs="10" :sm="8">
          <span style="font-size: 12px; display: flex; align-items: center; white-space: nowrap;">
            Slippage tolerance
            <el-popover
              placement="right"
              :width="200"
              trigger="click"
              content="Your tracsaction will be reverted if the price changes unfavorably by more than this percentage."
            >
              <template #reference>
                  <el-icon style="display: flex; margin-left: 2px; margin-top: 2px;">
                    <Warning />
                  </el-icon>
              </template>
            </el-popover>
          </span>
        </el-col>
        <el-col :span="12" :xs="14" :sm="16" style="text-align: right">
          <el-radio-group v-model="tolerance" size="mini">
            <el-radio-button :label="0.001">0.1%</el-radio-button>
            <el-radio-button :label="0.005">0.5%</el-radio-button>
            <el-radio-button :label="0.01">1%</el-radio-button>
          </el-radio-group>
        </el-col>
      </el-row>
      <el-row style="margin: 10px 0">
        <el-col :span="12">
          <span style="font-size: 12px">Deadline</span>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <span style="font-size: 12px">15 minutes</span>
        </el-col>
      </el-row>
      <el-form-item  style="margin-top: 20px">
        <el-button
          :loading="disableBtn"
          style="width: 100%"
          native-type="submit"
          type="primary"
          round
        >{{submitLabel}}</el-button>
      </el-form-item>
    </el-form>
    <TxInfoDialog
      ref="txdialog"
      type="swap"
      :confirmMsg="confirmMsg"
      :contents="contents"
      :onConfirm="onConfirm"
    />
  </el-card>
</template>
<script lang="ts">
import Amount from './amount.vue'
import vet from './vet.vue'
import vtho from './vtho.vue'
import TxInfoDialog from './txInfoDialog.vue'
import { defineComponent } from 'vue'
import Connex from '@vechain/connex'
import BigNumber from 'bignumber.js'
import { toWei, estimateGas, calcFee } from '../utils'

type Item = {
  token: 'vet' | 'vtho'
  amount: string
}

export default defineComponent({
  components: {
    Amount,
    vet,
    vtho,
    TxInfoDialog
  },
  data () {
    return {
      fromError: '',
      toError: '',
      disableBtn: false,
      contents: [] as Item[],
      timer: 0,
      from: (null as unknown) as string,
      to: (null as unknown) as string,
      fromCurrency: 'vet',
      contractName: ('EEFT' as unknown) as 'EFET' | 'ETFE' | 'EEFT' | 'TFEE',
      tolerance: 0.005,
      confirmMsg: ''
    }
  },
  props: {
    addr: String
  },
  computed: {
    maxInVet (): string {
      return (
        this.account && new BigNumber(this.account.balance).div(1e18).toString()
      )
    },
    maxInVtho (): string {
      return (
        this.account && new BigNumber(this.account.energy).div(1e18).toString()
      )
    },
    maxOutVet (): string {
      return new BigNumber(this.$state.reserves.vet).div(1e18).toFixed(0, 1)
    },
    maxOutVtho (): string {
      return new BigNumber(this.$state.reserves.vtho).div(1e18).toFixed(0, 1)
    },
    account (): Connex.Thor.Account {
      return this.$state.account
    },
    submitLabel (): string {
      return this.addr ? 'Swap' : 'Connect Wallet'
    },
    fromPrepend (): string {
      return this.fromCurrency === 'vet' ? 'VET' : 'VTHO'
    },
    toPrepend (): string {
      return this.fromCurrency === 'vet' ? 'VTHO' : 'VET'
    },
    thePath (): string[] {
      return this.fromCurrency === 'vet'
        ? [this.$path.vvet, this.$path.vtho]
        : [this.$path.vtho, this.$path.vvet]
    }
  },
  methods: {
    resetError (): void {
      this.fromError = ''
      this.toError = ''
    },
    change (): void {
      this.fromCurrency = this.fromCurrency === 'vet' ? 'vtho' : 'vet'
      this.from = ''
      this.to = ''
      this.resetError()
    },
    isRequired (): boolean {
      this.fromError = !this.from ? 'Required' : ''
      this.toError = !this.to ? 'Required' : ''

      return !(this.fromError || this.toError)
    },
    validNumber (): boolean {
      const from = new BigNumber(this.from)
      const to = new BigNumber(this.to)

      this.fromError = from.isNaN() ? 'Invalid number' : ''
      this.toError = to.isNaN() ? 'Invalid number' : ''

      return !(this.fromError || this.toError)
    },
    validRange (): boolean {
      const from = new BigNumber(this.from)
      this.fromError = from.isGreaterThan(
        this.fromCurrency === 'vet' ? this.maxInVet : this.maxInVtho
      )
        ? 'Insufficient balance'
        : ''

      return !this.fromError
    },
    validate (): boolean {
      if (!this.isRequired() || !this.validNumber() || !this.validRange()) {
        return false
      }
      return true
    },
    async onSubmit (): Promise<void> {
      if (!this.addr) {
        this.$emit('connect')
        return
      }
      if (!this.contractName) {
        return
      }

      if (!this.validate()) {
        return
      }
      if (this.fromCurrency === 'vtho') {
        const estGas = await estimateGas(this.$connex.thor, this.getClauses(this.addr), 0, this.addr, this.addr)
        const fee = calcFee(estGas.gas, estGas.baseGasPrice, 50).div(1e18)
        if (fee.plus(this.from).isGreaterThan(this.account.energy)) {
          const vtho = new BigNumber(this.account.energy).div(1e18)
          this.fromError = `Max ${vtho.minus(fee).toFixed(3, 1)} allowed`
          return
        } else {
          this.fromError = ''
        }
      }
      if (['EEFT', 'ETFE'].includes(this.contractName)) {
        this.confirmMsg = `Output is estimated. You will pay at most ${new BigNumber(
          this.from
        )
          .multipliedBy(1 + this.tolerance)
          .toString()} ${
          this.fromCurrency === 'vet' ? 'VET' : 'VTHO'
        } or the transaction will be reverted.`
      } else {
        this.confirmMsg = `Output is estimated. You will receive at least ${new BigNumber(
          this.to
        )
          .multipliedBy(1 - this.tolerance)
          .toString()} ${
          this.fromCurrency === 'vet' ? 'VTHO' : 'VET'
        } or the transaction will be reverted.`
      }

      this.contents = [
        {
          token: this.fromCurrency === 'vet' ? 'vet' : 'vtho',
          amount: new BigNumber(this.from).toString()
        },
        {
          token: this.fromCurrency === 'vet' ? 'vtho' : 'vet',
          amount: new BigNumber(this.to).toString()
        }
      ]
      ;(this.$refs.txdialog as typeof TxInfoDialog).open()
    },
    getClauses (addr: string) {
      const clauses: Connex.Vendor.TxMessage = []
      if (['TFEE', 'ETFE'].includes(this.contractName)) {
        clauses.push(this.$vtho.approve(this.$router.address, toWei(this.from)))
      }
      const deadline = ((Date.now() + 900000) / 1000).toFixed(0)

      switch (this.contractName) {
        case 'TFEE':
          clauses.push(
            this.$router.swapTokensForExactETH(
              new BigNumber(this.to).toString(),
              new BigNumber(this.from)
                .multipliedBy(1 + this.tolerance)
                .toString(),
              this.thePath,
              addr,
              deadline
            )
          )
          break
        case 'ETFE':
          clauses.push(
            this.$router.swapExactTokensForETH(
              new BigNumber(this.from).toString(),
              new BigNumber(this.to)
                .multipliedBy(1 - this.tolerance)
                .toString(),
              this.thePath,
              addr,
              deadline
            )
          )
          break
        case 'EEFT':
          clauses.push(
            this.$router.swapExactETHForTokens(
              new BigNumber(this.from).toString(),
              new BigNumber(this.to)
                .multipliedBy(1 - this.tolerance)
                .toString(),
              this.thePath,
              addr,
              deadline
            )
          )
          break
        case 'EFET':
          clauses.push(
            this.$router.swapETHForExactTokens(
              new BigNumber(this.from)
                .multipliedBy(1 + this.tolerance)
                .toString(),
              new BigNumber(this.to).toString(),
              this.thePath,
              addr,
              deadline
            )
          )
          break
      }
      return clauses
    },
    async onConfirm (): Promise<Connex.Vendor.TxResponse | void | unknown> {
      if (!this.addr) {
        this.$emit('connect')
        return
      }
      const clauses = this.getClauses(this.addr)
      const myPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('timeout'))
        }, 50000)
      })
      try {
        return Promise.race([
          myPromise,
          this.$connex.vendor.sign('tx', clauses).signer(this.addr).request()
        ])
      } catch (error) {
        console.log(error)
      } finally {
        this.from = ''
        this.to = ''
      }
    },
    onChange (action: 'amountIn' | 'amountOut'): void {
      this.resetError()
      if (this.timer) {
        window.clearTimeout(this.timer)
        this.timer = 0
      }
      this.timer = window.setTimeout(async () => {
        this.disableBtn = true

        try {
          if (action === 'amountIn') {
            const to =
              this.fromCurrency === 'vet' ? this.maxOutVtho : this.maxOutVet
            if (new BigNumber(this.to).isGreaterThan(to)) {
              this.to = to
            }
            await this.amountIn()
          } else {
            await this.amountOut()
          }
        } catch (error) {
          console.error(error)
        }
        this.disableBtn = false
      }, 600)
    },
    async amountIn (): Promise<void> {
      if (!this.to || this.to === '0') {
        this.from = ''
        return
      }
      this.contractName = this.fromCurrency === 'vet' ? 'EEFT' : 'ETFE'
      const temp = (await this.$router.getAmountsIn(this.to, this.thePath)).div(1e18)
      if (temp.isLessThan(1)) {
        this.from = new BigNumber(temp.toPrecision(6, 1)).toFixed()
      } else {
        this.from = temp.toFixed(2, 1)
      }
    },
    async amountOut (): Promise<void> {
      if (!this.from || this.from === '0') {
        this.to = ''
        return
      }
      this.contractName = this.fromCurrency === 'vet' ? 'EFET' : 'TFEE'
      const temp = (await this.$router.getAmountsOut(this.from, this.thePath)).div(1e18)
      if (temp.isLessThan(1)) {
        this.to = new BigNumber(temp.toPrecision(6, 1)).toFixed()
      } else {
        this.to = temp.toFixed(2, 1)
      }
    }
  }
})
</script>
<style>
.swap-form .el-form-item__label,
.add-lp-form .el-form-item__label {
  padding: 0;
  line-height: 25px;
  text-align: right;
  color: rgb(117, 117, 117);
  min-height: 25px;
}
</style>
