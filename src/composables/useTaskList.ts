import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as taskService from '@/services/taskService'
import type { PaginationMeta } from '@/types/api'
import type {
  Task,
  TaskListQuery,
  TaskPriority,
  TaskSortField,
  TaskStatus,
} from '@/types/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/task'
import { toApiClientError } from '@/utils/errors'
import { asRouteName, listIndexLocation, modalAliasLocation } from '@/utils/modalRoutes'

function parseOptionalInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as string[]).includes(value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && (TASK_PRIORITIES as string[]).includes(value)
}

export function useTaskList(options: { lockedProjectId?: number | null } = {}) {
  const route = useRoute()
  const router = useRouter()

  const tasks = ref<Task[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const searchInput = ref('')

  const filters = reactive({
    search: '',
    status: '' as TaskStatus | '',
    priority: '' as TaskPriority | '',
    project_id: null as number | null,
    assigned_to: null as number | null,
    created_by: null as number | null,
    sort: 'created_at' as TaskSortField,
    direction: 'desc' as 'asc' | 'desc',
    page: 1,
    per_page: 15,
  })

  const isEmpty = computed(
    () => !isLoading.value && !errorMessage.value && tasks.value.length === 0,
  )
  const hasActiveFilters = computed(
    () =>
      Boolean(filters.search) ||
      Boolean(filters.status) ||
      Boolean(filters.priority) ||
      (options.lockedProjectId == null && filters.project_id != null) ||
      filters.assigned_to != null ||
      filters.created_by != null,
  )

  function applyQueryFromRoute(): void {
    if (options.lockedProjectId != null) {
      filters.project_id = options.lockedProjectId
      return
    }

    const query = route.query
    filters.search = typeof query.search === 'string' ? query.search : ''
    searchInput.value = filters.search
    filters.status = isTaskStatus(query.status) ? query.status : ''
    filters.priority = isTaskPriority(query.priority) ? query.priority : ''
    filters.project_id = parseOptionalInt(query.project_id)
    filters.assigned_to = parseOptionalInt(query.assigned_to)
    filters.created_by = parseOptionalInt(query.created_by)
    filters.sort =
      typeof query.sort === 'string' && query.sort.length > 0
        ? (query.sort as TaskSortField)
        : 'created_at'
    filters.direction = query.direction === 'asc' ? 'asc' : 'desc'
    filters.page = Math.max(1, parseOptionalInt(query.page) ?? 1)
    filters.per_page = Math.min(100, Math.max(1, parseOptionalInt(query.per_page) ?? 15))
  }

  async function syncQuery(): Promise<void> {
    if (options.lockedProjectId != null) return

    const query: Record<string, string> = {}
    if (filters.search) query.search = filters.search
    if (filters.status) query.status = filters.status
    if (filters.priority) query.priority = filters.priority
    if (filters.project_id != null) query.project_id = String(filters.project_id)
    if (filters.assigned_to != null) query.assigned_to = String(filters.assigned_to)
    if (filters.created_by != null) query.created_by = String(filters.created_by)
    if (filters.sort !== 'created_at') query.sort = filters.sort
    if (filters.direction !== 'desc') query.direction = filters.direction
    if (filters.page > 1) query.page = String(filters.page)
    if (filters.per_page !== 15) query.per_page = String(filters.per_page)

    const indexLocation = listIndexLocation(asRouteName(route.name), query)
    await router.replace(indexLocation ?? { query })
  }

  function openModalAlias(name: 'tasks.create' | 'tasks.edit', params?: Record<string, string | number>): void {
    if (options.lockedProjectId != null) return
    void router.push(modalAliasLocation(name, route.query, params))
  }

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    const params: TaskListQuery = {
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      project_id: options.lockedProjectId ?? filters.project_id,
      assigned_to: filters.assigned_to,
      created_by: filters.created_by,
      sort: filters.sort,
      direction: filters.direction,
      page: filters.page,
      per_page: filters.per_page,
    }

    try {
      const result = await taskService.listTasks(params)
      tasks.value = result.tasks
      meta.value = result.meta
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load tasks.'
      if (tasks.value.length === 0) {
        meta.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function retry(): Promise<void> {
    await load()
  }

  function setPage(page: number): void {
    filters.page = page
    void syncQuery().then(load)
  }

  function clearFilters(): void {
    searchInput.value = ''
    filters.search = ''
    filters.status = ''
    filters.priority = ''
    if (options.lockedProjectId == null) {
      filters.project_id = null
    }
    filters.assigned_to = null
    filters.created_by = null
    filters.page = 1
    void syncQuery().then(load)
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  function onSearchInput(value: string): void {
    searchInput.value = value
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      filters.search = searchInput.value.trim()
      filters.page = 1
      void syncQuery().then(load)
    }, 350)
  }

  function onFilterChange(): void {
    filters.page = 1
    void syncQuery().then(load)
  }

  onMounted(() => {
    applyQueryFromRoute()
    if (options.lockedProjectId != null) {
      filters.project_id = options.lockedProjectId
    }
    void load()
  })

  watch(
    () => route.query,
    () => {
      if (options.lockedProjectId != null) return
      applyQueryFromRoute()
    },
  )

  watch(
    () => options.lockedProjectId,
    (value) => {
      if (value != null) {
        filters.project_id = value
        filters.page = 1
        void load()
      }
    },
  )

  return {
    tasks,
    meta,
    filters,
    searchInput,
    isLoading,
    errorMessage,
    isEmpty,
    hasActiveFilters,
    load,
    retry,
    setPage,
    clearFilters,
    onSearchInput,
    onFilterChange,
    syncQuery,
    openModalAlias,
  }
}
