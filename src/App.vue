<template>
  <el-container>
    <el-header style="border-bottom: 1px solid #eee">
      <el-row justify="space-between" style="height: 100%" align="middle">
        <el-col :span="6">
          <span style="font-size:18px">TinySwap</span>
        </el-col>
        <el-col :xs="16" :md="10" :span="10">
          <el-row justify="end">
          <el-button class="hidden-sm-and-down address-btn" round size="regular" plain type="primary" @click="onConnect" style="padding: 0 10px;">
            <template  v-if="addr" >
              <el-row justify="center" align="middle">
                <Picasso style="width: 28px; height: 28px; border-radius: 50%; margin-right: 5px;" :addr="addr" />
                <Address style="font-size: 15px; margin-top:2px;" :addr="addr"/>
              </el-row>
            </template>
            <span style="font-size: 14px" v-else>Connect Wallet</span>
          </el-button>
          <el-button class="hidden-md-and-up" v-if="!addr" round size="small" plain type="primary" @click="onConnect" style="padding: 0 8px;">
            Connect Wallet
          </el-button>
          <Picasso class="hidden-md-and-up" @click="onConnect" v-else style="width: 36px; height: 36px; border-radius: 50%" :addr="addr" />
          <el-dropdown style="margin-left: 20px">
            <el-button size="small" plain type="primary">
              <el-icon>
                <MoreFilled />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="toGit">GitHub</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          </el-row>
        </el-col>
      </el-row>
    </el-header>
    <el-main class="el-col" style="padding: 20px 0;">
      <el-row justify="center" style="margin-bottom: 15px">
        <el-radio-group v-model="tab">
          <el-radio-button label="swap">Swap</el-radio-button>
          <el-radio-button label="pool">Pool</el-radio-button>
          <el-radio-button label="claim">Claim</el-radio-button>
        </el-radio-group>
      </el-row>
      <el-row justify="center">
        <el-col :xl="8" :lg="10" :md="12" :xs="22">
          <component @connect="onConnect" :is="tab" :addr="addr"/>
        </el-col>
      </el-row>
    </el-main>
    <el-dialog
      :destroy-on-close="true"
      width="350px"
      v-model="dialogVisible"
      custom-class="account-info"
      :show-close="false"
    >
      <template #title>
        <el-row align="middle" justify="space-between">
          <el-col :span="10">
            Account
          </el-col>
          <el-col :span="10" style="text-align: right">
            <el-button @click="onDisconnect" size="mini" round style="padding: 3px 15px;">
              Disconnect
            </el-button>
          </el-col>
        </el-row>
      </template>
      <div>
        <el-row align="middle" justify="space-between">
          <el-col :span="18">
            <el-row align="middle">
              <Picasso style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;" :addr="addr" />
              <Address style="font-size: 16px" :addr="addr" />
              <el-link style="margin-left: 5px" href="javascript:;"  :underline="false">
                <el-icon @click="copy">
                  <document-copy/>
                </el-icon>
              </el-link>
            </el-row>
          </el-col>
          <el-col :span="6" style="text-align: right">
            <el-button @click="onChange" size="mini" style="padding: 3px 15px;" type="primary" plain round>Change</el-button>
          </el-col>
          <el-col style="margin-top: 10px" :span="24">
            <el-link icon="el-icon-link" target="_blank" :underline="false" style="font-weight: lighter;" :href="accountLink" >
              View on Explorer </el-link>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-row :gutter="20">
          <el-col style="margin-bottom: 5px">
            <el-row align="middle">
              <Vet style="margin-right: 10px; width: 25px; height: 25px"/>
              <Amount :balance="vet" />
            </el-row>
          </el-col>
          <el-col>
            <el-row align="middle">
              <Vtho style="margin-right: 10px; width: 25px; height: 25px"/>
              <Amount :balance="vtho" />
            </el-row>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </el-container>
</template>

<script lang="ts">
import Connex from '@vechain/connex'
import { Ticker } from './utils'
import { defineComponent } from 'vue'
import Swap from './components/swap.vue'
import Address from './components/address.vue'
import Amount from './components/amount.vue'
import Pool from './components/pool.vue'
import Picasso from './components/picasso.vue'
import Claim from './components/claim.vue'
import Vet from './components/vet.vue'
import Vtho from './components/vtho.vue'

export default defineComponent({
  name: 'App',
  components: {
    Swap,
    Address,
    Amount,
    Pool,
    Vet,
    Vtho,
    Picasso,
    Claim
  },
  data () {
    return {
      tab: 'swap',
      addr: '',
      dialogVisible: false
    }
  },
  created () {
    let ticker: Ticker | null = null
    this.addr = sessionStorage.getItem('addr') || ''
    const task = ():void => {
      if (ticker) {
        ticker.stop()
      }
      ticker = new Ticker(this.$connex)
      try {
        ticker.tick(async () => {
          if (this.accountVisitor) {
            const b = await this.accountVisitor.get()
            this.$state.account = b
            const balance = await this.$vv.balanceOf(this.addr)
            const claimVtho = await this.$vv.getUserVTHO(this.addr)
            this.$state.lpToken.balanceOf = balance
            this.$state.lpToken.claim = claimVtho
          } else {
            this.$state.account = {
              balance: '',
              energy: '',
              hasCode: false
            }
            this.$state.lpToken.balanceOf = ''
          }
          const r = await this.$vv.getReserves()
          this.$state.reserves.vtho = r[0]
          this.$state.reserves.vet = r[1]

          const total = await this.$vv.totalSupply()
          this.$state.lpToken.totalSupply = total
        })
      } catch (error) {
        console.log('tick error:', error)
      }
    }

    task()

    this.$watch('addr', () => {
      task()
    })
  },
  computed: {
    accountLink (): string {
      return `${this.$explore}accounts/${this.addr}`
    },
    vtho (): string {
      return this.$state.account.energy
    },
    vet (): string {
      return this.$state.account.balance
    },
    accountVisitor (): Connex.Thor.Account.Visitor | null {
      if (this.addr) {
        return this.$connex.thor.account(this.addr)
      } else {
        return null
      }
    }
  },
  methods: {
    toGit (): void {
      window.open('https://github.com/vechain/', '_blank')
    },
    async onConnect (): Promise<void> {
      if (!this.addr) {
        await this.signCert()
      } else {
        this.showDialog()
      }
    },
    copy ():void {
      navigator.clipboard.writeText(this.addr).then(() => {
        console.log('cpied')
      })
    },
    onDisconnect (): void {
      this.addr = ''
      this.$state.account.balance = ''
      this.$state.account.energy = ''
      this.dialogVisible = false
      sessionStorage.removeItem('addr')
    },
    onChange (): void {
      this.signCert()
      this.dialogVisible = false
    },
    showDialog (): void {
      this.dialogVisible = true
    },
    async signCert (): Promise<void> {
      try {
        const resp = await this.$connex.vendor
          .sign('cert', {
            purpose: 'identification',
            payload: {
              type: 'text',
              content: 'Sign in to use TinySwap.'
            }
          })
          .request()
        this.addr = resp.annex.signer
        sessionStorage.setItem('addr', this.addr)
      } catch (error) {
        console.log(error)
      }
    }
  }
})
</script>
<style>
body {
  margin: 0;
  padding: 0;
}
</style>
