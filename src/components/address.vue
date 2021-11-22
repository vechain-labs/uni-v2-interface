<template>
  <span style="font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace">
    {{displayString}}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { address } from 'thor-devkit'

export default defineComponent({
  name: 'Address',
  props: {
    addr: String
  },
  computed: {
    displayString () {
      if (!address.test(this.addr)) {
        return ''
      }
      const checksumed = address.toChecksumed(this.addr)
      return checksumed.slice(0, 6) + '⋯' + checksumed.slice(-6)
    }
  }
})
</script>
