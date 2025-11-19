import { useState, useEffect, useCallback } from 'react'
import { FormWithDetails } from '@/lib/supabase'
import { getForms, subscribeToFormsList, unsubscribe } from '@/lib/formService'

interface UseFormsListResult {
  forms: FormWithDetails[]
  isLoading: boolean
  refresh: () => Promise<void>
}

export function useFormsList(status?: 'draft' | 'completed'): UseFormsListResult {
  const [forms, setForms] = useState<FormWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadForms = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getForms(status)
      setForms(data)
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadForms()

    // Subscribe to real-time updates
    const channel = subscribeToFormsList(async (payload) => {
      // Refresh the list when any form changes
      loadForms()
    })

    return () => {
      unsubscribe(channel)
    }
  }, [loadForms])

  return {
    forms,
    isLoading,
    refresh: loadForms
  }
}

