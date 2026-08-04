export type DashboardRecentType = 'project' | 'task'

export interface DashboardProjectsSummary {
  total: number
  by_status: Record<string, number>
}

export interface DashboardTasksSummary {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  overdue: number
  assigned_to_me: number
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

export interface DashboardSummary {
  projects: DashboardProjectsSummary
  tasks: DashboardTasksSummary
  recent: DashboardRecentItem[]
}

export interface DashboardQuery {
  recent_limit?: number
}
