<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()
const { isSidebarOpen } = storeToRefs(ui)

/**
 * Keep list views mounted when opening Create/Edit modal alias routes
 * so filters, pagination, and lookup state are not destroyed/refetched.
 */
const viewKey = computed(() => {
  const name = typeof route.name === 'string' ? route.name : ''

  if (name === 'users.create' || name === 'users.edit') return 'users.index'
  if (name === 'projects.create' || name === 'projects.edit') return 'projects.index'
  if (name === 'tasks.create' || name === 'tasks.edit') return 'tasks.index'

  return route.path
})
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
      @click="ui.closeSidebar()"
    />

    <div class="flex min-h-screen">
      <AppSidebar />
      <div class="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main class="flex-1 px-4 py-6 md:px-6">
          <RouterView v-slot="{ Component }">
            <Transition name="opsflow-fade" mode="out-in">
              <component :is="Component" :key="viewKey" />
            </Transition>
          </RouterView>
        </main>
      </div>
    </div>
  </div>
</template>
