import { createApp } from 'vue'
import App from './App.vue'
import router from './app/router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import naive from 'naive-ui'
import VCalendar from 'v-calendar'
import 'v-calendar/style.css'

import './assets/styles/global.css'
import { setupOfflineInterceptor } from './shared/offline/offlineInterceptor'

setupOfflineInterceptor()

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(naive)
app.use(VCalendar, {})
app.use(pinia)
app.use(router)

// Suppress known Naive UI / Vue 3.5 slot compatibility warning
app.config.warnHandler = (msg, _instance, trace) => {
  if (msg.includes('Slot "default" invoked outside of the render function')) return;
  console.warn('[Vue warn]:', msg, trace);
};

app.mount('#app')