import { beforeEach, describe, expect, it, vi } from 'vitest'
import http from '@/services/http'
import * as profileService from '@/services/profileService'

vi.mock('@/services/http', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets the profile payload', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          user: { id: 1, first_name: 'Ada' },
          projects: { owned_count: 0, member_count: 0 },
          tasks: { assigned_open: 0, assigned_overdue: 0 },
          recent_activity: [],
        },
        errors: null,
        meta: null,
      },
    })

    const result = await profileService.getProfile()

    expect(http.get).toHaveBeenCalledWith('/api/v1/profile', { quietProgress: undefined })
    expect(result.user.id).toBe(1)
  })

  it('updates the profile with quietProgress by default', async () => {
    vi.mocked(http.put).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          user: { id: 1, first_name: 'Ada', theme_preference: 'light' },
          projects: { owned_count: 0, member_count: 0 },
          tasks: { assigned_open: 0, assigned_overdue: 0 },
          recent_activity: [],
        },
        errors: null,
        meta: null,
      },
    })

    await profileService.updateProfile({ theme_preference: 'light' })

    expect(http.put).toHaveBeenCalledWith(
      '/api/v1/profile',
      { theme_preference: 'light' },
      { quietProgress: true },
    )
  })

  it('uploads an avatar via multipart POST with method spoofing', async () => {
    vi.mocked(http.post).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          user: { id: 1, avatar: 'http://localhost/storage/avatars/1/avatar.jpg' },
          projects: { owned_count: 0, member_count: 0 },
          tasks: { assigned_open: 0, assigned_overdue: 0 },
          recent_activity: [],
        },
        errors: null,
        meta: null,
      },
    })

    const file = new File([new Uint8Array(8)], 'avatar.jpg', { type: 'image/jpeg' })
    await profileService.uploadAvatar(file)

    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/profile',
      expect.any(FormData),
      expect.objectContaining({
        quietProgress: true,
        headers: { 'Content-Type': undefined },
      }),
    )

    const formData = vi.mocked(http.post).mock.calls[0]![1] as FormData
    expect(formData.get('_method')).toBe('PUT')
    expect(formData.get('avatar')).toBe(file)
  })

  it('removes the avatar', async () => {
    vi.mocked(http.delete).mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: {
          user: { id: 1, avatar: null },
          projects: { owned_count: 0, member_count: 0 },
          tasks: { assigned_open: 0, assigned_overdue: 0 },
          recent_activity: [],
        },
        errors: null,
        meta: null,
      },
    })

    await profileService.removeAvatar()

    expect(http.delete).toHaveBeenCalledWith('/api/v1/profile/avatar', { quietProgress: true })
  })

  it('validates avatar files client-side', () => {
    expect(profileService.validateAvatarFile(new File([new Uint8Array(8)], 'a.gif', { type: 'image/gif' }))).toContain(
      'JPEG',
    )
    expect(
      profileService.validateAvatarFile(new File([new Uint8Array(3 * 1024 * 1024)], 'a.jpg', { type: 'image/jpeg' })),
    ).toContain('2 MB')
    expect(
      profileService.validateAvatarFile(new File([new Uint8Array(8)], 'a.jpg', { type: 'image/jpeg' })),
    ).toBeNull()
  })
})
