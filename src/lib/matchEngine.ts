import { doc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import type { User } from '../hooks/useAuth'
import type { UserSticker } from '../hooks/useUserStickers'

export interface MatchRecipient {
  userId: string
  userName: string
  stickerCodes: string[]
}

export interface MatchSuggestion {
  otherUser: User
  iGive: string[]
  iReceive: string[]
  score: number
}

const USER_STICKERS = 'userStickers'

export function findMatches(
  currentUser: User,
  allUsers: User[],
  allStickerMap: Map<string, UserSticker>,
  allStickerCodes: string[]
): MatchSuggestion[] {
  const matches: MatchSuggestion[] = []

  const myStickers = new Map<string, UserSticker>()
  allStickerMap.forEach((s) => {
    if (s.userId === currentUser.id) {
      myStickers.set(s.stickerCode, s)
    }
  })

  const myOwnedSet = new Set<string>()
  const myDupes: string[] = []
  myStickers.forEach((s) => {
    if (s.status === 'owned' || s.status === 'duplicate') {
      myOwnedSet.add(s.stickerCode)
    }
    if (s.status === 'duplicate' && s.duplicateCount > 0) {
      myDupes.push(s.stickerCode)
    }
  })

  for (const otherUser of allUsers) {
    if (otherUser.id === currentUser.id) continue

    const otherStickers = new Map<string, UserSticker>()
    allStickerMap.forEach((s) => {
      if (s.userId === otherUser.id) {
        otherStickers.set(s.stickerCode, s)
      }
    })

    const otherOwnedSet = new Set<string>()
    const otherDupes: string[] = []
    otherStickers.forEach((s) => {
      if (s.status === 'owned' || s.status === 'duplicate') {
        otherOwnedSet.add(s.stickerCode)
      }
      if (s.status === 'duplicate' && s.duplicateCount > 0) {
        otherDupes.push(s.stickerCode)
      }
    })

    const otherNeededSet = new Set(
      allStickerCodes.filter((c) => !otherOwnedSet.has(c))
    )
    const myNeededSet = new Set(
      allStickerCodes.filter((c) => !myOwnedSet.has(c))
    )

    const iGive = myDupes.filter((code) => otherNeededSet.has(code))
    const iReceive = Array.from(myNeededSet).filter((code) => otherDupes.includes(code))

    if (iGive.length > 0 || iReceive.length > 0) {
      matches.push({
        otherUser,
        iGive,
        iReceive,
        score: Math.min(iGive.length, iReceive.length) * 2 + (iGive.length + iReceive.length),
      })
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return matches
}

export function findUserStickersByStatus(
  userId: string,
  status: 'owned' | 'missing' | 'duplicate',
  allStickerMap: Map<string, UserSticker>
): string[] {
  const codes: string[] = []
  allStickerMap.forEach((s) => {
    if (s.userId === userId && s.status === status) {
      codes.push(s.stickerCode)
    }
  })
  return codes
}

export async function executeExchange(
  currentUserId: string,
  otherUserId: string,
  iGive: string[],
  iReceive: string[],
  allStickerMap: Map<string, UserSticker>
) {
  const batch = writeBatch(db)

  for (const code of iGive) {
    const mySticker = findUserSticker(allStickerMap, currentUserId, code)
    if (!mySticker || mySticker.status !== 'duplicate') continue

    const myNewCount = mySticker.duplicateCount - 1
    const myDocId = `${currentUserId}_${code}`
    batch.set(doc(db, USER_STICKERS, myDocId), {
      userId: currentUserId,
      stickerCode: code,
      status: myNewCount > 0 ? 'duplicate' : 'owned',
      duplicateCount: Math.max(0, myNewCount),
      updatedAt: Date.now(),
    })

    const otherDocId = `${otherUserId}_${code}`
    batch.set(doc(db, USER_STICKERS, otherDocId), {
      userId: otherUserId,
      stickerCode: code,
      status: 'owned',
      duplicateCount: 0,
      updatedAt: Date.now(),
    })
  }

  for (const code of iReceive) {
    const otherSticker = findUserSticker(allStickerMap, otherUserId, code)
    if (!otherSticker || otherSticker.status !== 'duplicate') continue

    const otherNewCount = otherSticker.duplicateCount - 1
    const otherDocId = `${otherUserId}_${code}`
    batch.set(doc(db, USER_STICKERS, otherDocId), {
      userId: otherUserId,
      stickerCode: code,
      status: otherNewCount > 0 ? 'duplicate' : 'owned',
      duplicateCount: Math.max(0, otherNewCount),
      updatedAt: Date.now(),
    })

    const myDocId = `${currentUserId}_${code}`
    batch.set(doc(db, USER_STICKERS, myDocId), {
      userId: currentUserId,
      stickerCode: code,
      status: 'owned',
      duplicateCount: 0,
      updatedAt: Date.now(),
    })
  }

  await batch.commit()
}

export interface BilateralMatch {
  aGivesB: string[]
  bGivesA: string[]
}

export function findMatchesBetween(
  userAId: string,
  userBId: string,
  allStickerMap: Map<string, UserSticker>,
  allStickerCodes: string[]
): BilateralMatch {
  const aOwned = new Set<string>()
  const aDupes: string[] = []
  const bOwned = new Set<string>()
  const bDupes: string[] = []

  allStickerMap.forEach((s) => {
    if (s.userId === userAId) {
      if (s.status === 'owned' || s.status === 'duplicate') aOwned.add(s.stickerCode)
      if (s.status === 'duplicate' && s.duplicateCount > 0) aDupes.push(s.stickerCode)
    }
    if (s.userId === userBId) {
      if (s.status === 'owned' || s.status === 'duplicate') bOwned.add(s.stickerCode)
      if (s.status === 'duplicate' && s.duplicateCount > 0) bDupes.push(s.stickerCode)
    }
  })

  const bNeeded = new Set(allStickerCodes.filter((c) => !bOwned.has(c)))
  const aNeeded = new Set(allStickerCodes.filter((c) => !aOwned.has(c)))

  const aGivesB = aDupes.filter((code) => bNeeded.has(code))
  const bGivesA = bDupes.filter((code) => aNeeded.has(code))

  return { aGivesB, bGivesA }
}

function findUserSticker(
  map: Map<string, UserSticker>,
  userId: string,
  stickerCode: string
): UserSticker | undefined {
  for (const [, s] of map) {
    if (s.userId === userId && s.stickerCode === stickerCode) return s
  }
  return undefined
}
