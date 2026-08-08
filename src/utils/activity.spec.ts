import { describe, expect, it } from 'vitest'
import type { ActivityLog } from '@/types/activity'
import { activityChangeSummary, activityHeadline, activitySubjectLabel, humanizeAction } from '@/utils/activity'

const baseLog: ActivityLog = {
  id: 1,
  action: 'task.status_changed',
  description: 'Changed task status from To Do to In Progress.',
  subject_type: 'task',
  subject_id: 42,
  subject: { id: 42, type: 'task', title: 'Draft API spec' },
  actor: { id: 2, full_name: 'Maria Lopez', email: 'maria@opsflow.test' },
  properties: {
    before: { status: 'todo' },
    after: { status: 'in_progress' },
  },
  created_at: '2026-08-08T02:15:00.000000Z',
}

describe('activity presentation helpers', () => {
  it('builds a readable headline from actor and description', () => {
    expect(activityHeadline(baseLog)).toBe(
      'Maria Lopez changed task status from To Do to In Progress',
    )
  })

  it('falls back to someone when actor is missing', () => {
    expect(activityHeadline({ ...baseLog, actor: null })).toBe(
      'Someone changed task status from To Do to In Progress',
    )
  })

  it('labels subjects from title, name, or type fallback', () => {
    expect(activitySubjectLabel(baseLog)).toBe('Draft API spec')
    expect(
      activitySubjectLabel({
        ...baseLog,
        subject_type: 'project',
        subject: { id: 3, type: 'project', name: 'Website Redesign' },
      }),
    ).toBe('Website Redesign')
    expect(
      activitySubjectLabel({
        ...baseLog,
        subject: null,
        subject_type: 'user',
        subject_id: 9,
      }),
    ).toBe('User #9')
  })

  it('summarizes before/after metadata without exposing raw JSON', () => {
    expect(activityChangeSummary(baseLog)).toBe('Status: Todo → In Progress')
    expect(
      activityChangeSummary({
        ...baseLog,
        properties: { member_full_name: 'John Reyes' },
      }),
    ).toBe('Member: John Reyes')
  })

  it('shows assignee names instead of user ids', () => {
    expect(
      activityChangeSummary({
        ...baseLog,
        action: 'task.assigned',
        properties: {
          before: {
            assigned_to: 3,
            assigned_to_name: 'Maria Lopez',
          },
          after: {
            assigned_to: 2,
            assigned_to_name: 'John Reyes',
          },
        },
      }),
    ).toBe('Assigned To: Maria Lopez → John Reyes')
  })

  it('humanizes machine action names', () => {
    expect(humanizeAction('project.member_added')).toBe('Project member added')
    expect(humanizeAction('user.created')).toBe('User created')
  })
})
