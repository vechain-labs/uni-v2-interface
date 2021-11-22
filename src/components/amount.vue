<template>
    <span>{{formatted}}</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { BigNumber } from 'bignumber.js'
export default defineComponent({
  name: 'Amount',
  props: {
    balance: String,
    decimals: { type: Number, default: 18 }
  },
  computed: {
    formatted (): string {
      if (!this.balance) {
        return ''
      }
      const bn = new BigNumber(this.balance)
      return bn.dividedBy(`1e${this.decimals}`).toFormat(3)
    }
  }
})
</script>
