import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ref } from 'vue'
import DashboardView from '@/modules/dashboard/views/DashboardView.vue'
import type { DashboardSummary } from '@/types/dashboard'
import type { ActivityLog } from '@/types/activity'

const load = vi.fn(async () => undefined)
const retry = vi.fn(async () => undefined)

const summary = ref<DashboardSummary | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const isEmptyRecent = ref(true)
const isEmptyDueSoon = ref(true)
const isEmptyRecentActivity = ref(true)

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    fullName: ref('Ada Admin'),
  }),
}))

vi.mock('@/composables/useDashboard', () => ({
  useDashboard: () => ({
    summary,
    isLoading,
    errorMessage,
    isEmptyRecent,
    isEmptyDueSoon,
    isEmptyRecentActivity,
    load,
    retry,
  }),
}))

const activity: ActivityLog = {
  id: 7,
  action: 'project.updated',
  description: 'Updated project OpsFlow Launch.',
  subject_type: 'project',
  subject_id: 2,
  subject: { id: 2, type: 'project', name: 'OpsFlow Launch' },
  actor: { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
  properties: {},
  created_at: '2026-08-12T09:00:00+00:00',
}

const filled: DashboardSummary = {
  projects: {
    total: 3,
    by_status: { planning: 1, active: 2, on_hold: 0, completed: 0, archived: 0 },
    average_progress: 75,
  },
  tasks: {
    total: 5,
    by_status: { todo: 2, in_progress: 3, in_review: 0, blocked: 0, completed: 0, cancelled: 0 },
    by_priority: { low: 1, medium: 2, high: 1, urgent: 1 },
    overdue: 1,
    assigned_to_me: 2,
    due_soon: 1,
  },
  recent: [
    {
      type: 'project',
      id: 2,
      name: 'OpsFlow Launch',
      status: 'active',
      updated_at: '2026-08-12T08:00:00+00:00',
    },
  ],
  due_soon: [
    {
      id: 44,
      title: 'Draft API',
      status: 'todo',
      priority: 'high',
      due_date: '2026-08-14',
      is_overdue: false,
      project: { id: 2, name: 'OpsFlow Launch' },
    },
  ],
  recent_activity: [activity],
  notifications: { unread_count: 3 },
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/tasks/:id', name: 'tasks.show', component: { template: '<div />' } },
      { path: '/projects/:id', name: 'projects.show', component: { template: '<div />' } },
      { path: '/users/:id', name: 'users.show', component: { template: '<div />' } },
      { path: '/notifications', name: 'notifications.index', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(DashboardView, {
    global: { plugins: [router] },
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    summary.value = null
    isLoading.value = false
    errorMessage.value = null
    isEmptyRecent.value = true
    isEmptyDueSoon.value = true
    isEmptyRecentActivity.value = true
    load.mockClear()
    retry.mockClear()
  })

  it('shows the loading skeleton before data arrives', async () => {
    isLoading.value = true
    const wrapper = await mountView()

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Total Projects')
  })

  it('renders existing and enhanced sections', async () => {
    summary.value = filled
    isEmptyRecent.value = false
    isEmptyDueSoon.value = false
    isEmptyRecentActivity.value = false

    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Total Projects')
    expect(wrapper.text()).toContain('Welcome, Ada Admin')
    expect(wrapper.text()).toContain('Overview of projects, tasks, and activity.')
    expect(wrapper.text()).toContain('Due Soon')
    expect(wrapper.text()).toContain('Unread Notifications')
    expect(wrapper.text()).toContain('Average project progress')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('Draft API')
    expect(wrapper.text()).toContain('OpsFlow Launch')
    expect(wrapper.text()).toContain('Recent activity')
    expect(wrapper.text()).toContain('Recent work')
    expect(wrapper.text()).toContain('You have')
    expect(wrapper.text()).toContain('3')
  })

  it('renders empty states for due soon, activity, and average progress', async () => {
    summary.value = {
      ...filled,
      projects: { ...filled.projects, average_progress: null },
      due_soon: [],
      recent_activity: [],
      recent: [],
      notifications: { unread_count: 0 },
      tasks: { ...filled.tasks, due_soon: 0 },
    }
    isEmptyRecent.value = true
    isEmptyDueSoon.value = true
    isEmptyRecentActivity.value = true

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('No upcoming tasks')
    expect(wrapper.text()).toContain('No recent activity')
    expect(wrapper.text()).toContain('No active project progress')
    expect(wrapper.text()).toContain("You're all caught up.")
    expect(wrapper.text()).toContain('No recent work yet')
  })

  it('shows error retry when the initial load fails', async () => {
    errorMessage.value = 'Unable to load the dashboard.'
    const wrapper = await mountView()

    expect(wrapper.text()).toContain("Couldn't load the dashboard")
    await wrapper.get('button').trigger('click')
    expect(retry).toHaveBeenCalled()
  })
})
