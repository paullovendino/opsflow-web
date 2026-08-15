import { ref, type Ref } from 'vue'
import { toApiClientError, type ApiClientError } from '@/utils/errors'

export interface MutationAfterSaveState {
  submitting: Ref<boolean>
  formError: Ref<string | null>
  serverErrors: Ref<Record<string, string[]> | null>
  refreshPending: Ref<boolean>
}

export interface RunMutationAfterSaveOptions<T> {
  mode: 'create' | 'edit'
  mutate: () => Promise<T>
  afterSave: (resource: T) => Promise<void>
  refreshFailureMessage: string
  onForbiddenToast?: (message: string) => void
  fallbackErrorMessage?: string
}

/**
 * Mutation → afterSave (reconcile/refresh) → complete.
 * On afterSave failure, keeps refreshPending so retry does not re-run mutate.
 */
export function createMutationAfterSaveController(): MutationAfterSaveState & {
  reset: () => void
  run: <T>(options: RunMutationAfterSaveOptions<T>) => Promise<void>
} {
  const submitting = ref(false)
  const formError = ref<string | null>(null)
  const serverErrors = ref<Record<string, string[]> | null>(null)
  const refreshPending = ref(false)
  let lastSaved: unknown = null

  function reset(): void {
    formError.value = null
    serverErrors.value = null
    submitting.value = false
    refreshPending.value = false
    lastSaved = null
  }

  async function run<T>(options: RunMutationAfterSaveOptions<T>): Promise<void> {
    submitting.value = true
    formError.value = null
    serverErrors.value = null

    try {
      if (!refreshPending.value) {
        lastSaved = await options.mutate()
        refreshPending.value = true
      }

      await options.afterSave(lastSaved as T)
      refreshPending.value = false
      lastSaved = null
    } catch (error) {
      if (refreshPending.value) {
        formError.value = options.refreshFailureMessage
        options.onForbiddenToast?.(formError.value)
        return
      }

      const apiError: ApiClientError = toApiClientError(error)
      if (apiError.status === 422) {
        serverErrors.value = apiError.errors
        formError.value = apiError.message
        return
      }
      if (apiError.status === 403) {
        formError.value = apiError.message || 'You are not allowed to perform this action.'
        options.onForbiddenToast?.(formError.value)
        return
      }
      formError.value = apiError.message || options.fallbackErrorMessage || 'Unable to save.'
    } finally {
      submitting.value = false
    }
  }

  return {
    submitting,
    formError,
    serverErrors,
    refreshPending,
    reset,
    run,
  }
}
