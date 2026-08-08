import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskForm from '@/modules/tasks/components/TaskForm.vue'
import type { Task } from '@/types/task'

const initial: Task = {
  id: 8,
  title: 'Ship filters',
  description: 'Add overdue filter',
  status: 'in_progress',
  priority: 'high',
  due_date: '2026-08-20',
  is_overdue: false,
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

describe('TaskForm', () => {
  it('renders priority and due date fields for create', () => {
    const wrapper = mount(TaskForm, {
      props: {
        mode: 'create',
        lockedProjectId: 3,
      },
    })

    expect(wrapper.get('#task_priority').exists()).toBe(true)
    expect(wrapper.get('#task_due_date').exists()).toBe(true)
    expect(wrapper.get('#task_due_date').attributes('type')).toBe('date')
    expect(wrapper.text()).toContain('Low')
    expect(wrapper.text()).toContain('Medium')
    expect(wrapper.text()).toContain('High')
    expect(wrapper.text()).toContain('Urgent')
  })

  it('hydrates edit values and submits priority plus due date', async () => {
    const wrapper = mount(TaskForm, {
      props: {
        mode: 'edit',
        initial,
      },
    })

    expect((wrapper.get('#task_priority').element as HTMLSelectElement).value).toBe('high')
    expect((wrapper.get('#task_due_date').element as HTMLInputElement).value).toBe('2026-08-20')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      title: 'Ship filters',
      description: 'Add overdue filter',
      priority: 'high',
      due_date: '2026-08-20',
    })
  })

  it('shows local and server validation errors', async () => {
    const wrapper = mount(TaskForm, {
      props: {
        mode: 'create',
        lockedProjectId: 3,
        serverErrors: { due_date: ['The due date is not a valid date.'] },
      },
    })

    await wrapper.get('#task_title').setValue('')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Title is required.')
    expect(wrapper.text()).toContain('The due date is not a valid date.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('allows clearing due date on edit', async () => {
    const wrapper = mount(TaskForm, {
      props: {
        mode: 'edit',
        initial,
      },
    })

    await wrapper.get('#task_due_date').setValue('')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      due_date: null,
      priority: 'high',
    })
  })
})
