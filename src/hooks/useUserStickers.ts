import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  setDoc,
  doc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { User } from './useAuth'

const USER_STICKERS = 'userStickers'

export type StickerStatus = 'owned' | 'missing' | 'duplicate'

export interface UserSticker {
  id: string
  userId: string
  stickerCode: string
  status: StickerStatus
  duplicateCount: number
  updatedAt: number
}

export function useUserStickers(currentUser: User | null) {
  const [userStickers, setUserStickers] = useState<Map<string, UserSticker>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setUserStickers(new Map())
      setLoading(false)
      return
    }

    const q = query(
      collection(db, USER_STICKERS),
      where('userId', '==', currentUser.id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = new Map<string, UserSticker>()
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as UserSticker
        map.set(data.stickerCode, data)
      })
      setUserStickers(map)
      setLoading(false)
    }, (err) => {
      console.error('Error loading user stickers:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const setStickerStatus = useCallback(
    async (stickerCode: string, status: StickerStatus, duplicateCount = 0) => {
      if (!currentUser) return
      const docId = `${currentUser.id}_${stickerCode}`
      await setDoc(doc(db, USER_STICKERS, docId), {
        userId: currentUser.id,
        stickerCode,
        status,
        duplicateCount: status === 'duplicate' ? Math.max(1, duplicateCount) : 0,
        updatedAt: Date.now(),
      })
    },
    [currentUser]
  )

  const bulkSetStatus = useCallback(
    async (codes: string[], status: StickerStatus) => {
      if (!currentUser || codes.length === 0) return
      const batch = writeBatch(db)
      for (const stickerCode of codes) {
        const docId = `${currentUser.id}_${stickerCode}`
        const ref = doc(db, USER_STICKERS, docId)
        batch.set(ref, {
          userId: currentUser.id,
          stickerCode,
          status,
          duplicateCount: status === 'duplicate' ? 1 : 0,
          updatedAt: Date.now(),
        })
      }
      await batch.commit()
    },
    [currentUser]
  )

  const getStatus = useCallback(
    (stickerCode: string): StickerStatus | null => {
      const s = userStickers.get(stickerCode)
      return s ? s.status : null
    },
    [userStickers]
  )

  const getDuplicateCount = useCallback(
    (stickerCode: string): number => {
      const s = userStickers.get(stickerCode)
      return s && s.status === 'duplicate' ? s.duplicateCount : 0
    },
    [userStickers]
  )

  const stats = {
    owned: Array.from(userStickers.values()).filter((s) => s.status === 'owned').length,
    missing: Array.from(userStickers.values()).filter((s) => s.status === 'missing').length,
    duplicates: Array.from(userStickers.values()).filter((s) => s.status === 'duplicate').length,
    totalDuplicates: Array.from(userStickers.values())
      .filter((s) => s.status === 'duplicate')
      .reduce((sum, s) => sum + s.duplicateCount, 0),
  }

  return {
    userStickers,
    loading,
    setStickerStatus,
    bulkSetStatus,
    getStatus,
    getDuplicateCount,
    stats,
  }
}

export function useAllUserStickers(users: User[]) {
  const [allStickers, setAllStickers] = useState<Map<string, UserSticker>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (users.length === 0) {
      setAllStickers(new Map())
      setLoading(false)
      return
    }

    const q = query(collection(db, USER_STICKERS))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = new Map<string, UserSticker>()
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as UserSticker
        map.set(data.id, data)
      })
      setAllStickers(map)
      setLoading(false)
    }, (err) => {
      console.error('Error loading all stickers:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [users.length])

  const getUserStickerMap = useCallback(
    (userId: string): Map<string, UserSticker> => {
      const map = new Map<string, UserSticker>()
      allStickers.forEach((s) => {
        if (s.userId === userId) {
          map.set(s.stickerCode, s)
        }
      })
      return map
    },
    [allStickers]
  )

  return { allStickers, loading, getUserStickerMap }
}
