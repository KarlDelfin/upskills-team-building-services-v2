import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import moment from 'moment'
import { supabase } from '@/utils/supabaseClient'

export const useServiceStore = defineStore('service', {
  state: () => ({
    services: [],

    loading: false,

    searchQuery: '',
    
    pagination: {
      currentPage: 1,
      elementsPerPage: 10,
      totalElements: 0
    }
  }),

  actions: {
    /* GET / FETCH SERVICES WITH PAGINATION & SEARCH */
    async fetchServices() {
      this.loading = true
      try {
        const limit = this.pagination.elementsPerPage
        const from = (this.pagination.currentPage - 1) * limit
        const to = from + limit - 1

        let query = supabase
          .from('Service')
          .select('*', { count: 'exact' })

        if (this.searchQuery && this.searchQuery.trim() !== '') {
          query = query.ilike('name', `%${this.searchQuery.trim()}%`)
        }

        query = query.order('dateTimeCreated', { ascending: false }).range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        this.services = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          dateTimeCreated: item.dateTimeCreated
            ? moment(item.dateTimeCreated).format('MMMM DD, YYYY HH:mm:ss')
            : ''
        }))
        this.pagination.totalElements = count || 0
      } catch (error) {
        console.error(error)
        ElMessage.error(`Error loading services: ${error.message || error}`)
      } finally {
        this.loading = false
      }
    },

    /* RESET SEARCH QUERY & PAGINATION */
    resetSearch() {
      this.searchQuery = ''
      this.pagination.currentPage = 1
    }
  }
})