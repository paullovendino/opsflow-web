import { computed, onMounted, ref } from 'vue'
import * as lookupService from '@/services/lookupService'
import type { LookupItem, RoleLookupItem } from '@/types/lookup'
import { toApiClientError } from '@/utils/errors'
import { humanizeKey } from '@/utils/format'

export function useLookups() {
  const roles = ref<RoleLookupItem[]>([])
  const departments = ref<LookupItem[]>([])
  const jobTitles = ref<LookupItem[]>([])
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const roleOptions = computed(() =>
    roles.value.map((role) => ({
      value: role.id,
      label: humanizeKey(role.name),
    })),
  )

  const departmentOptions = computed(() =>
    departments.value.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  )

  const jobTitleOptions = computed(() =>
    jobTitles.value.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  )

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    try {
      const [roleList, departmentList, jobTitleList] = await Promise.all([
        lookupService.listRoles(),
        lookupService.listDepartments(),
        lookupService.listJobTitles(),
      ])

      roles.value = roleList
      departments.value = departmentList
      jobTitles.value = jobTitleList
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load lookup options.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    roles,
    departments,
    jobTitles,
    roleOptions,
    departmentOptions,
    jobTitleOptions,
    isLoading,
    errorMessage,
    load,
  }
}
