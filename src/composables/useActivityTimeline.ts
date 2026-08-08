import { computed, reactive, ref, toValue, type MaybeRefOrGetter } from 'vue'
import * as activityLogService from '@/services/activityLogService'
import type { ActivityListQuery, ActivityLog, ActivitySubjectType } from '@/types/activity'
import type { PaginationMeta } from '@/types/api'
import { toApiClientError } from '@/utils/errors'

export type ActivitySource =
  | { type: 'global' }
  | { type: 'project'; id: number }
  | { type: 'task'; id: number }
  | { type: 'user'; id: number }
  | null

export interface ActivityTimelineFilters {
  action: string
  subject_type: ActivitySubjectType | ''
  from: string
  to: string
  page: number
  per_page: number
}

export function useActivityTimeline(
  source: MaybeRefOrGetter<ActivitySource>,
  options: { quiet?: boolean; perPage?: number } = {},
) {
  const logs = ref<ActivityLog[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const filters = reactive<ActivityTimelineFilters>({
    action: '',
    subject_type: '',
    from: '',
    to: '',
    page: 1,
    per_page: options.perPage ?? 15,
  })

  const isEmpty = computed(() => !isLoading.value && !errorMessage.value && logs.value.length === 0)
  const hasActiveFilters = computed(
    () => Boolean(filters.action) || Boolean(filters.subject_type) || Boolean(filters.from) || Boolean(filters.to),
  )
  const rangeError = computed(() => {
    if (filters.from && filters.to && filters.to < filters.from) {
      return 'End date must be on or after the start date.'
    }
    return null
  })

  function resolvedSource(): ActivitySource {
    return toValue(source)
  }

  function queryParams(): ActivityListQuery {
    const current = resolvedSource()
    const params: ActivityListQuery = {
      page: filters.page,
      per_page: filters.per_page,
    }

    if (current?.type === 'global') {
      if (filters.action) params.action = filters.action
      if (filters.subject_type) params.subject_type = filters.subject_type
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to
    }

    return params
  }

  async function load(): Promise<void> {
    const current = resolvedSource()
    if (!current || ('id' in current && !current.id)) {
      logs.value = []
      meta.value = null
      errorMessage.value = null
      isLoading.value = false
      return
    }

    if (rangeError.value) {
      errorMessage.value = rangeError.value
      return
    }

    isLoading.value = true
    errorMessage.value = null

    const quiet = options.quiet ?? current.type !== 'global'
    const params = queryParams()

    try {
      const result =
        current.type === 'global'
          ? await activityLogService.listActivityLogs(params, { quietProgress: quiet })
          : current.type === 'project'
            ? await activityLogService.listProjectActivityLogs(current.id, params, { quietProgress: quiet })
            : current.type === 'task'
              ? await activityLogService.listTaskActivityLogs(current.id, params, { quietProgress: quiet })
              : await activityLogService.listUserActivityLogs(current.id, params, { quietProgress: quiet })

      logs.value = result.logs
      meta.value = result.meta
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load activity.'
      if (logs.value.length === 0) {
        meta.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function retry(): Promise<void> {
    await load()
  }

  async function setPage(page: number): Promise<void> {
    filters.page = page
    await load()
  }

  async function applyFilters(): Promise<void> {
    filters.page = 1
    await load()
  }

  async function clearFilters(): Promise<void> {
    filters.action = ''
    filters.subject_type = ''
    filters.from = ''
    filters.to = ''
    filters.page = 1
    await load()
  }

  return {
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
    setPage,
    applyFilters,
    clearFilters,
  }
}
