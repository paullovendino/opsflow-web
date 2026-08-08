import { describe, expect, it } from 'vitest'
import { formatTaskDueDate, taskDueDateLabel } from '@/utils/taskDueDate'

describe('taskDueDateLabel', () => {
  it('formats a normal short due date', () => {
    expect(taskDueDateLabel('2026-08-12', false)).toContain('Due')
    expect(taskDueDateLabel('2026-08-12', false)).toContain(formatTaskDueDate('2026-08-12', 'short'))
  })

  it('formats an overdue due date with readable state text', () => {
    const label = taskDueDateLabel('2026-08-05', true)
    expect(label.startsWith('Overdue ·')).toBe(true)
    expect(label).toContain(formatTaskDueDate('2026-08-05', 'short'))
  })

  it('uses medium style without a Due prefix', () => {
    expect(taskDueDateLabel('2026-08-08', false, 'medium')).toBe(formatTaskDueDate('2026-08-08', 'medium'))
    expect(taskDueDateLabel('2026-08-08', true, 'medium')).toBe(
      `Overdue · ${formatTaskDueDate('2026-08-08', 'medium')}`,
    )
  })

  it('returns an em dash when due date is missing', () => {
    expect(taskDueDateLabel(null, false)).toBe('—')
    expect(taskDueDateLabel(null, true)).toBe('—')
  })
})
