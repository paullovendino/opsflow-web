import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as notificationService from '@/services/notificationService'
import type { AppNotification } from '@/types/notification'
import { toApiClientError } from '@/utils/errors'

const PREVIEW_LIMIT = 8
const POLL_INTERVAL_MS = 60_000
const FOCUS_COOLDOWN_MS = 5_000

export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0)
  const preview = ref<AppNotification[]>([])
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const isMutating = ref(false)
  const errorMessage = ref<string | null>(null)
  const isOpen = ref(false)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let lastFocusRefreshAt = 0
  let focusHandler: (() => void) | null = null

  const hasUnread = computed(() => unreadCount.value > 0)
  const isEmpty = computed(
    () => !isLoading.value && !errorMessage.value && preview.value.length === 0,
  )

  async function refresh(options: { quiet?: boolean } = {}): Promise<void> {
    const quiet = options.quiet ?? (preview.value.length > 0 || unreadCount.value > 0)
    if (quiet) {
      isRefreshing.value = true
    } else {
      isLoading.value = true
    }
    errorMessage.value = null

    try {
      const [count, list] = await Promise.all([
        notificationService.getUnreadCount({ quietProgress: true }),
        notificationService.listNotifications(
          { page: 1, per_page: PREVIEW_LIMIT },
          { quietProgress: true },
        ),
      ])
      unreadCount.value = count
      preview.value = list.notifications
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load notifications.'
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  async function retry(): Promise<void> {
    await refresh({ quiet: false })
  }

  async function markRead(id: number): Promise<void> {
    const current = preview.value.find((item) => item.id === id)
    const wasUnread = current?.read_at == null
    if (current && wasUnread) {
      current.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }

    isMutating.value = true
    try {
      const updated = await notificationService.markNotificationRead(id, { quietProgress: true })
      preview.value = preview.value.map((item) => (item.id === id ? updated : item))
    } catch (error) {
      if (current && wasUnread) {
        current.read_at = null
        unreadCount.value += 1
      }
      throw error
    } finally {
      isMutating.value = false
    }
  }

  async function markAllRead(): Promise<void> {
    const previousPreview = preview.value.map((item) => ({ ...item }))
    const previousCount = unreadCount.value
    preview.value = preview.value.map((item) => ({
      ...item,
      read_at: item.read_at ?? new Date().toISOString(),
    }))
    unreadCount.value = 0

    isMutating.value = true
    try {
      await notificationService.markAllNotificationsRead({ quietProgress: true })
    } catch (error) {
      preview.value = previousPreview
      unreadCount.value = previousCount
      throw error
    } finally {
      isMutating.value = false
    }
  }

  function onWindowFocus(): void {
    const now = Date.now()
    if (now - lastFocusRefreshAt < FOCUS_COOLDOWN_MS) {
      return
    }
    lastFocusRefreshAt = now
    void refresh({ quiet: true })
  }

  function startPolling(): void {
    if (pollTimer) {
      return
    }

    void refresh({ quiet: false })
    pollTimer = setInterval(() => {
      void refresh({ quiet: true })
    }, POLL_INTERVAL_MS)

    focusHandler = onWindowFocus
    window.addEventListener('focus', focusHandler)
  }

  function stopPolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (focusHandler) {
      window.removeEventListener('focus', focusHandler)
      focusHandler = null
    }
  }

  function setOpen(open: boolean): void {
    isOpen.value = open
    if (open && preview.value.length === 0 && !isLoading.value) {
      void refresh({ quiet: false })
    }
  }

  return {
    unreadCount,
    preview,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    isOpen,
    hasUnread,
    isEmpty,
    refresh,
    retry,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    setOpen,
  }
})
