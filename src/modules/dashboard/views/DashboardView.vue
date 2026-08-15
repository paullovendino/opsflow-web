<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import { useAuth } from '@/composables/useAuth'
import { useDashboard } from '@/composables/useDashboard'
import DashboardAverageProgress from '@/modules/dashboard/components/DashboardAverageProgress.vue'
import DashboardDueSoon from '@/modules/dashboard/components/DashboardDueSoon.vue'
import DashboardRecentActivity from '@/modules/dashboard/components/DashboardRecentActivity.vue'
import DashboardRecentWork from '@/modules/dashboard/components/DashboardRecentWork.vue'
import DashboardSection from '@/modules/dashboard/components/DashboardSection.vue'
import DashboardSkeleton from '@/modules/dashboard/components/DashboardSkeleton.vue'
import DashboardStatCard from '@/modules/dashboard/components/DashboardStatCard.vue'
import DashboardStatusBar from '@/modules/dashboard/components/DashboardStatusBar.vue'
import { entriesFromRecord } from '@/utils/format'

const { fullName } = useAuth()
const {
  summary,
  isLoading,
  errorMessage,
  isEmptyRecent,
  isEmptyDueSoon,
  isEmptyRecentActivity,
  load,
  retry,
} = useDashboard()

const projectStatusItems = computed(() =>
  summary.value ? entriesFromRecord(summary.value.projects.by_status) : [],
)

const taskStatusItems = computed(() =>
  summary.value ? entriesFromRecord(summary.value.tasks.by_status) : [],
)

const taskPriorityItems = computed(() =>
  summary.value ? entriesFromRecord(summary.value.tasks.by_priority) : [],
)

const welcomeDescription = computed(() => {
  if (fullName.value) {
    return `Welcome, ${fullName.value}. Overview of projects, tasks, and activity.`
  }
  return 'Overview of projects, tasks, and activity.'
})

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppPageHeader title="Dashboard" :description="welcomeDescription" />

    <DashboardSkeleton v-if="isLoading && !summary" />

    <div
      v-else-if="errorMessage && !summary"
      class="rounded-xl border border-danger-border bg-danger-soft px-5 py-6"
      role="alert"
    >
      <h2 class="text-base font-semibold text-danger-fg">Couldn't load the dashboard</h2>
      <p class="mt-1 text-sm text-danger-fg">{{ errorMessage }}</p>
      <div class="mt-4">
        <AppButton type="button" variant="secondary" :loading="isLoading" loading-label="Retrying…" @click="retry">
          Try again
        </AppButton>
      </div>
    </div>

    <template v-else-if="summary">
      <div
        v-if="errorMessage"
        class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        role="status"
      >
        Couldn't refresh dashboard data. Showing the last loaded snapshot.
        <button type="button" class="ml-2 font-medium underline" @click="retry">Retry</button>
      </div>
      <div :class="{ 'pointer-events-none opacity-60 transition-opacity': isLoading }" :aria-busy="isLoading">
        <DashboardSection title="Overview" description="Key counts for projects and tasks in your scope.">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardStatCard label="Total Projects" :value="summary.projects.total" />
            <DashboardStatCard label="Total Tasks" :value="summary.tasks.total" />
            <DashboardStatCard label="Overdue Tasks" :value="summary.tasks.overdue" />
            <DashboardStatCard label="Assigned To Me" :value="summary.tasks.assigned_to_me" />
            <DashboardStatCard label="Due Soon" :value="summary.tasks.due_soon" hint="Next 7 days" />
            <DashboardStatCard
              label="Unread Notifications"
              :value="summary.notifications.unread_count"
              hint="Your inbox only"
            />
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-2">
            <DashboardAverageProgress :progress="summary.projects.average_progress" />
            <article class="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p class="text-sm font-medium text-fg-muted">Notifications</p>
              <p class="mt-2 text-sm text-fg-secondary">
                <template v-if="summary.notifications.unread_count === 0">
                  You're all caught up.
                </template>
                <template v-else>
                  You have
                  <span class="font-semibold tabular-nums text-fg">{{
                    summary.notifications.unread_count
                  }}</span>
                  unread notification{{ summary.notifications.unread_count === 1 ? '' : 's' }}.
                </template>
              </p>
              <RouterLink
                :to="{ name: 'notifications.index' }"
                class="mt-3 inline-flex text-sm font-medium text-fg-secondary underline-offset-2 hover:underline"
              >
                Open notifications
              </RouterLink>
            </article>
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

        <div class="grid gap-8 lg:grid-cols-2">
          <DashboardSection title="Due soon" description="Tasks due today through the next 7 days.">
            <AppEmptyState
              v-if="isEmptyDueSoon"
              title="No upcoming tasks"
              description="Tasks with due dates in the next week will appear here."
            />
            <DashboardDueSoon v-else :items="summary.due_soon" />
          </DashboardSection>

          <DashboardSection title="Recent activity" description="Latest audit events in your scope.">
            <AppEmptyState
              v-if="isEmptyRecentActivity"
              title="No recent activity"
              description="Significant changes will appear here as work happens."
            />
            <DashboardRecentActivity v-else :items="summary.recent_activity" />
          </DashboardSection>
        </div>

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
