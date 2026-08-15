import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerHttpInterceptors } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
registerHttpInterceptors()

useUiStore().initTheme()

const auth = useAuthStore()
await auth.bootstrap()

app.use(router)
app.mount('#app')
