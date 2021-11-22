<template>
    <el-card shadow="never" class="pool-card">
      <div v-if="tab === 'info'">
        <div v-if="!hasLp || !addr" style="border: 1px dashed #ebeef5; height: 200px; margin-top: 25px">
          <el-row style="height: 100%">
            <el-col style="text-align: center;align-self: center;">
              No liquidity was found.
            </el-col>
          </el-row>
        </div>
        <LpInfo v-else-if="hasLp && !!addr" />
        <div style="margin: 25px 0 0 0">
          <el-row v-if="!hasLp" style="margin-top: 20px " justify="center">
            <el-button class="btn" v-if="!addr" @click="$emit('connect')" type="primary" round>Connect Wallet</el-button>
            <el-button class="btn" v-else @click="tab = 'add'" type="primary" round>Join VET/VTHO Pool</el-button>
          </el-row>
          <el-row v-if="addr && hasLp" :gutter="20" style="margin-top: 20px " justify="center">
            <el-col :span="12" :xs="12" :sm="12">
              <el-button @click="tab = 'add'" class="btn" type="primary" round>Add</el-button>
            </el-col>
            <el-col :span="12" :xs="12" :sm="12">
              <el-button @click="tab = 'remove'" class="btn" type="danger" round>Remove</el-button>
            </el-col>
          </el-row>
         </div>
      </div>
      <AddLp :onSuccess="success" v-else-if="tab === 'add'" :addr="addr" >
        <el-link href="javascript:;" :underline="false" @click="tab = 'info'">
          <el-icon :size="20"><Back /></el-icon>
        </el-link>
      </AddLp>
      <RemoveLp :onSuccess="success" v-else-if="tab === 'remove'" :addr="addr">
        <el-link href="javascript:;" :underline="false" @click="tab = 'info'">
          <el-icon :size="20"><Back /></el-icon>
        </el-link>
      </RemoveLp>
    </el-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LpInfo from './lpInfo.vue'
import RemoveLp from './removeLp.vue'
import AddLp from './addLp.vue'
import BigNumber from 'bignumber.js'

export default defineComponent({
  components: {
    LpInfo,
    AddLp,
    RemoveLp
  },
  name: 'pool',
  data: () => {
    return {
      tab: 'info' as 'info' | 'add' | 'remove'
    }
  },
  props: {
    addr: String
  },
  computed: {
    hasLp (): boolean {
      const b = new BigNumber(this.$state.lpToken.balanceOf)
      return !(b.isZero() || b.isNaN())
    }
  },
  methods: {
    success (): void {
      this.tab = 'info'
    }
  },
  created ():void {
    this.$watch('addr', (nv: string, ov: string) => {
      if (nv.toLowerCase() !== ov.toLowerCase()) {
        this.tab = 'info'
      }
    })
  }
})
</script>
<style scoped>
.btn {
  width: 100%;
  font-size: 16px;
}
</style>
