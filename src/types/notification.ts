import type { PaginationMeta } from '@/types/api'

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'project_member_added'
  | 'remark_created'
  | 'remark_mentioned'

export interface NotificationActor {
  id: number
  full_name: string
  email: string
}

export interface NotificationSubject {
  id: number
  type: string
  name?: string
  title?: string
  full_name?: string
  body_preview?: string
}

export interface NotificationData {
  title?: string
  message?: string
  target_type?: string
  target_id?: number
  project_id?: number
  remark_id?: number
  [key: string]: unknown
}

export interface AppNotification {
  id: number
  type: NotificationType | string
  actor: NotificationActor | null
  subject_type: string | null
  subject_id: number | null
  subject: NotificationSubject | null
  data: NotificationData
  read_at: string | null
  created_at: string
}

export interface NotificationListQuery {
  unread?: boolean
  page?: number
  per_page?: number
}

export interface NotificationListResult {
  notifications: AppNotification[]
  meta: PaginationMeta
  message: string
}
