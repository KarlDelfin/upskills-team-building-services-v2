import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import { markRaw } from 'vue'

import { Delete } from '@element-plus/icons-vue'

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

export interface CalendarEventForm {
  id: string,
  bookingId: string | any,
  eventDate: string,
  dateTimeCreated: string
}

export interface TimeSlot {
  id: number | string,
  slotTime: string,
  formattedLabel?: string,
  disabled?: boolean,
}

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    title: '',
    calendarEventForm: {} as CalendarEventForm,

    events: [] as CalendarEvent[],
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

          this.events = data.map((event: any) => {
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
      try {
        const { data: existingEvents, error: eventErr } = await supabase.from('Event').select('bookingId')
        if (eventErr) throw eventErr

        const assignedBookingIds = (existingEvents || []).map((e: any) => e.bookingId)

        let query = supabase
          .from('Booking')
          .select(`*, Service(name)`)

        if (assignedBookingIds.length > 0) {
          query = query.not('id', 'in', `(${assignedBookingIds.join(',')})`)
        }

        const { data, error } = await query
        if (error) throw error

        this.unassignedBookings = data || []
      } catch (error) {
        console.error('Error fetching unassigned bookings:', error)
      }
    },

    formController(action: string, data: any) {
      if(action === 'Schedule Booking to Calendar') {
        this.title = action
        this.dialog.createEvent = true
        this.fetchUnassignedBookings()
      }
    },

    async submitForm() {
      /* SCHEDULE BOOKING */
      if(this.title === 'Schedule Booking to Calendar') {
        try{
          this.loading.createEvent = true

          const payload = {
            bookingId: this.calendarEventForm.bookingId,
            eventDate: this.calendarEventForm.eventDate
          }

          const { data, error} = await supabase
            .from('Event')
            .insert(payload)

          if(error) throw error

          ElMessage.success('Event scheduled successfully.')
          this.clear()
        }
        catch(error) {
          console.log(error)
          ElMessage.error('Failed to schedule event!')
        }
        finally {
          this.loading.createEvent = false
        }
      }

      /* RESCHEDULE BOOKING EVENT DATE */
      if(this.title === 'Reschedule Booking Event Date') {
        try{
          this.loading.calendar = true

          const payload = {
            eventDate: this.calendarEventForm.eventDate
          }

          const { data, error } = await supabase
            .from('Event')
            .update(payload)
            .eq('id', this.calendarEventForm.id)

          if(error) throw error

          ElMessage.success('Event rescheduled successfully.')
          
          this.clear()

        } catch(error) {
          console.log(error)
          ElMessage.error('Failed to reschedule event!')
        } finally {
          this.loading.calendar = false
        }
      }
    },

    async handleDeleteEvent() {
      try {
        await ElMessageBox.confirm('Are you sure you want to delete this event?', 'Warning', {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning',
          icon: markRaw(Delete),
        })

        this.loading.calendar = true

        const { error } = await supabase
          .from('Event')
          .delete()
          .eq('id', this.calendarEventForm.id)

        if (error) throw error

        ElMessage.success('Event deleted successfully.')

        this.clear()

      } catch (error) {
          console.error(error)
      } finally {
        this.loading.calendar = false
      }
    },

    clear() {
      this.title = ''
      this.dialog.createEvent = false
      this.dialog.viewEvent = false
      
      Object.assign(this.calendarEventForm, {
        id: '',
        bookingId: '',
        eventDate: '',
        dateTimeCreated: '',
      })
    }


  }
})