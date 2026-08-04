import { computed, ref } from 'vue'
import * as dashboardService from '@/services/dashboardService'
import type { DashboardSummary } from '@/types/dashboard'
import { toApiClientError } from '@/utils/errors'

export function useDashboard() {
  const summary = ref<DashboardSummary | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const hasLoaded = ref(false)

  const isEmptyRecent = computed(() => (summary.value?.recent.length ?? 0) === 0)

  async function load(recentLimit = 10): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    try {
      summary.value = await dashboardService.getSummary({ recent_limit: recentLimit })
      hasLoaded.value = true
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load the dashboard.'
      summary.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function retry(): Promise<void> {
    await load()
  }

  return {
    summary,
    isLoading,
    errorMessage,
    hasLoaded,
    isEmptyRecent,
    load,
    retry,
  }
}
