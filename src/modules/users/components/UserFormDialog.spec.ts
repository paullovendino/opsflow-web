import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import UserFormDialog from '@/modules/users/components/UserFormDialog.vue'
import type { User } from '@/types/user'

const toast = { success: vi.fn(), error: vi.fn() }

vi.mock('@/composables/useToast', () => ({
  useToast: () => toast,
}))

vi.mock('@/modules/users/components/UserForm.vue', () => ({
  default: defineComponent({
    name: 'UserForm',
    props: {
      submitting: Boolean,
      formError: String,
      submitLabel: String,
    },
    emits: ['submit', 'cancel'],
    setup(props, { emit }) {
      return () =>
        h('form', {
          'data-test': 'user-form-stub',
          onSubmit: (event: Event) => {
            event.preventDefault()
            emit('submit', {
              first_name: 'Pat',
              middle_name: null,
              last_name: 'Person',
              email: 'pat@opsflow.test',
              password: 'Password1!',
              role_id: 1,
              department_id: null,
              job_title_id: null,
              status: 'active',
            })
          },
        }, [
          props.formError ? h('p', props.formError) : null,
          h('button', { type: 'submit' }, props.submitLabel || 'Create user'),
        ])
    },
  }),
}))

vi.mock('@/services/userService', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}))

import * as userService from '@/services/userService'

const createdUser: User = {
  id: 9,
  first_name: 'Pat',
  middle_name: null,
  last_name: 'Person',
  full_name: 'Pat Person',
  email: 'pat@opsflow.test',
  avatar: null,
  status: 'active',
  last_login_at: null,
}

describe('UserFormDialog afterSave lifecycle', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('awaits afterSave before completing and retries without re-creating', async () => {
    const afterSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('reconcile failed'))
      .mockResolvedValueOnce(undefined)
    vi.mocked(userService.createUser).mockResolvedValue(createdUser)

    wrapper = mount(UserFormDialog, {
      attachTo: document.body,
      props: {
        open: true,
        mode: 'create',
        afterSave,
      },
    })

    await wrapper.getComponent({ name: 'UserForm' }).get('[data-test="user-form-stub"]').trigger('submit.prevent')
    await flushPromises()

    expect(userService.createUser).toHaveBeenCalledTimes(1)
    expect(wrapper.getComponent({ name: 'UserForm' }).text()).toContain(
      'User was created, but the list could not be updated',
    )
    expect(wrapper.getComponent({ name: 'UserForm' }).text()).toContain('Retry update')

    await wrapper.getComponent({ name: 'UserForm' }).get('[data-test="user-form-stub"]').trigger('submit.prevent')
    await flushPromises()

    expect(userService.createUser).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledTimes(2)
  })
})
