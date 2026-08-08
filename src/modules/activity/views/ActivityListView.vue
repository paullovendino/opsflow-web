<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFilterBar from '@/components/ui/AppFilterBar.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppTableSkeleton from '@/components/ui/AppTableSkeleton.vue'
import { useActivityTimeline } from '@/composables/useActivityTimeline'
import { ACTIVITY_ACTIONS, ACTIVITY_SUBJECT_TYPES, type ActivitySubjectType } from '@/types/activity'
import { activityHeadline, activitySubjectLabel, humanizeAction } from '@/utils/activity'
import { formatDateTime, humanizeKey } from '@/utils/format'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'

const route = useRoute()
const router = useRouter()
const headingRef = ref<HTMLElement | null>(null)

const {
  logs,
  meta,
  filters,
  isLoading,
  errorMessage,
  isEmpty,
  hasActiveFilters,
  rangeError,
  load,
  retry,
  applyFilters,
  clearFilters,
} = useActivityTimeline({ type: 'global' }, { quiet: false, perPage: 15 })

const actionOptions = ACTIVITY_ACTIONS.map((action) => ({
  value: action.value,
  label: action.label,
}))

const subjectTypeOptions = ACTIVITY_SUBJECT_TYPES.map((type) => ({
  value: type.value,
  label: type.label,
}))

const showSkeleton = computed(() => isInitialListLoading(isLoading.value, logs.value.length))
const softRefresh = computed(() => isSoftListRefresh(isLoading.value, logs.value.length))

function applyQueryFromRoute(): void {
  const query = route.query
  filters.action = typeof query.action === 'string' ? query.action : ''
  filters.subject_type =
    query.subject_type === 'user' || query.subject_type === 'project' || query.subject_type === 'task'
      ? query.subject_type
      : ''
  filters.from = typeof query.from === 'string' ? query.from : ''
  filters.to = typeof query.to === 'string' ? query.to : ''
  filters.page = Math.max(1, Number(query.page) || 1)
}

async function syncQuery(): Promise<void> {
  const query: Record<string, string> = {}
  if (filters.action) query.action = filters.action
  if (filters.subject_type) query.subject_type = filters.subject_type
  if (filters.from) query.from = filters.from
  if (filters.to) query.to = filters.to
  if (filters.page > 1) query.page = String(filters.page)
  await router.replace({ query })
}

function onFilterChange(): void {
  filters.page = 1
  void syncQuery().then(applyFilters)
}

function onClearFilters(): void {
  clearFilters()
  void syncQuery()
}

function onPageChange(page: number): void {
  filters.page = page
  void syncQuery().then(() => load())
}

function subjectRoute(log: (typeof logs.value)[number]) {
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

watch(
  () => route.query,
  () => {
    applyQueryFromRoute()
  },
)

onMounted(async () => {
  applyQueryFromRoute()
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        title="Activity"
        description="Read-only audit trail of significant project, task, and user changes."
      />
    </div>

    <AppFilterBar>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AppSelect
          id="activity_action"
          :model-value="filters.action"
          label="Action"
          placeholder="Any action"
          optional
          :options="actionOptions"
          @update:model-value="
            (value) => {
              filters.action = typeof value === 'string' ? value : ''
              onFilterChange()
            }
          "
        />
        <AppSelect
          id="activity_subject_type"
          :model-value="filters.subject_type"
          label="Subject"
          placeholder="Any subject"
          optional
          :options="subjectTypeOptions"
          @update:model-value="
            (value) => {
              filters.subject_type =
                value === 'user' || value === 'project' || value === 'task' ? (value as ActivitySubjectType) : ''
              onFilterChange()
            }
          "
        />
        <AppInput
          id="activity_from"
          :model-value="filters.from"
          label="From date"
          type="date"
          :error="rangeError"
          @update:model-value="
            (value) => {
              filters.from = value
              onFilterChange()
            }
          "
        />
        <AppInput
          id="activity_to"
          :model-value="filters.to"
          label="To date"
          type="date"
          @update:model-value="
            (value) => {
              filters.to = value
              onFilterChange()
            }
          "
        />
      </div>
      <div v-if="hasActiveFilters" class="mt-3">
        <AppButton type="button" variant="secondary" @click="onClearFilters">Clear filters</AppButton>
      </div>
    </AppFilterBar>

    <AppTableSkeleton v-if="showSkeleton" :columns="5" :rows="8" />

    <div
      v-else-if="errorMessage && logs.length === 0"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-red-900">Couldn't load activity</h2>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <AppEmptyState
      v-else-if="isEmpty"
      title="No activity yet"
      description="Significant changes across projects, tasks, and users will appear here."
    />

    <div v-else class="flex flex-col gap-4 transition-opacity" :class="{ 'opacity-60': softRefresh }" :aria-busy="isLoading">
      <p
        v-if="errorMessage"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="status"
      >
        Couldn't refresh activity. Showing the last loaded snapshot.
        <button type="button" class="ml-1 font-medium underline" @click="retry">Retry</button>
      </p>

      <AppTable caption="Activity logs">
        <template #head>
          <tr>
            <th class="px-4 py-3">When</th>
            <th class="px-4 py-3">Who</th>
            <th class="px-4 py-3">What happened</th>
            <th class="px-4 py-3">Entity</th>
            <th class="px-4 py-3">Action</th>
          </tr>
        </template>
        <tr v-for="log in logs" :key="log.id" data-test="activity-row">
          <td class="whitespace-nowrap px-4 py-3 text-slate-600">{{ formatDateTime(log.created_at) }}</td>
          <td class="px-4 py-3">
            <div class="font-medium text-slate-900">{{ log.actor?.full_name || 'System' }}</div>
            <div v-if="log.actor?.email" class="text-xs text-slate-500">{{ log.actor.email }}</div>
          </td>
          <td class="px-4 py-3 text-slate-800">{{ activityHeadline(log) }}</td>
          <td class="px-4 py-3">
            <RouterLink
              v-if="subjectRoute(log)"
              class="text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
              :to="subjectRoute(log)!"
            >
              {{ activitySubjectLabel(log) }}
            </RouterLink>
            <span v-else>{{ activitySubjectLabel(log) }}</span>
            <div class="text-xs text-slate-500">{{ humanizeKey(String(log.subject_type)) }}</div>
          </td>
          <td class="px-4 py-3">
            <AppBadge :label="humanizeAction(String(log.action))" tone="slate" />
          </td>
        </tr>
      </AppTable>

      <AppPagination v-if="meta" :meta="meta" :disabled="isLoading" @change="onPageChange" />
    </div>
  </div>
</template>
