export interface ReportDateQuery {
  from_date?: string
  to_date?: string
}

export interface ProjectReportProject {
  id: number
  name: string
  status: string
  start_date: string | null
  due_date: string | null
  created_at: string
}

export interface ProjectReportTasks {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  overdue: number
  unassigned: number
}

export interface ProjectReport {
  project: ProjectReportProject
  tasks: ProjectReportTasks
  members_count: number
}

export interface EmployeeReportUser {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string | null
  full_name: string
  email: string
  status: string
}

export interface EmployeeReportProjectBreakdown {
  project_id: number
  name: string
  total: number
}

export interface EmployeeReportTasks {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  overdue: number
  by_project?: EmployeeReportProjectBreakdown[]
}

export interface EmployeeReport {
  user: EmployeeReportUser
  tasks: EmployeeReportTasks
}

export type ProjectReportSortField = 'name' | 'status' | 'created_at'
export type EmployeeReportSortField = 'first_name' | 'last_name' | 'email' | 'created_at'

export interface ProjectReportListQuery extends ReportDateQuery {
  search?: string
  status?: string
  sort?: ProjectReportSortField
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface EmployeeReportListQuery extends ReportDateQuery {
  search?: string
  role_id?: number | null
  department_id?: number | null
  status?: string
  sort?: EmployeeReportSortField
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ProjectReportListResult {
  reports: ProjectReport[]
  meta: import('@/types/api').PaginationMeta
  message: string
}

export interface EmployeeReportListResult {
  reports: EmployeeReport[]
  meta: import('@/types/api').PaginationMeta
  message: string
}
