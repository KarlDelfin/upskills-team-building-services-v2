<template>
  <div class="p-3 sm:p-6 bg-white rounded-2xl shadow-lg font-sans w-full min-h-[600px] block">
    <!-- Parent wrapper with explicit dimensions -->
    <div 
      v-loading="store.loading" 
      element-loading-text="Loading calendar events..."
      class="w-full min-h-[550px] relative"
    >
      <FullCalendar 
        v-if="isMounted"
        ref="calendarRef" 
        :options="calendarOptions as any" 
      />
    </div>

    <!-- Booking Details Dialog -->
    <el-dialog 
      v-model="detailsDialogVisible" 
      title="Booking Details" 
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px]" 
      center 
      destroy-on-close
    >
      <div v-if="selectedBooking" v-loading="store.slotLoading" class="!space-y-4 !text-slate-700">
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
          <span class="sm:col-span-2 !font-semibold !text-slate-700 flex flex-col !gap-2 !w-full">
            <div>{{ formatBookingTime(selectedBooking.start) }}</div>
            <el-select
              v-model="selectedSlotId"
              placeholder="Select a time slot"
              class="!w-full"
              size="large"
              @change="handleSlotChange"
            >
              <el-option
                v-for="slot in store.availableSlots"
                :key="slot.id"
                :label="slot.formattedLabel"
                :value="slot.id"
                :disabled="slot.disabled"
              >
                <div class="flex items-center justify-between">
                  <span>{{ slot.formattedLabel }}</span>
                  <span v-if="slot.disabled" class="!text-xs !text-red-500 !font-semibold">Booked</span>
                </div>
              </el-option>
            </el-select>
          </span>

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
          <el-button class="!w-full sm:!w-auto" @click="detailsDialogVisible = false">Close</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Reschedule Dialog -->
    <el-dialog
      v-model="rescheduleDialogVisible"
      title="Select Time Slot"
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px]"
      center
      :before-close="handleRescheduleCancel"
    >
      <div v-loading="store.slotLoading" class="!space-y-4">
        <p class="!text-sm !text-slate-600">
          Target Date: <strong class="!text-slate-800">{{ targetDateFormatted }}</strong>
        </p>

        <div class="!space-y-2">
          <label class="block !text-sm !font-medium !text-slate-700">Available Time Slots:</label>
          <el-select
            v-model="selectedSlotId"
            placeholder="Select a time slot"
            class="!w-full"
            size="large"
          >
            <el-option
              v-for="slot in store.availableSlots"
              :key="slot.id"
              :label="slot.formattedLabel"
              :value="slot.id"
              :disabled="slot.disabled"
            >
              <div class="flex items-center justify-between">
                <span>{{ slot.formattedLabel }}</span>
                <span v-if="slot.disabled" class="!text-xs !text-red-500 !font-semibold">Booked</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row justify-end !gap-2">
          <el-button class="!w-full sm:!w-auto !m-0" @click="handleRescheduleCancel">Cancel</el-button>
          <el-button 
            type="primary" 
            color="#136cb3"
            class="!w-full sm:!w-auto !font-semibold" 
            :loading="savingReschedule" 
            :disabled="!selectedSlotId" 
            @click="confirmReschedule"
          >
            Confirm Reschedule
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
import { ElMessage } from 'element-plus'
import { useCalendarStore, type CalendarEvent } from '@/stores/useCalendarStore'
import { supabase } from '@/utils/supabaseClient'

export default {
  name: 'CalendarView',
  components: {
    FullCalendar
  },
  setup() {
    const store = useCalendarStore() 
    return { store }
  },
  data() {
    const vm = this as any

    return {
      isMounted: false,
      detailsDialogVisible: false,
      selectedBooking: null as any,
      rescheduleDialogVisible: false,
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
        eventDrop: this.handleEventDrop,
        datesSet: this.handleDatesSet,
        allDaySlot: false,
        eventOverlap: true,
        displayEventTime: true
      })
    }
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
  computed: {
    calendarApi(): any {
      return (this.$refs.calendarRef as any) ? (this.$refs.calendarRef as any).getApi() : null
    },
    targetDateFormatted(): string {
      return this.targetDate ? moment(this.targetDate).format('MMMM DD, YYYY') : ''
    }
  },
  methods: {
    async handleRefreshClick() {
      if (this.calendarApi) {
        const currentView = this.calendarApi.view
        await this.loadBookings(currentView.activeStart.toISOString(), currentView.activeEnd.toISOString())
      }
    },

    async handleDatesSet(dateInfo: any) {
      await this.loadBookings(dateInfo.startStr, dateInfo.endStr)
    },

    async handleEventClick(info: any) {
      this.selectedBooking = info.event
      this.selectedSlotId = info.event.extendedProps.timeSlotId
      this.detailsDialogVisible = true

      const dateStr = info.event.extendedProps.bookingDate
      await this.store.loadTimeSlotsForTargetDate(dateStr, info.event.id)
    },

    async handleSlotChange(newSlotId: number | string | null) {
      if (!this.selectedBooking || !newSlotId) return

      try {
        const { error } = await supabase
          .from('Booking')
          .update({ timeSlotId: newSlotId })
          .eq('id', this.selectedBooking.id)

        if (error) throw error

        ElMessage.success('Booking time slot updated successfully.')
        this.selectedBooking.setExtendedProp('timeSlotId', newSlotId)
        await this.store.refreshCurrentRange()
        await this.syncCalendarEvents()
      } catch (error) {
        console.error('Failed to update booking slot:', error)
        ElMessage.error('Failed to update booking time slot.')
      }
    },

    async handleEventDrop(info: any) {
      if (new Date(info.event.startStr) < new Date(new Date().setHours(0, 0, 0, 0))) {
        ElMessage.warning('Cannot move booking on past dates.')
        info.revert()
        return
      }
      this.pendingDropInfo = info
      this.selectedSlotId = null
      this.targetDate = moment(info.event.start).format('YYYY-MM-DD')
      this.rescheduleDialogVisible = true

      await this.store.loadTimeSlotsForTargetDate(this.targetDate, info.event.id)
    },

    async confirmReschedule() {
      if (!this.selectedSlotId || !this.pendingDropInfo) return

      this.savingReschedule = true
      try {
        const { error } = await supabase
          .from('Booking')
          .update({
            bookingDate: this.targetDate,
            timeSlotId: this.selectedSlotId
          })
          .eq('id', this.pendingDropInfo.event.id)

        if (error) throw error

        ElMessage.success('Booking rescheduled successfully.')
        this.rescheduleDialogVisible = false
        this.pendingDropInfo = null
        await this.store.refreshCurrentRange()
        await this.syncCalendarEvents()
      } catch (error) {
        console.error('Reschedule failed:', error)
        ElMessage.error('Failed to reschedule booking.')
        this.handleRescheduleCancel()
      } finally {
        this.savingReschedule = false
      }
    },

    handleRescheduleCancel() {
      if (this.pendingDropInfo) {
        this.pendingDropInfo.revert()
        this.pendingDropInfo = null
      }
      this.rescheduleDialogVisible = false
      this.targetDate = ''
    },

    async loadBookings(startDate: string, endDate: string) {
      const events = await this.store.fetchCalendarEvents(startDate, endDate)
      this.updateCalendarSource(events)
    },

    async syncCalendarEvents() {
      if (this.calendarApi) {
        this.updateCalendarSource(this.store.bookings)
      }
    },

    updateCalendarSource(events: CalendarEvent[]) {
      if (this.calendarApi) {
        this.calendarApi.removeAllEventSources()
        this.calendarApi.addEventSource(events)
      } else {
        this.calendarOptions.events = events
      }
    },

    formatBookingTime(dateString: string | Date) {
      return dateString ? moment(dateString).format('MMMM DD, YYYY') : ''
    },

    handleTodayClick() { this.calendarApi?.today() },
    handlePrevClick() { this.calendarApi?.prev() },
    handleNextClick() { this.calendarApi?.next() },
    handleMonthClick() { this.calendarApi?.changeView('dayGridMonth') },
    handleWeekClick() { this.calendarApi?.changeView('timeGridWeek') },
    handleDayClick() { this.calendarApi?.changeView('timeGridDay') },
    handleListClick() { this.calendarApi?.changeView('listMonth') }
  }
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