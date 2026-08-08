import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useUserList } from '@/composables/useUserList'
import { isInitialListLoading, isSoftListRefresh } from '@/utils/listLoading'
import type { User } from '@/types/user'

vi.mock('@/services/userService', () => ({
  listUsers: vi.fn(),
}))

import * as userService from '@/services/userService'

const sampleUser: User = {
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

const Host = defineComponent({
  setup() {
    return useUserList()
  },
  template: `
    <div>
      <span data-test="empty">{{ isEmpty }}</span>
      <span data-test="loading">{{ isLoading }}</span>
      <span data-test="error">{{ errorMessage ?? '' }}</span>
      <span data-test="count">{{ users.length }}</span>
    </div>
  `,
})

async function mountList(initialPath = '/users') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/users', name: 'users.index', component: Host },
      { path: '/users/create', name: 'users.create', component: Host },
      { path: '/users/:id/edit', name: 'users.edit', component: Host },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  const wrapper = mount(Host, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('useUserList', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is not empty while the initial request is in flight', async () => {
    let resolveList!: (value: { users: User[]; meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null }; message: string }) => void
    vi.mocked(userService.listUsers).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    const { wrapper } = await mountList()
    await nextTick()

    expect(wrapper.get('[data-test="loading"]').text()).toBe('true')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('false')
    expect(isInitialListLoading(true, 0)).toBe(true)

    resolveList({
      users: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null },
      message: 'OK',
    })
    await flushPromises()

    expect(wrapper.get('[data-test="loading"]').text()).toBe('false')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('true')
  })

  it('keeps prior rows during a soft refresh', async () => {
    vi.mocked(userService.listUsers)
      .mockResolvedValueOnce({
        users: [sampleUser],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
        message: 'OK',
      })
      .mockReturnValueOnce(new Promise(() => {}))

    const { wrapper } = await mountList()
    await flushPromises()

    expect(wrapper.get('[data-test="count"]').text()).toBe('1')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('false')

    void wrapper.vm.retry()
    await nextTick()

    expect(wrapper.get('[data-test="loading"]').text()).toBe('true')
    expect(wrapper.get('[data-test="count"]').text()).toBe('1')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('false')
    expect(isSoftListRefresh(true, 1)).toBe(true)
  })

  it('exposes a retryable error without inventing empty rows', async () => {
    vi.mocked(userService.listUsers).mockRejectedValue({
      response: {
        status: 500,
        data: {
          success: false,
          message: 'Unable to load users.',
          data: null,
          errors: null,
          meta: null,
        },
      },
    })

    const { wrapper } = await mountList()
    await flushPromises()

    expect(wrapper.get('[data-test="error"]').text()).toBe('Unable to load users.')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('false')
    expect(wrapper.get('[data-test="count"]').text()).toBe('0')
  })

  it('preserves list query when opening a modal alias and does not refetch', async () => {
    vi.mocked(userService.listUsers).mockResolvedValue({
      users: [sampleUser],
      meta: { current_page: 2, last_page: 3, per_page: 15, total: 16, from: 16, to: 16 },
      message: 'OK',
    })

    const { wrapper, router } = await mountList('/users?search=John&page=2')
    await flushPromises()
    expect(userService.listUsers).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-test="count"]').text()).toBe('1')

    wrapper.vm.openModalAlias('users.create')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('users.create')
    expect(router.currentRoute.value.query).toMatchObject({ search: 'John', page: '2' })
    expect(userService.listUsers).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.filters.search).toBe('John')
    expect(wrapper.vm.filters.page).toBe(2)
  })
})
