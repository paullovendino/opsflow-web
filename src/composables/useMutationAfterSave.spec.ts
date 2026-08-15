import { describe, expect, it, vi } from 'vitest'
import { createMutationAfterSaveController } from '@/composables/useMutationAfterSave'

describe('createMutationAfterSaveController', () => {
  it('runs mutate then afterSave and clears refresh pending on success', async () => {
    const controller = createMutationAfterSaveController()
    const mutate = vi.fn().mockResolvedValue({ id: 1, name: 'A' })
    const afterSave = vi.fn().mockResolvedValue(undefined)

    await controller.run({
      mode: 'create',
      mutate,
      afterSave,
      refreshFailureMessage: 'Unable to refresh.',
    })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledWith({ id: 1, name: 'A' })
    expect(controller.refreshPending.value).toBe(false)
    expect(controller.formError.value).toBeNull()
  })

  it('keeps refresh pending and does not re-mutate on afterSave retry', async () => {
    const controller = createMutationAfterSaveController()
    const mutate = vi.fn().mockResolvedValue({ id: 1 })
    const afterSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce(undefined)

    await controller.run({
      mode: 'create',
      mutate,
      afterSave,
      refreshFailureMessage: 'Unable to refresh.',
    })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(controller.refreshPending.value).toBe(true)
    expect(controller.formError.value).toBe('Unable to refresh.')

    await controller.run({
      mode: 'create',
      mutate,
      afterSave,
      refreshFailureMessage: 'Unable to refresh.',
    })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(afterSave).toHaveBeenCalledTimes(2)
    expect(controller.refreshPending.value).toBe(false)
  })

  it('does not call afterSave when mutate fails', async () => {
    const controller = createMutationAfterSaveController()
    const mutate = vi.fn().mockRejectedValue({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'Invalid',
          data: null,
          errors: { name: ['Required'] },
          meta: null,
        },
      },
    })
    const afterSave = vi.fn()

    await controller.run({
      mode: 'create',
      mutate,
      afterSave,
      refreshFailureMessage: 'Unable to refresh.',
    })

    expect(afterSave).not.toHaveBeenCalled()
    expect(controller.refreshPending.value).toBe(false)
    expect(controller.formError.value).toBe('Invalid')
    expect(controller.serverErrors.value).toEqual({ name: ['Required'] })
  })
})
