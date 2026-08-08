<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuth } from '@/composables/useAuth'
import NotificationBell from '@/modules/notifications/components/NotificationBell.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const { fullName, email, logout, isLoading } = useAuth()

const title = computed(() => {
  const metaTitle = route.meta.title
  return typeof metaTitle === 'string' ? metaTitle : 'Dashboard'
})

async function onLogout(): Promise<void> {
  await logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 md:hidden"
        aria-label="Toggle navigation"
        @click="ui.toggleSidebar()"
      >
        <span class="text-lg leading-none">☰</span>
      </button>
      <div>
        <h1 class="text-base font-semibold text-slate-900">{{ title }}</h1>
        <p class="text-xs text-slate-500">Authenticated shell</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <NotificationBell />
      <div class="hidden text-right sm:block">
        <p class="text-sm font-medium text-slate-900">{{ fullName || 'User' }}</p>
        <p class="text-xs text-slate-500">{{ email }}</p>
      </div>
      <AppButton variant="secondary" :loading="isLoading" @click="onLogout">Logout</AppButton>
    </div>
  </header>
</template>
