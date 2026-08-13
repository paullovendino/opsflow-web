import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProfile } from '@/composables/useProfile'
import { useAuthStore } from '@/stores/auth'
import type { ProfileSummary } from '@/types/profile'

vi.mock('@/services/profileService', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}))

import * as profileService from '@/services/profileService'

const summary: ProfileSummary = {
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
    notify_task_status: true,
    notify_remarks: true,
    notify_mentions: true,
    role: { id: 3, name: 'employee', description: null },
    department: { id: 1, name: 'Operations' },
    job_title: { id: 2, name: 'Analyst' },
  },
  projects: { owned_count: 1, member_count: 2 },
  tasks: { assigned_open: 4, assigned_overdue: 1 },
  recent_activity: [],
}

describe('useProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().setUser({
      id: 3,
      first_name: 'Eli',
      middle_name: null,
      last_name: 'Employee',
      full_name: 'Eli Employee',
      email: 'eli@opsflow.test',
      avatar: null,
      status: 'active',
      last_login_at: null,
      role: { id: 3, name: 'employee', description: null },
    })
  })

  it('loads profile summary', async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue(summary)
    const profile = useProfile()

    await profile.load()

    expect(profile.user.value?.full_name).toBe('Eli Employee')
    expect(profile.summary.value?.projects.owned_count).toBe(1)
  })

  it('saves profile and syncs auth store', async () => {
    const updated = {
      ...summary,
      user: { ...summary.user, first_name: 'Elena', full_name: 'Elena Employee', theme_preference: 'dark' },
    }
    vi.mocked(profileService.updateProfile).mockResolvedValue(updated)
    const profile = useProfile()
    profile.summary.value = summary

    const ok = await profile.save({ first_name: 'Elena', theme_preference: 'dark' })

    expect(ok).toBe(true)
    expect(useAuthStore().user?.first_name).toBe('Elena')
    expect(useAuthStore().user?.theme_preference).toBe('dark')
  })

  it('applies avatar updates into summary and auth store', () => {
    const profile = useProfile()
    profile.summary.value = summary

    profile.applyProfileUser({
      ...summary.user,
      avatar: 'http://localhost/storage/avatars/3/avatar.png',
    })

    expect(profile.user.value?.avatar).toContain('/storage/avatars/3/avatar.png')
    expect(useAuthStore().user?.avatar).toContain('/storage/avatars/3/avatar.png')
  })

  it('captures validation errors from the API', async () => {
    vi.mocked(profileService.updateProfile).mockRejectedValue({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'The given data was invalid.',
          data: null,
          errors: { avatar: ['The avatar field must be a valid URL.'] },
          meta: null,
        },
      },
    })
    const profile = useProfile()
    profile.summary.value = summary

    const ok = await profile.save({ avatar: 'bad' })

    expect(ok).toBe(false)
    expect(profile.serverErrors.value?.avatar?.[0]).toContain('valid URL')
  })
})
