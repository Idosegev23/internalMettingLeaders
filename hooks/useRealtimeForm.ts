import { useState, useEffect, useCallback, useRef } from 'react'
import { InnerMeetingForm, Form } from '@/lib/supabase'
import {
  createFormDraft,
  getFormByToken,
  subscribeToForm,
  unsubscribe
} from '@/lib/formService'

interface UseRealtimeFormResult {
  form: Form | null
  innerForm: InnerMeetingForm | null
  isLoading: boolean
  updateField: (field: string, value: any) => Promise<void>
  initializeForm: (token?: string) => Promise<void>
}

export function useRealtimeForm(): UseRealtimeFormResult {
  const [form, setForm] = useState<Form | null>(null)
  const [innerForm, setInnerForm] = useState<InnerMeetingForm | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const channelRef = useRef<any>(null)

  // Initialize form - either load existing or create new draft
  const initializeForm = useCallback(async (token?: string) => {
    setIsLoading(true)
    try {
      if (token) {
        // Load existing form
        const formData = await getFormByToken(token)
        if (formData && formData.inner_meeting_form) {
          setForm(formData)
          setInnerForm(formData.inner_meeting_form)
          
          // Subscribe to changes
          if (channelRef.current) {
            unsubscribe(channelRef.current)
          }
          channelRef.current = subscribeToForm(formData.id, (payload) => {
            if (payload.eventType === 'UPDATE') {
              setInnerForm(prev => ({
                ...prev!,
                ...payload.new
              }))
            }
          })
        }
      }
    } catch (error) {
      console.error('Error initializing form:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update a field (just optimistic update for real-time, no auto-save)
  const updateField = useCallback(async (field: string, value: any) => {
    if (!innerForm) {
      return
    }

    // Just optimistic update - no save to database (save happens on button click)
    setInnerForm(prev => ({
      ...prev!,
      [field]: value
    }))
  }, [innerForm])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }
    }
  }, [])

  return {
    form,
    innerForm,
    isLoading,
    updateField,
    initializeForm
  }
}

