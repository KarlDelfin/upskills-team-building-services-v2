<template>
  <div class="p-3 sm:p-6 bg-white rounded-2xl shadow-lg font-sans w-full min-h-[600px] block">
    <!-- Parent wrapper with explicit dimensions -->
    <div 
      v-loading="calendarStore.loading.calendar" 
      element-loading-text="Loading calendar events..."
      class="w-full min-h-[550px] relative"
    >
      <FullCalendar 
        v-if="isMounted"
        ref="calendarRef" 
        :options="calendarOptions as any" 
      />
    </div>

    <!-- VIEW BOOKING -->
    <el-dialog 
      v-model="calendarStore.dialog.viewEvent" 
      title="Booking Details" 
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px]" 
      center 
      destroy-on-close
    >
      <div v-if="selectedBooking" v-loading="calendarStore.loading.slot" class="!space-y-4 !text-slate-700">
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
          <span class="sm:col-span-2 !font-semibold !text-slate-700 flex flex-col !gap-2 !w-full"> <div>{{ selectedBooking.start }}</div> </span>
          <span class="!text-slate-500 !font-medium">Time:</span>
          <span class="sm:col-span-2 !font-semibold !text-slate-700 flex flex-col !gap-2 !w-full"> <div>{{ selectedBooking.extendedProps.slotTime }}</div> </span> 

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
        <div class="flex justify-end !gap-2">
          <el-button class="!w-full sm:!w-auto" @click="calendarStore.dialog.viewEvent = false">Close</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- SCHEDULE BOOKING -->
    <el-dialog 
      v-model="calendarStore.dialog.createEvent"
      title="Schedule Booking to Calendar" 
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
          >
            <el-option
              v-for="b in calendarStore.unassignedBookings"
              :key="b.id"
              :label="`${b.fullName} - ${b.Service?.name || 'Service'}`"
              :value="b.id"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button 
            type="primary" 
            color="#136cb3" 
            :loading="calendarStore.createEventLoading"
            :disabled="!selectedBookingId" 
            @click="confirmAddEvent"
          >
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">

import { markRaw } from 'vue' // <-- Add markRaw import
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'
import moment from 'moment'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCalendarStore, type CalendarEvent } from '@/stores/useCalendarStore'
import { supabase } from '@/utils/supabaseClient'

import { Delete } from '@element-plus/icons-vue'

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
      selectedBookingId: null,
      isMounted: false,
      selectedBooking: null as any,
      savingReschedule: false,
      pendingDropInfo: null as any,
      targetDate: '',
      selectedSlotId: null as number | string | null,

      // Wrap calendarOptions inside markRaw()
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
    targetDateFormatted(): string {
      return this.targetDate ? moment(this.targetDate).format('MMMM DD, YYYY') : ''
    },
    selectedDateFormatted(): string {
      return this.selectedDateStr ? moment(this.selectedDateStr).format('MMMM DD, YYYY') : ''
    }
  },
  methods: {
    /* Create Event in Database & Refresh UI */
    async confirmAddEvent() {
      if (!this.selectedBookingId || !this.selectedDateStr) return

      const created = await this.calendarStore.createCalendarEvent(
        this.selectedBookingId, 
        this.selectedDateStr
      )

      if (created) {
        const events = await this.calendarStore.refreshCurrentRange()
        /* this.calendarOptions.events = events */
      }
    },

    async handleRefreshClick() {
      if (this.calendarApi) {
        const currentView = this.calendarApi.view
        await this.loadBookings(currentView.activeStart.toISOString(), currentView.activeEnd.toISOString())
      }
    },

    async handleDatesSet(dateInfo: any) {
      await this.loadBookings(dateInfo.startStr, dateInfo.endStr)
    },

    async handleDateClick(info: any) {
      this.selectedDateStr = info.dateStr
      this.selectedBookingId = null
      this.calendarStore.dialog.createEvent = true
    },

    async handleEventClick(info: any) {
      this.selectedBooking = info.event
      this.selectedSlotId = info.event.extendedProps.timeSlotId
      this.calendarStore.dialog.viewEvent = true
      this.selectedDateStr = info.event.extendedProps.bookingDate
    },


    async handleEventDrop(info: any) {
      console.log(info)
      if (new Date(info.event.startStr) < new Date(new Date().setHours(0, 0, 0, 0))) {
        ElMessage.warning('Cannot move booking on past dates.')
        info.revert()
        return
      }
      ElMessageBox.confirm(`Are you sure you want to move ${info.event.extendedProps.title}?`, 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
        icon: markRaw(Delete),
      }).then(() => {
        this.pendingDropInfo = info
        this.selectedSlotId = null
        this.targetDate = moment(info.event.start).format('YYYY-MM-DD')
      })
      .catch(() => {
        this.updateCalendarSource()
      })
      .finally(() => { })
    },

    async loadBookings(startDate: string, endDate: string) {
      const events = await this.calendarStore.fetchCalendarEvents(startDate, endDate)
      this.updateCalendarSource()
    },

    updateCalendarSource() {
      if (this.calendarApi) {
        this.calendarApi.removeAllEventSources()
        this.calendarApi.addEventSource(this.calendarStore.bookings)
      } else {
        this.calendarOptions.events = this.calendarStore.bookings
      }
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
    this.isMounted = true
    this.$nextTick(() => {
      setTimeout(() => {
        if (this.calendarApi) {
          this.calendarApi.updateSize()
        }
      }, 100)
    })
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
</style>