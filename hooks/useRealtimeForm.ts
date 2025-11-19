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
  const isCreatingDraft = useRef(false) // Prevent duplicate draft creation

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
    if (!innerForm && !isCreatingDraft.current) {
      // Prevent duplicate draft creation
      isCreatingDraft.current = true
      
      // Create new draft on first edit
      const draft = await createFormDraft()
      if (draft) {
        setForm(draft.form)
        setInnerForm(draft.innerForm)
        
        // Update URL with share token
        const url = new URL(window.location.href)
        url.searchParams.set('form', draft.form.share_token)
        window.history.pushState({}, '', url.toString())
        
        // Subscribe to changes
        if (channelRef.current) {
          unsubscribe(channelRef.current)
        }
        channelRef.current = subscribeToForm(draft.form.id, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setInnerForm(prev => ({
              ...prev!,
              ...payload.new
            }))
          }
        })
      }
      return
    }

    // If draft is being created, wait
    if (isCreatingDraft.current && !innerForm) {
      return
    }

    // Just optimistic update - no save to database (save happens on button click)
    setInnerForm(prev => ({
      ...prev!,
      [field]: value
    }))
  }, [form, innerForm])

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

