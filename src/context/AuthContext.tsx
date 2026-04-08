'use client'

import { createContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { signInWithGoogle, signOutUser } from '@/services/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<User>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn: signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}
