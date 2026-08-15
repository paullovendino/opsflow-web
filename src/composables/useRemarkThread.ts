import { computed, reactive, ref, toValue, type MaybeRefOrGetter } from 'vue'
import * as remarkService from '@/services/remarkService'
import type { Remark, RemarkSource, RemarkWritePayload } from '@/types/remark'
import type { PaginationMeta } from '@/types/api'
import { toApiClientError } from '@/utils/errors'

export function useRemarkThread(
  source: MaybeRefOrGetter<RemarkSource | null>,
  options: { quiet?: boolean; perPage?: number } = {},
) {
  const remarks = ref<Remark[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const isSaving = ref(false)
  const isDeleting = ref(false)

  const filters = reactive({
    page: 1,
    per_page: options.perPage ?? 15,
    direction: 'asc' as 'asc' | 'desc',
  })

  const isEmpty = computed(() => !isLoading.value && !errorMessage.value && remarks.value.length === 0)

  function resolvedSource(): RemarkSource | null {
    return toValue(source)
  }

  async function load(): Promise<void> {
    const current = resolvedSource()
    if (!current || !current.id) {
      remarks.value = []
      meta.value = null
      errorMessage.value = null
      isLoading.value = false
      return
    }

    isLoading.value = true
    errorMessage.value = null

    const quiet = options.quiet ?? true

    try {
      const result =
        current.type === 'project'
          ? await remarkService.listProjectRemarks(
              current.id,
              {
                page: filters.page,
                per_page: filters.per_page,
                direction: filters.direction,
              },
              { quietProgress: quiet },
            )
          : await remarkService.listTaskRemarks(
              current.id,
              {
                page: filters.page,
                per_page: filters.per_page,
                direction: filters.direction,
              },
              { quietProgress: quiet },
            )

      remarks.value = result.remarks
      meta.value = result.meta
      errorMessage.value = null
    } catch (error) {
      const apiError = toApiClientError(error)
      errorMessage.value = apiError.message || 'Unable to load remarks.'
      if (remarks.value.length === 0) {
        meta.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function retry(): Promise<void> {
    await load()
  }

  async function setPage(page: number): Promise<void> {
    filters.page = page
    await load()
  }

  async function create(payload: RemarkWritePayload): Promise<Remark> {
    const current = resolvedSource()
    if (!current) {
      throw new Error('Remark source is missing.')
    }

    isSaving.value = true
    try {
      const remark =
        current.type === 'project'
          ? await remarkService.createProjectRemark(current.id, payload)
          : await remarkService.createTaskRemark(current.id, payload)

      const onLastPage = !meta.value || filters.page === meta.value.last_page
      const perPage = filters.per_page

      if (filters.direction === 'asc' && onLastPage) {
        remarks.value = [...remarks.value, remark]
        if (remarks.value.length > perPage) {
          filters.page += 1
          remarks.value = [remark]
        }
        if (meta.value) {
          const total = meta.value.total + 1
          meta.value = {
            ...meta.value,
            total,
            last_page: Math.max(1, Math.ceil(total / perPage)),
            current_page: filters.page,
            from: filters.page === 1 ? 1 : (filters.page - 1) * perPage + 1,
            to: Math.min(total, filters.page * perPage),
          }
        } else {
          meta.value = {
            current_page: 1,
            last_page: 1,
            per_page: perPage,
            total: 1,
            from: 1,
            to: 1,
          }
        }
        return remark
      }

      if (filters.direction === 'desc' && filters.page === 1) {
        remarks.value = [remark, ...remarks.value].slice(0, perPage)
        if (meta.value) {
          const total = meta.value.total + 1
          meta.value = {
            ...meta.value,
            total,
            last_page: Math.max(1, Math.ceil(total / perPage)),
            to: Math.min(perPage, total),
            from: total === 0 ? null : 1,
          }
        } else {
          meta.value = {
            current_page: 1,
            last_page: 1,
            per_page: perPage,
            total: 1,
            from: 1,
            to: 1,
          }
        }
        return remark
      }

      if (meta.value && filters.direction === 'asc') {
        filters.page = Math.max(1, Math.ceil((meta.value.total + 1) / perPage))
      } else {
        filters.page = 1
      }
      await load()
      return remark
    } finally {
      isSaving.value = false
    }
  }

  async function update(id: number, payload: RemarkWritePayload): Promise<Remark> {
    isSaving.value = true
    try {
      const remark = await remarkService.updateRemark(id, payload)
      const index = remarks.value.findIndex((item) => item.id === id)
      if (index >= 0) {
        remarks.value[index] = remark
      } else {
        await load()
      }
      return remark
    } finally {
      isSaving.value = false
    }
  }

  async function remove(id: number): Promise<void> {
    isDeleting.value = true
    try {
      await remarkService.deleteRemark(id)
      remarks.value = remarks.value.filter((item) => item.id !== id)
      if (remarks.value.length === 0 && filters.page > 1) {
        filters.page -= 1
        await load()
      } else if (meta.value) {
        meta.value = {
          ...meta.value,
          total: Math.max(0, meta.value.total - 1),
        }
      }
    } finally {
      isDeleting.value = false
    }
  }

  return {
    remarks,
    meta,
    filters,
    isLoading,
    errorMessage,
    isEmpty,
    isSaving,
    isDeleting,
    load,
    retry,
    setPage,
    create,
    update,
    remove,
  }
}
