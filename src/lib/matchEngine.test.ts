import { describe, it, expect } from 'vitest'
import { findMatches, findMatchesBetween } from './matchEngine'
import type { User } from '../hooks/useAuth'
import type { UserSticker } from '../hooks/useUserStickers'

function makeUser(id: string, name: string): User {
  return { id, name, pin: '0000', createdAt: Date.now() }
}

function makeSticker(
  id: string,
  userId: string,
  stickerCode: string,
  status: 'owned' | 'missing' | 'duplicate',
  duplicateCount = 0
): UserSticker {
  return {
    id,
    userId,
    stickerCode,
    status,
    duplicateCount: status === 'duplicate' ? Math.max(1, duplicateCount) : 0,
    updatedAt: Date.now(),
  }
}

function buildMap(stickers: UserSticker[]): Map<string, UserSticker> {
  const map = new Map<string, UserSticker>()
  stickers.forEach((s) => map.set(s.id, s))
  return map
}

const ALL_CODES = ['FWC1', 'FWC2', 'MEX1', 'MEX2', 'MEX3', 'MEX4', 'MEX5', 'ARG1', 'ARG2', 'ARG3']

describe('findMatches', () => {
  it('returns empty when no users', () => {
    const current = makeUser('u1', 'Luis')
    const result = findMatches(current, [current], new Map(), ALL_CODES)
    expect(result).toEqual([])
  })

  it('finds no match when both users have same stickers', () => {
    const luis = makeUser('u1', 'Luis')
    const juan = makeUser('u2', 'Juan')
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX1', 'duplicate', 2),
      makeSticker('2', 'u1', 'MEX2', 'owned'),
      makeSticker('3', 'u2', 'MEX1', 'owned'),
      makeSticker('4', 'u2', 'MEX2', 'owned'),
    ])
    const result = findMatches(luis, [luis, juan], stickers, ALL_CODES)
    // Luis has MEX1 dup, Juan already owns MEX1 and MEX2 - no match
    expect(result).toHaveLength(0)
  })

  it('finds 1:1 match when one gives one duplicate and receives one missing', () => {
    const luis = makeUser('u1', 'Luis')
    const juan = makeUser('u2', 'Juan')
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX1', 'duplicate', 1),
      makeSticker('2', 'u1', 'MEX2', 'owned'),
      makeSticker('3', 'u2', 'MEX3', 'duplicate', 1),
      makeSticker('4', 'u2', 'MEX1', 'missing'),
    ])
    const result = findMatches(luis, [luis, juan], stickers, ALL_CODES)
    expect(result).toHaveLength(1)
    expect(result[0].otherUser.id).toBe('u2')
    expect(result[0].iGive).toContain('MEX1')
    expect(result[0].iReceive).toContain('MEX3')
  })

  it('finds multiple matches across users', () => {
    const luis = makeUser('u1', 'Luis')
    const juan = makeUser('u2', 'Juan')
    const maria = makeUser('u3', 'Maria')
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX1', 'duplicate', 1),
      makeSticker('2', 'u1', 'ARG1', 'owned'),
      makeSticker('3', 'u2', 'ARG2', 'duplicate', 2),
      makeSticker('4', 'u3', 'MEX2', 'duplicate', 1),
      makeSticker('5', 'u3', 'MEX3', 'owned'),
    ])
    const result = findMatches(luis, [luis, juan, maria], stickers, ALL_CODES)
    expect(result.length).toBeGreaterThanOrEqual(1)
    // Luis gives MEX1 -> Juan needs it, Maria needs it
    // Luis receives ARG2 from Juan, MEX2 from Maria
    const juanMatch = result.find((m) => m.otherUser.id === 'u2')
    const mariaMatch = result.find((m) => m.otherUser.id === 'u3')
    expect(juanMatch).toBeDefined()
    expect(mariaMatch).toBeDefined()
  })

  it('considers unmarked stickers as needed (not owned)', () => {
    const luis = makeUser('u1', 'Luis')
    const juan = makeUser('u2', 'Juan')
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX5', 'duplicate', 3),
      // Juan has NO stickers in the map at all -> he "needs" everything
      makeSticker('2', 'u2', 'ARG3', 'duplicate', 1),
    ])
    const result = findMatches(luis, [luis, juan], stickers, ALL_CODES)
    expect(result).toHaveLength(1)
    // Luis can give MEX5 to Juan (Juan needs everything)
    expect(result[0].iGive).toContain('MEX5')
    // Luis can receive ARG3 from Juan (Luis doesn't own ARG3)
    expect(result[0].iReceive).toContain('ARG3')
  })

  it('sorts matches by score descending', () => {
    const luis = makeUser('u1', 'Luis')
    const juan = makeUser('u2', 'Juan')
    const maria = makeUser('u3', 'Maria')
    const stickers = buildMap([
      // Luis dupes
      makeSticker('1', 'u1', 'MEX1', 'duplicate', 1),
      makeSticker('2', 'u1', 'MEX2', 'duplicate', 1),
      // Juan dupes (more = higher score with Luis)
      makeSticker('3', 'u2', 'ARG1', 'duplicate', 1),
      makeSticker('4', 'u2', 'ARG2', 'duplicate', 1),
      makeSticker('5', 'u2', 'ARG3', 'duplicate', 1),
      // Maria dupes (fewer)
      makeSticker('6', 'u3', 'FWC1', 'duplicate', 1),
    ])
    const result = findMatches(luis, [luis, juan, maria], stickers, ALL_CODES)
    expect(result).toHaveLength(2)
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
  })
})

describe('findMatchesBetween', () => {
  it('returns empty when no overlap', () => {
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX1', 'duplicate', 1),
      makeSticker('2', 'u2', 'MEX1', 'owned'),
    ])
    const result = findMatchesBetween('u1', 'u2', stickers, ALL_CODES)
    expect(result.aGivesB).toEqual([])
    expect(result.bGivesA).toEqual([])
  })

  it('finds bilateral exchange', () => {
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX1', 'duplicate', 1),
      makeSticker('2', 'u1', 'MEX2', 'owned'),
      makeSticker('3', 'u2', 'ARG1', 'duplicate', 2),
      makeSticker('4', 'u2', 'MEX1', 'missing'),
    ])
    const result = findMatchesBetween('u1', 'u2', stickers, ALL_CODES)
    expect(result.aGivesB).toContain('MEX1')
    expect(result.bGivesA).toContain('ARG1')
  })

  it('handles one-sided match', () => {
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX5', 'duplicate', 5),
      makeSticker('2', 'u2', 'MEX5', 'owned'),
    ])
    const result = findMatchesBetween('u1', 'u2', stickers, ALL_CODES)
    // u1 gives MEX5 to u2 (u2 needs it), but u2 gives nothing to u1
    expect(result.aGivesB).toEqual([]) // u2 already has MEX5
    expect(result.bGivesA).toEqual([])
  })

  it('detects all stickers not owned as needed', () => {
    const stickers = buildMap([
      makeSticker('1', 'u1', 'FWC1', 'duplicate', 1),
      // u2 has nothing marked -> needs everything
    ])
    const result = findMatchesBetween('u1', 'u2', stickers, ALL_CODES)
    expect(result.aGivesB).toContain('FWC1')
    expect(result.bGivesA).toEqual([])
  })

  it('ignores stickers both users already own', () => {
    const stickers = buildMap([
      makeSticker('1', 'u1', 'MEX1', 'owned'),
      makeSticker('2', 'u2', 'MEX1', 'owned'),
      makeSticker('3', 'u1', 'MEX2', 'duplicate', 1),
      makeSticker('4', 'u2', 'MEX2', 'duplicate', 2),
    ])
    const result = findMatchesBetween('u1', 'u2', stickers, ALL_CODES)
    // Both have MEX1 and MEX2 -> no exchange possible
    expect(result.aGivesB).toEqual([])
    expect(result.bGivesA).toEqual([])
  })
})
