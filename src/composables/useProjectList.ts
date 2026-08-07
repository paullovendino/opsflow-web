import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as projectService from '@/services/projectService'
import type { PaginationMeta } from '@/types/api'
import type { Project, ProjectListQuery, ProjectSortField, ProjectStatus } from '@/types/project'
import { PROJECT_STATUSES } from '@/types/project'
import { toApiClientError } from '@/utils/errors'

function parseOptionalInt(value: unknown): number | null {
  if (typeof value !== 'string' || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && (PROJECT_STATUSES as string[]).includes(value)
}

export function useProjectList() {
  const route = useRoute()
  const router = useRouter()

  const projects = ref<Project[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const searchInput = ref('')

  const filters = reactive({
    search: '',
    status: '' as ProjectStatus | '',
    created_by: null as number | null,
    sort: 'created_at' as ProjectSortField,
    direction: 'desc' as 'asc' | 'desc',
    page: 1,
    per_page: 15,
  })

  const isEmpty = computed(() => !isLoading.value && !errorMessage.value && projects.value.length === 0)
  const hasActiveFilters = computed(
    () => Boolean(filters.search) || Boolean(filters.status) || filters.created_by != null,
  )

  function applyQueryFromRoute(): void {
    const query = route.query
    filters.search = typeof query.search === 'string' ? query.search : ''
    searchInput.value = filters.search
    filters.status = isProjectStatus(query.status) ? query.status : ''
    filters.created_by = parseOptionalInt(query.created_by)
    filters.sort =
      typeof query.sort === 'string' && query.sort.length > 0
        ? (query.sort as ProjectSortField)
        : 'created_at'
    filters.direction = query.direction === 'asc' ? 'asc' : 'desc'
    filters.page = Math.max(1, parseOptionalInt(query.page) ?? 1)
    filters.per_page = Math.min(100, Math.max(1, parseOptionalInt(query.per_page) ?? 15))
  }

  async function syncQuery(): Promise<void> {
    const query: Record<string, string> = {}

    if (filters.search) query.search = filters.search
    if (filters.status) query.status = filters.status
    if (filters.created_by != null) query.created_by = String(filters.created_by)
    if (filters.sort !== 'created_at') query.sort = filters.sort
    if (filters.direction !== 'desc') query.direction = filters.direction
    if (filters.page > 1) query.page = String(filters.page)
    if (filters.per_page !== 15) query.per_page = String(filters.per_page)

    await router.replace({ query })
  }

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    const params: ProjectListQuery = {
      search: filters.search || undefined,
      status: filters.status || undefined,
      created_by: filters.created_by,
      sort: filters.sort,
      direction: filters.direction,
      page: filters.page,
      per_page: filters.per_page,
    }

    try {
      const result = await projectService.listProjects(params)
      projects.value = result.projects
      meta.value = result.meta
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load projects.'
      projects.value = []
      meta.value = null
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
    filters.created_by = null
    filters.page = 1
    void syncQuery().then(load)
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  function onSearchInput(value: string): void {
    searchInput.value = value
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
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
    void load()
  })

  watch(
    () => route.query,
    () => {
      applyQueryFromRoute()
    },
  )

  return {
    projects,
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
  }
}
