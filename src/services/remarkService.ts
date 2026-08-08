import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  Remark,
  RemarkListQuery,
  RemarkListResult,
  RemarkWritePayload,
} from '@/types/remark'

function cleanParams(params: RemarkListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

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

async function requestRemarks(
  url: string,
  params: RemarkListQuery = {},
  quietProgress = true,
): Promise<RemarkListResult> {
  const { data } = await http.get<ApiEnvelope<Remark[]>>(url, {
    params: cleanParams(params),
    quietProgress,
  })

  return {
    remarks: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function listProjectRemarks(
  projectId: number,
  params: RemarkListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<RemarkListResult> {
  return requestRemarks(
    `/api/v1/projects/${projectId}/remarks`,
    params,
    options.quietProgress ?? true,
  )
}

export async function listTaskRemarks(
  taskId: number,
  params: RemarkListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<RemarkListResult> {
  return requestRemarks(`/api/v1/tasks/${taskId}/remarks`, params, options.quietProgress ?? true)
}

export async function createProjectRemark(
  projectId: number,
  payload: RemarkWritePayload,
): Promise<Remark> {
  const { data } = await http.post<ApiEnvelope<Remark>>(`/api/v1/projects/${projectId}/remarks`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Remark payload missing.')
  }

  return data.data
}

export async function createTaskRemark(taskId: number, payload: RemarkWritePayload): Promise<Remark> {
  const { data } = await http.post<ApiEnvelope<Remark>>(`/api/v1/tasks/${taskId}/remarks`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Remark payload missing.')
  }

  return data.data
}

export async function updateRemark(id: number, payload: RemarkWritePayload): Promise<Remark> {
  const { data } = await http.put<ApiEnvelope<Remark>>(`/api/v1/remarks/${id}`, payload)

  if (!data.data) {
    throw new Error(data.message || 'Remark payload missing.')
  }

  return data.data
}

export async function deleteRemark(id: number): Promise<void> {
  await http.delete(`/api/v1/remarks/${id}`)
}
