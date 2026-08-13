<script setup lang="ts">
import ProjectProgressMeter from '@/components/ui/ProjectProgressMeter.vue'

defineProps<{
  progress: number | null
}>()
</script>

<template>
  <article
    class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    data-test="dashboard-average-progress"
  >
    <p class="text-sm font-medium text-slate-500">Average project progress</p>
    <div v-if="progress === null" class="mt-3 text-sm text-slate-600" data-test="average-progress-empty">
      No active project progress
    </div>
    <div v-else class="mt-3">
      <ProjectProgressMeter :progress="progress" compact />
    </div>
  </article>
</template>
