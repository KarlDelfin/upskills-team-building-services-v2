import { defineStore } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import { supabase } from '@/utils/supabaseClient'
import debounce from 'lodash/debounce';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export interface Service {
  id: string | number
  name: string
  description: string
  price: number | string
  dateTimeCreated?: string
}

export interface ServicePagination {
  currentPage: number
  elementsPerPage: number
  totalElements: number
}

export const useServiceStore = defineStore('service', {
  state: () => ({
    services: [] as Service[],
    loading: false as boolean,
    search: '' as string,
    title: '' as string,
    dialog: {
      service: false,
    },

    serviceForm: {
      id: '' as string | number,
      name: '' as string,
      description: '' as string,
      price: '' as string | number
    },

    servicePagination: {
      currentPage: 1,
      elementsPerPage: 10,
      totalElements: 0
    } as ServicePagination
  }),

  actions: {
    searchService: debounce(function(this: any) {
        this.fetchServices()
    }, 300),
    
    /* GET */
    async fetchServices() {
      this.loading = true
      try {
        const limit = this.servicePagination.elementsPerPage
        const from = (this.servicePagination.currentPage - 1) * limit
        const to = from + limit - 1

        let query = supabase
          .from('Service')
          .select('*', { count: 'exact' })

        if (this.search && this.search.trim() !== '') {
          query = query.ilike('name', `%${this.search.trim()}%`)
        }

        query = query.order('dateTimeCreated', { ascending: false }).range(from, to)

        const { data, error, count } = await query
        if (error) throw error

        this.services = (data || []).map((item: any): Service => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          dateTimeCreated: item.dateTimeCreated
            ? moment(item.dateTimeCreated).format('MMMM DD, YYYY HH:mm:ss')
            : ''
        }))
        this.servicePagination.currentPage = this.servicePagination.currentPage;
        this.servicePagination.totalElements = count || 0
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    /* CREATE / UPDATE FORM */
    async submitForm() {
      this.loading = true

      try {
        const payload = {
          name: this.serviceForm.name,
          description: this.serviceForm.description,
          price: Number(this.serviceForm.price)
        }

        if (this.title === 'Create Service') {
          const { error } = await supabase
            .from('Service')
            .insert(payload)

          if (error) throw error

          ElMessage.success('Service created successfully.')
        } 
        
        if (this.title === 'Edit Service') {
          const { error } = await supabase
            .from('Service')
            .update(payload)
            .eq('id', this.serviceForm.id)

          if (error) throw error

          ElMessage.success('Service updated successfully.')
        }

        await this.fetchServices()
        this.clear()
      } catch (error) {
        console.error(error)
        ElMessage.error(error || 'Failed to update service.')
      } finally {
        this.loading = false
      }
    },

    /* DELETE */
    async deleteService(id: string) {
      try {
        await ElMessageBox.confirm('Do you want to delete this service?', 'Warning', {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
            icon: markRaw(Delete),
        })

        this.loading = true

        const { error } = await supabase
          .from('Service')
          .delete()
          .eq('id', id)

        if (error) throw error

        ElMessage.success('Service deleted successfully.')
        await this.fetchServices()

      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    /* DIALOG CONTROLLER */
    formController(title: string, service: any) {
        this.title = title
        this.dialog.service = true

        if(title == "Create Service") {}

        if(title == "Edit Service") {
            this.serviceForm = { ...service }
        }
    },

    /* CLEAR */
    clear() {
      Object.assign(this.serviceForm, {
        id: '',
        name: '',
        description: '',
        price: ''
      })

      this.dialog.service = false
    },
  }
})