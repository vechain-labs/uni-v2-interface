<template>
  <el-form class="remove-lp-form" @submit.stop.prevent="onSubmit">
    <el-row justify="spance-between" align="middle">
      <el-col :span="4">
        <slot />
      </el-col>
      <el-col :span="16" style="text-align: center; font-size: 20px; font-weight:500;">Remove Liquidity</el-col>
    </el-row>
    <div style="margin: 20px 0 10px; font-size: 60px; font-weight: 600;">
      <span>{{percent}}%</span>
    </div>
    <el-form-item>
      <el-slider v-model="percent" :show-tooltip="false" />

      <div class="hidden-md-and-up" style="text-align: center">
        <el-radio-group size="small" v-model="percent">
          <el-radio-button :label="25">25%</el-radio-button>
          <el-radio-button :label="50">50%</el-radio-button>
          <el-radio-button :label="75">75%</el-radio-button>
          <el-radio-button :label="100">100%</el-radio-button>
        </el-radio-group>
      </div>
    </el-form-item>
    <el-row class="hidden-sm-and-down" justify="space-between">
      <el-col :sm="6" :xs="12" style="text-align: center">
        <el-radio border v-model="percent" :label="25" size="small">25%</el-radio>
      </el-col>
      <el-col :sm="6" :xs="12" style="text-align: center">
        <el-radio border v-model="percent" :label="50" size="small">50%</el-radio>
      </el-col>
      <el-col :sm="6" :xs="12" style="text-align: center">
        <el-radio border v-model="percent" :label="75" size="small">75%</el-radio>
      </el-col>
      <el-col :sm="6" :xs="12" style="text-align: center">
        <el-radio border v-model="percent" :label="100" size="small">100%</el-radio>
      </el-col>
    </el-row>
    <el-card shadow="never">
      <template #header>
        <strong>You will receive</strong>
      </template>
      <el-row justify="space-between" style="margin-bottom: 5px;">
        <el-col :span="6">VET</el-col>
        <el-col
          :span="16"
          style="text-align:right"
        ><Amount :balance="vet" /></el-col>
      </el-row>
      <el-row justify="space-between">
        <el-col :span="6">VTHO</el-col>
        <el-col
          :span="16"
          style="text-align:right"
        >
          <Amount :balance="vtho" />
        </el-col>
      </el-row>
    </el-card>
    <el-form-item style="text-align:center;margin-top: 20px">
      <el-button :disabled="!percent" style="width: 100%" native-type="submit" type="danger" round>Remove</el-button>
    </el-form-item>
    <TxInfoDialog @successed="onSuccessed" :confirmMsg="`Output is estimated. You will receive at least ${minETH} VET and at least ${minVtho} VTHO or the transaction will revert.`"
      ref="txdialog" type="remove" :contents="contents" :onConfirm="onConfirm"/>
  </el-form>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import Amount from './amount.vue'
import BigNumber from 'bignumber.js'
import TxInfoDialog from './txInfoDialog.vue'

type Item = {
  token: 'vet' | 'vtho',
  amount: string
}

export default defineComponent({
  components: {
    Amount,
    TxInfoDialog
  },
  data: () => {
    return {
      percent: 0,
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
    balance () : string {
      return this.$state.lpToken.balanceOf
    },
    total (): string {
      return this.$state.lpToken.totalSupply
    },
    bigPercent (): string {
      return new BigNumber(this.percent).dividedBy(100).toString()
    },
    pooledPercent (): string {
      return new BigNumber(this.balance).dividedBy(this.total).toString()
    },
    vet (): string {
      return new BigNumber(this.balance).dividedBy(this.total).multipliedBy(this.$state.reserves.vet).multipliedBy(this.bigPercent).toString()
    },
    vtho (): string {
      return new BigNumber(this.balance).dividedBy(this.total).multipliedBy(this.$state.reserves.vtho).multipliedBy(this.bigPercent).toString()
    },
    minVtho (): string {
      return new BigNumber(this.vtho).div(1e18).multipliedBy(0.97).toFixed(3)
    },
    minETH (): string {
      return new BigNumber(this.vet).div(1e18).multipliedBy(0.97).toFixed(3)
    }
  },
  methods: {
    onSuccessed () {
      this.onSuccess()
    },
    onSubmit () {
      this.contents = [{
        token: 'vet',
        amount: new BigNumber(this.vet).div(1e18).toFixed(3)
      }, {
        token: 'vtho',
        amount: new BigNumber(this.vtho).div(1e18).toFixed(3)
      }];
      (this.$refs.txdialog as typeof TxInfoDialog).open()
    },
    async onConfirm () {
      const deadline = ((Date.now() + 900000) / 1000).toFixed()
      const balance = new BigNumber(this.balance).multipliedBy(this.bigPercent).toFixed(0, 1)
      const minVtho = new BigNumber(this.vtho).multipliedBy(0.97).toFixed(0, 1)
      const minETH = new BigNumber(this.vet).multipliedBy(0.97).toFixed(0, 1)
      const myPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('timeout'))
        }, 50000)
      })

      try {
        const appLp = this.$vv.approve(this.$router.address, this.balance)
        const clause = this.$router.removeLiquidityETH(
          this.$path.vtho,
          balance,
          minVtho,
          minETH,
          this.addr,
          deadline
        )
        return Promise.race([myPromise, this.$connex.vendor.sign('tx', [appLp, clause]).signer(this.addr).request()])
      } catch (error) {
        console.log(error)
      } finally {
        this.percent = 0
      }
    }
  }
})
</script>
<style>
.remove-lp-form .el-radio__input {
  display: none;
}

.remove-lp-form .el-radio.is-bordered {
  padding: 6px 10px 0 10px
}

.remove-lp-form .el-radio.is-bordered .el-radio__label {
  padding-left: 0;
}

@media screen and (max-width: 374px) {
  .remove-lp-form .el-radio-button--small .el-radio-button__inner {
    padding: 6px 10px;
  }
}
</style>
