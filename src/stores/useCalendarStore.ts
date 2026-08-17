import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage } from 'element-plus'
import moment from 'moment'

export interface CalendarEvent {
  id: number | string,
  title: string,
  start: string,
  end: string,
  backgroundColor: string,
  borderColor: string,
  textColor: string,
  extendedProps: {
    status: string,
    phone: string,
    email: string,
    noOfParticipants: number,
    timeSlotId: number | string,
    bookingDate: string,
  }
}

export interface TimeSlot {
  id: number | string,
  slotTime: string,
  formattedLabel?: string,
  disabled?: boolean,
}

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    loading: false as Boolean,
    slotLoading: false as Boolean,
    bookings: [] as CalendarEvent[],
    availableSlots: [] as TimeSlot[],
    lastStartDate: null as string | null,
    lastEndDate: null as string | null,
  }),

  actions: {
    /* GET / FETCH CALENDAR EVENTS IN ACTIVE DATE RANGE */
    async fetchCalendarEvents(startDate?: string, endDate?: string) {
      this.loading = true
      if (startDate) this.lastStartDate = startDate
      if (endDate) this.lastEndDate = endDate

      try {
        let query = supabase
          .from('Booking')
          .select(`
            *,
            Service ( name ),
            Status ( name, color ),
            TimeSlot ( id, slotTime )
          `)

        if (startDate && endDate) {
          query = query.gte('bookingDate', startDate).lte('bookingDate', endDate)
        }

        const { data, error } = await query
        if (error) throw error

        this.bookings = (data || []).map((booking: any) => {
          const dateOnly = moment(booking.bookingDate).format('YYYY-MM-DD')
          const timeOnly = booking.TimeSlot?.slotTime || '00:00:00'
          const startDateTime = `${dateOnly}T${timeOnly}`
          const cardColor = booking.Status?.color || '#136cb3'

          return {
            id: booking.id,
            title: `${booking.fullName} - ${booking.Service?.name || 'Booking'}`,
            start: startDateTime,
            end: moment(startDateTime).add(1, 'hour').toISOString(),
            backgroundColor: cardColor,
            borderColor: cardColor,
            textColor: '#ffffff',
            extendedProps: {
              status: booking.Status?.name || 'Pending',
              phone: booking.phone,
              email: booking.email,
              noOfParticipants: booking.noOfParticipants,
              timeSlotId: booking.timeSlotId || booking.TimeSlot?.id,
              bookingDate: dateOnly
            }
          }
        })

        return this.bookings
      } catch (error) {
        console.error('Failed to load bookings:', error)
        ElMessage.error('Failed to load calendar events.')
        return []
      } finally {
        this.loading = false
      }
    },

    /* REFRESH CURRENT DATE RANGE (GET ONLY) */
    async refreshCurrentRange() {
      if (this.lastStartDate && this.lastEndDate) {
        return await this.fetchCalendarEvents(this.lastStartDate, this.lastEndDate)
      }
      return await this.fetchCalendarEvents()
    },

    /* GET / FETCH TIME SLOTS & DISABLE TAKEN ONES FOR TARGET DATE */
    async loadTimeSlotsForTargetDate(dateStr: string, currentBookingId: number | string) {
      this.slotLoading = true
      try {
        const { data: slots, error: slotsErr } = await supabase
          .from('TimeSlot')
          .select('*')
          .order('slotTime', { ascending: true })

        if (slotsErr) throw slotsErr

        const { data: existingBookings, error: bookingsErr } = await supabase
          .from('Booking')
          .select('id, timeSlotId')
          .eq('bookingDate', dateStr)

        if (bookingsErr) throw bookingsErr

        const takenSlotIds = (existingBookings || [])
          .filter((b: any) => String(b.id) !== String(currentBookingId))
          .map((b: any) => b.timeSlotId)

        this.availableSlots = (slots || []).map((slot: any) => {
          const isTaken = takenSlotIds.includes(slot.id)
          const formattedTime = moment(slot.slotTime, 'HH:mm:ss').format('h:mm A')

          return {
            ...slot,
            formattedLabel: formattedTime,
            disabled: isTaken
          }
        })
      } catch (error) {
        console.error('Failed to load slots:', error)
        ElMessage.error('Could not load time slots.')
      } finally {
        this.slotLoading = false
      }
    }
  }
})