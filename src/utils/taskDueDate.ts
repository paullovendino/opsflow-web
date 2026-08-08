export function formatTaskDueDate(value: string, style: 'short' | 'medium' = 'medium'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) {
    return value
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...(style === 'medium' ? { year: 'numeric' } : {}),
  }).format(date)
}

export function taskDueDateLabel(
  dueDate: string | null | undefined,
  isOverdue: boolean,
  style: 'short' | 'medium' = 'short',
): string {
  if (!dueDate) {
    return '—'
  }

  const formatted = formatTaskDueDate(dueDate, style)
  if (isOverdue) {
    return `Overdue · ${formatted}`
  }

  return style === 'short' ? `Due ${formatted}` : formatted
}
