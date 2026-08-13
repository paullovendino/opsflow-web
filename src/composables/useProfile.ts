import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import * as profileService from '@/services/profileService'
import type { ProfileSummary, ProfileUpdatePayload, ProfileUser } from '@/types/profile'
import { toApiClientError } from '@/utils/errors'

export function useProfile() {
  const auth = useAuthStore()
  const summary = ref<ProfileSummary | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const serverErrors = ref<Record<string, string[]> | null>(null)

  const user = computed(() => summary.value?.user ?? null)

  function syncAuthUser(next: ProfileUser): void {
    if (auth.user) {
      auth.setUser({
        ...auth.user,
        ...next,
        role: next.role ?? auth.user.role,
        department: next.department ?? auth.user.department,
        job_title: next.job_title ?? auth.user.job_title,
      })
    } else {
      auth.setUser(next)
    }
  }

  function applyProfileUser(next: ProfileUser): void {
    if (summary.value) {
      summary.value = {
        ...summary.value,
        user: next,
      }
    }
    syncAuthUser(next)
  }

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    try {
      summary.value = await profileService.getProfile()
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load profile.'
      if (!summary.value) {
        summary.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function save(payload: ProfileUpdatePayload): Promise<boolean> {
    isSaving.value = true
    errorMessage.value = null
    serverErrors.value = null

    try {
      summary.value = await profileService.updateProfile(payload)
      syncAuthUser(summary.value.user)
      return true
    } catch (error) {
      const apiError = toApiClientError(error)
      if (apiError.status === 422) {
        serverErrors.value = apiError.errors
        errorMessage.value = apiError.message || 'Please correct the highlighted fields.'
        return false
      }
      errorMessage.value = apiError.message || 'Unable to update profile.'
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    summary,
    user,
    isLoading,
    isSaving,
    errorMessage,
    serverErrors,
    load,
    save,
    applyProfileUser,
  }
}
