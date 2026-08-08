import { describe, expect, it } from 'vitest'
import { firstFieldError, isApiEnvelope, toApiClientError } from '@/utils/errors'

describe('errors', () => {
  it('detects API envelopes', () => {
    expect(isApiEnvelope({ success: true, message: 'ok', data: {}, errors: null, meta: null })).toBe(true)
    expect(isApiEnvelope({ message: 'nope' })).toBe(false)
  })

  it('maps envelope Axios errors', () => {
    const error = toApiClientError({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'The given data was invalid.',
          data: null,
          errors: { email: ['Taken.'] },
          meta: null,
        },
      },
    })

    expect(error.status).toBe(422)
    expect(error.message).toBe('The given data was invalid.')
    expect(error.errors).toEqual({ email: ['Taken.'] })
    expect(firstFieldError(error.errors)).toBe('Taken.')
  })
})
