import http from '@/services/http'
import type { ApiEnvelope } from '@/types/api'
import type {
  SearchMeta,
  SearchQueryParams,
  SearchResult,
  SearchResults,
} from '@/types/search'
import { SEARCH_DEFAULT_PER_TYPE } from '@/types/search'

function cleanParams(params: SearchQueryParams): Record<string, string | number> {
  const out: Record<string, string | number> = {
    q: params.q,
  }

  if (params.types) {
    out.types = params.types
  }

  if (params.per_type != null) {
    out.per_type = params.per_type
  }

  return out
}

function asSearchMeta(meta: Record<string, unknown> | null | undefined): SearchMeta {
  return {
    q: String(meta?.q ?? ''),
    per_type: Number(meta?.per_type ?? SEARCH_DEFAULT_PER_TYPE),
    users_returned: Number(meta?.users_returned ?? 0),
    projects_returned: Number(meta?.projects_returned ?? 0),
    tasks_returned: Number(meta?.tasks_returned ?? 0),
  }
}

function asSearchResults(data: SearchResults | null | undefined): SearchResults {
  return {
    users: data?.users ?? [],
    projects: data?.projects ?? [],
    tasks: data?.tasks ?? [],
  }
}

export async function search(
  params: SearchQueryParams,
  options: { quietProgress?: boolean; signal?: AbortSignal } = {},
): Promise<SearchResult> {
  const { data } = await http.get<ApiEnvelope<SearchResults>>('/api/v1/search', {
    params: cleanParams(params),
    quietProgress: options.quietProgress ?? true,
    signal: options.signal,
  })

  return {
    results: asSearchResults(data.data),
    meta: asSearchMeta(data.meta),
    message: data.message,
  }
}
