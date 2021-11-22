<template>
  <el-dialog @closed="onClose" center :show-close="['received', 'submitted'].includes(status)" destroy-on-close :close-on-click-modal="false" width="350px" :title="title" v-model="dialogVisible" append-to-body>
    <template v-if="'received' === status">
      <el-row justify="space-between" align="middle">
        <el-col :span="12">
          <el-row align="middle">
            <component :is="contents[0].token" style="margin-right: 5px" />
            <span style="font-size: 18px">
              {{contents[0].token.toUpperCase()}}
            </span>
          </el-row>
        </el-col>
        <el-col :span="12" style="text-align: right; font-size: 18px">
          {{contents[0].amount}}
        </el-col>
      </el-row>
      <el-row v-if="contents[1]" justify="center" align="middle" style="margin: 5px">
        <el-col :span="6" style="text-align: center">
          <el-icon :size="30">
            <Bottom v-if="type ==='swap'"/>
            <Plus v-else/>
          </el-icon>
        </el-col>
      </el-row>
      <el-row v-if="contents[1]" justify="space-between" align="middle">
        <el-col :span="12">
          <el-row align="middle">
            <component :is="contents[1].token" style="margin-right: 5px"/>
            <span style="font-size: 18px">
              {{contents[1].token.toUpperCase()}}
            </span>
          </el-row>
        </el-col>
        <el-col :span="12" style="text-align: right; font-size: 18px">
          {{contents[1].amount}}
        </el-col>
      </el-row>
      <div v-if="confirmMsg" style="word-break: break-word;font-size: 12px; color: #909090; padding-top: 15px; border-top: 1px solid #eee; margin-top: 15px; line-height: 16px">
        {{confirmMsg}}
      </div>
      <el-row justify="center" align="middle" style="margin-top: 25px">
        <el-button style="width: 100%" type="primary" @click="onClick" round>
          Confirm
        </el-button>
      </el-row>
    </template>
    <template v-if="['confirmed', 'submitted'].includes(status)">
      <div style="text-align: center">
        <div>
          <el-icon  class="is-loading" :size="70" color="#7142FF" >
            <Loading />
          </el-icon>
        </div>
        <div style="margin: 10px 0;">
          <span style="font-size:18px;font-weight:500;">Waiting for confirmation...</span>
        </div>
        <div style="margin: 10px 0; color: #909090;">
          <span>{{waitingMsg}}</span>
        </div>
      </div>
    </template>
    <template v-if="['success', 'reverted', 'rejected'].includes(status) ">
      <div style="text-align: center">
        <div>
          <el-icon
            :color="status === 'success' ? '#7142FF' : '#CE4B4B'"
            :size="70" >
              <CircleCheck v-if="status === 'success'"/>
              <CircleClose v-else />
          </el-icon>
        </div>
        <div style="font-size: 20px">
          <span v-if="status === 'success'">Success</span>
          <span v-if="status === 'reverted'">Transaction Failed</span>
          <span v-if="status === 'rejected'">User Canceled</span>
        </div>
        <div v-if=" status !== 'rejected'" style="margin-top: 10px">
          <el-link style="font-weight: lighter;" target="_blank" :href="`${$explore}transactions/${txid}`">View on Explorer</el-link>
        </div>
        <div style="margin-top: 20px">
          <el-button style="width: 100%" type="primary" size="regular" @click="onOk" round>OK</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import vet from './vet.vue'
import vtho from './vtho.vue'
import { Ticker, Presume } from '../utils'
import { Connex } from '@vechain/connex'

type Item = {
  token: 'vet' | 'vtho',
  amount: string
}

export default defineComponent({
  components: {
    vet,
    vtho
  },
  emits: ['successed'],
  name: 'tx_dialog',
  data: () => {
    return {
      task: null as unknown as Promise< Connex.Vendor.TxResponse | void>,
      txid: '',
      presume: null as unknown as Presume<Connex.Vendor.TxResponse>,
      dialogVisible: false,
      status: 'received' as 'received' | 'submitted' | 'confirmed' | 'rejected' | 'reverted' | 'success'
    }
  },
  props: {
    type: {
      type: String,
      required: true
    },
    confirmMsg: String,
    onConfirm: { type: Function, required: true },
    contents: { type: Array as () => Array<Item>, required: true }
  },
  created () {
    let ticker: Ticker | null = null
    let txVisitor: Connex.Thor.Transaction.Visitor | null = null

    const task = () => {
      if (ticker) {
        ticker.stop()
      }
      ticker = new Ticker(this.$connex)
      ticker.tick(async (): Promise<void> => {
        const t = await txVisitor?.getReceipt()

        if (t) {
          this.status = t.reverted ? 'reverted' : 'success'
          ticker && ticker.stop()
        }
      })
    }
    this.$watch('txid', (v: string) => {
      txVisitor = this.$connex.thor.transaction(v)
      task()
    })
  },
  computed: {
    waitingMsg (): string {
      let result = ''

      if (!['confirmed', 'submitted'].includes(this.status)) {
        return result
      }

      switch (this.type) {
        case 'swap':
          result = `Swapping ${this.contents[0].amount} ${this.contents[0].token.toUpperCase()} for ${this.contents[1].amount} ${this.contents[1].token.toUpperCase()}`
          break
        case 'add':
          result = `Supplying ${this.contents[0].amount} ${this.contents[0].token.toUpperCase()} and ${this.contents[1].amount} ${this.contents[1].token.toUpperCase()}`
          break
        case 'remove':
          result = `Removing ${this.contents[0].amount} ${this.contents[0].token.toUpperCase()} and ${this.contents[1].amount} ${this.contents[1].token.toUpperCase()}`
          break
        case 'claim':
          result = `Claiming ${this.contents[0].amount} ${this.contents[0].token.toUpperCase()}`
          break
      }
      return result
    },
    title (): string {
      let result = ''

      if (this.status !== 'received') {
        return result
      }
      switch (this.type) {
        case 'swap':
          result = 'Confirm Swap'
          break
        case 'add':
          result = 'You will supply'
          break
        case 'remove':
          result = 'You will receive'
          break
        case 'claim':
          result = 'You will receive'
          break
      }
      return result
    },
    icon (): string {
      return this.type === 'swap' ? 'el-icon-bottom' : 'el-icon-plus'
    }
  },
  methods: {
    open (): void {
      this.dialogVisible = true
    },
    onClose (): void {
      if (this.presume) {
        this.presume.ignore()
      }
      this.status = 'received'
    },
    onOk (): void {
      if (this.status === 'success') {
        this.$emit('successed')
      }
      this.dialogVisible = false
    },
    async onClick (): Promise<void> {
      if (this.onConfirm && typeof this.onConfirm === 'function') {
        this.status = 'submitted'
        try {
          this.presume = new Presume(this.onConfirm as () => Promise<Connex.Vendor.TxResponse>)
          const tx = await this.presume.promise
          this.txid = tx.txid
          this.status = 'confirmed'
        } catch (error) {
          this.status = error.message === 'abort' ? 'received' : 'rejected'
        }
      }
    }
  }
})
</script>
<style>
  .el-dialog{
    border-radius: 20px;
  }
  .el-dialog__headerbtn .el-dialog__close {
    font-size: 24px;
  }
</style>
