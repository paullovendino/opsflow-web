import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerHttpInterceptors } from '@/services/http'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
registerHttpInterceptors()

const auth = useAuthStore()
await auth.bootstrap()

app.use(router)
app.mount('#app')
