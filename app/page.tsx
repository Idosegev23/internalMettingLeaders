'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import FormsList from '@/components/FormsList'
import InnerMeetingForm from '@/components/InnerMeetingForm'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const [selectedFormToken, setSelectedFormToken] = useState<string | undefined>(undefined)
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Check URL for form token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const formToken = params.get('form')
    if (formToken) {
      setSelectedFormToken(formToken)
    }
  }, [])

  const handleSelectForm = (token: string) => {
    setSelectedFormToken(token)
    
    // Update URL without reload
    const url = new URL(window.location.href)
    url.searchParams.set('form', token)
    window.history.pushState({}, '', url.toString())
    
    // Scroll to form
      setTimeout(() => {
      document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Show loading while checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6 text-center mb-4 md:mb-8">
          {/* User info bar */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{user.hebrewName}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              התנתק
            </button>
          </div>

          <div className="flex justify-center mb-3 md:mb-4">
            <Image
              src="/logo.png"
              alt="Leaders Logo"
              width={150}
              height={60}
              className="object-contain md:w-[180px] md:h-[72px]"
              priority
            />
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
            מסמך התנעה – LEADERS 2025
          </h1>
          <p className="text-sm md:text-base text-gray-600 px-2">
            את המסמך הזה אנחנו ממלאים בפגישת בריף פנימית לאחר קבלת הבריף המלא מהלקוח
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-2">
            אחראים על מילוי המסמך: מנהל הלקוח ואיש קריאייטיב
          </p>
        </div>

        {/* Forms List */}
        <FormsList onSelectForm={handleSelectForm} />

        {/* Form Section */}
        <div id="form-section">
          <InnerMeetingForm initialToken={selectedFormToken} />
        </div>
      </div>
    </div>
  )
}

