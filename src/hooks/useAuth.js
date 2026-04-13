import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const DEV_USER = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'
  ? { id: '00000000-0000-0000-0000-000000000000', email: 'dev@localhost' }
  : null

export function useAuth() {
  const [user, setUser] = useState(DEV_USER)
  const [session, setSession] = useState(DEV_USER ? { user: DEV_USER } : null)
  const [loading, setLoading] = useState(!DEV_USER)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (DEV_USER) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }

  return { user, session, loading, signOut, recoveryMode, setRecoveryMode }
}
