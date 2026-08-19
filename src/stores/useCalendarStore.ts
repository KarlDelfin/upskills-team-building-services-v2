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
   
    bookings: [] as CalendarEvent[],
    lastStartDate: null as string | null,
    lastEndDate: null as string | null,

    unassignedBookings: [] as any[],

    availableSlots: [] as any[],

    loading: {
      calendar: false,
      createEvent: false,
      viewEvent: false,
      slot: false,
    },

    dialog: {
      createEvent: false,
      viewEvent: false
    }
  }),

  actions: {
    async fetchCalendarEvents(startDate?: string, endDate?: string) {
      this.loading.calendar = true
      if (startDate) this.lastStartDate = startDate
      if (endDate) this.lastEndDate = endDate

      try {
        let query = supabase
          .from('Event')
          .select(`
            id,
            eventDate,
            bookingId,
            Booking (
              id,
              fullName,
              phone,
              email,
              noOfParticipants,
              Service ( name ),
              Status ( name, color ),
              TimeSlot ( id, slotTime )
            )
          `)

        if (startDate && endDate) {
          query = query.gte('eventDate', startDate).lte('eventDate', endDate)
        }

        const { data, error } = await query
        if (error) throw error

        this.bookings = data.map((event: any) => {
          const booking = event.Booking
          const dateOnly = moment(event.eventDate).format('YYYY-MM-DD')
          const timeOnly = booking?.TimeSlot?.slotTime || '00:00:00'
          const startDateTime = `${dateOnly}T${timeOnly}`
          const cardColor = booking?.Status?.color || '#136cb3'

          return {
            id: event.id,
            title: `${booking?.fullName || 'Client'} - ${booking?.Service?.name || 'Booking'}`,
            start: startDateTime,
            end: moment(startDateTime).add(1, 'hour').toISOString(),
            backgroundColor: cardColor,
            borderColor: cardColor,
            textColor: '#ffffff',
            extendedProps: {
              title: `${booking?.fullName || 'Client'} - ${booking?.Service?.name || 'Booking'}`,
              eventId: event.id,
              bookingId: event.bookingId,
              status: booking?.Status?.name || 'Pending',
              phone: booking?.phone,
              email: booking?.email,
              noOfParticipants: booking?.noOfParticipants,
              timeSlotId: booking?.TimeSlot?.id,
              slotTime: moment(booking?.TimeSlot?.slotTime, 'HH:mm:ss').format('h:mm A'),
              bookingDate: dateOnly
            }
          }
        })

      } catch (error) {
        console.error('Failed to load events:', error)
        ElMessage.error('Failed to load calendar events.')
      } finally {
        this.loading.calendar = false
      }
    },

    async fetchUnassignedBookings() {
      const { data, error } = await supabase
        .from('Booking')
        .select('*')

        if(error) throw error

        this.unassignedBookings = data || []
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
      this.loading.slot = true
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
        this.loading.slot = false
      }
    },

    /* CREATE EVENT RECORD IN DB */
    async createCalendarEvent(bookingId: number | string, dateStr: string) {
      this.createEventLoading = true
      try {
        const { data, error } = await supabase
          .from('Event')
          .insert({
            bookingId: bookingId,
            eventDate: dateStr,
            dateTimeCreated: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        ElMessage.success('Event added to calendar successfully!')
        return data
      } catch (error) {
        console.error('Error creating event:', error)
        ElMessage.error('Failed to add event to calendar.')
        return null
      } finally {
        this.createEventLoading = false
      }
    },
  }
})