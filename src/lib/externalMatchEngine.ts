import { doc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import type { UserSticker } from '../hooks/useUserStickers'
import type { ExternalReport } from '../hooks/useExternalReports'

export interface ExternalMatchResult {
  iGive: string[]
  iReceive: string[]
}

const USER_STICKERS = 'userStickers'
const EXTERNAL_REPORTS = 'externalReports'

export function findExternalMatches(
  myStickerMap: Map<string, UserSticker>,
  report: ExternalReport
): ExternalMatchResult {
  const myOwnedSet = new Set<string>()
  const myDupes: string[] = []

  myStickerMap.forEach((s) => {
    if (s.status === 'owned' || s.status === 'duplicate') {
      myOwnedSet.add(s.stickerCode)
    }
    if (s.status === 'duplicate' && s.duplicateCount > 0) {
      myDupes.push(s.stickerCode)
    }
  })

  const externalMissingSet = new Set(report.missing)

  const iGive = myDupes.filter((code) => externalMissingSet.has(code))

  const iReceive = report.duplicates.filter((code) => !myOwnedSet.has(code))

  return { iGive, iReceive }
}

export async function executeExternalExchange(
  currentUserId: string,
  report: ExternalReport,
  iGive: string[],
  iReceive: string[],
  myStickerMap: Map<string, UserSticker>
) {
  const batch = writeBatch(db)

  const newMissing = new Set(report.missing)
  const newDuplicates = new Set(report.duplicates)

  for (const code of iGive) {
    const mySticker = findSticker(myStickerMap, code)
    if (!mySticker || mySticker.status !== 'duplicate') continue

    const newCount = mySticker.duplicateCount - 1
    const myDocId = `${currentUserId}_${code}`
    batch.set(doc(db, USER_STICKERS, myDocId), {
      userId: currentUserId,
      stickerCode: code,
      status: newCount > 0 ? 'duplicate' : 'owned',
      duplicateCount: Math.max(0, newCount),
      updatedAt: Date.now(),
    })

    newMissing.delete(code)
  }

  for (const code of iReceive) {
    const myDocId = `${currentUserId}_${code}`
    batch.set(doc(db, USER_STICKERS, myDocId), {
      userId: currentUserId,
      stickerCode: code,
      status: 'owned',
      duplicateCount: 0,
      updatedAt: Date.now(),
    })

    newDuplicates.delete(code)
  }

  batch.set(doc(db, EXTERNAL_REPORTS, report.id), {
    userId: report.userId,
    name: report.name,
    missing: Array.from(newMissing),
    duplicates: Array.from(newDuplicates),
    updatedAt: Date.now(),
  })

  await batch.commit()
}

function findSticker(
  map: Map<string, UserSticker>,
  stickerCode: string
): UserSticker | undefined {
  return map.get(stickerCode)
}
