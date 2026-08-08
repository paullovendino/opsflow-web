import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskDetailPanel from '@/modules/tasks/components/TaskDetailPanel.vue'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'
import type { Task } from '@/types/task'
import { taskDueDateLabel } from '@/utils/taskDueDate'

vi.mock('@/services/projectService', () => ({
  getProject: vi.fn(),
  listProjectMembers: vi.fn(),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

const user: AuthUser = {
  id: 1,
  first_name: 'Ada',
  middle_name: null,
  last_name: 'Admin',
  full_name: 'Ada Admin',
  email: 'ada@opsflow.test',
  avatar: null,
  status: 'active',
  last_login_at: null,
  role: { id: 1, name: 'administrator', description: null },
  department: null,
  job_title: null,
}

const task: Task = {
  id: 44,
  title: 'Past due work',
  description: 'Finish the contract.',
  status: 'in_progress',
  priority: 'urgent',
  due_date: '2026-08-08',
  is_overdue: true,
  project: { id: 3, name: 'Alpha' },
  assignee: null,
  creator: {
    id: 1,
    first_name: 'Ada',
    middle_name: null,
    last_name: 'Admin',
    full_name: 'Ada Admin',
    email: 'ada@opsflow.test',
  },
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z',
}

describe('TaskDetailPanel', () => {
  it('shows priority, due date, and overdue copy', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().setUser(user)

    const wrapper = mount(TaskDetailPanel, {
      props: {
        task,
        canEdit: false,
        canAssign: false,
        canDelete: false,
      },
      global: { plugins: [pinia] },
    })

    expect(wrapper.text()).toContain('Urgent')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.get('[data-test="task-detail-due-date"]').text()).toBe(
      taskDueDateLabel('2026-08-08', true, 'medium'),
    )
  })
})
