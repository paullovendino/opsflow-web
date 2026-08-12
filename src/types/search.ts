export type SearchResultType = 'user' | 'project' | 'task'

export interface SearchUserHit {
  id: number
  full_name: string
  email: string
  status: string
  type: 'user'
}

export interface SearchProjectHit {
  id: number
  name: string
  status: string
  progress: number | null
  type: 'project'
}

export interface SearchTaskHit {
  id: number
  title: string
  status: string
  priority: string
  due_date: string | null
  is_overdue: boolean
  project: { id: number; name: string } | null
  type: 'task'
}

export interface SearchResults {
  users: SearchUserHit[]
  projects: SearchProjectHit[]
  tasks: SearchTaskHit[]
}

export interface SearchMeta {
  q: string
  per_type: number
  users_returned: number
  projects_returned: number
  tasks_returned: number
}

export interface SearchQueryParams {
  q: string
  types?: string
  per_type?: number
}

export interface SearchResult {
  results: SearchResults
  meta: SearchMeta
  message: string
}

export const SEARCH_MIN_QUERY_LENGTH = 2
export const SEARCH_DEBOUNCE_MS = 350
export const SEARCH_DEFAULT_PER_TYPE = 5
