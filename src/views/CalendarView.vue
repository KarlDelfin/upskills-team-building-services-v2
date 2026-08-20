<template>
  <div class="p-3 sm:p-6 bg-white rounded-2xl shadow-lg font-sans w-full min-h-[600px] block">
    <!-- Parent wrapper with explicit dimensions -->
    <div 
      v-loading="calendarStore.loading.calendar" 
      element-loading-text="Loading calendar events..."
      class="w-full min-h-[550px] relative"
    >
      <FullCalendar 
        ref="calendarRef" 
        :options="calendarOptions as any" 
      />
    </div>

    <!-- VIEW BOOKING -->
    <el-dialog 
      v-model="calendarStore.dialog.viewEvent" 
      :title="calendarStore.title" 
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px]" 
      center 
      destroy-on-close
    >
      <div v-if="selectedBooking" v-loading="calendarStore.loading.viewEvent" class="!space-y-4 !text-slate-700">
        <div class="flex items-center justify-between !border-b !border-slate-100 !pb-3">
          <span class="!font-semibold !text-slate-500 !text-sm">Status</span>
          <span 
            class="!px-3 !py-1 !text-xs !font-bold !rounded-full !text-white !shadow-sm"
            :style="{ backgroundColor: selectedBooking.backgroundColor || '#136cb3' }"
          >
            {{ selectedBooking.extendedProps.status }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 !gap-2.5 !text-sm !pt-1 items-start sm:items-center">
          <span class="!text-slate-500 !font-medium">Client / Service:</span>
          <span class="sm:col-span-2 !font-bold !text-slate-800 !break-words">{{ selectedBooking.title }}</span>

          <span class="!text-slate-500 !font-medium">Scheduled Date:</span>
          <span class="sm:col-span-2 !font-semibold !text-slate-700 flex flex-col !gap-2 !w-full"> <div>{{ selectedDateFormatted }}</div> </span>

          <span class="!text-slate-500 !font-medium">Email:</span>
          <span class="sm:col-span-2 !text-slate-700 !break-all">{{ selectedBooking.extendedProps.email || 'N/A' }}</span>

          <span class="!text-slate-500 !font-medium">Phone:</span>
          <span class="sm:col-span-2 !text-slate-700">{{ selectedBooking.extendedProps.phone || 'N/A' }}</span>

          <span class="!text-slate-500 !font-medium">Participants:</span>
          <span class="sm:col-span-2 !text-slate-700 !font-semibold">
            {{ selectedBooking.extendedProps.noOfParticipants }} pax
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <el-button class="!w-full sm:!w-auto" @click="calendarStore.dialog.viewEvent = false">Close</el-button>
          <el-button type="danger" class="!w-full sm:!w-auto" @click="handleDeleteEvent">Delete</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- SCHEDULE BOOKING -->
    <el-dialog 
      v-model="calendarStore.dialog.createEvent"
      :title="calendarStore.title" 
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px]" 
      center
    >
      <div class="!space-y-4">
        <p class="!text-sm !text-slate-600">
          Target Date: <strong class="!text-slate-800">{{ selectedDateFormatted }}</strong>
        </p>

        <div class="!space-y-2">
           <label class="block !text-sm !font-medium !text-slate-700">Booking:</label>
          <el-select 
            v-model="selectedBookingId" 
            placeholder="Select a booking" 
            class="!w-full"
            size="large"
            filterable
            @change="handleSelectBooking"
          >
            <el-option
              v-for="unassignedBooking in calendarStore.unassignedBookings"
              :key="unassignedBooking.id"
              :label="`${unassignedBooking.fullName} - ${unassignedBooking.Service?.name || 'Service'}`"
              :value="unassignedBooking.id"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button 
            type="primary" 
            color="#136cb3" 
            :loading="calendarStore.loading.createEvent"
            :disabled="!selectedBookingId" 
            @click="handleConfirm"
          >
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">

import { markRaw } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'

import moment from 'moment'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCalendarStore, type CalendarEvent } from '@/stores/useCalendarStore'

import { Edit } from '@element-plus/icons-vue'

export default {
  name: 'CalendarView',
  components: {
    FullCalendar
  },
  setup() {
    const calendarStore = useCalendarStore() 
    return { calendarStore }
  },
  data() {
    const vm = this as any

    return {
      selectedDateStr: '',
      selectedBookingId: '' as string,
      selectedBooking: null as any,
      savingReschedule: false,
      targetDate: '',
      selectedSlotId: null as number | string | null,

      calendarOptions: markRaw({
        height: '650px',
        contentHeight: 600,
        expandRows: true,
        handleWindowResize: true,
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin, rrulePlugin],
        timeZone: 'UTC',
        editable: true,
        eventStartEditable: true,
        eventDurationEditable: false,
        initialView: 'dayGridMonth',
        headerToolbar: {
          start: 'prevCustom,todayCustom,nextCustom refreshCustom',
          center: 'title',
          end: 'monthCustom,weekCustom,dayCustom,listCustom'
        },
        customButtons: {
          todayCustom: { text: 'today', click: () => vm.handleTodayClick() },
          prevCustom: { text: '«', click: () => vm.handlePrevClick() },
          nextCustom: { text: '»', click: () => vm.handleNextClick() },
          refreshCustom: { text: '⟲ Refresh', click: () => vm.handleRefreshClick() },
          monthCustom: { text: 'month', click: () => vm.handleMonthClick() },
          weekCustom: { text: 'week', click: () => vm.handleWeekClick() },
          dayCustom: { text: 'day', click: () => vm.handleDayClick()},
          listCustom: { text: 'list', click: () => vm.handleListClick() }
        },
        events: [] as CalendarEvent[],
        firstDay: 0,
        eventClick: this.handleEventClick,
        selectable: true,
        eventDrop: this.handleEventDrop,
        datesSet: this.handleDatesSet,
        allDaySlot: false,
        eventOverlap: true,
        displayEventTime: true,
        dateClick: this.handleDateClick
      })
    }
  },

  computed: {
    calendarApi(): any {
      return (this.$refs.calendarRef as any) ? (this.$refs.calendarRef as any).getApi() : null
    },
    selectedDateFormatted(): string {
      return this.selectedDateStr ? moment(this.selectedDateStr).format('MMMM DD, YYYY') : ''
    }
  },
  methods: {
    /* REFRESH EVENT */
    async handleRefreshClick() {
      if (this.calendarApi) {
        const currentView = this.calendarApi.view
        await this.loadEvents(currentView.activeStart.toISOString(), currentView.activeEnd.toISOString())
      }
    },
   
    /* CLICK DATE */
    async handleDateClick(info: any) {
      if (new Date(info.dateStr) < new Date(new Date().setHours(0, 0, 0, 0))) {
        ElMessage.warning('Cannot schedule on past dates.')
        return
      }

      const targetDate = moment(info.dateStr).format('YYYY-MM-DD')
      this.selectedDateStr = info.dateStr
      
      this.calendarStore.calendarEventForm.bookingId = this.selectedBookingId
      this.calendarStore.calendarEventForm.eventDate = targetDate

      this.calendarStore.formController('Schedule Booking to Calendar', {})
    },

    /* SELECT BOOKING */
    handleSelectBooking(bookingId: string) {
      this.calendarStore.calendarEventForm.bookingId = bookingId
    },

    /* CLICK EVENT */
    async handleEventClick(info: any) {
      this.selectedBooking = info.event
      this.selectedSlotId = info.event.extendedProps.timeSlotId
      this.selectedDateStr = info.event.extendedProps.bookingDate

      this.calendarStore.dialog.viewEvent = true
      this.calendarStore.title = 'Booking Event Details'
      this.calendarStore.calendarEventForm.id = info.event.extendedProps.eventId
    },

    /* MOVE EVENT */
    async handleEventDrop(info: any) {
      if (new Date(info.event.startStr) < new Date(new Date().setHours(0, 0, 0, 0))) {
        ElMessage.warning('Cannot move booking on past dates.')
        info.revert()
        return
      }
      ElMessageBox.confirm(`Are you sure you want to move ${info.event.extendedProps.title} to ${moment(info.event.startStr).format('LL')}?`, 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
        icon: markRaw(Edit),
      }).then(() => {
        const targetDate = moment(info.event.start).format('YYYY-MM-DD')
        const eventId = info.event.extendedProps.eventId

        this.calendarStore.calendarEventForm.eventDate = targetDate
        this.calendarStore.calendarEventForm.id = eventId
        this.calendarStore.title = 'Reschedule Booking Event Date'
        this.calendarStore.submitForm()
      })
      .catch(() => {
        this.updateCalendarSource()
      })
      .finally(() => { })
    },

    async handleDeleteEvent() {
      await this.calendarStore.handleDeleteEvent()
      this.handleRefreshClick()
    },

    /* LOAD EVENTS DIRECTLY ON MOUNT */
    async handleDatesSet(dateInfo: any) {
      await this.loadEvents(dateInfo.startStr, dateInfo.endStr)
    },

    /* LOAD EVENTS */
    async loadEvents(startDate: string, endDate: string) {
      const events = await this.calendarStore.fetchCalendarEvents(startDate, endDate)
      this.updateCalendarSource()
    },
   
    /* UPDATE CALENDAR STATIC DATES */
    updateCalendarSource() {
      if (this.calendarApi) {
        this.calendarApi.removeAllEventSources()
        this.calendarApi.addEventSource(this.calendarStore.events)
      } else {
        this.calendarOptions.events = this.calendarStore.events
      }
    },

    handleConfirm() {
      this.calendarStore.submitForm()
      this.handleRefreshClick()
      this.selectedBookingId = ''
    },


    handleTodayClick() { this.calendarApi?.today() },
    handlePrevClick() { this.calendarApi?.prev() },
    handleNextClick() { this.calendarApi?.next() },
    handleMonthClick() { this.calendarApi?.changeView('dayGridMonth') },
    handleWeekClick() { this.calendarApi?.changeView('timeGridWeek') },
    handleDayClick() { this.calendarApi?.changeView('timeGridDay') },
    handleListClick() { this.calendarApi?.changeView('listMonth') }
  },
  mounted() {
    
  },
}
</script>

<style scoped>
:deep(.fc) {
  min-height: 550px !important;
  width: 100% !important;
}

:deep(.fc-view-harness) { 
  min-height: 500px !important;
}

:deep(.fc-event) {
  border-radius: 6px !important;
  border: none !important;
  cursor: pointer;
}

:deep(.fc-day-past) {
  background-color: #f0f0f0 !important; /* Light gray for past dates */
}

:deep(.fc-event-time) { display: none !important; }
</style>