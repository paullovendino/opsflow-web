<script setup lang="ts">
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { isSidebarOpen } = storeToRefs(ui)
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
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
