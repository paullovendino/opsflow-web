import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import DashboardRecentActivity from '@/modules/dashboard/components/DashboardRecentActivity.vue'
import type { ActivityLog } from '@/types/activity'

const logs: ActivityLog[] = [
  {
    id: 1,
    action: 'task.created',
    description: 'Created task Draft API.',
    subject_type: 'task',
    subject_id: 44,
    subject: { id: 44, type: 'task', title: 'Draft API' },
    actor: { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
    properties: {},
    created_at: '2026-08-12T10:00:00+00:00',
  },
  {
    id: 2,
    action: 'remark.created',
    description: 'Added a remark.',
    subject_type: 'remark',
    subject_id: 9,
    subject: { id: 9, type: 'remark' },
    actor: { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
    properties: {},
    created_at: '2026-08-12T11:00:00+00:00',
  },
]

async function mountActivity(items: ActivityLog[] = logs) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/tasks/:id', name: 'tasks.show', component: { template: '<div />' } },
      { path: '/projects/:id', name: 'projects.show', component: { template: '<div />' } },
      { path: '/users/:id', name: 'users.show', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(DashboardRecentActivity, {
    props: { items },
    global: { plugins: [router] },
  })
}

describe('DashboardRecentActivity', () => {
  it('renders activity headlines and subjects', async () => {
    const wrapper = await mountActivity()

    expect(wrapper.findAll('[data-test="dashboard-activity-item"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Ada Admin')
    expect(wrapper.text()).toContain('Draft API')
  })

  it('links navigable subjects and skips remarks', async () => {
    const wrapper = await mountActivity()
    const links = wrapper.findAll('[data-test="dashboard-activity-link"]')

    expect(links).toHaveLength(1)
    expect(links[0]!.attributes('href')).toBe('/tasks/44')
  })
})
