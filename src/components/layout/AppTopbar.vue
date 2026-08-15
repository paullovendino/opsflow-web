<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppAccountMenu from '@/components/layout/AppAccountMenu.vue'
import AppGlobalSearch from '@/components/layout/AppGlobalSearch.vue'
import AppThemeToggle from '@/components/ui/AppThemeToggle.vue'
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
  <header class="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:gap-4 md:px-6">
    <div class="flex min-w-0 shrink-0 items-center gap-3">
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-strong text-fg-secondary md:hidden"
        aria-label="Toggle navigation"
        @click="ui.toggleSidebar()"
      >
        <span class="text-lg leading-none">☰</span>
      </button>
      <div class="min-w-0">
        <h1 class="truncate text-base font-semibold leading-tight text-fg">{{ title }}</h1>
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <AppGlobalSearch />
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <AppThemeToggle />
      <NotificationBell />
      <AppAccountMenu />
    </div>
  </header>
</template>
