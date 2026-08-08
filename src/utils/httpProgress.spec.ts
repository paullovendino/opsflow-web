import { describe, expect, it } from 'vitest'
import { isQuietRequestUrl, shouldTrackHttpProgress } from '@/utils/httpProgress'

describe('httpProgress', () => {
  it('treats lookup endpoints as quiet', () => {
    expect(isQuietRequestUrl('/api/v1/lookups/roles')).toBe(true)
    expect(isQuietRequestUrl('http://localhost:8000/api/v1/lookups/departments')).toBe(true)
    expect(shouldTrackHttpProgress('/api/v1/lookups/job-titles')).toBe(false)
  })

  it('tracks non-lookup API requests', () => {
    expect(shouldTrackHttpProgress('/api/v1/users')).toBe(true)
    expect(shouldTrackHttpProgress('/api/v1/auth/me')).toBe(true)
    expect(isQuietRequestUrl('/api/v1/users')).toBe(false)
  })

  it('honors quietProgress for modal-scoped detail requests', () => {
    expect(shouldTrackHttpProgress('/api/v1/users/4', true)).toBe(false)
    expect(shouldTrackHttpProgress('/api/v1/users', true)).toBe(false)
    expect(shouldTrackHttpProgress('/api/v1/users')).toBe(true)
  })
})
