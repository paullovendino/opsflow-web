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

export function entriesFromRecord(record: Record<string, number>): Array<{ label: string; value: number }> {
  return Object.entries(record).map(([key, value]) => ({
    label: humanizeKey(key),
    value,
  }))
}
