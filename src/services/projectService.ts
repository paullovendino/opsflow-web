import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  Project,
  ProjectListQuery,
  ProjectListResult,
  ProjectMember,
  ProjectMemberPayload,
  ProjectStatusPayload,
  ProjectWritePayload,
} from '@/types/project'

function cleanParams(params: ProjectListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.search?.trim()) {
    out.search = params.search.trim()
  }
  if (params.status) {
    out.status = params.status
  }
  if (params.created_by != null) {
    out.created_by = params.created_by
  }
  if (params.sort) {
    out.sort = params.sort
  }
  if (params.direction) {
    out.direction = params.direction
  }
  if (params.page != null) {
    out.page = params.page
  }
  if (params.per_page != null) {
    out.per_page = params.per_page
  }

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

export async function listProjects(params: ProjectListQuery = {}): Promise<ProjectListResult> {
  const { data } = await http.get<ApiEnvelope<Project[]>>('/api/v1/projects', {
    params: cleanParams(params),
  })

  return {
    projects: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getProject(id: number): Promise<Project> {
  const { data } = await http.get<ApiEnvelope<Project>>(`/api/v1/projects/${id}`)

  if (!data.data) {
    throw new Error(data.message || 'Project payload missing.')
  }

  return data.data
}

export async function createProject(payload: ProjectWritePayload): Promise<Project> {
  const { data } = await http.post<ApiEnvelope<Project>>('/api/v1/projects', payload)

  if (!data.data) {
    throw new Error(data.message || 'Project create payload missing.')
  }

  return data.data
}

export async function updateProject(id: number, payload: ProjectWritePayload): Promise<Project> {
  const { data } = await http.put<ApiEnvelope<Project>>(`/api/v1/projects/${id}`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Project update payload missing.')
  }

  return data.data
}

export async function deleteProject(id: number): Promise<void> {
  await http.delete<ApiEnvelope<null>>(`/api/v1/projects/${id}`)
}

export async function updateProjectStatus(id: number, payload: ProjectStatusPayload): Promise<Project> {
  const { data } = await http.patch<ApiEnvelope<Project>>(`/api/v1/projects/${id}/status`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Project status payload missing.')
  }

  return data.data
}

export async function listProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const { data } = await http.get<ApiEnvelope<ProjectMember[]>>(`/api/v1/projects/${projectId}/members`)
  return data.data ?? []
}

export async function addProjectMember(
  projectId: number,
  payload: ProjectMemberPayload,
): Promise<ProjectMember> {
  const { data } = await http.post<ApiEnvelope<ProjectMember>>(
    `/api/v1/projects/${projectId}/members`,
    payload,
  )

  if (!data.data) {
    throw new Error(data.message || 'Project member payload missing.')
  }

  return data.data
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  await http.delete<ApiEnvelope<null>>(`/api/v1/projects/${projectId}/members/${userId}`)
}
