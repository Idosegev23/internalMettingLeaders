'use client'

import { useState } from 'react'
import { FormWithDetails } from '@/lib/supabase'
import { useFormsList } from '@/hooks/useFormsList'

interface FormsListProps {
  onSelectForm: (token: string) => void
}

export default function FormsList({ onSelectForm }: FormsListProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const { forms, isLoading } = useFormsList(showCompleted ? 'completed' : 'draft')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
          {showCompleted ? 'טפסים שהושלמו' : 'רשימת טיוטות'}
        </h2>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-sm md:text-base text-primary hover:text-primary-dark font-semibold"
        >
          {showCompleted ? 'הצג טיוטות' : 'הצג הושלמו'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {showCompleted ? 'אין טפסים שהושלמו' : 'אין טיוטות'}
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => {
            const innerForm = Array.isArray(form.inner_meeting_forms) 
              ? form.inner_meeting_forms[0] 
              : form.inner_meeting_forms
            const draftName = form.title || 'ללא שם'
            const clientName = innerForm?.client_name || 'ללא שם לקוח'
            const activeCount = form.active_editors_count || 0

            return (
              <button
                key={form.id}
                onClick={() => onSelectForm(form.share_token)}
                className="w-full text-right p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 mb-1">
                      {draftName}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {clientName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(form.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeCount > 0 ? (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        {activeCount} עורכים
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        0 עורכים
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

