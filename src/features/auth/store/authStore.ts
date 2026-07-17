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
  setOrganization: (organization: Organization) => void
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

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  profile: null,
  organization: null,
  error: null,

  init: () => {
    if (initialized) return
    initialized = true

    // Safety net: if we're still stuck on "loading" after a few seconds
    // (stale/invalid session, network hiccup during profile lookup, ...),
    // don't leave the app spinning forever — force back to signed-out.
    const stuckTimeout = setTimeout(() => {
      if (get().status === 'loading') {
        void supabase.auth.signOut()
        set({ status: 'signed_out', session: null, profile: null, organization: null })
      }
    }, 8000)

    supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        clearTimeout(stuckTimeout)
        set({ status: 'signed_out', session: null, profile: null, organization: null })
        return
      }

      // Supabase re-fires SIGNED_IN (not just TOKEN_REFRESHED/USER_UPDATED)
      // on tab focus/visibility changes, not only on an actual new sign-in.
      // Treating every event as a fresh sign-in bounced the whole app
      // through a loading spinner — remounting every route — on each one.
      // If we already have this exact user loaded, just refresh the session
      // reference instead of redoing the full profile/org fetch.
      const current = get()
      const sameUserAlreadyLoaded =
        current.status === 'signed_in' && current.session?.user.id === session.user.id
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || sameUserAlreadyLoaded) {
        set({ session })
        return
      }

      set({ status: 'loading', session })
      loadProfileAndOrg(session.user.id)
        .then(({ profile, organization }) => {
          clearTimeout(stuckTimeout)
          set({ status: 'signed_in', session, profile, organization })
        })
        .catch(() => {
          clearTimeout(stuckTimeout)
          void supabase.auth.signOut()
          set({ status: 'signed_out', session: null, profile: null, organization: null })
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

  setOrganization: (organization) => set({ organization }),
}))
