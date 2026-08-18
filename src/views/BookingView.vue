<template>
  <div class="flex flex-col xl:flex-row !w-full !gap-4">
    <div class="!space-y-6 !w-full xl:!w-[80%] 2xl:!w-[83%]">
      <div class="grid grid-cols-1 sm:grid-cols-2 !gap-4">
        <el-card shadow="hover" class="!rounded-lg !border-slate-200">
          <template #header>
            <span class="!text-slate-500 !font-semibold !text-sm !uppercase !tracking-wider">Total Bookings</span>
          </template>
          <div class="!text-2xl sm:!text-3xl !font-bold !text-slate-800">
            {{ bookingStore.metrics.totalBookings.toLocaleString() }}
          </div>
        </el-card>

        <el-card shadow="hover" class="!rounded-lg !border-slate-200">
          <template #header>
            <span class="!text-slate-500 !font-semibold !text-sm !uppercase !tracking-wider">Pending Bookings</span>
          </template>
          <div class="!text-2xl sm:!text-3xl !font-bold !text-amber-500">
            {{ bookingStore.metrics.pendingBookings.toLocaleString() }}
          </div>
        </el-card>
      </div>

       <el-card class="shadow-sm border-0 rounded-xl overflow-hidden">
          <template #header>
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 class="!text-xl !font-bold !m-0">Booking Management</h2>
                      <p class="!text-xs !m-0 !mt-1">Manage and organize your booking</p>
                  </div>
              </div>
          </template>

          <div class="mb-6 flex justify-between w-full gap-3">
              <div class="w-full">
                  <el-input
                      v-model="bookingStore.search"
                      @input="bookingStore.searchBooking" 
                      placeholder="Search booking..." 
                      :prefix-icon="Search"
                      clearable
                  />
              </div>

              <div class="flex items-center justify-end">
                  <el-button 
                      class="custom-btn-secondary"
                      @click="bookingStore.fetchBookings()"
                      title="Refresh Data"
                      :loading="bookingStore.loading"
                  >
                      <el-icon><Refresh /></el-icon>
                  </el-button>
                  <el-button 
                      class="custom-btn-primary flex items-center" 
                      @click="bookingStore.formController('Create Booking', {})"
                      type="primary"
                  >
                      <el-icon><Plus /></el-icon>
                      <span>Create Booking</span>
                  </el-button>
              </div>
          </div>

          <el-table 
              class="mb-6 rounded-lg overflow-hidden custom-table min-h-[367px]" 
              :data="bookingStore.bookings" 
              v-loading="bookingStore.loading"
              element-loading-text="Loading bookings..."
              :row-class-name="tableRowClassName"
          >
            <el-table-column label="Client" min-width="180">
              <template #default="scope">
                <div class="flex flex-col">
                  <div class="!font-bold !text-slate-800 !text-sm">{{ scope.row.fullName }}</div>
                  <div class="!text-xs !text-slate-500 !mt-0.5 flex flex-wrap !gap-1 items-center">
                    <a :href="`mailto:${scope.row.email}`" class="!text-blue-500 !no-underline hover:!underline !break-all">
                      {{ scope.row.email }}
                    </a>
                    <span class="hidden sm:!inline">|</span>
                    <a :href="`tel:${scope.row.phone}`" class="!text-blue-500 !no-underline hover:!underline">
                      {{ scope.row.phone }}
                    </a>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Service" min-width="140">
              <template #default="scope">
                <el-tooltip
                  v-if="scope.row.Service"
                  :content="scope.row.Service.description"
                  placement="top"
                  effect="dark"
                >
                  <el-tag effect="plain" class="!border-[#136cb3] !text-[#136cb3] !font-bold !bg-white !cursor-pointer">
                    {{ scope.row.Service.name }}
                  </el-tag>
                </el-tooltip>
                
                <div v-if="scope.row.Service" class="!text-xs !text-slate-500 !mt-1">
                  Rate: ₱{{ scope.row.Service.price?.toLocaleString() }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Participants" min-width="120" align="center">
              <template #default="scope">
                <div class="inline-flex items-center !gap-1.5 !bg-slate-100 !px-2 !py-1 !rounded-md !text-slate-700 !font-semibold !text-xs sm:!text-sm">
                  <span class="!w-2 !h-2 !rounded-full !bg-emerald-500"></span>
                  <span>{{ scope.row.noOfParticipants }} pax</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Scheduled Date & Time" min-width="180" align="center">
              <template #default="scope">
                <div class="!text-slate-800 !font-medium !text-sm flex flex-col items-center !gap-1">
                  <el-tag class="!whitespace-normal !text-center !h-auto !py-1">
                    {{ scope.row.formattedBookingDate }} {{ scope.row.formattedSlotTime }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Status" min-width="130">
              <template #default="scope">
                <el-select 
                  v-model="scope.row.statusId" 
                  size="small" 
                  class="!w-full"
                  @change="bookingStore.handleStatusChange(scope.row)"
                >
                  <el-option 
                    class="!flex !justify-between !items-center"
                    v-for="status in statusStore.bookingStatuses" 
                    :key="status.id" 
                    :label="status.name" 
                    :value="status.id" 
                  >{{ status.name }}<!--  <span class="rounded-full !h-[10px] !w-[10px]" :style="{ backgroundColor: status.color }"></span> --></el-option>
                </el-select>
              </template>
            </el-table-column>

              <el-table-column label="Operations" width="160" fixed="right" align="center">
                  <template #default="scope">
                      <div class="flex items-center justify-center">
                          <el-button 
                              size="small"
                              class="custom-btn-edit" 
                              @click="bookingStore.formController('Edit Booking', scope.row)"
                          >
                              <el-icon class="!mr-1"><Edit /></el-icon> Edit
                          </el-button>
                          <el-button 
                              size="small" 
                              type="danger" 
                              plain
                              @click="bookingStore.handleDelete(scope.row.id)"
                          >
                              <el-icon class="!mr-1"><Delete /></el-icon> Delete
                          </el-button>
                      </div>
                  </template>
              </el-table-column>
          </el-table>

          <!-- BOOKING PAGINATION -->
          <div class="flex justify-end !pt-5">
              <el-pagination
                  v-model:current-page="bookingStore.bookingPagination.currentPage"
                  v-model:page-size="bookingStore.bookingPagination.elementsPerPage"
                  :page-sizes="[5, 10, 25, 50]"
                  :total="bookingStore.bookingPagination.totalElements"
                  layout="total, sizes, prev, pager, next, jumper"
                  @current-change="bookingStore.fetchBookings()"
                  @size-change="bookingStore.fetchBookings()"
              />
          </div>
      </el-card>
    </div>

    <!-- UPCOMING BOOKING -->
    <div 
      v-loading="bookingStore.loading" 
      element-loading-text="Loading upcoming events..."
      class="!w-full xl:!w-[20%] 2xl:!w-[17%] !rounded-xl !bg-white !p-4 sm:!p-5 !border !border-slate-200 flex flex-col !gap-4 !shadow-sm !h-fit"
    >
      <div class="flex items-center justify-between !border-b !border-slate-100 !pb-3">
        <h3 class="!font-bold !text-slate-800 !text-sm !tracking-wide !uppercase !m-0">Upcoming Bookings</h3>
        <span class="!bg-[#136cb3]/10 !text-[#136cb3] !text-xs !font-bold !px-2 !py-0.5 !rounded-full">
          {{ bookingStore.upcomingBookings.length }}
        </span>
      </div>

      <div class="flex flex-col !divide-y !divide-slate-100 !overflow-y-auto !max-h-[350px] xl:!max-h-[calc(100vh-220px)] custom-scrollbar !gap-y-3">
        <div 
          v-for="(upcomingBooking, index) in bookingStore.upcomingBookings" 
          :key="index"
          class="flex flex-col !gap-1.5 !py-3 first:!pt-0 last:!pb-0 group hover:!bg-slate-50/50 transition-colors duration-150 !rounded-lg !px-1"
        >
          <div class="flex items-center !gap-1.5 flex-wrap">
            <el-tag size="small" type="primary" effect="light" class="!font-semibold !text-[11px] !px-2 !h-auto !py-0.5">
              {{ upcomingBooking.formattedBookingDate }} {{ upcomingBooking.formattedSlotTime }}
            </el-tag>
          </div>

          <div class="flex flex-col !pl-0.5">
            <div class="!font-bold !text-slate-800 !text-xs group-hover:!text-[#136cb3] transition-colors duration-150">
              {{ upcomingBooking.fullName }}
            </div>
            <div class="!text-[11px] !text-slate-500 !font-medium !mt-0.5 !break-all">
              {{ upcomingBooking.email }}
            </div>
            <div class="!text-[11px] !text-slate-400 !font-medium !mt-0.5">
              {{ upcomingBooking.phone }}
            </div>
          </div>
        </div>

        <div v-if="bookingStore.upcomingBookings.length === 0" class="!text-center !py-6 flex flex-col items-center justify-center">
          <el-empty description="No bookings yet." :image-size="60"/>
        </div>
      </div>
    </div>
  </div>

  <!-- BOOKING FORM DIALOG -->
  <el-dialog 
    v-model="bookingStore.dialog.booking" 
    :title="bookingStore.title" 
    center 
    class="custom-dialog !w-[95%] sm:!w-[80%] md:!w-[650px] lg:!w-[750px] !max-w-[800px] !rounded-xl"
    :before-close="bookingStore.clear"
  >
    <el-form 
      ref="bookingFormRef" 
      label-position="top" 
      :model="bookingStore.bookingForm" 
      v-loading="bookingStore.loading"
      @submit.prevent="handleConfirm" 
    >
      <div class="grid grid-cols-1 md:grid-cols-2 !gap-x-5 !gap-y-2">
        <el-form-item 
          label="Service"
          prop="serviceId"
          :rules="[{ required: true, message: 'Please select service', trigger: 'change' }]"
        >
         <el-select 
            filterable 
            @input="serviceStore.searchService" 
            :loading="bookingStore.loading" 
            placeholder="Select Service"
            v-model="bookingStore.bookingForm.serviceId"
            class="!w-full"
          >
            <el-option 
              v-for="service in serviceStore.services" 
              :key="service.id" 
              :label="service.name" 
              :value="service.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item 
          label="Status"
          prop="statusId"
          :rules="[{ required: true, message: 'Please select status', trigger: 'change' }]"
        >
         <el-select 
            filterable 
            @input="statusStore.searchBookingStatus" 
            :loading="bookingStore.loading" 
            placeholder="Select Status"
            v-model="bookingStore.bookingForm.statusId"
            class="!w-full"
          >
            <el-option 
              class="!flex !justify-between !items-center"
              v-for="status in statusStore.bookingStatuses" 
              :key="status.id" 
              :label="status.name" 
              :value="status.id" 
            >
              {{ status.name }}
            </el-option>
          </el-select>
        </el-form-item>
      </div>
      
      <!-- Date & Time Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 !gap-5 !mt-2">
        <el-form-item 
          class="!w-full" 
          label="Preferred Date" 
          prop="bookingDate"
          :rules="[{ required: true, message: 'Please choose preferred date', trigger: 'change' }]">
          <div class="!w-full !overflow-x-auto">
            <VCalendar expanded @dayclick="bookingStore.handleSelectDate" :min-date="new Date()" :attributes="bookingStore.vCalendarEvents"/>
          </div>
        </el-form-item>

        <el-form-item 
          class="!w-full" 
          label="Preferred Time" 
          prop="timeSlotId"
          :rules="[{ required: true, message: 'Please choose preferred time', trigger: 'change' }]">
          <div class="grid grid-cols-2 sm:grid-cols-3 !gap-2 !w-full !max-h-[280px] !overflow-y-auto !pr-1">
            <button
              type="button"
              v-for="timeSlot in timeSlotStore.timeSlots"
              :key="timeSlot.id"
              class="!w-full !border !border-[#ccc] !rounded-[5px] !py-2 !px-2 !text-xs !text-center transition-colors"
              :class="{ active: bookingStore.bookingForm.timeSlotId === timeSlot.id, disabled: timeSlot.disabled }"
              @click="!timeSlot.disabled && bookingStore.handleSelectTime(timeSlot.id)"
              :disabled="timeSlot.disabled"
            >
              {{ timeSlot.slotTime }}
            </button>
          </div>
        </el-form-item>
      </div>

      <!-- User Information Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 !gap-x-5 !gap-y-1 !mt-2">
        <el-form-item 
          label="Full Name"
          prop="fullName"
          :rules="[{ required: true, message: 'Please input full name', trigger: 'blur' }]"
        >
          <el-input v-model="bookingStore.bookingForm.fullName" placeholder="Enter Client Full Name"/>
        </el-form-item>

        <el-form-item 
          label="Email" 
          prop="email"
          :rules="[
            { required: true, message: 'Please input email address', trigger: 'blur' },
            { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: 'Please input correct email address', trigger: ['blur', 'change'] }
          ]"
        >
          <el-input v-model="bookingStore.bookingForm.email" placeholder="Enter Client Email"/>
        </el-form-item>

        <el-form-item 
          label="Phone" 
          prop="phone"
          :rules="[
            { required: true, message: 'Please input phone number', trigger: 'blur' },
            { pattern: /^09\d{9}$/, message: 'Must be a valid PH mobile number starting with 09', trigger: ['blur', 'change'] }
          ]"
        >
          <el-input v-model="bookingStore.bookingForm.phone" maxlength="11" placeholder="Enter Client Phone Number"/>
        </el-form-item>

        <el-form-item 
          label="No of Participants" 
          prop="noOfParticipants"
          :rules="[{ required: true, message: 'Please input a digit', trigger: 'blur' }]"
        >
          <el-input-number v-model="bookingStore.bookingForm.noOfParticipants" :min="1" class="!w-full" placeholder="Enter No of Participants"/>
        </el-form-item>
      </div>

      <div class="!mt-6 flex !justify-end !gap-2">
        <el-button @click="bookingStore.clear()">Cancel</el-button>
        <el-button 
          type="primary" 
          color="#136cb3" 
          class="custom-btn-primary !font-semibold" 
          @click="handleConfirm"
          :loading="bookingStore.loading"
        >
          Confirm
        </el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script lang="ts">
import { markRaw } from 'vue'
import { Search } from '@element-plus/icons-vue'

import { useBookingStore } from '@/stores/useBookingStore'
import { useServiceStore  } from '@/stores/useServiceStore'
import { useTimeSlotStore  } from '@/stores/useTimeSlotStore'
import { useStatusStore  } from '@/stores/useStatusStore'

export default {
  components: {
    Search: markRaw(Search),
  },
  setup() {
    const bookingStore = useBookingStore()
    const serviceStore = useServiceStore()
    const timeSlotStore = useTimeSlotStore()
    const statusStore = useStatusStore()
    return { bookingStore, serviceStore, timeSlotStore, statusStore }
  },
  data() {
    return {
      Search: markRaw(Search),
    }
  },


  methods: {
    /* DONE */
    async handleConfirm() {
      const formEl = await this.$refs.bookingFormRef as any
      await formEl.validate()

      await this.bookingStore.submitForm()
    },
    

    tableRowClassName({ row }: { row: any }) {
      const statusName = row.Status?.name
      if (statusName === 'Confirmed') return 'primary-row'
      if (statusName === 'Completed') return 'success-row'
      if (statusName === 'Pending') return 'warning-row'
      if (statusName === 'Cancelled') return 'danger-row'
      return ''
    }
  },
  
  mounted() {
    if (this.bookingStore.bookings.length === 0) {
      this.bookingStore.fetchDashboardData()
    }
    if (this.serviceStore.services.length === 0) {
      this.serviceStore.fetchServices()
    }
    if (this.timeSlotStore.timeSlots.length === 0) {
      this.timeSlotStore.fetchTimeSlots()
    }
    if (this.statusStore.bookingStatuses.length === 0) {
      this.statusStore.fetchBookingStatuses()
    }
  },
}
</script>

<style scoped>
:deep(.el-form-item__content button.active) { background: #136cb3 !important; color: #fff !important; }
:deep(.el-form-item__content button.disabled) { color: #7f8c8d; opacity: 0.6; cursor: not-allowed; background-color: #ccc; }
:deep(.el-table .primary-row) { --el-table-tr-bg-color: var(--el-color-primary-light-9); }
:deep(.el-table .success-row) { --el-table-tr-bg-color: var(--el-color-success-light-9); }
:deep(.el-table .warning-row) { --el-table-tr-bg-color: var(--el-color-warning-light-9); }
:deep(.el-table .danger-row) { --el-table-tr-bg-color: var(--el-color-danger-light-9); }
</style>