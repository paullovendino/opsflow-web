import type { RouteLocationRaw } from 'vue-router'
import type { AppNotification } from '@/types/notification'
import { humanizeKey } from '@/utils/format'

export function notificationTitle(notification: AppNotification): string {
  if (typeof notification.data.title === 'string' && notification.data.title.trim()) {
    return notification.data.title
  }

  return humanizeKey(String(notification.type))
}

export function notificationMessage(notification: AppNotification): string {
  if (typeof notification.data.message === 'string' && notification.data.message.trim()) {
    return notification.data.message
  }

  return notificationTitle(notification)
}

export function notificationTargetRoute(notification: AppNotification): RouteLocationRaw | null {
  const targetType =
    (typeof notification.data.target_type === 'string' && notification.data.target_type) ||
    notification.subject_type
  const targetId =
    (typeof notification.data.target_id === 'number' && notification.data.target_id) ||
    notification.subject_id

  if (targetType === 'task' && targetId) {
    return { name: 'tasks.show', params: { id: targetId } }
  }

  if (targetType === 'project' && targetId) {
    return { name: 'projects.show', params: { id: targetId } }
  }

  if (targetType === 'remark') {
    const nestedType = notification.data.target_type
    const nestedId = notification.data.target_id
    if (nestedType === 'task' && nestedId) {
      return { name: 'tasks.show', params: { id: nestedId } }
    }
    if (nestedType === 'project' && nestedId) {
      return { name: 'projects.show', params: { id: nestedId } }
    }
  }

  return { name: 'notifications.index' }
}
