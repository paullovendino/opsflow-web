import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AvatarUploader from '@/modules/users/components/AvatarUploader.vue'
import type { ProfileUser } from '@/types/profile'

vi.mock('@/services/profileService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/profileService')>()
  return {
    ...actual,
    uploadAvatar: vi.fn(),
    removeAvatar: vi.fn(),
  }
})

import * as profileService from '@/services/profileService'

const user: ProfileUser = {
  id: 3,
  first_name: 'Eli',
  middle_name: null,
  last_name: 'Employee',
  full_name: 'Eli Employee',
  email: 'eli@opsflow.test',
  avatar: 'http://localhost/storage/avatars/3/avatar.jpg',
  status: 'active',
  last_login_at: null,
  theme_preference: 'system',
  notify_task_assigned: true,
  notify_task_status: true,
  notify_remarks: true,
  notify_mentions: true,
}

function makeFile(name: string, type: string, size = 1024): File {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], name, { type })
}

describe('AvatarUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('renders the current avatar and opens the file picker', async () => {
    const wrapper = mount(AvatarUploader, {
      props: { name: user.full_name, avatar: user.avatar },
    })

    expect(wrapper.get('[data-test="app-avatar-image"]').attributes('src')).toBe(user.avatar)
    const clickSpy = vi.spyOn(wrapper.get('[data-test="avatar-file-input"]').element as HTMLInputElement, 'click')
    await wrapper.get('[data-test="avatar-change"]').trigger('click')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('rejects invalid file types and oversized files', async () => {
    const wrapper = mount(AvatarUploader, {
      props: { name: user.full_name, avatar: user.avatar },
    })

    const input = wrapper.get('[data-test="avatar-file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [makeFile('notes.txt', 'text/plain')],
      configurable: true,
    })
    await input.trigger('change')
    expect(wrapper.get('[data-test="avatar-error"]').text()).toContain('JPEG, PNG, or WEBP')
    expect(profileService.uploadAvatar).not.toHaveBeenCalled()

    Object.defineProperty(input.element, 'files', {
      value: [makeFile('huge.jpg', 'image/jpeg', 3 * 1024 * 1024)],
      configurable: true,
    })
    await input.trigger('change')
    expect(wrapper.get('[data-test="avatar-error"]').text()).toContain('2 MB')
  })

  it('previews a valid image and uploads on confirm', async () => {
    vi.mocked(profileService.uploadAvatar).mockResolvedValue({
      user: { ...user, avatar: 'http://localhost/storage/avatars/3/avatar.png' },
      projects: { owned_count: 0, member_count: 0 },
      tasks: { assigned_open: 0, assigned_overdue: 0 },
      recent_activity: [],
    })

    const wrapper = mount(AvatarUploader, {
      props: { name: user.full_name, avatar: user.avatar },
    })

    const input = wrapper.get('[data-test="avatar-file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [makeFile('avatar.png', 'image/png')],
      configurable: true,
    })
    await input.trigger('change')

    expect(wrapper.get('[data-test="avatar-preview-hint"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="app-avatar-image"]').attributes('src')).toBe('blob:preview')

    await wrapper.get('[data-test="avatar-confirm"]').trigger('click')
    await flushPromises()

    expect(profileService.uploadAvatar).toHaveBeenCalled()
    expect(wrapper.emitted('updated')?.[0]?.[0]).toMatchObject({
      avatar: 'http://localhost/storage/avatars/3/avatar.png',
    })
  })

  it('shows upload failure without emitting success', async () => {
    vi.mocked(profileService.uploadAvatar).mockRejectedValue({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Invalid',
          data: null,
          errors: { avatar: ['The avatar failed to upload.'] },
          meta: null,
        },
      },
    })

    const wrapper = mount(AvatarUploader, {
      props: { name: user.full_name, avatar: user.avatar },
    })

    const input = wrapper.get('[data-test="avatar-file-input"]')
    Object.defineProperty(input.element, 'files', {
      value: [makeFile('avatar.jpg', 'image/jpeg')],
      configurable: true,
    })
    await input.trigger('change')
    await wrapper.get('[data-test="avatar-confirm"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="avatar-error"]').text()).toContain('failed to upload')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })

  it('removes the avatar and emits null avatar', async () => {
    vi.mocked(profileService.removeAvatar).mockResolvedValue({
      user: { ...user, avatar: null },
      projects: { owned_count: 0, member_count: 0 },
      tasks: { assigned_open: 0, assigned_overdue: 0 },
      recent_activity: [],
    })

    const wrapper = mount(AvatarUploader, {
      props: { name: user.full_name, avatar: user.avatar },
    })

    await wrapper.get('[data-test="avatar-remove"]').trigger('click')
    await flushPromises()

    expect(profileService.removeAvatar).toHaveBeenCalled()
    expect(wrapper.emitted('updated')?.[0]?.[0]).toMatchObject({ avatar: null })
  })
})
