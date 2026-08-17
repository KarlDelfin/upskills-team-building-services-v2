import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage } from 'element-plus'
import gsap from 'gsap'
import moment from 'moment'

export interface ServiceItem {
  id: string
  name: string
  description?: string
  dateTimeCreated?: string
}

export interface StatusItem {
  id: string
  name: string
}

export interface TimeSlotItem {
  id: string
  slotTime: string
  isActive: boolean
  formattedTime?: string
  disabled?: boolean
}

export interface CalendarAttribute {
  highlight: { backgroundColor: string }
  dates: Date
}

export interface StepItem {
  number: number
  title: string
  desc: string
}

export interface BookingFormData {
  serviceId: string
  bookingDate: string
  timeSlotId: string
  statusId: string
  fullName: string
  email: string
  phone: string
  noOfParticipants: number
}

export interface BookingState {
  sitekey: string
  loading: boolean
  formStep: number
  captchaToken: string | null
  services: ServiceItem[]
  statuses: StatusItem[]
  timeSlots: TimeSlotItem[]
  vCalendarEvents: CalendarAttribute[]
  steps: StepItem[]
  bookingForm: BookingFormData
}

export const useBookingStore = defineStore('booking', {
  state: (): BookingState => ({
    sitekey: import.meta.env.VITE_HCAPTCHA_SITE_KEY as string,
    loading: false,
    formStep: 1,
    captchaToken: null,
    services: [],
    statuses: [],
    timeSlots: [],
    vCalendarEvents: [],
    steps: [
      { number: 1, title: 'Training Program', desc: 'Select the workshop or training service' },
      { number: 2, title: 'Schedule', desc: 'Choose your preferred date and time' },
      { number: 3, title: 'Organization Details', desc: 'Provide your contact and company information' }
    ],
    bookingForm: {
      serviceId: '',
      bookingDate: '',
      timeSlotId: '',
      statusId: '',
      fullName: '',
      email: '',
      phone: '',
      noOfParticipants: 1
    }
  }),

  actions: {
    setCaptchaToken(token: string | null): void {
      this.captchaToken = token
    },

    async fetchInitialData(): Promise<void> {
      await Promise.all([
        this.getServices(),
        this.getStatuses(),
        this.getTimeSlots()
      ])
    },

    async getStatuses(): Promise<void> {
      try {
        const { data, error } = await supabase.from('Status').select('*')
        if (error) throw error
        this.statuses = (data as StatusItem[]) || []

        const pendingStatus = this.statuses.find(s => s.name?.toLowerCase() === 'pending')
        if (pendingStatus) {
          this.bookingForm.statusId = pendingStatus.id
        }
      } catch (err) {
        console.error('Error fetching statuses:', err)
      }
    },

    async getTimeSlots(): Promise<void> {
      try {
        const { data, error } = await supabase
          .from('TimeSlot')
          .select('*')
          .eq('isActive', true)
          .order('slotTime', { ascending: true })

        if (error) throw error

        this.timeSlots = ((data as TimeSlotItem[]) || []).map(slot => ({
          ...slot,
          formattedTime: moment(slot.slotTime, 'HH:mm:ss').format('h:mm A'),
          disabled: false
        }))
      } catch (err) {
        console.error('Error fetching time slots:', err)
      }
    },

    async getServices(): Promise<void> {
      try {
        this.loading = true
        const { data, error } = await supabase
          .from('Service')
          .select('*')
          .order('dateTimeCreated', { ascending: false })

        if (error) throw error
        this.services = (data as ServiceItem[]) || []
      } catch (err) {
        console.error('Error fetching services:', err)
        ElMessage.error('Failed to load training services.')
      } finally {
        this.loading = false
      }
    },

    goToStep(step: number, action: 'next' | 'back'): void {
      if (action === 'back') {
        this.formStep = step
        return
      }

      if (this.formStep === 1 && !this.bookingForm.serviceId) {
        ElMessage.warning('Please select a service.')
        return
      }

      if (this.formStep === 2) {
        if (!this.bookingForm.bookingDate) {
          ElMessage.warning('Please select a preferred date.')
          return
        }
        if (!this.bookingForm.timeSlotId) {
          ElMessage.warning('Please select a preferred time slot.')
          return
        }
      }

      this.formStep = step
    },

    handleSelectService(serviceId: string): void {
      this.bookingForm.serviceId = serviceId
    },

    async handleSelectDate(day: { date: Date }): Promise<void> {
      this.bookingForm.bookingDate = ''
      this.bookingForm.timeSlotId = ''

      const today = moment().startOf('day')
      const targetDate = moment(day.date).startOf('day')

      if (targetDate < today) {
        ElMessage.warning('Cannot select a past date.')
        return
      }

      this.bookingForm.bookingDate = targetDate.toISOString()

      this.vCalendarEvents = [
        {
          highlight: { backgroundColor: 'var(--priColor, #3b82f6)' },
          dates: new Date(day.date)
        }
      ]

      try {
        const startOfDay = targetDate.format('YYYY-MM-DD 00:00:00')
        const endOfDay = targetDate.format('YYYY-MM-DD 23:59:59')

        const { data, error } = await supabase
          .from('Booking')
          .select('timeSlotId')
          .gte('bookingDate', startOfDay)
          .lte('bookingDate', endOfDay)

        if (error) throw error

        const bookedTimeSlotIds = new Set((data || []).map((item: { timeSlotId: string }) => item.timeSlotId))

        this.timeSlots = this.timeSlots.map(slot => ({
          ...slot,
          disabled: bookedTimeSlotIds.has(slot.id)
        }))
      } catch (err) {
        console.error('Error fetching booked slots:', err)
      }
    },

    handleSelectTime(timeSlotId: string): void {
      this.bookingForm.timeSlotId = timeSlotId
    },

    async submitBooking(formRef: { validate: () => Promise<boolean> } | null): Promise<void> {
      try {
        if (!formRef) return
        await formRef.validate()

        if (!this.captchaToken) {
          ElMessage.warning('Please check the security box before submitting.')
          return
        }

        if (!this.bookingForm.statusId) {
          const pendingStatus = this.statuses.find(s => s.name?.toLowerCase() === 'pending')
          if (pendingStatus) this.bookingForm.statusId = pendingStatus.id
        }

        this.loading = true

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

        const { error } = await supabase.from('Booking').insert(payload)
        if (error) throw error

        try {
          await supabase.functions.invoke('send-booking-email', {
            body: {
              clientName: payload.fullName,
              clientEmail: payload.email,
              clientPhone: payload.phone,
              bookingDate: payload.bookingDate,
              timeSlotId: payload.timeSlotId,
              noOfParticipants: payload.noOfParticipants
            }
          })
        } catch (emailErr) {
          console.error('Database saved, but email trigger failed:', emailErr)
        }

        ElMessage.success('Booking submitted successfully.')
        this.clear()
      } catch (err) {
        console.error('Booking submission error:', err)
      } finally {
        this.loading = false
      }
    },

    clear(): void {
      const pendingStatus = this.statuses.find(s => s.name?.toLowerCase() === 'pending')

      Object.assign(this.bookingForm, {
        serviceId: '',
        bookingDate: '',
        timeSlotId: '',
        statusId: pendingStatus ? pendingStatus.id : '',
        fullName: '',
        email: '',
        phone: '',
        noOfParticipants: 1
      })

      this.vCalendarEvents = []
      this.timeSlots = this.timeSlots.map(s => ({ ...s, disabled: false }))

      setTimeout(() => {
        this.formStep = 1
      }, 500)

      gsap.to('#bookingForm', {
        opacity: 0,
        y: window.innerHeight,
        duration: 0.5,
        ease: 'back.in'
      })
    }
  }
})