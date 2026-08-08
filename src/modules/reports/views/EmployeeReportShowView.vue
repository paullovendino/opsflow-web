<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppTable from '@/components/ui/AppTable.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'
import DashboardSection from '@/modules/dashboard/components/DashboardSection.vue'
import DashboardStatCard from '@/modules/dashboard/components/DashboardStatCard.vue'
import DashboardStatusBar from '@/modules/dashboard/components/DashboardStatusBar.vue'
import ReportDateFilters from '@/modules/reports/components/ReportDateFilters.vue'
import AppReportSkeleton from '@/components/ui/AppReportSkeleton.vue'
import * as reportService from '@/services/reportService'
import type { EmployeeReport } from '@/types/report'
import { toApiClientError } from '@/utils/errors'
import { entriesFromRecord } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const { roleName, user: currentUser } = useAuth()

const report = ref<EmployeeReport | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const headingRef = ref<HTMLElement | null>(null)

const dates = reactive({
  from_date: '',
  to_date: '',
})

const canListEmployees = computed(
  () => roleName.value === 'administrator' || roleName.value === 'project_manager',
)

const statusItems = computed(() =>
  report.value ? entriesFromRecord(report.value.tasks.by_status) : [],
)
const priorityItems = computed(() =>
  report.value ? entriesFromRecord(report.value.tasks.by_priority) : [],
)
const byProject = computed(() => report.value?.tasks.by_project ?? [])

function userId(): number {
  return Number(route.params.id)
}

function applyQueryFromRoute(): void {
  dates.from_date = typeof route.query.from_date === 'string' ? route.query.from_date : ''
  dates.to_date = typeof route.query.to_date === 'string' ? route.query.to_date : ''
}

async function syncQuery(): Promise<void> {
  const query: Record<string, string> = {}
  if (dates.from_date) query.from_date = dates.from_date
  if (dates.to_date) query.to_date = dates.to_date
  await router.replace({ query })
}

async function load(): Promise<void> {
  if (dates.from_date && dates.to_date && dates.to_date < dates.from_date) {
    errorMessage.value = 'End date must be on or after the start date.'
    return
  }

  isLoading.value = true
  errorMessage.value = null
  try {
    report.value = await reportService.getEmployeeReport(userId(), {
      from_date: dates.from_date || undefined,
      to_date: dates.to_date || undefined,
    })
    errorMessage.value = null
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value = apiError.message || 'Unable to load employee report.'
    if (!report.value) {
      report.value = null
    }
  } finally {
    isLoading.value = false
  }
}

function applyDates(): void {
  void syncQuery().then(load)
}

function clearDates(): void {
  dates.from_date = ''
  dates.to_date = ''
  applyDates()
}

function goBack(): void {
  if (canListEmployees.value) {
    void router.push({ name: 'reports.employees.index' })
    return
  }
  void router.push({ name: 'reports.projects.index' })
}

watch(
  () => [route.params.id, route.query],
  () => {
    applyQueryFromRoute()
  },
)

onMounted(async () => {
  applyQueryFromRoute()
  if (
    roleName.value === 'employee' &&
    currentUser.value?.id &&
    userId() !== currentUser.value.id
  ) {
    await router.replace({
      name: 'reports.employees.show',
      params: { id: currentUser.value.id },
      query: route.query,
    })
  }
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        :title="report?.user.full_name || 'Employee report'"
        description="Assigned-task statistics for this employee."
      >
        <template #actions>
          <AppButton type="button" variant="secondary" @click="goBack">Back</AppButton>
        </template>
      </AppPageHeader>
    </div>

    <ReportDateFilters
      :from-date="dates.from_date"
      :to-date="dates.to_date"
      @update:from-date="(value) => (dates.from_date = value)"
      @update:to-date="(value) => (dates.to_date = value)"
      @apply="applyDates"
      @clear="clearDates"
    />

    <AppReportSkeleton v-if="isLoading && !report" />

    <div
      v-else-if="errorMessage && !report"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-red-900">Couldn't load report</h2>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="load">
          Try again
        </AppButton>
        <AppButton type="button" variant="secondary" @click="goBack">Back</AppButton>
      </div>
    </div>

    <template v-else-if="report">
      <div class="flex flex-col gap-6 transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :aria-busy="isLoading">
      <div class="flex flex-wrap items-center gap-3">
        <StatusBadge :status="String(report.user.status)" kind="user" />
        <p class="text-sm text-slate-600">{{ report.user.email }}</p>
      </div>

      <DashboardSection title="Overview" description="Assigned task counts.">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardStatCard label="Total tasks" :value="report.tasks.total" />
          <DashboardStatCard label="Overdue" :value="report.tasks.overdue" />
        </div>
      </DashboardSection>

      <DashboardSection title="Breakdown" description="Status and priority distribution.">
        <div class="grid gap-4 lg:grid-cols-2">
          <DashboardStatusBar title="Tasks by status" :items="statusItems" />
          <DashboardStatusBar title="Tasks by priority" :items="priorityItems" />
        </div>
      </DashboardSection>

      <DashboardSection title="By project" description="Assigned tasks grouped by project.">
        <AppEmptyState
          v-if="byProject.length === 0"
          title="No project breakdown"
          description="No assigned tasks in the selected date range."
        />
        <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <AppTable caption="Tasks by project">
            <template #head>
              <tr>
                <th scope="col" class="px-4 py-3">Project</th>
                <th scope="col" class="px-4 py-3">Tasks</th>
              </tr>
            </template>
            <tr v-for="row in byProject" :key="row.project_id">
              <td class="px-4 py-3 font-medium text-slate-900">{{ row.name }}</td>
              <td class="px-4 py-3 text-slate-600">{{ row.total }}</td>
            </tr>
          </AppTable>
        </div>
      </DashboardSection>
      </div>
    </template>
  </div>
</template>
