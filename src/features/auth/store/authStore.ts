import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase/client'
import type { Tables } from '../../../types/database.types'

type Profile = Tables<'profiles'>
type Organization = Tables<'organizations'>

type AuthStatus = 'loading' | 'signed_out' | 'signed_in'

interface AuthState {
  status: AuthStatus
  session: Session | null
  profile: Profile | null
  organization: Organization | null
  error: string | null
  init: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    orgName: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

async function loadProfileAndOrg(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return { profile: null, organization: null }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.org_id)
    .maybeSingle()

  return { profile, organization: organization ?? null }
}

let initialized = false

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  organization: null,
  error: null,

  init: () => {
    if (initialized) return
    initialized = true

    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        set({ status: 'signed_out', session: null, profile: null, organization: null })
        return
      }

      set({ status: 'loading', session })
      loadProfileAndOrg(session.user.id).then(({ profile, organization }) => {
        set({ status: 'signed_in', session, profile, organization })
      })
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  },

  signUp: async (email, password, fullName, orgName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || undefined,
          org_name: orgName || undefined,
        },
      },
    })

    if (error) return { error: error.message, needsEmailConfirmation: false }

    return { error: null, needsEmailConfirmation: !data.session }
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
