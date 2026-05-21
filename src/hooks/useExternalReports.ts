import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { User } from './useAuth'

const EXTERNAL_REPORTS = 'externalReports'

export interface ExternalReport {
  id: string
  userId: string
  name: string
  missing: string[]
  duplicates: string[]
  updatedAt: number
}

export function useExternalReports(currentUser: User | null) {
  const [reports, setReports] = useState<ExternalReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setReports([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, EXTERNAL_REPORTS),
      where('userId', '==', currentUser.id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ExternalReport[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        list.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          missing: data.missing || [],
          duplicates: data.duplicates || [],
          updatedAt: data.updatedAt || 0,
        })
      })
      list.sort((a, b) => b.updatedAt - a.updatedAt)
      setReports(list)
      setLoading(false)
    }, (err) => {
      console.error('Error loading external reports:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  const saveReport = useCallback(
    async (name: string, missing: string[], duplicates: string[]) => {
      if (!currentUser) return
      const docId = `${currentUser.id}_${name}`
      await setDoc(doc(db, EXTERNAL_REPORTS, docId), {
        userId: currentUser.id,
        name,
        missing,
        duplicates,
        updatedAt: Date.now(),
      })
    },
    [currentUser]
  )

  const updateReport = useCallback(
    async (report: ExternalReport) => {
      await setDoc(doc(db, EXTERNAL_REPORTS, report.id), {
        userId: report.userId,
        name: report.name,
        missing: report.missing,
        duplicates: report.duplicates,
        updatedAt: Date.now(),
      })
    },
    []
  )

  const deleteReport = useCallback(
    async (reportId: string) => {
      await deleteDoc(doc(db, EXTERNAL_REPORTS, reportId))
    },
    []
  )

  return {
    reports,
    loading,
    saveReport,
    updateReport,
    deleteReport,
  }
}
