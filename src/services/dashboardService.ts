import http from '@/services/http'
import type { ApiEnvelope } from '@/types/api'
import type { DashboardQuery, DashboardSummary } from '@/types/dashboard'

export async function getSummary(params: DashboardQuery = {}): Promise<DashboardSummary> {
  const { data } = await http.get<ApiEnvelope<DashboardSummary>>('/api/v1/dashboard', {
    params: {
      recent_limit: params.recent_limit,
      activity_limit: params.activity_limit,
    },
  })

  if (!data.data) {
    throw new Error(data.message || 'Dashboard payload missing.')
  }

  return data.data
}
