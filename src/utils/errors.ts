import type { AxiosError } from 'axios'
import type { ApiEnvelope } from '@/types/api'

export interface ApiClientError {
  status: number | null
  message: string
  errors: Record<string, string[]> | null
  raw: unknown
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'message' in value &&
    'data' in value
  )
}

export function toApiClientError(error: unknown): ApiClientError {
  const axiosError = error as AxiosError<ApiEnvelope>
  const response = axiosError.response
  const data = response?.data

  if (data && isApiEnvelope(data)) {
    return {
      status: response?.status ?? null,
      message: data.message || 'Request failed.',
      errors: data.errors,
      raw: error,
    }
  }

  if (axiosError.message) {
    return {
      status: response?.status ?? null,
      message: axiosError.message,
      errors: null,
      raw: error,
    }
  }

  return {
    status: null,
    message: 'Unexpected error.',
    errors: null,
    raw: error,
  }
}

export function firstFieldError(errors: Record<string, string[]> | null | undefined): string | null {
  if (!errors) {
    return null
  }

  const firstKey = Object.keys(errors)[0]
  if (!firstKey) {
    return null
  }

  return errors[firstKey]?.[0] ?? null
}
