<template>
  <el-card shadow="never">
    <template #header>
      <div>
        <span>VET/VTHO</span>
      </div>
    </template>
      <el-row justify="space-between">
          <el-col :span="12">Pooled VET</el-col>
          <el-col :span="12" style="text-align:right">
            <Amount :balance="vet" />
          </el-col>
      </el-row>
      <el-row justify="space-between" style="margin-top: 10px">
          <el-col :span="12">Pooled VTHO</el-col>
          <el-col :span="12" style="text-align:right">
            <Amount :balance="vtho" />
          </el-col>
      </el-row>
      <!-- <el-row justify="space-between" style="margin-top: 10px">
          <el-col :span="12">Your pool tokens</el-col>
          <el-col :span="12" style="text-align:right">
            <Amount :balance="lpToken" />
          </el-col>
      </el-row> -->
      <el-row justify="space-between" style="margin-top: 10px">
          <el-col :span="12">Your pool share</el-col>
          <el-col :span="12" style="text-align:right">
            <span>{{percentStr}}</span>%
          </el-col>
      </el-row>
  </el-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Amount from './amount.vue'
import BigNumber from 'bignumber.js'
export default defineComponent({
  name: 'lp_info',
  components: {
    Amount
  },
  computed: {
    lpToken (): string {
      return this.$state.lpToken.balanceOf
    },
    total (): string {
      return this.$state.lpToken.totalSupply
    },
    ratio (): BigNumber {
      return new BigNumber(this.lpToken).dividedBy(this.total)
    },
    percentStr (): string {
      const percent = this.ratio.multipliedBy(100)
      return percent.lt(0.001) ? '< 0.001' : percent.toFormat(3)
    },
    vet (): string {
      return this.ratio.multipliedBy(this.$state.reserves.vet).toString()
    },
    vtho (): string {
      return this.ratio.multipliedBy(this.$state.reserves.vtho).toString()
    }
  }
})
</script>
