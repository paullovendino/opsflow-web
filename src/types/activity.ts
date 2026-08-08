import type { PaginationMeta } from '@/types/api'

export type ActivitySubjectType = 'user' | 'project' | 'task'

export type ActivityAction =
  | 'user.created'
  | 'user.updated'
  | 'user.activated'
  | 'user.deactivated'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.status_changed'
  | 'project.member_added'
  | 'project.member_removed'
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.assigned'
  | 'task.unassigned'
  | 'task.status_changed'
  | 'task.priority_changed'
  | 'task.due_date_changed'
  | 'remark.created'
  | 'remark.updated'
  | 'remark.deleted'
  | string

export interface ActivityActor {
  id: number
  full_name: string
  email: string
}

export interface ActivitySubject {
  id: number
  type: ActivitySubjectType | string
  name?: string
  title?: string
  full_name?: string
}

export interface ActivityLog {
  id: number
  action: ActivityAction
  description: string
  subject_type: ActivitySubjectType | string
  subject_id: number
  subject: ActivitySubject | null
  actor: ActivityActor | null
  properties: Record<string, unknown>
  created_at: string
}

export interface ActivityListQuery {
  actor_id?: number | null
  action?: string
  subject_type?: ActivitySubjectType | ''
  subject_id?: number | null
  from?: string
  to?: string
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ActivityListResult {
  logs: ActivityLog[]
  meta: PaginationMeta
  message: string
}

export const ACTIVITY_ACTIONS: Array<{ value: string; label: string }> = [
  { value: 'user.created', label: 'User created' },
  { value: 'user.updated', label: 'User updated' },
  { value: 'user.activated', label: 'User activated' },
  { value: 'user.deactivated', label: 'User deactivated' },
  { value: 'project.created', label: 'Project created' },
  { value: 'project.updated', label: 'Project updated' },
  { value: 'project.deleted', label: 'Project deleted' },
  { value: 'project.status_changed', label: 'Project status changed' },
  { value: 'project.member_added', label: 'Project member added' },
  { value: 'project.member_removed', label: 'Project member removed' },
  { value: 'task.created', label: 'Task created' },
  { value: 'task.updated', label: 'Task updated' },
  { value: 'task.deleted', label: 'Task deleted' },
  { value: 'task.assigned', label: 'Task assigned' },
  { value: 'task.unassigned', label: 'Task unassigned' },
  { value: 'task.status_changed', label: 'Task status changed' },
  { value: 'task.priority_changed', label: 'Task priority changed' },
  { value: 'task.due_date_changed', label: 'Task due date changed' },
  { value: 'remark.created', label: 'Remark created' },
  { value: 'remark.updated', label: 'Remark updated' },
  { value: 'remark.deleted', label: 'Remark deleted' },
]

export const ACTIVITY_SUBJECT_TYPES: Array<{ value: ActivitySubjectType; label: string }> = [
  { value: 'user', label: 'User' },
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
]
