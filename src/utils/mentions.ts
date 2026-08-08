/** Canonical mention token inserted by the picker. */
export function mentionToken(user: { id: number; full_name: string }): string {
  return `@${user.full_name}`
}

export function insertMention(
  body: string,
  cursor: number,
  user: { id: number; full_name: string },
): { body: string; cursor: number; mentionQueryStart: number | null } {
  const before = body.slice(0, cursor)
  const after = body.slice(cursor)
  const atIndex = before.lastIndexOf('@')

  if (atIndex < 0) {
    const token = `${mentionToken(user)} `
    return {
      body: `${before}${token}${after}`,
      cursor: before.length + token.length,
      mentionQueryStart: null,
    }
  }

  const token = `${mentionToken(user)} `
  const nextBody = `${before.slice(0, atIndex)}${token}${after}`

  return {
    body: nextBody,
    cursor: atIndex + token.length,
    mentionQueryStart: null,
  }
}

export function activeMentionQuery(body: string, cursor: number): string | null {
  const before = body.slice(0, cursor)
  const match = before.match(/@([^\s@]*)$/)

  if (!match) {
    return null
  }

  return match[1] ?? ''
}

export function filterMentionCandidates<T extends { full_name: string; email: string }>(
  candidates: T[],
  query: string,
  limit = 8,
): T[] {
  const needle = query.trim().toLowerCase()

  const filtered = !needle
    ? candidates
    : candidates.filter(
        (candidate) =>
          candidate.full_name.toLowerCase().includes(needle) ||
          candidate.email.toLowerCase().includes(needle),
      )

  return filtered.slice(0, limit)
}

export type RemarkBodySegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; userId?: number }

/**
 * Split remark body into plain-text and mention segments for safe Vue rendering.
 * Matches only known mention display tokens (longest first) — never trusts free @text alone.
 */
export function segmentRemarkBody(
  body: string,
  mentions: Array<{ id: number; full_name: string }> = [],
): RemarkBodySegment[] {
  if (!body) {
    return []
  }

  const tokens = [...mentions]
    .map((mention) => ({
      id: mention.id,
      token: mentionToken(mention),
    }))
    .filter((item) => item.token.length > 1)
    .sort((a, b) => b.token.length - a.token.length)

  if (tokens.length === 0) {
    return [{ type: 'text', value: body }]
  }

  const segments: RemarkBodySegment[] = []
  let cursor = 0

  while (cursor < body.length) {
    let nextIndex = -1
    let nextToken: (typeof tokens)[number] | null = null

    for (const token of tokens) {
      const index = body.indexOf(token.token, cursor)
      if (index === -1) {
        continue
      }
      if (nextIndex === -1 || index < nextIndex) {
        nextIndex = index
        nextToken = token
      }
    }

    if (nextIndex === -1 || nextToken === null) {
      segments.push({ type: 'text', value: body.slice(cursor) })
      break
    }

    if (nextIndex > cursor) {
      segments.push({ type: 'text', value: body.slice(cursor, nextIndex) })
    }

    segments.push({
      type: 'mention',
      value: nextToken.token,
      userId: nextToken.id,
    })
    cursor = nextIndex + nextToken.token.length
  }

  return segments
}
