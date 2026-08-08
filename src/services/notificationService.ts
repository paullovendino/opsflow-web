import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  AppNotification,
  NotificationListQuery,
  NotificationListResult,
} from '@/types/notification'

function cleanParams(params: NotificationListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.unread) {
    out.unread = 1
  }
  if (params.page != null) {
    out.page = params.page
  }
  if (params.per_page != null) {
    out.per_page = params.per_page
  }

  return out
}

function asPaginationMeta(meta: Record<string, unknown> | null): PaginationMeta {
  return {
    current_page: Number(meta?.current_page ?? 1),
    last_page: Number(meta?.last_page ?? 1),
    per_page: Number(meta?.per_page ?? 15),
    total: Number(meta?.total ?? 0),
    from: (meta?.from as number | null | undefined) ?? null,
    to: (meta?.to as number | null | undefined) ?? null,
  }
}

export async function listNotifications(
  params: NotificationListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<NotificationListResult> {
  const { data } = await http.get<ApiEnvelope<AppNotification[]>>('/api/v1/notifications', {
    params: cleanParams(params),
    quietProgress: options.quietProgress ?? true,
  })

  return {
    notifications: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getUnreadCount(options: { quietProgress?: boolean } = {}): Promise<number> {
  const { data } = await http.get<ApiEnvelope<{ unread_count: number }>>(
    '/api/v1/notifications/unread-count',
    { quietProgress: options.quietProgress ?? true },
  )

  return Number(data.data?.unread_count ?? 0)
}

export async function markNotificationRead(
  id: number,
  options: { quietProgress?: boolean } = {},
): Promise<AppNotification> {
  const { data } = await http.patch<ApiEnvelope<AppNotification>>(
    `/api/v1/notifications/${id}/read`,
    {},
    { quietProgress: options.quietProgress ?? true },
  )

  if (!data.data) {
    throw new Error(data.message || 'Notification payload missing.')
  }

  return data.data
}

export async function markAllNotificationsRead(
  options: { quietProgress?: boolean } = {},
): Promise<number> {
  const { data } = await http.post<ApiEnvelope<{ updated_count: number }>>(
    '/api/v1/notifications/read-all',
    {},
    { quietProgress: options.quietProgress ?? true },
  )

  return Number(data.data?.updated_count ?? 0)
}
