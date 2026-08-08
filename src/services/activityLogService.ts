import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type { ActivityListQuery, ActivityListResult, ActivityLog } from '@/types/activity'

function cleanParams(params: ActivityListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.actor_id != null) {
    out.actor_id = params.actor_id
  }
  if (params.action) {
    out.action = params.action
  }
  if (params.subject_type) {
    out.subject_type = params.subject_type
  }
  if (params.subject_id != null) {
    out.subject_id = params.subject_id
  }
  if (params.from) {
    out.from = params.from
  }
  if (params.to) {
    out.to = params.to
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

async function requestLogs(
  url: string,
  params: ActivityListQuery = {},
  quietProgress = false,
): Promise<ActivityListResult> {
  const { data } = await http.get<ApiEnvelope<ActivityLog[]>>(url, {
    params: cleanParams(params),
    quietProgress,
  })

  return {
    logs: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function listActivityLogs(
  params: ActivityListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<ActivityListResult> {
  return requestLogs('/api/v1/activity-logs', params, options.quietProgress)
}

export async function listProjectActivityLogs(
  projectId: number,
  params: ActivityListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<ActivityListResult> {
  return requestLogs(`/api/v1/projects/${projectId}/activity-logs`, params, options.quietProgress ?? true)
}

export async function listTaskActivityLogs(
  taskId: number,
  params: ActivityListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<ActivityListResult> {
  return requestLogs(`/api/v1/tasks/${taskId}/activity-logs`, params, options.quietProgress ?? true)
}

export async function listUserActivityLogs(
  userId: number,
  params: ActivityListQuery = {},
  options: { quietProgress?: boolean } = {},
): Promise<ActivityListResult> {
  return requestLogs(`/api/v1/users/${userId}/activity-logs`, params, options.quietProgress ?? true)
}
