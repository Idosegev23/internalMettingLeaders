'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormData, formSchema, Contact } from '@/types/form'
import { loadContacts } from '@/lib/csvLoader'
import PersonSelector from '@/components/PersonSelector'
import ActiveEditorsIndicator from '@/components/ActiveEditorsIndicator'
import { useRealtimeForm } from '@/hooks/useRealtimeForm'
import { completeForm } from '@/lib/formService'
import type { InnerMeetingForm as InnerMeetingFormType } from '@/lib/supabase'

interface InnerMeetingFormProps {
  initialToken?: string
}

export default function InnerMeetingForm({ initialToken }: InnerMeetingFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingSubmitData, setPendingSubmitData] = useState<FormData | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const { form, innerForm, updateField, initializeForm } = useRealtimeForm()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participants: [],
      creativeWriter: [],
      presenter: [],
      presentationMaker: [],
      accountManager: [],
    }
  })

  // Watch all form fields for changes
  const watchedFields = watch()

  // Load contacts on mount
  useEffect(() => {
    loadContacts().then((data) => {
      setContacts(data)
      setIsLoading(false)
    })
  }, [])

  // Initialize form if token is provided
  useEffect(() => {
    if (initialToken) {
      initializeForm(initialToken)
    }
  }, [initialToken, initializeForm])

  // Sync innerForm data to react-hook-form (only when innerForm changes from null to data)
  const prevInnerFormRef = useRef<InnerMeetingFormType | null>(null)
  const isInitialSync = useRef(false)
  
  useEffect(() => {
    if (innerForm && prevInnerFormRef.current?.id !== innerForm.id) {
      // New form loaded, update all fields
      isInitialSync.current = true
      setValue('clientName', innerForm.client_name || '')
      setValue('meetingDate', innerForm.meeting_date || '')
      setValue('aboutBrand', innerForm.about_brand || '')
      setValue('targetAudiences', innerForm.target_audiences || '')
      setValue('goals', innerForm.goals || '')
      setValue('insight', innerForm.insight || '')
      setValue('strategy', innerForm.strategy || '')
      setValue('creative', innerForm.creative || '')
      setValue('influencersExample', innerForm.influencers_example || '')
      setValue('additionalNotes', innerForm.additional_notes || '')
      setValue('budgetDistribution', innerForm.budget_distribution || '')
      setValue('creativeDeadline', innerForm.creative_deadline || '')
      setValue('internalDeadline', innerForm.internal_deadline || '')
      setValue('clientDeadline', innerForm.client_deadline || '')
      
      prevInnerFormRef.current = innerForm
      
      // Reset the flag after a short delay to allow setValue to complete
      setTimeout(() => {
        isInitialSync.current = false
      }, 100)
    }
  }, [innerForm, setValue])

  // Track changes for unsaved warning
  useEffect(() => {
    // Don't track during initial sync
    if (isInitialSync.current || !innerForm) return
    
    // Check if any field has changed
    const hasChanges = 
      (watchedFields.clientName !== innerForm.client_name) ||
      (watchedFields.meetingDate !== innerForm.meeting_date) ||
      (watchedFields.aboutBrand !== innerForm.about_brand) ||
      (watchedFields.targetAudiences !== innerForm.target_audiences) ||
      (watchedFields.goals !== innerForm.goals) ||
      (watchedFields.insight !== innerForm.insight) ||
      (watchedFields.strategy !== innerForm.strategy) ||
      (watchedFields.creative !== innerForm.creative) ||
      (watchedFields.influencersExample !== innerForm.influencers_example) ||
      (watchedFields.additionalNotes !== innerForm.additional_notes) ||
      (watchedFields.budgetDistribution !== innerForm.budget_distribution) ||
      (watchedFields.creativeDeadline !== innerForm.creative_deadline) ||
      (watchedFields.internalDeadline !== innerForm.internal_deadline) ||
      (watchedFields.clientDeadline !== innerForm.client_deadline)
    
    setHasUnsavedChanges(hasChanges)
  }, [watchedFields, innerForm])

  // Handle first field change to create draft - only if no form exists
  const handleFirstChange = async (field: string, value: any) => {
    // Only create draft if we don't have a form AND we haven't loaded a form yet
    if (!form && !innerForm && !initialToken) {
      await updateField(field, value)
    }
  }

  const handleSaveDraft = async () => {
    if (!form || !innerForm) {
      alert('אין מה לשמור')
      return
    }

    setIsSaving(true)
    try {
      // Prepare all data to save
      const dataToSave: any = {
        client_name: watchedFields.clientName || null,
        meeting_date: watchedFields.meetingDate || null,
        about_brand: watchedFields.aboutBrand || null,
        target_audiences: watchedFields.targetAudiences || null,
        goals: watchedFields.goals || null,
        insight: watchedFields.insight || null,
        strategy: watchedFields.strategy || null,
        creative: watchedFields.creative || null,
        influencers_example: watchedFields.influencersExample || null,
        additional_notes: watchedFields.additionalNotes || null,
        budget_distribution: watchedFields.budgetDistribution || null,
        creative_deadline: watchedFields.creativeDeadline || null,
        internal_deadline: watchedFields.internalDeadline || null,
        client_deadline: watchedFields.clientDeadline || null,
      }

      // Import updateFormData here
      const { updateFormData } = await import('@/lib/formService')
      const success = await updateFormData(form.id, innerForm.id, dataToSave)
      
      if (success) {
        setHasUnsavedChanges(false)
        alert('הטיוטה נשמרה בהצלחה')
        
        // Update innerForm state to match saved data
        Object.keys(dataToSave).forEach(key => {
          updateField(key, dataToSave[key])
        })
      } else {
        alert('שגיאה בשמירת הטיוטה')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('שגיאה בשמירת הטיוטה')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitClick = (data: FormData) => {
    setPendingSubmitData(data)
    setShowConfirmDialog(true)
  }

  const confirmSubmit = async () => {
    if (!pendingSubmitData || !form) return

    setIsSubmitting(true)
    setShowConfirmDialog(false)

    try {
      const success = await completeForm(form.id, pendingSubmitData)
      
      if (success) {
        alert('הטופס נשלח בהצלחה')
        window.location.href = '/'
      } else {
        throw new Error('Failed to complete form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('אירעה שגיאה בשליחת הטופס. אנא נסה שנית.')
    } finally {
      setIsSubmitting(false)
      setPendingSubmitData(null)
    }
  }

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">טוען נתונים...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-8">
        <ActiveEditorsIndicator formId={form?.id || null} />
        
        {/* Unsaved changes warning */}
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">יש שינויים שלא נשמרו</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleSubmitClick)}>
          {/* פרטים כלליים */}
          <div className="mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
              פרטים כלליים
            </h2>

            <div className="mb-6">
              <label htmlFor="clientName" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                שם הלקוח
                <span className="text-red-500 mr-1">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                {...register('clientName')}
                onChange={(e) => {
                  register('clientName').onChange(e)
                  handleFirstChange('client_name', e.target.value)
                }}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.clientName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.clientName && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.clientName.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="meetingDate" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                תאריך פגישה פנימית
                <span className="text-red-500 mr-1">*</span>
              </label>
              <input
                id="meetingDate"
                type="date"
                {...register('meetingDate')}
                onChange={(e) => {
                  register('meetingDate').onChange(e)
                  handleFirstChange('meeting_date', e.target.value)
                }}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.meetingDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.meetingDate && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.meetingDate.message}</p>
              )}
            </div>

            <Controller
              name="participants"
              control={control}
              render={({ field }) => (
                <PersonSelector
                  label="משתתפים בפגישה"
                  contacts={contacts}
                  selectedPersons={field.value}
                  onChange={field.onChange}
                  error={errors.participants?.message}
                  multiSelect={true}
                />
              )}
            />

            <Controller
              name="creativeWriter"
              control={control}
              render={({ field }) => (
                <PersonSelector
                  label="מי כותב קריאייטיב"
                  contacts={contacts}
                  selectedPersons={field.value}
                  onChange={field.onChange}
                  error={errors.creativeWriter?.message}
                  multiSelect={false}
                />
              )}
            />

            <Controller
              name="presenter"
              control={control}
              render={({ field }) => (
                <PersonSelector
                  label="מי מציג ללקוח (אחראי על המצגת)"
                  contacts={contacts}
                  selectedPersons={field.value}
                  onChange={field.onChange}
                  error={errors.presenter?.message}
                  multiSelect={false}
                />
              )}
            />

            <Controller
              name="presentationMaker"
              control={control}
              render={({ field }) => (
                <PersonSelector
                  label="מי מכין את המצגת"
                  contacts={contacts}
                  selectedPersons={field.value}
                  onChange={field.onChange}
                  error={errors.presentationMaker?.message}
                  multiSelect={false}
                />
              )}
            />

            <Controller
              name="accountManager"
              control={control}
              render={({ field }) => (
                <PersonSelector
                  label="מנהל לקוח"
                  contacts={contacts}
                  selectedPersons={field.value}
                  onChange={field.onChange}
                  error={errors.accountManager?.message}
                  multiSelect={false}
                />
              )}
            />
          </div>

          {/* על הבריף */}
          <div className="mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
              על הבריף / המוצר / השירות - מתוך הבריף
            </h2>

            <div className="mb-6">
              <label htmlFor="aboutBrand" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                על המותג
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                id="aboutBrand"
                {...register('aboutBrand')}
                onChange={(e) => {
                  register('aboutBrand').onChange(e)
                  handleFirstChange('about_brand', e.target.value)
                }}
                rows={4}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.aboutBrand ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.aboutBrand && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.aboutBrand.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="targetAudiences" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                קהלי יעד
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                id="targetAudiences"
                {...register('targetAudiences')}
                rows={4}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.targetAudiences ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.targetAudiences && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.targetAudiences.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="goals" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                מטרות
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                id="goals"
                {...register('goals')}
                rows={4}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.goals ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.goals && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.goals.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="insight" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                תובנה
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                id="insight"
                {...register('insight')}
                rows={4}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.insight ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.insight && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.insight.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="strategy" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                אסטרטגיה
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                id="strategy"
                {...register('strategy')}
                rows={4}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.strategy ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.strategy && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.strategy.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="creative" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                קריאייטיב
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                id="creative"
                {...register('creative')}
                rows={4}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.creative ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.creative && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.creative.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="influencersExample" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                משפיענים לדוגמא
              </label>
              <textarea
                id="influencersExample"
                {...register('influencersExample')}
                rows={3}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="additionalNotes" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                הערות נוספות
              </label>
              <textarea
                id="additionalNotes"
                {...register('additionalNotes')}
                rows={3}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="budgetDistribution" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                חלוקת תקציב
              </label>
              <textarea
                id="budgetDistribution"
                {...register('budgetDistribution')}
                rows={3}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* דדליינים */}
          <div className="mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
              דדליינים
            </h2>

            <div className="mb-6">
              <label htmlFor="creativeDeadline" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                דד ליין קריאייטיב
                <span className="text-red-500 mr-1">*</span>
              </label>
              <input
                id="creativeDeadline"
                type="date"
                {...register('creativeDeadline')}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.creativeDeadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.creativeDeadline && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.creativeDeadline.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="internalDeadline" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                דד ליין פנימי
                <span className="text-red-500 mr-1">*</span>
              </label>
              <input
                id="internalDeadline"
                type="date"
                {...register('internalDeadline')}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.internalDeadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.internalDeadline && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.internalDeadline.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="clientDeadline" className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
                דד ליין לקוח
                <span className="text-red-500 mr-1">*</span>
              </label>
              <input
                id="clientDeadline"
                type="date"
                {...register('clientDeadline')}
                className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.clientDeadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.clientDeadline && (
                <p className="mt-1 text-xs md:text-sm text-red-600">{errors.clientDeadline.message}</p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col md:flex-row justify-center gap-4 pt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-8 py-3 md:px-12 md:py-4 bg-gray-600 text-white font-bold text-base md:text-lg rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'שומר...' : 'שמור להמשך'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="px-8 py-3 md:px-12 md:py-4 bg-primary text-white font-bold text-base md:text-lg rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'שולח...' : 'שלח טופס'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-md w-full">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              האם אתה בטוח?
            </h3>
            <p className="text-gray-600 mb-6">
              הטופס יישלח ללקוח ויועבר למצב הושלם. פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-400 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
              >
                אשר ושלח
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

