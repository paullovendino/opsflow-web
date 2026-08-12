<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppAccountMenu from '@/components/layout/AppAccountMenu.vue'
import AppGlobalSearch from '@/components/layout/AppGlobalSearch.vue'
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
  <header class="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:gap-4 md:px-6">
    <div class="flex min-w-0 shrink-0 items-center gap-3">
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 md:hidden"
        aria-label="Toggle navigation"
        @click="ui.toggleSidebar()"
      >
        <span class="text-lg leading-none">☰</span>
      </button>
      <div class="min-w-0">
        <h1 class="truncate text-base font-semibold text-slate-900">{{ title }}</h1>
        <p class="hidden text-xs text-slate-500 sm:block">Authenticated shell</p>
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <AppGlobalSearch />
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <NotificationBell />
      <AppAccountMenu />
    </div>
  </header>
</template>
