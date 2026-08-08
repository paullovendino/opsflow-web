import type { ActivityLog } from '@/types/activity'
import { humanizeKey } from '@/utils/format'

export function activitySubjectLabel(log: ActivityLog): string {
  const subject = log.subject

  if (subject?.name) {
    return subject.name
  }
  if (subject?.title) {
    return subject.title
  }
  if (subject?.full_name) {
    return subject.full_name
  }

  return `${humanizeKey(String(log.subject_type))} #${log.subject_id}`
}

export function activityHeadline(log: ActivityLog): string {
  const actor = log.actor?.full_name?.trim() || 'Someone'
  const description = log.description.replace(/\.$/, '')
  const rest = description.length > 0 ? description.charAt(0).toLowerCase() + description.slice(1) : 'recorded activity'

  return `${actor} ${rest}`
}

export function humanizeAction(action: string): string {
  const [entity, ...rest] = action.split('.')
  const verb = rest.map((part) => humanizeKey(part).toLowerCase()).join(' ')

  if (!entity) {
    return action
  }

  return verb ? `${humanizeKey(entity)} ${verb}` : humanizeKey(entity)
}

export function activityChangeSummary(log: ActivityLog): string | null {
  const properties = log.properties ?? {}
  const before = isRecord(properties.before) ? properties.before : null
  const after = isRecord(properties.after) ? properties.after : null

  if (!before || !after) {
    if (typeof properties.member_full_name === 'string' && properties.member_full_name) {
      return `Member: ${properties.member_full_name}`
    }
    return null
  }

  const keys = ['status', 'priority', 'due_date', 'assigned_to', 'title', 'name']
  for (const key of keys) {
    if (!(key in before) && !(key in after)) {
      continue
    }
    const from = formatChangeValue(before[key])
    const to = formatChangeValue(after[key])
    if (from === to) {
      continue
    }
    return `${humanizeKey(key)}: ${from} → ${to}`
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'none'
  }
  if (typeof value === 'string') {
    return humanizeKey(value)
  }
  return String(value)
}
