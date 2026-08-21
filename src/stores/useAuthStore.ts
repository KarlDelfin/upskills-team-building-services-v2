import { defineStore } from 'pinia'
import { supabase } from '../utils/supabaseClient'
import { ElMessage, ElLoading } from 'element-plus'
import router from '../router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    loading: true as boolean, // Start true so app waits for init
  }),

  getters: {
    getUser: (state) => state.user,
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    setUser(user: any) {
      this.user = user
    },

    async initAuth() {
      try {
        this.loading = true

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session?.user?.email) {
          this.setUser(null)
          return
        }

        const userEmail = session.user.email

        // Check if email is whitelisted in database
        const { data, error } = await supabase
          .from('User')
          .select('email')
          .eq('email', userEmail)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          ElMessage.error(`Access Denied: ${userEmail} is not authorized.`)
          await supabase.auth.signOut()
          this.setUser(null)
          return
        }

        // Set verified user state
        this.setUser(session.user)
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.setUser(null)
      } finally {
        this.loading = false
      }
    },

    async handleSignOut() {
      try {
        this.loading = true
        await supabase.auth.signOut()
        this.setUser(null)
        ElMessage.info('Logged out securely.')
        router.push('/admin')
      } catch (error: any) {
        ElMessage.error(error?.message || 'Logout failed.')
      } finally {
        this.loading = false
      }
    },

    async handleGoogleLogin() {
      try {
        this.loading = true
        const REDIRECTION_URL = `${window.location.origin}/admin/booking`

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { 
            redirectTo: REDIRECTION_URL 
          }
        })

        if (error) throw error
      } catch (error: any) {
        ElMessage.error(`OAuth Initialization failure: ${error.message || error}`)
        this.loading = false
      }
    },
  },
})