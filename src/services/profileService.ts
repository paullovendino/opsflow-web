import http from '@/services/http'
import type { ApiEnvelope } from '@/types/api'
import type { ProfileSummary, ProfileUpdatePayload } from '@/types/profile'

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export async function getProfile(options: { quietProgress?: boolean } = {}): Promise<ProfileSummary> {
  const { data } = await http.get<ApiEnvelope<ProfileSummary>>('/api/v1/profile', {
    quietProgress: options.quietProgress,
  })

  if (!data.data) {
    throw new Error(data.message || 'Profile payload missing.')
  }

  return data.data
}

export async function updateProfile(
  payload: ProfileUpdatePayload,
  options: { quietProgress?: boolean } = {},
): Promise<ProfileSummary> {
  const { data } = await http.put<ApiEnvelope<ProfileSummary>>('/api/v1/profile', payload, {
    quietProgress: options.quietProgress ?? true,
  })

  if (!data.data) {
    throw new Error(data.message || 'Profile update payload missing.')
  }

  return data.data
}

export async function uploadAvatar(
  file: File,
  options: { quietProgress?: boolean } = {},
): Promise<ProfileSummary> {
  const formData = new FormData()
  formData.append('_method', 'PUT')
  formData.append('avatar', file)

  const { data } = await http.post<ApiEnvelope<ProfileSummary>>('/api/v1/profile', formData, {
    quietProgress: options.quietProgress ?? true,
    // Let the browser set multipart boundary; default JSON Content-Type breaks uploads.
    headers: { 'Content-Type': undefined },
  })

  if (!data.data) {
    throw new Error(data.message || 'Avatar upload payload missing.')
  }

  return data.data
}

export async function removeAvatar(options: { quietProgress?: boolean } = {}): Promise<ProfileSummary> {
  const { data } = await http.delete<ApiEnvelope<ProfileSummary>>('/api/v1/profile/avatar', {
    quietProgress: options.quietProgress ?? true,
  })

  if (!data.data) {
    throw new Error(data.message || 'Avatar removal payload missing.')
  }

  return data.data
}

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
    return 'Please choose a JPEG, PNG, or WEBP image.'
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return 'Image must be 2 MB or smaller.'
  }

  return null
}
