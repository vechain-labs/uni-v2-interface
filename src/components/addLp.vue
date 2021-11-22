<template>
<el-form class="add-lp-form" @submit.stop.prevent="onSubmit" label-position="top">
  <el-row justify="spance-between" align="middle">
    <el-col :span="4">
      <slot />
    </el-col>
    <el-col :span="16" style="text-align: center; font-size: 20px;font-weight:500;">Add Liquidity</el-col>
  </el-row>
  <el-form-item :error="vetError" :show-message="!!vetError"  class="grey-form-item" style="margin-top: 20px;">
    <template #label>
      Balance:
      <Amount :balance="balance" />
    </template>
    <el-input placeholder="0.0" v-number v-model="vet" @input="onChange('vet')">
      <template #prepend>
        <el-row justify="center" align="middle">
            <el-col :span="12">
              <Vet/>
            </el-col>
            <el-col :span="12" style="font-size: 18px">
              VET
            </el-col>
          </el-row>
      </template>
    </el-input>
  </el-form-item>
  <el-row justify="center">
      <el-icon :size="20">
        <Plus/>
      </el-icon>
  </el-row>
  <el-form-item :error="vthoError" :show-message="!!vthoError"  class="grey-form-item"  style="margin-top: 10px;">
    <template #label>
      Balance:
      <Amount :balance="energy" />
    </template>
    <el-input placeholder="0.0" v-number v-model="vtho" @input="onChange('vtho')">
      <template #prepend>
        <el-row justify="center" align="middle">
            <el-col :span="10">
              <Vtho />
            </el-col>
            <el-col :span="14" style="font-size: 18px">
              VTHO
            </el-col>
          </el-row>
      </template>
    </el-input>
  </el-form-item>
  <el-form-item  style="margin-top: 20px;">
    <el-button style="width: 100%" native-type="submit" type="primary" round>Add</el-button>
  </el-form-item>
  <TxInfoDialog @successed="onSuccessed" ref="txdialog" type="add" :contents="contents" :onConfirm="onConfirm"/>
</el-form>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import Amount from './amount.vue'
import TxInfoDialog from './txInfoDialog.vue'
import Vet from './vet.vue'
import Vtho from './vtho.vue'
import BigNumber from 'bignumber.js'
import { toWei, estimateGas, calcFee } from '../utils'
import { Connex } from '@vechain/connex'

type Item = {
  token: 'vet' | 'vtho',
  amount: string
}

export default defineComponent({
  name: 'add-LP',
  components: {
    Amount,
    Vet,
    Vtho,
    TxInfoDialog
  },
  data: () => {
    return {
      vetError: '',
      vthoError: '',
      vet: null as unknown as string,
      vtho: null as unknown as string,
      timer: null as unknown as number,
      contents: [] as Item[]
    }
  },
  props: {
    onSuccess: {
      type: Function,
      required: true
    },
    addr: {
      type: String,
      required: true
    }
  },
  computed: {
    balance (): string {
      return this.$state.account.balance
    },
    energy (): string {
      return this.$state.account.energy
    },
    ratio (): BigNumber {
      return new BigNumber(this.$state.reserves.vtho).div(this.$state.reserves.vet)
    }
  },
  methods: {
    onSuccessed () {
      this.onSuccess()
    },
    resetError (): void {
      this.vetError = ''
      this.vthoError = ''
    },
    isRequired (): boolean {
      this.vetError = !this.vet ? 'Required' : ''
      this.vthoError = !this.vtho ? 'Required' : ''

      return !(this.vetError || this.vthoError)
    },
    validateNumber (): boolean {
      const vet = new BigNumber(this.vet)
      const vtho = new BigNumber(this.vtho)

      this.vetError = (vet.isNaN() || vet.isZero()) ? 'Invalid number' : ''
      this.vthoError = (vtho.isNaN() || vtho.isZero()) ? 'Invalid number' : ''

      return !(this.vetError || this.vthoError)
    },
    validateRange (): boolean {
      const vet = new BigNumber(this.vet)
      const vtho = new BigNumber(this.vtho)

      this.vetError = vet.isGreaterThan(new BigNumber(this.balance).div(1e18)) ? 'Insufficient balance' : ''
      this.vthoError = vtho.isGreaterThan(new BigNumber(this.energy).div(1e18)) ? 'Insufficient balance' : ''

      return !(this.vetError || this.vthoError)
    },
    validate (): boolean {
      if (!this.isRequired() || !this.validateNumber() || !this.validateRange()) {
        return false
      }
      return true
    },
    onChange (type: 'vet' | 'vtho'): void {
      if (this.timer) {
        window.clearTimeout(this.timer)
      }
      this.timer = window.setTimeout(() => {
        this.resetError()
        if (type === 'vet' && this.vet) {
          const temp = this.ratio.multipliedBy(this.vet)
          if (temp.isLessThan(1)) {
            this.vtho = new BigNumber(temp.toPrecision(6, 1)).toFixed()
          } else {
            this.vtho = temp.toFixed(2, 1)
          }
        } else if (type === 'vtho' && this.vtho) {
          const temp = new BigNumber(this.vtho).div(this.ratio)
          if (temp.isLessThan(1)) {
            this.vet = new BigNumber(temp.toPrecision(6, 1)).toFixed()
          } else {
            this.vet = temp.toFixed(2, 1)
          }
        }
      }, 300)
    },
    async onSubmit (): Promise<void> {
      if (!this.validate()) {
        return
      }
      const energy = new BigNumber(this.energy).div(1e18)
      if (energy.minus(8).lt(this.vtho)) {
        const estGas = await estimateGas(this.$connex.thor, this.getClauses(), 0, this.addr, this.addr)
        const fee = calcFee(estGas.gas, estGas.baseGasPrice, 50).div(1e18)
        if (energy.lt(fee.plus(this.vtho))) {
          this.vthoError = `Max ${energy.minus(fee).toFixed(3, 1)} allowed`
          return
        } else {
          this.vthoError = ''
        }
      }

      this.contents = [{
        token: 'vet',
        amount: new BigNumber(this.vet).toString()
      }, {
        token: 'vtho',
        amount: new BigNumber(this.vtho).toString()
      }];

      (this.$refs.txdialog as typeof TxInfoDialog).open()
    },

    getClauses () {
      const deadline = ((Date.now() + 900000) / 1000).toFixed(0)
      const vet = new BigNumber(this.vet)
      const vtho = new BigNumber(this.vtho)

      const appr = this.$vtho.approve(this.$router.address, toWei(this.vtho))
      const clause = this.$router.addLiquidityETH(
        vet.toString(),
        this.$path.vtho,
        vtho.toString(),
        vtho.multipliedBy(0.95).toString(),
        vet.multipliedBy(0.95).toString(),
        this.addr,
        deadline)

      return [appr, clause]
    },
    async onConfirm (): Promise<Connex.Vendor.TxResponse | void | unknown> {
      const myPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('timeout'))
        }, 50000)
      })

      try {
        const clauses = this.getClauses()
        return Promise.race([myPromise, this.$connex.vendor.sign('tx', clauses).signer(this.addr).request()])
      } catch (error) {
        console.log(error)
      } finally {
        this.vet = ''
        this.vtho = ''
      }
    }
  }
})
</script>
