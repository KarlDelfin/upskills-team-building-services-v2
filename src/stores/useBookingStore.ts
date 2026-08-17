import { defineStore } from 'pinia'
import moment from 'moment'
import { supabase } from '@/utils/supabaseClient'
import { useBookingStatusStore, type BookingStatus } from './useBookingStatusStore'
import { useTimeSlotStore, type BookingTimeSlot } from './useTimeSlotStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import debounce from 'lodash/debounce';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export interface BookingService {
  id: string | number
  name: string
  description?: string
  price?: number | string
}

export interface Booking {
  id: string | number
  serviceId: string | number
  statusId: string | number
  timeSlotId: string | number
  bookingDate: string
  fullName: string
  email: string
  phone: string
  noOfParticipants: number
  formattedBookingDate?: string
  formattedSlotTime?: string
  dateTimeCreated?: string
  Service?: BookingService
  Status?: BookingStatus
  TimeSlot?: BookingTimeSlot
}

export interface BookingMetrics {
  totalBookings: number
  pendingBookings: number
}

export interface BookingPagination {
  currentPage: number
  elementsPerPage: number
  totalElements: number
}

export const useBookingStore = defineStore('booking', {

  state: () => ({
    bookings: [] as Booking[],
    services: [] as BookingService[],
    statuses: [] as BookingStatus[],
    timeSlots: [] as BookingTimeSlot[],
    upcomingBookings: [] as Booking[],
    loading: false as boolean,
    searchQuery: '' as string,
    title: 'Create Booking' as string,
    dialog: {
      booking: false
    },

    metrics: {
      totalBookings: 0,
      pendingBookings: 0
    } as BookingMetrics,

    bookingForm: {
      id: '' as string | number,
      serviceId: '' as string | number,
      statusId: '' as string | number,
      timeSlotId: '' as string | number,
      bookingDate: '' as string,
      fullName: '' as string,
      email: '' as string,
      phone: '' as string,
      noOfParticipants: 1 as number
    },

    pagination: {
      currentPage: 1,
      elementsPerPage: 5,
      totalElements: 0
    } as BookingPagination
  }),

  actions: {
     /* SEARCH BOOKING */
    searchBookingStatus: debounce(function(this: any) {
        this.fetchBookings()
    }, 300),

    async fetchDashboardData() {
      this.loading = true
      const statusStore = useBookingStatusStore()
      const timeSlotStore = useTimeSlotStore()
      try {
        await Promise.all([
          this.statuses = statusStore.fetchBookingStatuses(),
          this.timeSlots = timeSlotStore.fetchTimeSlots(),
          this.fetchBookings(),
          this.fetchUpcomingBookings()
        ])
        await this.getBookingMetrics()
      } catch (error) {
        console.error(error)
        ElMessage.error('Error fetching dashboard data.')
      } finally {
        this.loading = false
      }
    },

  /*   async fetchStatuses() {
      try {
        const { data, error } = await supabase.from('Status').select('*')
        if (error) throw error
        this.statuses = data || []
      } catch (error) {
        console.error(error)
      }
    },

    async fetchTimeSlots() {
      try {
        const { data, error } = await supabase
          .from('TimeSlot')
          .select('*')
          .eq('isActive', true)
          .order('slotTime', { ascending: true })

        if (error) throw error

        this.timeSlots = (data || []).map((slot: any): BookingTimeSlot => ({
          ...slot,
          formattedTime: moment(slot.slotTime, 'HH:mm:ss').format('h:mm A'),
          disabled: false
        }))
      } catch (error) {
        console.error(error)
      }
    },

    async fetchServices() {
      try {
        let query = supabase.from('Service').select('*')

        if (searchValue !== '') {
          const searchPattern = `%${searchValue}%`
          query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
        }

        query = query.order('dateTimeCreated', { ascending: false })

        const { data, error } = await query
        if (error) throw error

        this.services = data || []
      } catch (error) {
        console.error(error)
      }
    }, */

    async fetchBookings() {
      this.loading = true
      try {
        const limit = this.pagination.elementsPerPage
        const from = (this.pagination.currentPage - 1) * limit
        const to = from + limit - 1

        let query = supabase
          .from('Booking')
          .select(
            `
            *,
            Service ( id, name, description, price ),
            Status ( id, name, color ),
            TimeSlot ( id, slotTime )
            `,
            { count: 'exact' }
          )

        if (this.searchQuery && this.searchQuery.trim() !== '') {
          const searchPattern = `%${this.searchQuery.trim()}%`
          query = query.or(`fullName.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`)
        }

        query = query.order('dateTimeCreated', { ascending: false }).range(from, to)

        const { data, error, count } = await query
        if (error) throw error

        this.bookings = (data || []).map((item: any): Booking => ({
          ...item,
          formattedBookingDate: moment(item.bookingDate).format('LL'),
          formattedSlotTime: item.TimeSlot?.slotTime
            ? moment(item.TimeSlot.slotTime, 'HH:mm:ss').format('h:mm A')
            : '',
          dateTimeCreated: moment(item.dateTimeCreated).format('LLL')
        }))

        this.pagination.totalElements = count || 0
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    async fetchUpcomingBookings() {
      try {
        const startOfToday = moment().startOf('day').toISOString()

        const { data, error } = await supabase
          .from('Booking')
          .select(
            `*,
            TimeSlot ( id, slotTime )`
          )
          .gte('bookingDate', startOfToday)
          .order('bookingDate', { ascending: true })

        if (error) throw error

        this.upcomingBookings = (data || []).map((item: any): Booking => ({
          ...item,
          formattedBookingDate: moment(item.bookingDate).format('MMMM DD, YYYY'),
          formattedSlotTime: item.TimeSlot?.slotTime
            ? moment(item.TimeSlot.slotTime, 'HH:mm:ss').format('h:mm A')
            : ''
        }))
      } catch (error) {
        console.error(error)
      }
    },

    async getBookingMetrics() {
      try {
        const pendingStatus = this.statuses.find((s: any) => s.name?.toLowerCase() === 'pending'
        )

        const [totalBookings, totalPending] = await Promise.all([
          supabase.from('Booking').select('*', { count: 'exact', head: true }),
          pendingStatus
            ? supabase
                .from('Booking')
                .select('*', { count: 'exact', head: true })
                .eq('statusId', pendingStatus.id)
            : { count: 0, error: null }
        ])

        if (totalBookings.error) throw totalBookings.error

        this.metrics.totalBookings = totalBookings.count || 0
        this.metrics.pendingBookings = totalPending.count || 0
      } catch (error) {
        console.error(error)
      }
    },

    /* CREATE / UPDATE FORM */
    async submitForm() {
      this.loading = true
      try {
        const payload = {
          serviceId: this.bookingForm.serviceId,
          statusId: this.bookingForm.statusId,
          bookingDate: this.bookingForm.bookingDate,
          timeSlotId: this.bookingForm.timeSlotId,
          fullName: this.bookingForm.fullName,
          email: this.bookingForm.email,
          phone: this.bookingForm.phone,
          noOfParticipants: this.bookingForm.noOfParticipants
        }

        if (this.title === 'Create Booking') {
          const { error } = await supabase.from('Booking').insert(payload)
          if (error) throw error
          ElMessage.success('Booking created successfully.')
        } else if (this.title === 'Edit Booking') {
          const { error } = await supabase
            .from('Booking')
            .update(payload)
            .eq('id', this.bookingForm.id)

          if (error) throw error
          ElMessage.success('Booking updated successfully.')
        }

        await this.fetchDashboardData()
        return true
      } catch (error) {
        console.error(error)
        ElMessage.error(error || 'Failed to save booking.')
        return false
      } finally {
        this.loading = false
      }
    },

    /* DELETE BOOKING */
    async handleDelete(id: string | number) {
      try {
        this.loading = true

        await ElMessageBox.confirm('Do you want to delete this booking?', 'Warning', {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
            icon: markRaw(Delete),
        })

        const { error } = await supabase
          .from('Booking')
          .delete()
          .eq('id', id)

        if (error) throw error

        ElMessage.success('Booking deleted successfully.')
        await this.fetchDashboardData()
         
      } catch (error) {
          console.error(error)
      } finally {
        this.loading = false
      }
    },

    /* CLEAR FORM */
    clear() {
      Object.assign(this.bookingForm, {
        id: '',
        serviceId: '',
        statusId: '',
        timeSlotId: '',
        bookingDate: '',
        fullName: '',
        email: '',
        phone: '',
        noOfParticipants: 1
      })
      this.timeSlots = this.timeSlots.map((slot: any) => ({
        ...slot,
        disabled: false
      }))
    },

    resetSearch() {
      this.searchQuery = ''
      this.pagination.currentPage = 1
    },

    async formController(title: string, data: Booking) {
      try {
        this.title = title
        this.dialog.booking = true
        this.bookingStore.loading = true

        await Promise.all([this.bookingStore.getServices(''), this.bookingStore.getTimeSlots()])

        if (title === 'Create Booking') {
          this.bookingStore.clear()
          const pendingStatus = this.bookingStore.statuses.find(s => s.name?.toLowerCase() === 'pending')
          if (pendingStatus) this.bookingStore.bookingForm.statusId = pendingStatus.id
        } else if (title === 'Edit Booking' && data) {
          this.bookingStore.bookingForm = {
            id: data.id || '',
            serviceId: data.Service?.id || data.serviceId || '',
            statusId: data.Status?.id || data.statusId || '',
            timeSlotId: data.timeSlotId || '',
            bookingDate: data.bookingDate || '',
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            noOfParticipants: data.noOfParticipants || 1
          }

          const datePart = moment(data.bookingDate).format('YYYY-MM-DD')
          await this.handleSelectDate({ date: datePart })
        }
      } catch (error: any) {
        console.error(error)
      } finally {
        this.bookingStore.loading = false
      }
    },
  }
})