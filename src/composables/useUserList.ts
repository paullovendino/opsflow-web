import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as userService from '@/services/userService'
import type { PaginationMeta } from '@/types/api'
import type { User, UserListQuery, UserSortField, UserStatus } from '@/types/user'
import { toApiClientError } from '@/utils/errors'
import { asRouteName, listIndexLocation, modalAliasLocation } from '@/utils/modalRoutes'

function parseOptionalInt(value: unknown): number | null {
  if (typeof value !== 'string' || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function useUserList() {
  const route = useRoute()
  const router = useRouter()

  const users = ref<User[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const searchInput = ref('')

  const filters = reactive({
    search: '',
    role_id: null as number | null,
    department_id: null as number | null,
    job_title_id: null as number | null,
    status: '' as UserStatus | '',
    sort: 'created_at' as UserSortField,
    direction: 'desc' as 'asc' | 'desc',
    page: 1,
    per_page: 15,
  })

  const isEmpty = computed(() => !isLoading.value && !errorMessage.value && users.value.length === 0)
  const hasActiveFilters = computed(
    () =>
      Boolean(filters.search) ||
      filters.role_id != null ||
      filters.department_id != null ||
      filters.job_title_id != null ||
      Boolean(filters.status),
  )

  function applyQueryFromRoute(): void {
    const query = route.query
    filters.search = typeof query.search === 'string' ? query.search : ''
    searchInput.value = filters.search
    filters.role_id = parseOptionalInt(query.role_id)
    filters.department_id = parseOptionalInt(query.department_id)
    filters.job_title_id = parseOptionalInt(query.job_title_id)
    filters.status =
      query.status === 'active' || query.status === 'inactive' ? query.status : ''
    filters.sort =
      typeof query.sort === 'string' && query.sort.length > 0
        ? (query.sort as UserSortField)
        : 'created_at'
    filters.direction = query.direction === 'asc' ? 'asc' : 'desc'
    filters.page = Math.max(1, parseOptionalInt(query.page) ?? 1)
    filters.per_page = Math.min(100, Math.max(1, parseOptionalInt(query.per_page) ?? 15))
  }

  async function syncQuery(): Promise<void> {
    const query: Record<string, string> = {}

    if (filters.search) query.search = filters.search
    if (filters.role_id != null) query.role_id = String(filters.role_id)
    if (filters.department_id != null) query.department_id = String(filters.department_id)
    if (filters.job_title_id != null) query.job_title_id = String(filters.job_title_id)
    if (filters.status) query.status = filters.status
    if (filters.sort !== 'created_at') query.sort = filters.sort
    if (filters.direction !== 'desc') query.direction = filters.direction
    if (filters.page > 1) query.page = String(filters.page)
    if (filters.per_page !== 15) query.per_page = String(filters.per_page)

    const indexLocation = listIndexLocation(asRouteName(route.name), query)
    await router.replace(indexLocation ?? { query })
  }

  function openModalAlias(name: 'users.create' | 'users.edit', params?: Record<string, string | number>): void {
    void router.push(modalAliasLocation(name, route.query, params))
  }

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    const params: UserListQuery = {
      search: filters.search || undefined,
      role_id: filters.role_id,
      department_id: filters.department_id,
      job_title_id: filters.job_title_id,
      status: filters.status || undefined,
      sort: filters.sort,
      direction: filters.direction,
      page: filters.page,
      per_page: filters.per_page,
    }

    try {
      const result = await userService.listUsers(params)
      users.value = result.users
      meta.value = result.meta
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load users.'
      if (users.value.length === 0) {
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

  function applyFilters(): void {
    filters.search = searchInput.value.trim()
    filters.page = 1
    void syncQuery().then(load)
  }

  function clearFilters(): void {
    searchInput.value = ''
    filters.search = ''
    filters.role_id = null
    filters.department_id = null
    filters.job_title_id = null
    filters.status = ''
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
    users,
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
    applyFilters,
    clearFilters,
    onSearchInput,
    onFilterChange,
    syncQuery,
    openModalAlias,
  }
}
