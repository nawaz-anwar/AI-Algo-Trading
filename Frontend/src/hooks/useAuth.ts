import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth'
import { auth } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)

  const register = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  // Get ID token to send to backend
  const getToken = async () => {
    if (!user) return null
    return await user.getIdToken()
  }

  return { user, loading, login, register, logout, getToken }
}
