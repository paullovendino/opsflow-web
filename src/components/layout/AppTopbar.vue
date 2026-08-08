<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppAccountMenu from '@/components/layout/AppAccountMenu.vue'
import NotificationBell from '@/modules/notifications/components/NotificationBell.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()

const title = computed(() => {
  const metaTitle = route.meta.title
  return typeof metaTitle === 'string' ? metaTitle : 'Dashboard'
})
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
      <AppAccountMenu />
    </div>
  </header>
</template>
