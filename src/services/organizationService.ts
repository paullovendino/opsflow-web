import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  Department,
  DepartmentListQuery,
  DepartmentWritePayload,
  JobTitle,
  JobTitleListQuery,
  JobTitleWritePayload,
  OrgListResult,
  OrgStatusPayload,
} from '@/types/organization'

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

function cleanDepartmentParams(params: DepartmentListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.q?.trim()) {
    out.q = params.q.trim()
  }
  if (params.status) {
    out.status = params.status
  }
  if (params.page != null) {
    out.page = params.page
  }
  if (params.per_page != null) {
    out.per_page = params.per_page
  }

  return out
}

function cleanJobTitleParams(params: JobTitleListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.q?.trim()) {
    out.q = params.q.trim()
  }
  if (params.status) {
    out.status = params.status
  }
  if (params.department_id != null) {
    out.department_id = params.department_id
  }
  if (params.page != null) {
    out.page = params.page
  }
  if (params.per_page != null) {
    out.per_page = params.per_page
  }

  return out
}

export async function listDepartments(
  params: DepartmentListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<OrgListResult<Department>> {
  const { data } = await http.get<ApiEnvelope<Department[]>>('/api/v1/departments', {
    params: cleanDepartmentParams(params),
    quietProgress: options.quietProgress,
  })

  return {
    items: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getDepartment(
  id: number,
  options: { quietProgress?: boolean } = {},
): Promise<Department> {
  const { data } = await http.get<ApiEnvelope<Department>>(`/api/v1/departments/${id}`, {
    quietProgress: options.quietProgress,
  })

  if (!data.data) {
    throw new Error(data.message || 'Department payload missing.')
  }

  return data.data
}

export async function createDepartment(payload: DepartmentWritePayload): Promise<Department> {
  const { data } = await http.post<ApiEnvelope<Department>>('/api/v1/departments', payload)

  if (!data.data) {
    throw new Error(data.message || 'Department create payload missing.')
  }

  return data.data
}

export async function updateDepartment(
  id: number,
  payload: DepartmentWritePayload,
): Promise<Department> {
  const { data } = await http.put<ApiEnvelope<Department>>(`/api/v1/departments/${id}`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Department update payload missing.')
  }

  return data.data
}

export async function updateDepartmentStatus(
  id: number,
  payload: OrgStatusPayload,
): Promise<Department> {
  const { data } = await http.patch<ApiEnvelope<Department>>(
    `/api/v1/departments/${id}/status`,
    payload,
  )

  if (!data.data) {
    throw new Error(data.message || 'Department status payload missing.')
  }

  return data.data
}

export async function deleteDepartment(id: number): Promise<void> {
  await http.delete<ApiEnvelope<null>>(`/api/v1/departments/${id}`)
}

export async function listJobTitles(
  params: JobTitleListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<OrgListResult<JobTitle>> {
  const { data } = await http.get<ApiEnvelope<JobTitle[]>>('/api/v1/job-titles', {
    params: cleanJobTitleParams(params),
    quietProgress: options.quietProgress,
  })

  return {
    items: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getJobTitle(
  id: number,
  options: { quietProgress?: boolean } = {},
): Promise<JobTitle> {
  const { data } = await http.get<ApiEnvelope<JobTitle>>(`/api/v1/job-titles/${id}`, {
    quietProgress: options.quietProgress,
  })

  if (!data.data) {
    throw new Error(data.message || 'Job title payload missing.')
  }

  return data.data
}

export async function createJobTitle(payload: JobTitleWritePayload): Promise<JobTitle> {
  const { data } = await http.post<ApiEnvelope<JobTitle>>('/api/v1/job-titles', payload)

  if (!data.data) {
    throw new Error(data.message || 'Job title create payload missing.')
  }

  return data.data
}

export async function updateJobTitle(id: number, payload: JobTitleWritePayload): Promise<JobTitle> {
  const { data } = await http.put<ApiEnvelope<JobTitle>>(`/api/v1/job-titles/${id}`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Job title update payload missing.')
  }

  return data.data
}

export async function updateJobTitleStatus(
  id: number,
  payload: OrgStatusPayload,
): Promise<JobTitle> {
  const { data } = await http.patch<ApiEnvelope<JobTitle>>(
    `/api/v1/job-titles/${id}/status`,
    payload,
  )

  if (!data.data) {
    throw new Error(data.message || 'Job title status payload missing.')
  }

  return data.data
}

export async function deleteJobTitle(id: number): Promise<void> {
  await http.delete<ApiEnvelope<null>>(`/api/v1/job-titles/${id}`)
}
