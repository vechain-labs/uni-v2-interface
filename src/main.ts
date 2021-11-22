import 'element-plus/lib/theme-chalk/base.css'
import 'element-plus/lib/theme-chalk/display.css'
import 'element-plus/lib/theme-chalk/el-icon.css'
import './style.css'
import { createApp, reactive } from 'vue'
import {
  Link,
  Back,
  Bottom,
  Loading,
  CircleCheck,
  CircleClose,
  Plus,
  DocumentCopy,
  MoreFilled,
  Warning
} from '@element-plus/icons'
import {
  ElContainer,
  ElHeader,
  ElRow,
  ElCol,
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMain,
  ElRadio,
  ElRadioGroup,
  ElRadioButton,
  ElDialog,
  ElLink,
  ElIcon,
  ElForm,
  ElInput,
  ElFormItem,
  ElCard,
  ElSlider,
  ElPopover
} from 'element-plus'
import App from './App.vue'
import './registerServiceWorker'
import Connex from '@vechain/connex'
import Pair from './contractCall/pair'
import Token from './contractCall/token'
import Router from './contractCall/router'

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $connex: Connex
    $state: {
      account: Connex.Thor.Account
      reserves: {
        vet: string,
        vtho: string
      },
      lpToken: {
        totalSupply: string,
        balanceOf: string,
        claim: string
      }
    }
    $explore: string
    $vv: Pair
    $vtho: Token
    $router: Router
    $path: {
      vvet: string
      vtho: string
    }
  }
}

const instance = createApp(App)

instance.component(ElContainer.name, ElContainer)
instance.component(ElHeader.name, ElHeader)
instance.component(ElRow.name, ElRow)
instance.component(ElCol.name, ElCol)
instance.component(ElButton.name, ElButton)
instance.component(ElDropdown.name, ElDropdown)
instance.component(ElDropdownItem.name, ElDropdownItem)
instance.component(ElDropdownMenu.name, ElDropdownMenu)
instance.component(ElMain.name, ElMain)
instance.component(ElRadio.name, ElRadio)
instance.component(ElRadioGroup.name, ElRadioGroup)
instance.component(ElRadioButton.name, ElRadioButton)
instance.component(ElDialog.name, ElDialog)
instance.component(ElLink.name, ElLink)
instance.component(ElIcon.name, ElIcon)
instance.component(ElForm.name, ElForm)
instance.component(ElInput.name, ElInput)
instance.component(ElFormItem.name, ElFormItem)
instance.component(ElCard.name, ElCard)
instance.component(ElSlider.name, ElSlider)
instance.component(ElPopover.name, ElPopover)

instance.component(Link.name, Link)
instance.component(Back.name, Back)
instance.component(Bottom.name, Bottom)
instance.component(Loading.name, Loading)
instance.component(CircleCheck.name, CircleCheck)
instance.component(CircleClose.name, CircleClose)
instance.component(Plus.name, Plus)
instance.component(MoreFilled.name, MoreFilled)
instance.component(DocumentCopy.name, DocumentCopy)
instance.component(Warning.name, Warning)

const connex = new Connex({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  node: process.env.VUE_APP_NODE as string,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  network: process.env.VUE_APP_NETWORK as 'test' | 'main'
})

instance.config.globalProperties.$connex = connex
instance.config.globalProperties.$state = reactive({
  account: {
    balance: null as unknown as string,
    energy: null as unknown as string,
    hasCode: null as unknown as boolean
  },
  reserves: {
    vet: 0,
    vtho: 0
  },
  lpToken: {
    totalSupply: 0,
    balanceOf: 0,
    claim: 0
  }
})

// vvet & vtho pair address
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
instance.config.globalProperties.$vv = new Pair(process.env.VUE_APP_VV!, connex)
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
instance.config.globalProperties.$vtho = new Token(process.env.VUE_APP_VTHO!, connex)
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
instance.config.globalProperties.$router = new Router(process.env.VUE_APP_ROUTER!, connex)
instance.config.globalProperties.$explore = process.env.VUE_APP_EXPLORE

instance.config.globalProperties.$path = {
  vvet: process.env.VUE_APP_VVET,
  vtho: process.env.VUE_APP_VTHO
}

instance.directive('number', {
  mounted (el) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'ArrowDown', 'ArrowUp']
    const mk = ['a', 'c', 'v', 'x']
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!keys.includes(event.key) && !(mk.includes(event.key) && (event.metaKey || event.ctrlKey))) {
        event.cancelBubble = true
        event.preventDefault()
        event.stopPropagation()
      }
    })
  }
})

instance.mount('#app')
