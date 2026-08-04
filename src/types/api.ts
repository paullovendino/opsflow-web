export interface ApiEnvelope<T = unknown> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
  meta: Record<string, unknown> | null
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}
