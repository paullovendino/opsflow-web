<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ActivityLog } from '@/types/activity'
import { activityHeadline, activitySubjectLabel, humanizeAction } from '@/utils/activity'
import { formatDateTime } from '@/utils/format'

defineProps<{
  items: ActivityLog[]
}>()

function subjectRoute(log: ActivityLog) {
  if (log.subject_type === 'project') {
    return { name: 'projects.show' as const, params: { id: log.subject_id } }
  }
  if (log.subject_type === 'task') {
    return { name: 'tasks.show' as const, params: { id: log.subject_id } }
  }
  if (log.subject_type === 'user') {
    return { name: 'users.show' as const, params: { id: log.subject_id } }
  }
  return null
}
</script>

<template>
  <ol class="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm" aria-label="Recent activity">
    <li
      v-for="log in items"
      :key="log.id"
      class="relative border-l border-border pl-4"
      data-test="dashboard-activity-item"
    >
      <span class="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-fg-muted" />
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-sm font-medium text-fg">{{ activityHeadline(log) }}</p>
        <span class="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-fg-subtle">
          {{ humanizeAction(String(log.action)) }}
        </span>
      </div>
      <p class="mt-1 text-xs text-fg-muted">
        <RouterLink
          v-if="subjectRoute(log)"
          :to="subjectRoute(log)!"
          class="font-medium text-fg-secondary underline-offset-2 hover:underline"
          data-test="dashboard-activity-link"
        >
          {{ activitySubjectLabel(log) }}
        </RouterLink>
        <span v-else class="font-medium text-fg-secondary">{{ activitySubjectLabel(log) }}</span>
        <span class="text-fg-muted"> · </span>
        {{ formatDateTime(log.created_at) }}
      </p>
    </li>
  </ol>
</template>
