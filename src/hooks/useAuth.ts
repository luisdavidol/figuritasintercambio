import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface User {
  id: string
  name: string
  pin: string
  createdAt: number
}

const USERS_COLLECTION = 'users'

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('currentUser')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeUser(user: User) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}

function clearStoredUser() {
  localStorage.removeItem('currentUser')
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(false)
  }, [])

  const login = useCallback(async (name: string, pin: string) => {
    setError(null)
    setLoading(true)
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('name', '==', name.trim()),
        where('pin', '==', pin)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const userData = { id: doc.id, ...doc.data() } as User
        storeUser(userData)
        setUser(userData)
        setLoading(false)
        return userData
      }

      setError('Nombre o PIN incorrecto. Si es nuevo, usa la opcion Registrarse.')
      setLoading(false)
      return null
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesion')
      setLoading(false)
      return null
    }
  }, [])

  const register = useCallback(async (name: string, pin: string) => {
    setError(null)
    setLoading(true)
    try {
      const existingQuery = query(
        collection(db, USERS_COLLECTION),
        where('name', '==', name.trim())
      )
      const existing = await getDocs(existingQuery)
      if (!existing.empty) {
        setError('Ya existe un usuario con ese nombre. Elige otro o usa Iniciar Sesion.')
        setLoading(false)
        return null
      }

      const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        name: name.trim(),
        pin,
        createdAt: Date.now(),
      })

      const userData: User = {
        id: docRef.id,
        name: name.trim(),
        pin,
        createdAt: Date.now(),
      }
      storeUser(userData)
      setUser(userData)
      setLoading(false)
      return userData
    } catch (e: any) {
      setError(e.message || 'Error al registrarse')
      setLoading(false)
      return null
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredUser()
    setUser(null)
    setError(null)
  }, [])

  return { user, loading, error, login, register, logout, setError }
}

export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, USERS_COLLECTION))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList: User[] = []
      snapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() } as User)
      })
      setUsers(userList)
      setLoading(false)
    }, (err) => {
      console.error('Error loading users:', err)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { users, loading }
}
