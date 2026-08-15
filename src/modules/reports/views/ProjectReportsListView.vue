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
import { useAuth } from '@/composables/useAuth'
import DashboardStatCard from '@/modules/dashboard/components/DashboardStatCard.vue'
import ReportDateFilters from '@/modules/reports/components/ReportDateFilters.vue'
import AppTableSkeleton from '@/components/ui/AppTableSkeleton.vue'
import * as reportService from '@/services/reportService'
import type { PaginationMeta } from '@/types/api'
import type { ProjectReport } from '@/types/report'
import { PROJECT_STATUSES } from '@/types/project'
import { toApiClientError } from '@/utils/errors'
import { humanizeKey } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const { roleName } = useAuth()

const canViewEmployeeReports = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const reports = ref<ProjectReport[]>([])
const meta = ref<PaginationMeta | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const searchInput = ref('')
const headingRef = ref<HTMLElement | null>(null)

const filters = reactive({
  search: '',
  status: '',
  from_date: '',
  to_date: '',
  page: 1,
  per_page: 15,
})

const statusOptions = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: humanizeKey(status),
}))

const isEmpty = computed(
  () => !isLoading.value && !errorMessage.value && reports.value.length === 0,
)
const hasActiveFilters = computed(
  () =>
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.from_date) ||
    Boolean(filters.to_date),
)

function applyQueryFromRoute(): void {
  const query = route.query
  filters.search = typeof query.search === 'string' ? query.search : ''
  searchInput.value = filters.search
  filters.status = typeof query.status === 'string' ? query.status : ''
  filters.from_date = typeof query.from_date === 'string' ? query.from_date : ''
  filters.to_date = typeof query.to_date === 'string' ? query.to_date : ''
  filters.page = Math.max(1, Number(query.page) || 1)
}

async function syncQuery(): Promise<void> {
  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
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
      const result = await reportService.listProjectReports({
        search: filters.search || undefined,
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
      errorMessage.value = apiError.message || 'Unable to load project reports.'
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
        title="Project reports"
        description="Review project and team performance."
      >
        <template #actions>
          <RouterLink
            v-if="canViewEmployeeReports"
            class="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-fg-secondary hover:bg-surface-hover"
            :to="{ name: 'reports.employees.index' }"
          >
            Employee reports
          </RouterLink>
        </template>
      </AppPageHeader>
    </div>

    <AppFilterBar>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
          <AppSearch
            :model-value="searchInput"
            label="Search"
            placeholder="Search project name"
            @update:model-value="onSearchInput"
          />
          <AppSelect
            id="filter_report_project_status"
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
      <AppTableSkeleton :columns="6" :rows="6" />
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
        title="No project reports"
        description="No projects match the current filters."
      />

      <template v-else>
        <div class="hidden md:block transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :aria-busy="isLoading">
          <AppTable caption="Project reports">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Project</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3">Tasks</th>
                <th scope="col" class="px-4 py-3">Overdue</th>
                <th scope="col" class="px-4 py-3">Unassigned</th>
                <th scope="col" class="px-4 py-3">Members</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </template>
            <tr v-for="report in reports" :key="report.project.id" class="hover:bg-surface-hover">
              <td class="px-4 py-3 font-medium text-fg">{{ report.project.name }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="String(report.project.status)" kind="project" />
              </td>
              <td class="px-4 py-3 text-fg-subtle">{{ report.tasks.total }}</td>
              <td class="px-4 py-3 text-fg-subtle">{{ report.tasks.overdue }}</td>
              <td class="px-4 py-3 text-fg-subtle">{{ report.tasks.unassigned }}</td>
              <td class="px-4 py-3 text-fg-subtle">{{ report.members_count }}</td>
              <td class="px-4 py-3 text-right">
                <RouterLink
                  class="text-sm font-medium text-fg underline-offset-2 hover:underline"
                  :to="{
                    name: 'reports.projects.show',
                    params: { id: report.project.id },
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
            :key="`card-${report.project.id}`"
            class="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="font-medium text-fg">{{ report.project.name }}</p>
              <StatusBadge :status="String(report.project.status)" kind="project" />
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <DashboardStatCard label="Tasks" :value="report.tasks.total" />
              <DashboardStatCard label="Overdue" :value="report.tasks.overdue" />
            </div>
            <div class="mt-3 text-right">
              <RouterLink
                class="text-sm font-medium text-fg underline"
                :to="{
                  name: 'reports.projects.show',
                  params: { id: report.project.id },
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
