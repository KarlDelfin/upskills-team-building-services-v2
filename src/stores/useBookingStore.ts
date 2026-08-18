import { defineStore } from 'pinia'
import moment from 'moment'
import { supabase } from '@/utils/supabaseClient'

import { ElMessage, ElMessageBox } from 'element-plus'
import debounce from 'lodash/debounce';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

import { useStatusStore, type BookingStatus } from './useStatusStore'
import { useTimeSlotStore, type BookingTimeSlot } from './useTimeSlotStore'
import { useServiceStore } from './useServiceStore'


const statusStore = useStatusStore()
const timeSlotStore = useTimeSlotStore()
const serviceStore = useServiceStore()


export interface BookingService {
  id: string | number
  name: string
  description?: string
  price?: number | string
}

export interface Booking {
  id: string | number
  serviceId: string | number
  statusId: any
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
    upcomingBookings: [] as Booking[],
    vCalendarEvents: [] as any,

    selectedDateStr: '',
    loading: false as boolean,
    search: '' as string,
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
      statusId: '' as any,
      timeSlotId: '' as string | number,
      bookingDate: '' as string,
      fullName: '' as string,
      email: '' as string,
      phone: '' as string,
      noOfParticipants: 1 as number
    },

    bookingPagination: {
      currentPage: 1,
      elementsPerPage: 5,
      totalElements: 0
    } as BookingPagination
  }),

  actions: {
     /* SEARCH BOOKING */
    searchBooking: debounce(function(this: any) {
        this.fetchBookings()
    }, 300),

    async fetchDashboardData() {
      this.loading = true
    
      try {
        await Promise.all([
        
          this.fetchBookings(),
          this.fetchUpcomingBookings()
        ])
        await this.fetchBookingMetrics()
      } catch (error) {
        console.error(error)
        ElMessage.error('Error fetching dashboard data.')
      } finally {
        this.loading = false
      }
    },

    async fetchBookings() {
      this.loading = true
      try {
        const limit = this.bookingPagination.elementsPerPage
        const from = (this.bookingPagination.currentPage - 1) * limit
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

        if (this.search && this.search.trim() !== '') {
          const searchPattern = `%${this.search.trim()}%`
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

        this.bookingPagination.totalElements = count || 0
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

    async fetchBookingMetrics() {
      try {
        const pendingStatus = statusStore.bookingStatuses.find((s: any) => s.name?.toLowerCase() === 'pending'
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

    /* OPEN FORM */
    async formController(title: string, data: any) {
      try {
        this.title = title
        this.dialog.booking = true
        this.loading = true

        await Promise.all([
          statusStore.fetchBookingStatuses(),
          timeSlotStore.fetchTimeSlots(),
          serviceStore.fetchServices(),
        ])

        if (title === 'Create Booking') {
          const pendingStatus = statusStore.bookingStatuses.find(s => s.name?.toLowerCase() === 'pending')
          if (pendingStatus) this.bookingForm.statusId = pendingStatus.id
        }
        
        if (title === 'Edit Booking' && data) {
          this.bookingForm = {
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
        this.loading = false
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
          const { error } = await supabase
            .from('Booking')
            .insert(payload)

          if (error) throw error

          ElMessage.success('Booking created successfully.')
        } 
        
        if (this.title === 'Edit Booking') {
          const { error } = await supabase
            .from('Booking')
            .update(payload)
            .eq('id', this.bookingForm.id)

          if (error) throw error

          ElMessage.success('Booking updated successfully.')
        }

        this.clear()
        await this.fetchDashboardData()
      } catch (error) {
        console.error(error)
        ElMessage.error(error || 'Failed to save booking.')
      } finally {
        this.loading = false
      }
    },

    /* DELETE BOOKING */
    async handleDelete(id: string | number) {
      try {
        await ElMessageBox.confirm('Do you want to delete this booking?', 'Warning', {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
            icon: markRaw(Delete),
        })

        this.loading = true

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
      this.vCalendarEvents = []
      this.selectedDateStr = ''

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

      timeSlotStore.timeSlots = timeSlotStore.timeSlots.map((slot: any) => ({
        ...slot,
        disabled: false
      }))

      this.dialog.booking = false
    },

    async handleSelectDate(day: any) {
      try {
        const selected = moment(day.date).startOf('day')
        const today = moment().startOf('day')
        
        if (selected.isBefore(today) && this.title === 'Create Booking') {
          ElMessage.warning('Cannot select past date');
          return;
        }
        
        this.selectedDateStr = selected.format('YYYY-MM-DD')
        this.bookingForm.bookingDate = moment(selected).add(1, 'days').toISOString()
        this.vCalendarEvents = [{
          highlight: { backgroundColor: '#ff8080' },
          dates: day.date instanceof Date ? day.date : new Date(day.date)
        }]
        
        const startOfDay = selected.format('YYYY-MM-DD 00:00:00')
        const endOfDay = selected.clone().endOf('day').format('YYYY-MM-DD 23:59:59')
        
        const { data, error } = await supabase
          .from('Booking')
          .select('timeSlotId')
          .gte('bookingDate', startOfDay)
          .lte('bookingDate', endOfDay)

        if (error) throw error

        const bookedTimeSlotIds = new Set(data.map((item: any) => item.timeSlotId))

        timeSlotStore.timeSlots = timeSlotStore.timeSlots.map((slot) => ({
          ...slot,
          disabled: bookedTimeSlotIds.has(slot.id)
        }))

      } catch (error: any) {
        console.error(error)
      }
    },

    handleSelectTime(timeSlotId: string | number): void {
      this.bookingForm.timeSlotId = timeSlotId
    },

    async handleStatusChange(row: Booking): Promise<void> {
      try {
        this.loading = true
        const { error } = await supabase
          .from('Booking')
          .update({ statusId: row.statusId })
          .eq('id', row.id)

        if (error) throw error

        ElMessage.success('Booking status updated successfully.')
        await this.fetchDashboardData()
      } catch (error: any) {
        console.error(error)
        ElMessage.error(error.message || 'Failed to update status.')
      } finally {
        this.loading = false
      }
    },

  }
})