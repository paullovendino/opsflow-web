<script setup lang="ts">
withDefaults(
  defineProps<{
    progress: number | null
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div :class="compact ? 'min-w-0' : 'flex flex-col gap-2'" data-test="project-progress">
    <p v-if="!compact" class="text-sm font-medium text-slate-700">Project progress</p>
    <p v-else class="text-xs text-slate-500">Progress</p>

    <div v-if="progress === null" class="text-sm text-slate-600" data-test="project-progress-empty">
      {{ compact ? 'No tasks' : 'No active tasks' }}
    </div>
    <div v-else class="flex min-w-0 items-center gap-2">
      <div
        class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Project progress ${progress} percent`"
        data-test="project-progress-bar"
      >
        <div
          class="h-full rounded-full bg-slate-800 transition-all"
          data-test="project-progress-fill"
          :style="{ width: `${Math.max(0, Math.min(progress, 100))}%` }"
        />
      </div>
      <span class="shrink-0 text-sm font-medium tabular-nums text-slate-900" data-test="project-progress-value">
        {{ progress }}%
      </span>
    </div>
  </div>
</template>
