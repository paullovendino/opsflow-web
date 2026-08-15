import { computed, onMounted, ref } from 'vue'
import * as lookupService from '@/services/lookupService'
import type { LookupItem, RoleLookupItem } from '@/types/lookup'
import { toApiClientError } from '@/utils/errors'
import { humanizeKey } from '@/utils/format'

/**
 * Module-level shared lookup cache for the SPA session.
 * Survives component remounts; cleared on full page reload only.
 * Job titles here are the global active list (for filters). Forms should
 * prefer department-scoped fetches via lookupService.listJobTitlesForDepartment.
 */
const roles = ref<RoleLookupItem[]>([])
const departments = ref<LookupItem[]>([])
const jobTitles = ref<LookupItem[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const hasLoaded = ref(false)

/** Single shared in-flight promise so concurrent callers share one fetch. */
let inFlight: Promise<void> | null = null

async function fetchLookups(): Promise<void> {
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
    hasLoaded.value = true
  } catch (error) {
    const apiError = toApiClientError(error)
    errorMessage.value = apiError.message || 'Unable to load lookup options.'
  } finally {
    isLoading.value = false
    inFlight = null
  }
}

/**
 * Load lookups once per session. Concurrent callers share the same request.
 * Pass `{ force: true }` only when intentionally refreshing.
 */
export async function ensureLookups(options: { force?: boolean } = {}): Promise<void> {
  if (!options.force && hasLoaded.value) {
    return
  }

  if (inFlight) {
    await inFlight
    return
  }

  inFlight = fetchLookups()
  await inFlight
}

/** Reset SPA-session lookup cache (tests / full reload equivalent). */
export function resetLookupsCache(): void {
  roles.value = []
  departments.value = []
  jobTitles.value = []
  isLoading.value = false
  errorMessage.value = null
  hasLoaded.value = false
  inFlight = null
}

export function useLookups() {
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

  /** Filter global job titles by department when a department filter is set. */
  function jobTitleOptionsForDepartment(departmentId: number | null | undefined) {
    const source =
      departmentId == null
        ? jobTitles.value
        : jobTitles.value.filter((item) => item.department_id === departmentId)

    return source.map((item) => ({
      value: item.id,
      label: item.name,
    }))
  }

  onMounted(() => {
    void ensureLookups()
  })

  return {
    roles,
    departments,
    jobTitles,
    roleOptions,
    departmentOptions,
    jobTitleOptions,
    jobTitleOptionsForDepartment,
    isLoading,
    errorMessage,
    hasLoaded,
    load: () => ensureLookups({ force: true }),
    ensureLookups,
  }
}
