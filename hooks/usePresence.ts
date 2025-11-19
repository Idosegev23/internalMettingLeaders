import { useState, useEffect, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'

interface UsePresenceResult {
  activeCount: number
  isConnected: boolean
}

export function usePresence(formId: string | null): UsePresenceResult {
  const [activeCount, setActiveCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)
  const sessionId = useRef(Math.random().toString(36).substring(7))

  useEffect(() => {
    if (!formId) {
      setActiveCount(0)
      setIsConnected(false)
      return
    }

    const supabase = getSupabase()
    const channel = supabase.channel(`presence:form:${formId}`, {
      config: {
        presence: {
          key: sessionId.current
        }
      }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setActiveCount(count)
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setActiveCount(count)
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        setActiveCount(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          await channel.track({
            online_at: new Date().toISOString()
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack()
        supabase.removeChannel(channelRef.current)
      }
      setIsConnected(false)
      setActiveCount(0)
    }
  }, [formId])

  return {
    activeCount,
    isConnected
  }
}

