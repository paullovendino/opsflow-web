<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useAuth } from '@/composables/useAuth'
import { useDashboard } from '@/composables/useDashboard'
import DashboardRecentWork from '@/modules/dashboard/components/DashboardRecentWork.vue'
import DashboardSection from '@/modules/dashboard/components/DashboardSection.vue'
import DashboardSkeleton from '@/modules/dashboard/components/DashboardSkeleton.vue'
import DashboardStatCard from '@/modules/dashboard/components/DashboardStatCard.vue'
import DashboardStatusBar from '@/modules/dashboard/components/DashboardStatusBar.vue'
import { entriesFromRecord } from '@/utils/format'

const { fullName } = useAuth()
const { summary, isLoading, errorMessage, isEmptyRecent, load, retry } = useDashboard()

const projectStatusItems = computed(() =>
  summary.value ? entriesFromRecord(summary.value.projects.by_status) : [],
)

const taskStatusItems = computed(() =>
  summary.value ? entriesFromRecord(summary.value.tasks.by_status) : [],
)

const taskPriorityItems = computed(() =>
  summary.value ? entriesFromRecord(summary.value.tasks.by_priority) : [],
)

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-600">
        Welcome{{ fullName ? `, ${fullName}` : '' }}. Here's a snapshot of your scoped work.
      </p>
    </header>

    <DashboardSkeleton v-if="isLoading && !summary" />

    <div
      v-else-if="errorMessage && !summary"
      class="rounded-xl border border-red-200 bg-red-50 px-5 py-6"
      role="alert"
    >
        <h2 class="text-base font-semibold text-red-900">Couldn't load the dashboard</h2>
      <p class="mt-1 text-sm text-red-800">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else-if="summary">
      <div
        v-if="errorMessage"
        class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="status"
      >
        Couldn't refresh dashboard data. Showing the last loaded snapshot.
        <button type="button" class="ml-2 font-medium underline" @click="retry">Retry</button>
      </div>
      <div :class="{ 'pointer-events-none opacity-60 transition-opacity': isLoading }" :aria-busy="isLoading">
      <DashboardSection title="Overview" description="Key counts for projects and tasks in your scope.">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard label="Total Projects" :value="summary.projects.total" />
          <DashboardStatCard label="Total Tasks" :value="summary.tasks.total" />
          <DashboardStatCard label="Overdue Tasks" :value="summary.tasks.overdue" />
          <DashboardStatCard label="Assigned To Me" :value="summary.tasks.assigned_to_me" />
        </div>
      </DashboardSection>

      <DashboardSection title="Status breakdown" description="Distribution across status and priority.">
        <div class="grid gap-4 lg:grid-cols-2">
          <DashboardStatusBar title="Tasks by Status" :items="taskStatusItems" />
          <DashboardStatusBar title="Tasks by Priority" :items="taskPriorityItems" />
        </div>
        <div class="mt-4">
          <DashboardStatusBar title="Projects by Status" :items="projectStatusItems" />
        </div>
      </DashboardSection>

      <DashboardSection title="Recent work" description="Latest updates across projects and tasks.">
        <AppEmptyState
          v-if="isEmptyRecent"
          title="No recent work yet"
          description="When projects or tasks are updated, they will appear here."
        />
        <DashboardRecentWork v-else :items="summary.recent" />
      </DashboardSection>
      </div>
    </template>
  </div>
</template>
