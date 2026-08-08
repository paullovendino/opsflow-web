export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'completed'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskProjectRef {
  id: number
  name: string
}

export interface TaskUserRef {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus | string
  priority: TaskPriority | string
  due_date: string | null
  project?: TaskProjectRef | null
  assignee?: TaskUserRef | null
  creator?: TaskUserRef | null
  created_at: string
  updated_at: string
}

export type TaskSortField = 'title' | 'status' | 'priority' | 'due_date' | 'created_at'

export interface TaskListQuery {
  search?: string
  status?: TaskStatus | ''
  priority?: TaskPriority | ''
  project_id?: number | null
  assigned_to?: number | null
  created_by?: number | null
  sort?: TaskSortField
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface TaskListResult {
  tasks: Task[]
  meta: import('@/types/api').PaginationMeta
  message: string
}

export interface TaskCreatePayload {
  project_id: number
  title: string
  description: string | null
  priority?: TaskPriority | null
  due_date: string | null
  assigned_to?: number | null
}

export interface TaskUpdatePayload {
  title: string
  description: string | null
  priority: TaskPriority
  due_date: string | null
}

export interface TaskAssignmentPayload {
  assigned_to: number | null
}

export interface TaskStatusPayload {
  status: TaskStatus
}

export const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'completed',
  'cancelled',
]

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
