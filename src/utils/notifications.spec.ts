import { describe, expect, it } from 'vitest'
import type { AppNotification } from '@/types/notification'
import { notificationMessage, notificationTargetRoute, notificationTitle } from '@/utils/notifications'

const base: AppNotification = {
  id: 1,
  type: 'task_assigned',
  actor: null,
  subject_type: 'task',
  subject_id: 44,
  subject: null,
  data: {
    title: 'You were assigned a task',
    message: 'Ada assigned Create DB to you.',
    target_type: 'task',
    target_id: 44,
  },
  read_at: null,
  created_at: '2026-08-08T02:15:00.000000Z',
}

describe('notification helpers', () => {
  it('reads title and message from data', () => {
    expect(notificationTitle(base)).toBe('You were assigned a task')
    expect(notificationMessage(base)).toBe('Ada assigned Create DB to you.')
  })

  it('resolves task and project routes from metadata', () => {
    expect(notificationTargetRoute(base)).toEqual({ name: 'tasks.show', params: { id: 44 } })
    expect(
      notificationTargetRoute({
        ...base,
        data: { target_type: 'project', target_id: 3 },
      }),
    ).toEqual({ name: 'projects.show', params: { id: 3 } })
  })
})
