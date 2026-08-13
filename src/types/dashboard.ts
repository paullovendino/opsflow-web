import type { ActivityLog } from '@/types/activity'

export type DashboardRecentType = 'project' | 'task'

export interface DashboardProjectsSummary {
  total: number
  by_status: Record<string, number>
  average_progress: number | null
}

export interface DashboardTasksSummary {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  overdue: number
  assigned_to_me: number
  due_soon: number
}

export interface DashboardRecentProjectItem {
  type: 'project'
  id: number
  name: string
  status: string
  updated_at: string
}

export interface DashboardRecentTaskItem {
  type: 'task'
  id: number
  title: string
  status: string
  project_id: number | null
  updated_at: string
}

export type DashboardRecentItem = DashboardRecentProjectItem | DashboardRecentTaskItem

export interface DashboardDueSoonItem {
  id: number
  title: string
  status: string
  priority: string
  due_date: string | null
  is_overdue: boolean
  project: {
    id: number
    name: string
  } | null
}

export interface DashboardNotificationsSummary {
  unread_count: number
}

export interface DashboardSummary {
  projects: DashboardProjectsSummary
  tasks: DashboardTasksSummary
  recent: DashboardRecentItem[]
  due_soon: DashboardDueSoonItem[]
  recent_activity: ActivityLog[]
  notifications: DashboardNotificationsSummary
}

export interface DashboardQuery {
  recent_limit?: number
  activity_limit?: number
}
