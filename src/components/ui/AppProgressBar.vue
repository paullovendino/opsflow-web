<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { isGlobalLoading, globalLoadingProgress } = storeToRefs(ui)

const widthStyle = computed(() => ({
  width: `${Math.min(100, Math.max(globalLoadingProgress.value, isGlobalLoading.value ? 8 : 0))}%`,
  opacity: isGlobalLoading.value || globalLoadingProgress.value > 0 ? 1 : 0,
}))
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
    role="progressbar"
    :aria-hidden="!isGlobalLoading"
    :aria-valuenow="Math.round(globalLoadingProgress)"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Loading"
  >
    <div
      class="h-full bg-slate-900 transition-[width,opacity] duration-200 ease-out"
      :style="widthStyle"
    />
  </div>
</template>
