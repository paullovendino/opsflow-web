import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { search as searchApi } from '@/services/searchService'
import type { SearchResults } from '@/types/search'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH } from '@/types/search'
import { toApiClientError } from '@/utils/errors'

const emptyResults = (): SearchResults => ({
  users: [],
  projects: [],
  tasks: [],
})

export function useGlobalSearch(options: {
  canSearchUsers?: () => boolean
  debounceMs?: number
  perType?: number
} = {}) {
  const query = ref('')
  const results = ref<SearchResults>(emptyResults())
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const hasSearched = ref(false)
  const isOpen = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestId = 0
  let abortController: AbortController | null = null

  const trimmedQuery = computed(() => query.value.trim())
  const meetsMinLength = computed(() => trimmedQuery.value.length >= SEARCH_MIN_QUERY_LENGTH)
  const isEmpty = computed(() => {
    const data = results.value
    return data.users.length === 0 && data.projects.length === 0 && data.tasks.length === 0
  })

  function clearTimer(): void {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  function abortInFlight(): void {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  function resetResults(): void {
    results.value = emptyResults()
    hasSearched.value = false
    errorMessage.value = null
    isLoading.value = false
  }

  function clear(): void {
    clearTimer()
    abortInFlight()
    requestId += 1
    query.value = ''
    resetResults()
  }

  function close(): void {
    isOpen.value = false
  }

  function open(): void {
    isOpen.value = true
  }

  async function runSearch(term: string): Promise<void> {
    const currentId = ++requestId
    abortInFlight()
    abortController = new AbortController()

    isLoading.value = true
    errorMessage.value = null

    try {
      const types = options.canSearchUsers?.() === false ? 'projects,tasks' : undefined
      const payload = await searchApi(
        {
          q: term,
          types,
          per_type: options.perType,
        },
        {
          quietProgress: true,
          signal: abortController.signal,
        },
      )

      if (currentId !== requestId) {
        return
      }

      results.value = payload.results
      hasSearched.value = true
    } catch (error) {
      if (currentId !== requestId) {
        return
      }

      const apiError = toApiClientError(error)
      if (apiError.message.toLowerCase().includes('canceled') || apiError.message.toLowerCase().includes('abort')) {
        return
      }

      errorMessage.value = apiError.message || 'Unable to search.'
      hasSearched.value = true
    } finally {
      if (currentId === requestId) {
        isLoading.value = false
      }
    }
  }

  function scheduleSearch(): void {
    clearTimer()

    if (!meetsMinLength.value) {
      abortInFlight()
      requestId += 1
      resetResults()
      return
    }

    debounceTimer = setTimeout(() => {
      void runSearch(trimmedQuery.value)
    }, options.debounceMs ?? SEARCH_DEBOUNCE_MS)
  }

  watch(query, () => {
    if (isOpen.value || trimmedQuery.value.length > 0) {
      isOpen.value = true
    }
    scheduleSearch()
  })

  onBeforeUnmount(() => {
    clearTimer()
    abortInFlight()
  })

  return {
    query,
    results,
    isLoading,
    errorMessage,
    hasSearched,
    isOpen,
    isEmpty,
    trimmedQuery,
    meetsMinLength,
    open,
    close,
    clear,
    scheduleSearch,
    runSearch,
  }
}
