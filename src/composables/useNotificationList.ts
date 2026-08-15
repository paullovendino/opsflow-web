import { computed, reactive, ref } from 'vue'
import * as notificationService from '@/services/notificationService'
import type { AppNotification } from '@/types/notification'
import type { PaginationMeta } from '@/types/api'
import { toApiClientError } from '@/utils/errors'

export function useNotificationList(options: { perPage?: number } = {}) {
  const notifications = ref<AppNotification[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const isMutating = ref(false)

  const filters = reactive({
    unreadOnly: false,
    page: 1,
    per_page: options.perPage ?? 15,
  })

  const isEmpty = computed(
    () => !isLoading.value && !errorMessage.value && notifications.value.length === 0,
  )

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    try {
      const result = await notificationService.listNotifications(
        {
          unread: filters.unreadOnly || undefined,
          page: filters.page,
          per_page: filters.per_page,
        },
        { quietProgress: true },
      )
      notifications.value = result.notifications
      meta.value = result.meta
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load notifications.'
      if (notifications.value.length === 0) {
        meta.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function retry(): Promise<void> {
    await load()
  }

  async function setPage(page: number): Promise<void> {
    filters.page = page
    await load()
  }

  async function setUnreadOnly(unreadOnly: boolean): Promise<void> {
    filters.unreadOnly = unreadOnly
    filters.page = 1
    await load()
  }

  async function markRead(id: number): Promise<void> {
    isMutating.value = true
    try {
      const updated = await notificationService.markNotificationRead(id, { quietProgress: true })
      if (filters.unreadOnly) {
        notifications.value = notifications.value.filter((item) => item.id !== id)
        if (meta.value) {
          meta.value = {
            ...meta.value,
            total: Math.max(0, meta.value.total - 1),
            to: meta.value.to != null ? Math.max((meta.value.from ?? 1) - 1, meta.value.to - 1) : null,
          }
        }
        if (notifications.value.length === 0 && (meta.value?.total ?? 0) > 0) {
          filters.page = Math.max(1, filters.page - 1)
          await load()
        }
      } else {
        notifications.value = notifications.value.map((item) => (item.id === id ? updated : item))
      }
    } finally {
      isMutating.value = false
    }
  }

  async function markAllRead(): Promise<void> {
    isMutating.value = true
    try {
      await notificationService.markAllNotificationsRead({ quietProgress: true })
      if (filters.unreadOnly) {
        notifications.value = []
        meta.value = {
          current_page: 1,
          last_page: 1,
          per_page: filters.per_page,
          total: 0,
          from: null,
          to: null,
        }
        filters.page = 1
      } else {
        const now = new Date().toISOString()
        notifications.value = notifications.value.map((item) => ({
          ...item,
          read_at: item.read_at ?? now,
        }))
      }
    } finally {
      isMutating.value = false
    }
  }

  return {
    notifications,
    meta,
    filters,
    isLoading,
    errorMessage,
    isEmpty,
    isMutating,
    load,
    retry,
    setPage,
    setUnreadOnly,
    markRead,
    markAllRead,
  }
}
