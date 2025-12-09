'use client'

import { useState, useEffect } from 'react'
import { getFormActivityLogs } from '@/lib/formService'
import { FormActivityLog as ActivityLog } from '@/lib/supabase'

interface FormActivityLogProps {
  formId: string | null
}

export default function FormActivityLog({ formId }: FormActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (formId && isExpanded) {
      loadLogs()
    }
  }, [formId, isExpanded])

  const loadLogs = async () => {
    if (!formId) return
    
    setIsLoading(true)
    const data = await getFormActivityLogs(formId)
    setLogs(data)
    setIsLoading(false)
  }

  if (!formId) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'save_draft':
        return 'שמר טיוטה'
      case 'submit':
        return 'שלח טופס'
      default:
        return action
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'save_draft':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        )
      case 'submit':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        היסטוריית פעולות
      </button>

      {isExpanded && (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              אין היסטוריה עדיין
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3 bg-gray-50/50 hover:bg-gray-50">
                  {getActionIcon(log.action_type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">
                      {log.user_name || log.user_email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getActionLabel(log.action_type)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

