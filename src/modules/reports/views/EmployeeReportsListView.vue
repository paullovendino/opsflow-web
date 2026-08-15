<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppFilterBar from '@/components/ui/AppFilterBar.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSearch from '@/components/ui/AppSearch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTable from '@/components/ui/AppTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useLookups } from '@/composables/useLookups'
import DashboardStatCard from '@/modules/dashboard/components/DashboardStatCard.vue'
import ReportDateFilters from '@/modules/reports/components/ReportDateFilters.vue'
import AppTableSkeleton from '@/components/ui/AppTableSkeleton.vue'
import * as reportService from '@/services/reportService'
import type { PaginationMeta } from '@/types/api'
import type { EmployeeReport } from '@/types/report'
import { toApiClientError } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const { roleOptions, departmentOptions } = useLookups()

const reports = ref<EmployeeReport[]>([])
const meta = ref<PaginationMeta | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const searchInput = ref('')
const headingRef = ref<HTMLElement | null>(null)

const filters = reactive({
  search: '',
  role_id: null as number | null,
  department_id: null as number | null,
  status: '',
  from_date: '',
  to_date: '',
  page: 1,
  per_page: 15,
})

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const isEmpty = computed(
  () => !isLoading.value && !errorMessage.value && reports.value.length === 0,
)
const hasActiveFilters = computed(
  () =>
    Boolean(filters.search) ||
    filters.role_id != null ||
    filters.department_id != null ||
    Boolean(filters.status) ||
    Boolean(filters.from_date) ||
    Boolean(filters.to_date),
)

function applyQueryFromRoute(): void {
  const query = route.query
  filters.search = typeof query.search === 'string' ? query.search : ''
  searchInput.value = filters.search
  filters.role_id = query.role_id ? Number(query.role_id) : null
  filters.department_id = query.department_id ? Number(query.department_id) : null
  filters.status = typeof query.status === 'string' ? query.status : ''
  filters.from_date = typeof query.from_date === 'string' ? query.from_date : ''
  filters.to_date = typeof query.to_date === 'string' ? query.to_date : ''
  filters.page = Math.max(1, Number(query.page) || 1)
}

async function syncQuery(): Promise<void> {
  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
  if (filters.role_id != null) query.role_id = String(filters.role_id)
  if (filters.department_id != null) query.department_id = String(filters.department_id)
  if (filters.status) query.status = filters.status
  if (filters.from_date) query.from_date = filters.from_date
  if (filters.to_date) query.to_date = filters.to_date
  if (filters.page > 1) query.page = String(filters.page)
  await router.replace({ query })
}

async function load(): Promise<void> {
  if (filters.from_date && filters.to_date && filters.to_date < filters.from_date) {
    errorMessage.value = 'End date must be on or after the start date.'
    return
  }

  isLoading.value = true
  errorMessage.value = null
    try {
      const result = await reportService.listEmployeeReports({
        search: filters.search || undefined,
        role_id: filters.role_id,
        department_id: filters.department_id,
        status: filters.status || undefined,
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined,
        page: filters.page,
        per_page: filters.per_page,
      })
      reports.value = result.reports
      meta.value = result.meta
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load employee reports.'
      if (reports.value.length === 0) {
        meta.value = null
      }
    } finally {
      isLoading.value = false
    }
}

function onFilterChange(): void {
  filters.page = 1
  void syncQuery().then(load)
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput(value: string): void {
  searchInput.value = value
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.search = searchInput.value.trim()
    onFilterChange()
  }, 350)
}

function clearFilters(): void {
  searchInput.value = ''
  filters.search = ''
  filters.role_id = null
  filters.department_id = null
  filters.status = ''
  filters.from_date = ''
  filters.to_date = ''
  filters.page = 1
  void syncQuery().then(load)
}

function setPage(page: number): void {
  filters.page = page
  void syncQuery().then(load)
}

function detailQuery(): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.from_date) query.from_date = filters.from_date
  if (filters.to_date) query.to_date = filters.to_date
  return query
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
        title="Employee reports"
        description="Assigned-task aggregates per employee. Date filters apply to task created dates."
      >
        <template #actions>
          <RouterLink
            class="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-fg-secondary hover:bg-surface-hover"
            :to="{ name: 'reports.projects.index' }"
          >
            Project reports
          </RouterLink>
        </template>
      </AppPageHeader>
    </div>

    <AppFilterBar>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <AppSearch
            :model-value="searchInput"
            label="Search"
            placeholder="Search name or email"
            @update:model-value="onSearchInput"
          />
          <AppSelect
            id="filter_report_employee_role"
            :model-value="filters.role_id"
            class="min-w-[10rem] flex-1"
            label="Role"
            :options="roleOptions"
            optional
            placeholder="Any role"
            @update:model-value="
              (value) => {
                filters.role_id = typeof value === 'number' ? value : null
                onFilterChange()
              }
            "
          />
          <AppSelect
            id="filter_report_employee_department"
            :model-value="filters.department_id"
            class="min-w-[10rem] flex-1"
            label="Department"
            :options="departmentOptions"
            optional
            placeholder="Any department"
            @update:model-value="
              (value) => {
                filters.department_id = typeof value === 'number' ? value : null
                onFilterChange()
              }
            "
          />
          <AppSelect
            id="filter_report_employee_status"
            :model-value="filters.status || null"
            class="min-w-[10rem] flex-1"
            label="Status"
            :options="statusOptions"
            optional
            placeholder="Any status"
            @update:model-value="
              (value) => {
                filters.status = typeof value === 'string' ? value : ''
                onFilterChange()
              }
            "
          />
          <AppButton variant="secondary" :disabled="!hasActiveFilters" @click="clearFilters">
            Clear
          </AppButton>
        </div>
        <ReportDateFilters
          :from-date="filters.from_date"
          :to-date="filters.to_date"
          @update:from-date="(value) => (filters.from_date = value)"
          @update:to-date="(value) => (filters.to_date = value)"
          @apply="onFilterChange"
          @clear="
            () => {
              filters.from_date = ''
              filters.to_date = ''
              onFilterChange()
            }
          "
        />
      </div>
    </AppFilterBar>

    <div v-if="isLoading && reports.length === 0" class="flex flex-col gap-4">
      <AppTableSkeleton :columns="5" :rows="6" />
    </div>

    <div
      v-else-if="errorMessage && reports.length === 0"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load reports</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else>
      <AppEmptyState
        v-if="isEmpty"
        title="No employee reports"
        description="No employees match the current filters."
      />

      <template v-else>
        <div class="hidden md:block transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :aria-busy="isLoading">
          <AppTable caption="Employee reports">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Employee</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3">Tasks</th>
                <th scope="col" class="px-4 py-3">Overdue</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </template>
            <tr v-for="report in reports" :key="report.user.id" class="hover:bg-surface-hover">
              <td class="px-4 py-3">
                <p class="font-medium text-fg">{{ report.user.full_name }}</p>
                <p class="text-sm text-fg-subtle">{{ report.user.email }}</p>
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="String(report.user.status)" kind="user" />
              </td>
              <td class="px-4 py-3 text-fg-subtle">{{ report.tasks.total }}</td>
              <td class="px-4 py-3 text-fg-subtle">{{ report.tasks.overdue }}</td>
              <td class="px-4 py-3 text-right">
                <RouterLink
                  class="text-sm font-medium text-fg underline-offset-2 hover:underline"
                  :to="{
                    name: 'reports.employees.show',
                    params: { id: report.user.id },
                    query: detailQuery(),
                  }"
                >
                  View
                </RouterLink>
              </td>
            </tr>
          </AppTable>
        </div>

        <ul class="flex flex-col gap-3 md:hidden" role="list">
          <li
            v-for="report in reports"
            :key="`card-${report.user.id}`"
            class="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-fg">{{ report.user.full_name }}</p>
                <p class="text-sm text-fg-subtle">{{ report.user.email }}</p>
              </div>
              <StatusBadge :status="String(report.user.status)" kind="user" />
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <DashboardStatCard label="Tasks" :value="report.tasks.total" />
              <DashboardStatCard label="Overdue" :value="report.tasks.overdue" />
            </div>
            <div class="mt-3 text-right">
              <RouterLink
                class="text-sm font-medium text-fg underline"
                :to="{
                  name: 'reports.employees.show',
                  params: { id: report.user.id },
                  query: detailQuery(),
                }"
              >
                View detail
              </RouterLink>
            </div>
          </li>
        </ul>

        <AppPagination
          v-if="meta"
          class="mt-4"
          :meta="meta"
          :disabled="isLoading"
          @change="setPage"
        />
      </template>
    </template>
  </div>
</template>
