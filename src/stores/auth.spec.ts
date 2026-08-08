import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser } from '@/types/auth'

vi.mock('@/services/authService', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

import * as authService from '@/services/authService'

const adminUser: AuthUser = {
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

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('bootstraps the current user from /me', async () => {
    vi.mocked(authService.fetchCurrentUser).mockResolvedValue(adminUser)
    const auth = useAuthStore()

    await auth.bootstrap()

    expect(auth.isBootstrapped).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.roleName).toBe('administrator')
    expect(auth.user?.email).toBe('ada@opsflow.test')
  })

  it('treats a failed bootstrap as guest', async () => {
    vi.mocked(authService.fetchCurrentUser).mockRejectedValue(new Error('Unauthenticated.'))
    const auth = useAuthStore()

    await auth.bootstrap()

    expect(auth.isBootstrapped).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  it('does not refetch /me once bootstrapped', async () => {
    vi.mocked(authService.fetchCurrentUser).mockResolvedValue(adminUser)
    const auth = useAuthStore()

    await auth.bootstrap()
    await auth.bootstrap()

    expect(authService.fetchCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('logs in and stores the authenticated user', async () => {
    vi.mocked(authService.login).mockResolvedValue(adminUser)
    const auth = useAuthStore()

    await auth.login({ email: 'ada@opsflow.test', password: 'password' })

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.fullName).toBe('Ada Admin')
  })

  it('clears the session on logout even if the API call fails', async () => {
    vi.mocked(authService.fetchCurrentUser).mockResolvedValue(adminUser)
    vi.mocked(authService.logout).mockRejectedValue(new Error('already gone'))
    const auth = useAuthStore()

    await auth.bootstrap()
    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })
})
