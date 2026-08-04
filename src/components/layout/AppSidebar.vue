<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuth } from '@/composables/useAuth'
import { useUiStore } from '@/stores/ui'

const appName = import.meta.env.VITE_APP_NAME || 'OpsFlow'
const ui = useUiStore()
const { isSidebarOpen } = storeToRefs(ui)
const { roleName } = useAuth()

const upcoming = [
  { label: 'Users', roles: ['administrator', 'project_manager'] },
  { label: 'Projects', roles: ['administrator', 'project_manager', 'employee'] },
  { label: 'Tasks', roles: ['administrator', 'project_manager', 'employee'] },
  { label: 'Reports', roles: ['administrator', 'project_manager', 'employee'] },
] as const

function showUpcoming(roles: readonly string[]): boolean {
  if (!roleName.value) {
    return true
  }

  return roles.includes(roleName.value)
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0"
    :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Primary"
  >
    <div class="border-b border-slate-200 px-5 py-4">
      <p class="text-lg font-semibold tracking-tight text-slate-900">{{ appName }}</p>
      <p class="text-xs text-slate-500">Operations workspace</p>
    </div>

    <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
      <RouterLink
        :to="{ name: 'dashboard' }"
        class="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        active-class="bg-slate-900 text-white hover:bg-slate-900"
        @click="ui.closeSidebar()"
      >
        Dashboard
      </RouterLink>

      <p class="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Coming later</p>
      <template v-for="item in upcoming" :key="item.label">
        <button
          v-if="showUpcoming(item.roles)"
          type="button"
          class="cursor-not-allowed rounded-md px-3 py-2 text-left text-sm text-slate-400"
          disabled
          :aria-label="`${item.label} (coming later)`"
        >
          {{ item.label }}
        </button>
      </template>
    </nav>
  </aside>
</template>
