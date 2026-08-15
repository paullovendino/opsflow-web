<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DashboardSection from '@/modules/dashboard/components/DashboardSection.vue'
import DashboardStatCard from '@/modules/dashboard/components/DashboardStatCard.vue'
import DashboardStatusBar from '@/modules/dashboard/components/DashboardStatusBar.vue'
import ReportDateFilters from '@/modules/reports/components/ReportDateFilters.vue'
import AppReportSkeleton from '@/components/ui/AppReportSkeleton.vue'
import * as reportService from '@/services/reportService'
import type { ProjectReport } from '@/types/report'
import { toApiClientError } from '@/utils/errors'
import { entriesFromRecord, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const report = ref<ProjectReport | null>(null)
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const headingRef = ref<HTMLElement | null>(null)

const dates = reactive({
  from_date: '',
  to_date: '',
})

const statusItems = computed(() =>
  report.value ? entriesFromRecord(report.value.tasks.by_status) : [],
)
const priorityItems = computed(() =>
  report.value ? entriesFromRecord(report.value.tasks.by_priority) : [],
)

function projectId(): number {
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
    report.value = await reportService.getProjectReport(projectId(), {
      from_date: dates.from_date || undefined,
      to_date: dates.to_date || undefined,
    })
    errorMessage.value = null
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value = apiError.message || 'Unable to load project report.'
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
  await load()
  await nextTick()
  headingRef.value?.focus()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div ref="headingRef" tabindex="-1" class="outline-none">
      <AppPageHeader
        :title="report?.project.name || 'Project report'"
        description="Task statistics for this project."
      >
        <template #actions>
          <AppButton type="button" variant="secondary" @click="goBack">Back to list</AppButton>
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
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load report</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
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
        <StatusBadge :status="String(report.project.status)" kind="project" />
        <p class="text-sm text-fg-subtle">
          Start {{ report.project.start_date ? formatDate(report.project.start_date) : '—' }}
          · Due {{ report.project.due_date ? formatDate(report.project.due_date) : '—' }}
        </p>
      </div>

      <DashboardSection title="Overview" description="Key counts for this project.">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard label="Total tasks" :value="report.tasks.total" />
          <DashboardStatCard label="Overdue" :value="report.tasks.overdue" />
          <DashboardStatCard label="Unassigned" :value="report.tasks.unassigned" />
          <DashboardStatCard label="Members" :value="report.members_count" />
        </div>
      </DashboardSection>

      <DashboardSection title="Breakdown" description="Status and priority distribution.">
        <div class="grid gap-4 lg:grid-cols-2">
          <DashboardStatusBar title="Tasks by status" :items="statusItems" />
          <DashboardStatusBar title="Tasks by priority" :items="priorityItems" />
        </div>
      </DashboardSection>
      </div>
    </template>
  </div>
</template>
