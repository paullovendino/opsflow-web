<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'
import { authLayoutViewKey } from '@/utils/modalRoutes'

const route = useRoute()
const ui = useUiStore()
const notifications = useNotificationsStore()
const { isSidebarOpen } = storeToRefs(ui)

onMounted(() => {
  notifications.startPolling()
})

onUnmounted(() => {
  notifications.stopPolling()
})

/**
 * One key per list family (index + create + edit aliases).
 * Modal route changes must not remount the list or replay onMounted fetches.
 */
const viewKey = computed(() => authLayoutViewKey(route.name, route.path))
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
