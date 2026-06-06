import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Subscribe to auth state changes (INITIAL_SESSION fires on mount)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
      setInitialized(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile whenever user changes
  useEffect(() => {
    if (!user) return
    let mounted = true
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (mounted) setProfile(data as Profile | null)
      })
    return () => { mounted = false }
  }, [user])

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Authentication failed.' }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUser.id)
      .single()

    if (!profileData?.is_admin) {
      await supabase.auth.signOut()
      return { error: 'This portal is for admins only.' }
    }

    return { error: null }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, isLoading: !initialized, signIn, signUp, signOut } },
    children,
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
