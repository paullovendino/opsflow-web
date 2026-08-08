export function humanizeKey(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diffMs = date.getTime() - Date.now()
  const absSeconds = Math.round(Math.abs(diffMs) / 1000)

  if (absSeconds < 45) {
    return 'just now'
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (absSeconds < 3600) {
    return formatter.format(Math.round(diffMs / 60_000), 'minute')
  }
  if (absSeconds < 86_400) {
    return formatter.format(Math.round(diffMs / 3_600_000), 'hour')
  }
  if (absSeconds < 2_592_000) {
    return formatter.format(Math.round(diffMs / 86_400_000), 'day')
  }

  return formatDate(value)
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

export function entriesFromRecord(record: Record<string, number>): Array<{ label: string; value: number }> {
  return Object.entries(record).map(([key, value]) => ({
    label: humanizeKey(key),
    value,
  }))
}
