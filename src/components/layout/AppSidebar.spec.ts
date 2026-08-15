import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'

const routes = [
  { path: '/dashboard', name: 'dashboard', component: { template: '<div />' } },
  { path: '/users', name: 'users.index', component: { template: '<div />' } },
  { path: '/projects', name: 'projects.index', component: { template: '<div />' } },
  { path: '/tasks', name: 'tasks.index', component: { template: '<div />' } },
  { path: '/activity', name: 'activity.index', component: { template: '<div />' } },
  { path: '/notifications', name: 'notifications.index', component: { template: '<div />' } },
  { path: '/reports/projects', name: 'reports.projects.index', component: { template: '<div />' } },
  { path: '/reports/employees', name: 'reports.employees.index', component: { template: '<div />' } },
  {
    path: '/reports/employees/:id',
    name: 'reports.employees.show',
    component: { template: '<div />' },
  },
  { path: '/profile', name: 'profile', component: { template: '<div />' } },
]

function userFor(role: 'administrator' | 'project_manager' | 'employee'): AuthUser {
  return {
    id: role === 'employee' ? 9 : 1,
    first_name: 'Test',
    middle_name: null,
    last_name: 'User',
    full_name: 'Test User',
    email: `${role}@opsflow.test`,
    avatar: null,
    status: 'active',
    last_login_at: null,
    role: { id: 1, name: role, description: null },
    department: null,
    job_title: null,
  }
}

async function mountSidebar(
  role: 'administrator' | 'project_manager' | 'employee',
  path = '/dashboard',
) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()

  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(userFor(role))

  const wrapper = mount(AppSidebar, {
    global: {
      plugins: [pinia, router],
    },
  })

  return { wrapper, router }
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_NAME', 'OpsFlow')
  })

  it('shows Users, Activity, and Employee reports for administrators', async () => {
    const { wrapper } = await mountSidebar('administrator')
    const text = wrapper.text()
    expect(text).toContain('Users')
    expect(text).toContain('Activity')
    expect(text).toContain('Employee reports')
    expect(text).toContain('Dashboard')
    expect(text).toContain('Projects')
    expect(text).toContain('Tasks')
    expect(text).toContain('Reports')
    expect(text).not.toContain('My report')
    expect(text).not.toContain('Notifications')
    expect(text).not.toContain('Profile')
  })

  it('shows Users, Activity, and Employee reports for project managers', async () => {
    const { wrapper } = await mountSidebar('project_manager')
    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).toContain('Activity')
    expect(wrapper.text()).toContain('Employee reports')
    expect(wrapper.text()).not.toContain('Notifications')
    expect(wrapper.text()).not.toContain('Profile')
  })

  it('hides Users, Activity, and Employee reports for employees and shows My report', async () => {
    const { wrapper } = await mountSidebar('employee')
    expect(wrapper.text()).not.toContain('Users')
    expect(wrapper.text()).not.toContain('Activity')
    expect(wrapper.text()).not.toContain('Employee reports')
    expect(wrapper.text()).toContain('My report')
    expect(wrapper.text()).toContain('Projects')
    expect(wrapper.text()).toContain('Tasks')
    expect(wrapper.text()).toContain('Reports')
    expect(wrapper.text()).not.toContain('Profile')
    expect(wrapper.text()).not.toContain('Notifications')
  })

  it('does not mark a primary item active on profile or notifications routes', async () => {
    const { wrapper: profileWrapper } = await mountSidebar('administrator', '/profile')
    expect(profileWrapper.find('.bg-inverse').exists()).toBe(false)

    const { wrapper: notificationsWrapper } = await mountSidebar('administrator', '/notifications')
    expect(notificationsWrapper.find('.bg-inverse').exists()).toBe(false)
  })

  it('keeps dashboard active only on the dashboard route', async () => {
    const { wrapper } = await mountSidebar('administrator', '/dashboard')
    const dashboard = wrapper.findAll('a').find((link) => link.text() === 'Dashboard')
    expect(dashboard?.classes()).toContain('bg-inverse')
  })
})
