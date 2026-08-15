import http from '@/services/http'
import type { ApiEnvelope } from '@/types/api'
import type { LookupItem, RoleLookupItem } from '@/types/lookup'

export async function listRoles(): Promise<RoleLookupItem[]> {
  const { data } = await http.get<ApiEnvelope<RoleLookupItem[]>>('/api/v1/lookups/roles')
  return data.data ?? []
}

export async function listDepartments(): Promise<LookupItem[]> {
  const { data } = await http.get<ApiEnvelope<LookupItem[]>>('/api/v1/lookups/departments')
  return data.data ?? []
}

export async function listJobTitles(options: {
  departmentId?: number | null
  includeId?: number | null
} = {}): Promise<LookupItem[]> {
  const params: Record<string, number> = {}

  if (options.departmentId != null) {
    params.department_id = options.departmentId
  }
  if (options.includeId != null) {
    params.include_id = options.includeId
  }

  const { data } = await http.get<ApiEnvelope<LookupItem[]>>('/api/v1/lookups/job-titles', {
    params,
  })
  return data.data ?? []
}

export async function listJobTitlesForDepartment(
  departmentId: number,
  includeId?: number | null,
): Promise<LookupItem[]> {
  const params: Record<string, number> = {}

  if (includeId != null) {
    params.include_id = includeId
  }

  const { data } = await http.get<ApiEnvelope<LookupItem[]>>(
    `/api/v1/lookups/departments/${departmentId}/job-titles`,
    { params },
  )
  return data.data ?? []
}
