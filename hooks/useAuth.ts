'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase, Contact } from '@/lib/supabase'

const AUTH_KEY = 'inner_meeting_user'

export interface AuthUser {
  email: string
  name: string
  hebrewName: string
  contactId: string
}

interface UseAuthResult {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(AUTH_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Login function - checks if email exists in contacts
  const login = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = getSupabase()
      
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (error || !contact) {
        return { success: false, error: 'המייל לא נמצא במערכת' }
      }

      const authUser: AuthUser = {
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`,
        hebrewName: `${contact.hebrew_first_name} ${contact.hebrew_last_name}`,
        contactId: contact.id
      }

      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser))
      setUser(authUser)

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'שגיאה בהתחברות' }
    }
  }, [])

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  return {
    user,
    isLoading,
    login,
    logout
  }
}

