<template>
  <img :attr="$attrs" :src="svg" />
</template>
<script lang="ts">
import { picasso } from '@vechain/picasso'
import { defineComponent } from 'vue'
export default defineComponent({
  name: '',
  props: {
    addr: String
  },
  computed: {
    svg (): string {
      return this.addr
        ? `data:image/svg+xml;utf8,${picasso(this.addr.toLowerCase())}`
        : ''
    }
  }
})
</script>
