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
  <ol class="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Recent activity">
    <li
      v-for="log in items"
      :key="log.id"
      class="relative border-l border-slate-200 pl-4"
      data-test="dashboard-activity-item"
    >
      <span class="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-sm font-medium text-slate-900">{{ activityHeadline(log) }}</p>
        <span class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
          {{ humanizeAction(String(log.action)) }}
        </span>
      </div>
      <p class="mt-1 text-xs text-slate-500">
        <RouterLink
          v-if="subjectRoute(log)"
          :to="subjectRoute(log)!"
          class="font-medium text-slate-700 underline-offset-2 hover:underline"
          data-test="dashboard-activity-link"
        >
          {{ activitySubjectLabel(log) }}
        </RouterLink>
        <span v-else class="font-medium text-slate-700">{{ activitySubjectLabel(log) }}</span>
        <span class="text-slate-400"> · </span>
        {{ formatDateTime(log.created_at) }}
      </p>
    </li>
  </ol>
</template>
