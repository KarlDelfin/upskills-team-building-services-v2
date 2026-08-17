<template>
  <div class="!p-3 sm:!p-6 !bg-white !rounded-2xl !shadow-lg !font-sans !w-full !max-w-full !overflow-hidden">
    <!-- Main Calendar Component -->
    <div class="calendar-wrapper !w-full !overflow-x-auto">
      <FullCalendar ref="calendarRef" :options="calendarOptions" v-loading="store.loading" />
    </div>

    <!-- Booking Details Dialog -->
    <el-dialog 
      v-model="detailsDialogVisible" 
      title="Booking Details" 
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px] !rounded-2xl" 
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

    <!-- Reschedule / Drag & Drop Select Time Slot Dialog -->
    <el-dialog
      v-model="rescheduleDialogVisible"
      title="Select Time Slot"
      class="!w-[92vw] sm:!w-[440px] !max-w-[440px] !rounded-2xl"
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
import FullCalendar from '@fullcalendar/vue3'
import rrulePlugin from '@fullcalendar/rrule'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import list from '@fullcalendar/list'
import moment from 'moment'
import { ElMessage } from 'element-plus'
import { useCalendarStore } from '@/stores/useCalendarStore'
import { supabase } from '@/utils/supabaseClient' // Added direct client import for updates

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
    return {
      detailsDialogVisible: false,
      selectedBooking: null,

      // Reschedule / Slot State Variables
      rescheduleDialogVisible: false,
      savingReschedule: false,
      pendingDropInfo: null,
      targetDate: '',
      selectedSlotId: null,

      weekClicked: false,
      dayClicked: false,
      pickerKey: 0,
      today: new Date(),
      calendarOptions: {
        height: 'auto',
        aspectRatio: 1.35,
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, list, rrulePlugin],
        timeZone: 'UTC',
        editable: true,
        eventStartEditable: true,
        eventDurationEditable: false,
        views: {
          dayGridMonth: {
            dayMaxEventRows: 2,
            titleFormat: { year: 'numeric', month: 'short' }
          },
          timeGridWeek: {
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            },
            eventTimeFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          },
          timeGridDay: {
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          },
          listMonth: {
            eventTimeFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          }
        },
        headerToolbar: {
          start: 'prevCustom,todayCustom,nextCustom refreshCustom',
          center: 'title',
          end: 'monthCustom,weekCustom,dayCustom,listCustom'
        },
        customButtons: {
          todayCustom: {
            text: 'today',
            click: () => this.handleTodayClick()
          },
          prevCustom: {
            text: '«',
            click: () => this.handlePrevClick()
          },
          nextCustom: {
            text: '»',
            click: () => this.handleNextClick()
          },
          refreshCustom: {
            text: 'Refresh',
            click: () => this.handleRefreshClick()
          },
          monthCustom: {
            text: 'month',
            click: () => this.handleMonthClick()
          },
          weekCustom: {
            text: 'week',
            click: () => this.handleWeekClick()
          },
          dayCustom: {
            text: 'day',
            click: () => this.handleDayClick()
          },
          listCustom: {
            text: 'list',
            click: () => this.handleListClick()
          }
        },
        events: [],
        firstDay: 0,
        initialView: 'dayGridMonth',
        eventClick: this.handleEventClick,
        eventDrop: this.handleEventDrop,
        datesSet: this.handleDatesSet,
        allDaySlot: false,
        eventLongPressDelay: 50,
        eventOverlap: true,
        forceEventDuration: true,
        displayEventTime: true,
        showNonCurrentDates: false
      }
    }
  },
  mounted() {
    this.calendarOptions.customButtons.todayCustom.click = this.handleTodayClick.bind(this)
    this.calendarOptions.customButtons.prevCustom.click = this.handlePrevClick.bind(this)
    this.calendarOptions.customButtons.nextCustom.click = this.handleNextClick.bind(this)
    this.calendarOptions.customButtons.refreshCustom.click = this.handleRefreshClick.bind(this)
    this.calendarOptions.customButtons.monthCustom.click = this.handleMonthClick.bind(this)
    this.calendarOptions.customButtons.weekCustom.click = this.handleWeekClick.bind(this)
    this.calendarOptions.customButtons.dayCustom.click = this.handleDayClick.bind(this)
    this.calendarOptions.customButtons.listCustom.click = this.handleListClick.bind(this)
  },
  computed: {
    calendarApi() {
      return this.$refs.calendarRef ? this.$refs.calendarRef.getApi() : null
    },
    targetDateFormatted() {
      return this.targetDate ? moment(this.targetDate).format('MMMM DD, YYYY') : ''
    }
  },
  methods: {
    /* REFRESH CURRENT CALENDAR VIEW RANGE */
    async handleRefreshClick() {
      if (this.calendarApi) {
        const currentView = this.calendarApi.view
        const startDate = currentView.activeStart.toISOString()
        const endDate = currentView.activeEnd.toISOString()

        await this.loadBookings(startDate, endDate)
      }
    },

    /* AUTOMATIC DATES RANGE CHANGE HOOK */
    async handleDatesSet(dateInfo) {
      await this.loadBookings(dateInfo.startStr, dateInfo.endStr)
    },

    /* OPEN DETAILS DIALOG ON EVENT CLICK AND LOAD TIME SLOTS */
    async handleEventClick(info) {
      this.selectedBooking = info.event
      this.selectedSlotId = info.event.extendedProps.timeSlotId
      this.detailsDialogVisible = true

      const dateStr = info.event.extendedProps.bookingDate
      await this.store.loadTimeSlotsForTargetDate(dateStr, info.event.id)
    },

    /* LOCAL COMPONENT MUTATION: UPDATE TIME SLOT */
    async handleSlotChange(newSlotId) {
      if (!this.selectedBooking || !newSlotId) return

      const bookingId = this.selectedBooking.id
      try {
        const { error } = await supabase
          .from('Booking')
          .update({ timeSlotId: newSlotId })
          .eq('id', bookingId)

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

    /* DRAG & DROP INTERCEPTION & SLOT DIALOG TRIGGER */
    async handleEventDrop(info) {
      if (new Date(info.event.startStr) < new Date().setHours(0, 0, 0, 0)) {
        ElMessage.warning('Cannot move booking on past dates.')
        info.revert()
        return
      }
      this.pendingDropInfo = info
      this.selectedSlotId = ''
      this.targetDate = moment(info.event.start).format('YYYY-MM-DD')
      this.rescheduleDialogVisible = true

      await this.store.loadTimeSlotsForTargetDate(this.targetDate, info.event.id)
    },

    /* LOCAL COMPONENT MUTATION: CONFIRM RESCHEDULE */
    async confirmReschedule() {
      if (!this.selectedSlotId || !this.pendingDropInfo) return

      this.savingReschedule = true
      const bookingId = this.pendingDropInfo.event.id

      try {
        const { error } = await supabase
          .from('Booking')
          .update({
            bookingDate: this.targetDate,
            timeSlotId: this.selectedSlotId
          })
          .eq('id', bookingId)

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

    /* CANCEL RESCHEDULE AND REVERT EVENT POSITION */
    handleRescheduleCancel() {
      if (this.pendingDropInfo) {
        this.pendingDropInfo.revert()
        this.pendingDropInfo = null
      }
      this.rescheduleDialogVisible = false
      this.targetDate = ''
    },

    /* LOAD BOOKINGS FROM STORE */
    async loadBookings(startDate, endDate) {
      const events = await this.store.fetchCalendarEvents(startDate, endDate)
      this.updateCalendarSource(events)
    },

    /* SYNC CALENDAR EVENTS FROM CURRENT STORE STATE */
    async syncCalendarEvents() {
      if (this.calendarApi) {
        const events = this.store.bookings
        this.updateCalendarSource(events)
      }
    },

    /* HELPER TO REFRESH EVENT SOURCE IN FULLCALENDAR */
    updateCalendarSource(events) {
      if (this.calendarApi) {
        this.calendarApi.removeAllEventSources()
        this.calendarApi.addEventSource(events)
      } else {
        this.calendarOptions = {
          ...this.calendarOptions,
          events
        }
      }
    },

    /* DATE FORMATTER HELPER */
    formatBookingTime(dateString) {
      if (!dateString) return ''
      return moment(dateString).format('MMMM DD, YYYY')
    },

    /* NAVIGATION BUTTON HANDLERS */
    handleTodayClick() {
      this.pickerKey++
      this.today = new Date()
      this.calendarApi?.today()
    },

    handlePrevClick() {
      this.pickerKey++
      this.calendarApi?.prev()
    },

    handleNextClick() {
      this.pickerKey++
      this.calendarApi?.next()
    },

    handleMonthClick() {
      this.weekClicked = false
      this.dayClicked = false
      this.calendarApi?.changeView('dayGridMonth')
    },

    handleWeekClick() {
      this.weekClicked = true
      this.dayClicked = false
      this.calendarApi?.changeView('timeGridWeek')
    },

    handleDayClick() {
      this.weekClicked = false
      this.dayClicked = true
      this.calendarApi?.changeView('timeGridDay')
    },

    handleListClick() {
      this.calendarApi?.changeView('listMonth')
    }
  },
}
</script>

<style scoped>
:deep(.fc-event) {
  border-radius: 6px !important;
  border: none !important;
  background-color: transparent !important;
  cursor: pointer;
}

:deep(.fc-event-main) {
  padding: 0 !important;
  background-color: transparent !important;
}

:deep(.fc-h-event) {
  background-color: transparent !important;
  border: none !important;
}

/* FullCalendar Header Responsiveness Overrides */
:deep(.fc-header-toolbar) {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 1rem !important;
}

:deep(.fc-toolbar-chunk) {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex-wrap: wrap !important;
}

@media (max-width: 640px) {
  :deep(.fc-header-toolbar) {
    flex-direction: column !important;
    align-items: stretch !important;
  }

  :deep(.fc-toolbar-chunk) {
    justify-content: center !important;
    width: 100% !important;
  }

  :deep(.fc-toolbar-title) {
    font-size: 1.1rem !important;
    text-align: center !important;
  }

  :deep(.fc-button) {
    padding: 0.25rem 0.5rem !important;
    font-size: 0.75rem !important;
  }
}
</style>