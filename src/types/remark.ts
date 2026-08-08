export interface RemarkAuthor {
  id: number
  full_name: string
  email: string
}

export interface RemarkMentionUser {
  id: number
  full_name: string
  email: string
}

export interface Remark {
  id: number
  body: string
  author: RemarkAuthor | null
  mentions: RemarkMentionUser[]
  can_edit: boolean
  can_delete: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type RemarkSource =
  | { type: 'project'; id: number }
  | { type: 'task'; id: number }

export interface RemarkListQuery {
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface RemarkListResult {
  remarks: Remark[]
  meta: import('@/types/api').PaginationMeta
  message: string
}

export interface RemarkWritePayload {
  body: string
  mentioned_user_ids?: number[]
}

export interface MentionCandidate {
  id: number
  full_name: string
  email: string
}
