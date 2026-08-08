import http from '@/services/http'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type {
  Task,
  TaskAssignmentPayload,
  TaskCreatePayload,
  TaskListQuery,
  TaskListResult,
  TaskStatusPayload,
  TaskUpdatePayload,
} from '@/types/task'

function cleanParams(params: TaskListQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}

  if (params.search?.trim()) out.search = params.search.trim()
  if (params.status) out.status = params.status
  if (params.priority) out.priority = params.priority
  if (params.overdue) out.overdue = 1
  if (params.due_after?.trim()) out.due_after = params.due_after.trim()
  if (params.due_before?.trim()) out.due_before = params.due_before.trim()
  if (params.project_id != null) out.project_id = params.project_id
  if (params.assigned_to != null) out.assigned_to = params.assigned_to
  if (params.created_by != null) out.created_by = params.created_by
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

export async function listTasks(params: TaskListQuery = {}): Promise<TaskListResult> {
  const { data } = await http.get<ApiEnvelope<Task[]>>('/api/v1/tasks', {
    params: cleanParams(params),
  })

  return {
    tasks: data.data ?? [],
    meta: asPaginationMeta(data.meta),
    message: data.message,
  }
}

export async function getTask(id: number, options: { quietProgress?: boolean } = {}): Promise<Task> {
  const { data } = await http.get<ApiEnvelope<Task>>(`/api/v1/tasks/${id}`, {
    quietProgress: options.quietProgress,
  })
  if (!data.data) throw new Error(data.message || 'Task payload missing.')
  return data.data
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  const { data } = await http.post<ApiEnvelope<Task>>('/api/v1/tasks', payload)
  if (!data.data) throw new Error(data.message || 'Task create payload missing.')
  return data.data
}

export async function updateTask(id: number, payload: TaskUpdatePayload): Promise<Task> {
  const { data } = await http.put<ApiEnvelope<Task>>(`/api/v1/tasks/${id}`, payload)
  if (!data.data) throw new Error(data.message || 'Task update payload missing.')
  return data.data
}

export async function deleteTask(id: number): Promise<void> {
  await http.delete<ApiEnvelope<null>>(`/api/v1/tasks/${id}`)
}

export async function updateTaskAssignment(id: number, payload: TaskAssignmentPayload): Promise<Task> {
  const { data } = await http.patch<ApiEnvelope<Task>>(`/api/v1/tasks/${id}/assignment`, payload)
  if (!data.data) throw new Error(data.message || 'Task assignment payload missing.')
  return data.data
}

export async function updateTaskStatus(id: number, payload: TaskStatusPayload): Promise<Task> {
  const { data } = await http.patch<ApiEnvelope<Task>>(`/api/v1/tasks/${id}/status`, payload)
  if (!data.data) throw new Error(data.message || 'Task status payload missing.')
  return data.data
}
