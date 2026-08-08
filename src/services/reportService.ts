import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  EmployeeReport,
  EmployeeReportListQuery,
  EmployeeReportListResult,
  ProjectReport,
  ProjectReportListQuery,
  ProjectReportListResult,
  ReportDateQuery,
} from '@/types/report'

function cleanDateParams(params: ReportDateQuery): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.from_date) out.from_date = params.from_date
  if (params.to_date) out.to_date = params.to_date
  return out
}

function cleanProjectListParams(params: ProjectReportListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = { ...cleanDateParams(params) }
  if (params.search?.trim()) out.search = params.search.trim()
  if (params.status) out.status = params.status
  if (params.sort) out.sort = params.sort
  if (params.direction) out.direction = params.direction
  if (params.page != null) out.page = params.page
  if (params.per_page != null) out.per_page = params.per_page
  return out
}

function cleanEmployeeListParams(params: EmployeeReportListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = { ...cleanDateParams(params) }
  if (params.search?.trim()) out.search = params.search.trim()
  if (params.role_id != null) out.role_id = params.role_id
  if (params.department_id != null) out.department_id = params.department_id
  if (params.status) out.status = params.status
  if (params.sort) out.sort = params.sort
  if (params.direction) out.direction = params.direction
  if (params.page != null) out.page = params.page
  if (params.per_page != null) out.per_page = params.per_page
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

export async function listProjectReports(
  params: ProjectReportListQuery = {},
): Promise<ProjectReportListResult> {
  const { data } = await http.get<ApiEnvelope<ProjectReport[]>>('/api/v1/reports/projects', {
    params: cleanProjectListParams(params),
  })

  return {
    reports: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getProjectReport(
  projectId: number,
  params: ReportDateQuery = {},
): Promise<ProjectReport> {
  const { data } = await http.get<ApiEnvelope<ProjectReport>>(
    `/api/v1/reports/projects/${projectId}`,
    { params: cleanDateParams(params) },
  )
  if (!data.data) throw new Error(data.message || 'Project report payload missing.')
  return data.data
}

export async function listEmployeeReports(
  params: EmployeeReportListQuery = {},
): Promise<EmployeeReportListResult> {
  const { data } = await http.get<ApiEnvelope<EmployeeReport[]>>('/api/v1/reports/employees', {
    params: cleanEmployeeListParams(params),
  })

  return {
    reports: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getEmployeeReport(
  userId: number,
  params: ReportDateQuery = {},
): Promise<EmployeeReport> {
  const { data } = await http.get<ApiEnvelope<EmployeeReport>>(
    `/api/v1/reports/employees/${userId}`,
    { params: cleanDateParams(params) },
  )
  if (!data.data) throw new Error(data.message || 'Employee report payload missing.')
  return data.data
}
