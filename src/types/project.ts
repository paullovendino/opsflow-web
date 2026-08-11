export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

export interface ProjectOwner {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
  status?: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  status: ProjectStatus | string
  start_date: string | null
  due_date: string | null
  progress: number | null
  owner?: ProjectOwner | null
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
  status: string
  joined_at: string | null
}

export type ProjectSortField = 'name' | 'status' | 'start_date' | 'due_date' | 'created_at'

export interface ProjectListQuery {
  search?: string
  status?: ProjectStatus | ''
  created_by?: number | null
  sort?: ProjectSortField
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ProjectListResult {
  projects: Project[]
  meta: import('@/types/api').PaginationMeta
  message: string
}

export interface ProjectWritePayload {
  name: string
  description: string | null
  start_date: string | null
  due_date: string | null
}

export interface ProjectStatusPayload {
  status: ProjectStatus
}

export interface ProjectMemberPayload {
  user_id: number
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
]
