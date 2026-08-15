<script setup lang="ts">
import { computed, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { useActivityTimeline, type ActivitySource } from '@/composables/useActivityTimeline'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'
import { activityChangeSummary, activityHeadline, activitySubjectLabel, humanizeAction } from '@/utils/activity'
import { formatDateTime } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    source: ActivitySource
    title?: string
    description?: string
    perPage?: number
    quiet?: boolean
    /** Bump to reload activity after sibling mutations on the same record. */
    refreshKey?: number
  }>(),
  {
    title: 'Activity',
    description: 'Significant changes recorded for this record.',
    perPage: 10,
    quiet: true,
    refreshKey: 0,
  },
)

const sourceRef = computed(() => props.source)

const { logs, meta, isLoading, errorMessage, isEmpty, load, retry, setPage } = useActivityTimeline(sourceRef, {
  quiet: props.quiet,
  perPage: props.perPage,
})

watch(
  [() => props.source, () => props.refreshKey],
  () => {
    void load()
  },
  { immediate: true, deep: true },
)

const showSkeleton = computed(() => isInitialListLoading(isLoading.value, logs.value.length))
const softRefresh = computed(() => isSoftListRefresh(isLoading.value, logs.value.length))
</script>

<template>
  <section class="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
    <header class="mb-4">
      <h2 class="text-base font-semibold text-fg">{{ title }}</h2>
      <p v-if="description" class="mt-1 text-sm text-fg-subtle">{{ description }}</p>
    </header>

    <div v-if="showSkeleton" class="space-y-4" aria-busy="true" aria-label="Loading activity">
      <div v-for="index in 4" :key="index" class="flex gap-3">
        <AppSkeleton class="mt-1 h-8 w-8 shrink-0" rounded="full" />
        <div class="min-w-0 flex-1 space-y-2">
          <AppSkeleton class="h-4 w-3/4" />
          <AppSkeleton class="h-3 w-1/2" />
        </div>
      </div>
    </div>

    <div
      v-else-if="errorMessage && logs.length === 0"
      class="rounded-lg border border-danger-border bg-danger-soft px-4 py-4"
      role="alert"
    >
      <p class="text-sm font-medium text-danger-fg">Couldn't load activity</p>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <AppEmptyState
      v-else-if="isEmpty"
      title="No activity yet"
      description="Significant changes will appear here once work starts."
    />

    <div v-else class="transition-opacity" :class="{ 'opacity-60': softRefresh }" :aria-busy="isLoading">
      <p
        v-if="errorMessage"
        class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        role="status"
      >
        Couldn't refresh activity.
        <button type="button" class="ml-1 font-medium underline" @click="retry">Retry</button>
      </p>

      <ol class="space-y-4" aria-label="Activity timeline">
        <li
          v-for="log in logs"
          :key="log.id"
          class="relative border-l border-border pl-4"
          data-test="activity-item"
        >
          <span class="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-fg-muted" />
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm font-medium text-fg">{{ activityHeadline(log) }}</p>
            <AppBadge :label="humanizeAction(String(log.action))" tone="slate" />
          </div>
          <p class="mt-1 text-sm text-fg-subtle">
            {{ activitySubjectLabel(log) }}
            <span class="text-fg-muted">·</span>
            {{ formatDateTime(log.created_at) }}
          </p>
          <p v-if="activityChangeSummary(log)" class="mt-1 text-xs text-fg-muted">
            {{ activityChangeSummary(log) }}
          </p>
        </li>
      </ol>

      <div v-if="meta && meta.last_page > 1" class="mt-5">
        <AppPagination :meta="meta" :disabled="isLoading" @change="setPage" />
      </div>
    </div>
  </section>
</template>
