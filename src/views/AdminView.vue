<template>
  <Login v-if="!authStore.getUser" />

  <div v-else class="flex h-screen overflow-hidden">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-y-auto">
      <el-header class="!flex bg-white border-b justify-end items-center px-6 h-16 shrink-0">
        <div class="flex items-center gap-3 justify-between w-full">
          <h1 class="!text-lg !font-bold m-0">{{ $route.name }}</h1>
          <el-button 
            type="danger" 
            size="small" 
            plain 
            @click="authStore.handleSignOut()"
          >
            Sign Out
          </el-button>
        </div>
      </el-header>

      <main class="flex-1 p-6 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script lang="ts">
import { supabase } from '@/utils/supabaseClient'
import { useAuthStore } from '@/stores/useAuthStore'

import Sidebar from '@/components/Sidebar.vue'
import Login from '@/components/Login.vue'

export default {
  components: {
    Sidebar, 
    Login,
  },

  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },

  mounted() {
    this.authStore.initAuth()

   /*  if(this.authStore.getUser) {
      this.$router.push('/admin/booking')
    } */

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this.authStore.setUser(null)
      } else if (session?.user) {
        this.authStore.setUser(session.user)
      }
      this.authStore.loading = false
    })
  }
}
</script>