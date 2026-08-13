import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ProfileView from '@/modules/users/views/ProfileView.vue'
import type { ProfileSummary } from '@/types/profile'

const load = vi.fn(async () => undefined)
const save = vi.fn(async () => true)
const applyProfileUser = vi.fn()

const summary = ref<ProfileSummary | null>(null)
const user = ref<ProfileSummary['user'] | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const serverErrors = ref<Record<string, string[]> | null>(null)

vi.mock('@/composables/useProfile', () => ({
  useProfile: () => ({
    summary,
    user,
    isLoading,
    isSaving,
    errorMessage,
    serverErrors,
    load,
    save,
    applyProfileUser,
  }),
}))

vi.mock('@/modules/users/components/AvatarUploader.vue', () => ({
  default: {
    name: 'AvatarUploader',
    props: ['name', 'avatar'],
    emits: ['updated'],
    template:
      '<div data-test="avatar-uploader-stub">Avatar uploader stub<button type="button" data-test="avatar-stub-emit" @click="$emit(\'updated\', { id: 3, full_name: \'Eli Employee\', avatar: \'http://localhost/storage/avatars/3/avatar.jpg\' })">emit</button></div>',
  },
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

const filled: ProfileSummary = {
  user: {
    id: 3,
    first_name: 'Eli',
    middle_name: null,
    last_name: 'Employee',
    full_name: 'Eli Employee',
    email: 'eli@opsflow.test',
    avatar: null,
    status: 'active',
    last_login_at: null,
    theme_preference: 'system',
    notify_task_assigned: true,
    notify_task_status: false,
    notify_remarks: true,
    notify_mentions: true,
    role: { id: 3, name: 'employee', description: null },
    department: { id: 1, name: 'Operations' },
    job_title: { id: 2, name: 'Analyst' },
  },
  projects: { owned_count: 1, member_count: 2 },
  tasks: { assigned_open: 3, assigned_overdue: 1 },
  recent_activity: [
    {
      id: 9,
      action: 'user.updated',
      description: 'Updated profile for Eli Employee.',
      subject_type: 'user',
      subject_id: 3,
      subject: { id: 3, type: 'user', full_name: 'Eli Employee' },
      actor: { id: 3, full_name: 'Eli Employee', email: 'eli@opsflow.test' },
      properties: {},
      created_at: '2026-08-13T10:00:00+00:00',
    },
  ],
}

async function mountProfile() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/profile', name: 'profile', component: { template: '<div />' } },
      { path: '/projects', name: 'projects.index', component: { template: '<div />' } },
      { path: '/tasks', name: 'tasks.index', component: { template: '<div />' } },
    ],
  })
  await router.push('/profile')
  await router.isReady()

  return mount(ProfileView, {
    global: {
      plugins: [createPinia(), router],
    },
  })
}

describe('ProfileView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    summary.value = null
    user.value = null
    isLoading.value = false
    isSaving.value = false
    errorMessage.value = null
    serverErrors.value = null
    load.mockClear()
    save.mockClear()
    applyProfileUser.mockClear()
    save.mockResolvedValue(true)
  })

  it('shows a loading skeleton initially', async () => {
    isLoading.value = true
    const wrapper = await mountProfile()

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="profile-form"]').exists()).toBe(false)
  })

  it('populates editable fields and read-only managed fields', async () => {
    summary.value = filled
    user.value = filled.user
    const wrapper = await mountProfile()
    await flushPromises()

    expect((wrapper.get('#profile_first_name').element as HTMLInputElement).value).toBe('Eli')
    expect((wrapper.get('#profile_theme_preference').element as HTMLSelectElement).value).toBe('system')
    expect((wrapper.get('[data-test="notify-task-status"]').element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.get('[data-test="managed-fields"]').text()).toContain('eli@opsflow.test')
    expect(wrapper.get('[data-test="managed-fields"]').text()).toContain('Employee')
    expect(wrapper.get('[data-test="managed-fields"]').html()).not.toContain('type="email"')
    expect(wrapper.get('[data-test="profile-work-summary"]').text()).toContain('1')
    expect(wrapper.get('[data-test="profile-recent-activity"]').text()).toContain('Eli Employee')
    expect(wrapper.find('#profile_email').exists()).toBe(false)
    expect(wrapper.find('#profile_role_id').exists()).toBe(false)
    expect(wrapper.find('#profile_avatar').exists()).toBe(false)
    expect(wrapper.get('[data-test="avatar-uploader-stub"]').exists()).toBe(true)
  })

  it('submits personal information and preferences without avatar URL', async () => {
    summary.value = filled
    user.value = filled.user
    const wrapper = await mountProfile()
    await flushPromises()

    await wrapper.get('#profile_first_name').setValue('Elena')
    await wrapper.get('#profile_theme_preference').setValue('dark')
    await wrapper.get('[data-test="notify-task-assigned"]').setValue(false)
    await wrapper.get('[data-test="profile-form"]').trigger('submit')

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Elena',
        theme_preference: 'dark',
        notify_task_assigned: false,
      }),
    )
    expect(save.mock.calls[0]![0]).not.toHaveProperty('avatar')
  })

  it('applies avatar uploader updates through the profile composable', async () => {
    summary.value = filled
    user.value = filled.user
    const wrapper = await mountProfile()
    await flushPromises()

    await wrapper.get('[data-test="avatar-stub-emit"]').trigger('click')

    expect(applyProfileUser).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar: 'http://localhost/storage/avatars/3/avatar.jpg',
      }),
    )
  })

  it('includes password fields when provided', async () => {
    summary.value = filled
    user.value = filled.user
    const wrapper = await mountProfile()
    await flushPromises()

    await wrapper.get('#profile_password').setValue('NewSecurePass1!')
    await wrapper.get('#profile_password_confirmation').setValue('NewSecurePass1!')
    await wrapper.get('[data-test="profile-form"]').trigger('submit')

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'NewSecurePass1!',
        password_confirmation: 'NewSecurePass1!',
      }),
    )
  })

  it('disables save while saving and shows API validation errors', async () => {
    summary.value = filled
    user.value = filled.user
    isSaving.value = true
    serverErrors.value = { first_name: ['The first name field is required.'] }
    errorMessage.value = 'The given data was invalid.'

    const wrapper = await mountProfile()

    expect(wrapper.get('[data-test="profile-save"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('The first name field is required.')
    expect(wrapper.get('[data-test="profile-form-error"]').text()).toContain('invalid')
  })

  it('shows load error retry', async () => {
    errorMessage.value = 'Unable to load profile.'
    const wrapper = await mountProfile()

    expect(wrapper.get('[data-test="profile-load-error"]').text()).toContain("Couldn't load profile")
    await wrapper.get('button').trigger('click')
    expect(load).toHaveBeenCalled()
  })
})
