import { describe, expect, it } from 'vitest'
import { activeMentionQuery, filterMentionCandidates, insertMention, mentionToken, segmentRemarkBody } from '@/utils/mentions'

describe('mentions utils', () => {
  it('builds a display mention token from full name', () => {
    expect(mentionToken({ id: 4, full_name: 'Ada Admin' })).toBe('@Ada Admin')
  })

  it('detects an active @query at the cursor', () => {
    expect(activeMentionQuery('Hello @Ad', 9)).toBe('Ad')
    expect(activeMentionQuery('Hello Ada', 9)).toBeNull()
  })

  it('inserts a selected mention replacing the active query', () => {
    const result = insertMention('Hello @Ad', 9, { id: 1, full_name: 'Ada Admin' })
    expect(result.body).toBe('Hello @Ada Admin ')
    expect(result.cursor).toBe('Hello @Ada Admin '.length)
  })

  it('filters candidates locally without an API call', () => {
    const matches = filterMentionCandidates(
      [
        { id: 1, full_name: 'Ada Admin', email: 'ada@opsflow.test' },
        { id: 2, full_name: 'Eli Employee', email: 'eli@opsflow.test' },
      ],
      'eli',
    )

    expect(matches).toHaveLength(1)
    expect(matches[0]?.id).toBe(2)
  })

  it('segments known mentions for highlighted rendering', () => {
    const segments = segmentRemarkBody('@Ada Admin fix this please', [
      { id: 1, full_name: 'Ada Admin' },
    ])

    expect(segments).toEqual([
      { type: 'mention', value: '@Ada Admin', userId: 1 },
      { type: 'text', value: ' fix this please' },
    ])
  })
})
