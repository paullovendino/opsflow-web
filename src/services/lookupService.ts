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

export async function listJobTitles(): Promise<LookupItem[]> {
  const { data } = await http.get<ApiEnvelope<LookupItem[]>>('/api/v1/lookups/job-titles')
  return data.data ?? []
}
