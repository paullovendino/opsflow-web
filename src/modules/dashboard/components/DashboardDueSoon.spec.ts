import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import DashboardDueSoon from '@/modules/dashboard/components/DashboardDueSoon.vue'
import type { DashboardDueSoonItem } from '@/types/dashboard'
import { taskDueDateLabel } from '@/utils/taskDueDate'

const items: DashboardDueSoonItem[] = [
  {
    id: 11,
    title: 'Ship API contract',
    status: 'todo',
    priority: 'high',
    due_date: '2026-08-14',
    is_overdue: false,
    project: { id: 2, name: 'OpsFlow Launch' },
  },
  {
    id: 12,
    title: 'Fix overdue copy',
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2026-08-10',
    is_overdue: true,
    project: { id: 2, name: 'OpsFlow Launch' },
  },
]

async function mountDueSoon(list: DashboardDueSoonItem[] = items) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/tasks/:id', name: 'tasks.show', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(DashboardDueSoon, {
    props: { items: list },
    global: { plugins: [router] },
  })
}

describe('DashboardDueSoon', () => {
  it('renders due-soon tasks with project and priority', async () => {
    const wrapper = await mountDueSoon()

    expect(wrapper.findAll('[data-test="due-soon-item"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Ship API contract')
    expect(wrapper.text()).toContain('OpsFlow Launch')
    expect(wrapper.text()).toContain('High')
  })

  it('renders overdue styling when is_overdue is true', async () => {
    const wrapper = await mountDueSoon([items[1]!])

    expect(wrapper.text()).toContain(taskDueDateLabel('2026-08-10', true))
    expect(wrapper.html()).toContain('text-rose-800')
  })

  it('links each task to tasks.show', async () => {
    const wrapper = await mountDueSoon([items[0]!])
    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe('/tasks/11')
  })
})
