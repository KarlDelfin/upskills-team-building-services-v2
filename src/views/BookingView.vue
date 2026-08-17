<template>
  <div class="flex flex-col xl:flex-row !w-full !gap-4">
    <!-- Main Content Area -->
    <div class="!space-y-6 !w-full xl:!w-[80%] 2xl:!w-[83%]">
      <!-- Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 !gap-4">
        <el-card shadow="hover" class="!rounded-lg !border-slate-200">
          <template #header>
            <span class="!text-slate-500 !font-semibold !text-sm !uppercase !tracking-wider">Total Bookings</span>
          </template>
          <div class="!text-2xl sm:!text-3xl !font-bold !text-slate-800">{{ store.metrics.totalBookings.toLocaleString() }}</div>
        </el-card>

        <el-card shadow="hover" class="!rounded-lg !border-slate-200">
          <template #header>
            <span class="!text-slate-500 !font-semibold !text-sm !uppercase !tracking-wider">Pending Bookings</span>
          </template>
          <div class="!text-2xl sm:!text-3xl !font-bold !text-amber-500">{{ store.metrics.pendingBookings.toLocaleString() }}</div>
        </el-card>
      </div>

      <!-- Bookings Table Section -->
      <el-card shadow="never" class="!rounded-lg !border-slate-200">
        <!-- Search and Action Bar -->
        <div class="flex flex-col sm:flex-row !justify-between !items-stretch sm:!items-center !mb-6 !gap-3">
          <div class="flex items-center !gap-2 !w-full sm:!w-auto">
            <el-input
              v-model="store.search.bookingName"
              placeholder="Search by booking..."
              class="!w-full sm:!w-80 md:!w-96"
              :prefix-icon="Search"
              clearable
            />
            <el-button 
              :icon="Refresh" 
              circle 
              :loading="store.loading" 
              @click="store.fetchDashboardData()" 
              title="Refresh Data"
            />
          </div>

          <el-button 
            type="primary" 
            color="#136cb3" 
            class="!font-semibold !w-full sm:!w-auto" 
            @click="formController('Create Booking')"
          >
            Create Booking
          </el-button>
        </div>

        <!-- Table -->
        <div class="!overflow-x-auto">
          <el-table 
            class="!w-full" 
            :data="store.bookings" 
            v-loading="store.loading" 
            :row-class-name="tableRowClassName"
          >
            <el-table-column label="Client" min-width="180">
              <template #default="scope: TableScope">
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
              <template #default="scope: TableScope">
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
              <template #default="scope: TableScope">
                <div class="inline-flex items-center !gap-1.5 !bg-slate-100 !px-2 !py-1 !rounded-md !text-slate-700 !font-semibold !text-xs sm:!text-sm">
                  <span class="!w-2 !h-2 !rounded-full !bg-emerald-500"></span>
                  <span>{{ scope.row.noOfParticipants }} pax</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Scheduled Date & Time" min-width="180" align="center">
              <template #default="scope: TableScope">
                <div class="!text-slate-800 !font-medium !text-sm flex flex-col items-center !gap-1">
                  <el-tag class="!whitespace-normal !text-center !h-auto !py-1">
                    {{ scope.row.formattedBookingDate }} {{ scope.row.formattedSlotTime }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Status" min-width="130">
              <template #default="scope: TableScope">
                <el-select 
                  v-model="scope.row.statusId" 
                  size="small" 
                  class="!w-full"
                  @change="handleStatusChange(scope.row)"
                >
                  <el-option 
                    class="!flex !justify-between !items-center"
                    v-for="status in store.statuses" 
                    :key="status.id" 
                    :label="status.name" 
                    :value="status.id" 
                  >
                    {{ status.name }} 
                    <span class="rounded-full !h-[10px] !w-[10px]" :style="{ backgroundColor: status.color }"></span>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="Operation" width="120" fixed="right" align="center">
              <template #default="scope: TableScope">
                <div class="flex items-center justify-center !gap-1">
                  <el-button 
                    size="small" 
                    type="primary" 
                    link 
                    class="!text-[#136cb3] !font-bold !px-1"
                    @click="formController('Edit Booking', scope.row)"
                  >
                    Edit
                  </el-button>
                  <el-button 
                    size="small" 
                    type="primary" 
                    link 
                    class="!text-rose-500 !font-bold !px-1"
                    @click="deleteBooking(scope.row.id)"
                  >
                    Delete
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Pagination -->
        <div class="!mt-4 !overflow-x-auto flex !justify-end">
          <el-pagination
            v-model:current-page="store.bookingPagination.currentPage"
            v-model:page-size="store.bookingPagination.elementsPerPage"
            :page-sizes="[5, 10, 25, 50]"
            :total="store.bookingPagination.totalElements"
            layout="total, sizes, prev, pager, next"
            @current-change="store.getBookings"
            @size-change="store.getBookings"
          />
        </div>
      </el-card>
    </div>

    <!-- Upcoming Bookings Sidebar Widget -->
    <div 
      v-loading="store.loading" 
      class="!w-full xl:!w-[20%] 2xl:!w-[17%] !rounded-xl !bg-white !p-4 sm:!p-5 !border !border-slate-200 flex flex-col !gap-4 !shadow-sm !h-fit"
    >
      <div class="flex items-center justify-between !border-b !border-slate-100 !pb-3">
        <h3 class="!font-bold !text-slate-800 !text-sm !tracking-wide !uppercase !m-0">Upcoming Bookings</h3>
        <span class="!bg-[#136cb3]/10 !text-[#136cb3] !text-xs !font-bold !px-2 !py-0.5 !rounded-full">
          {{ store.upcomingBookings.length }}
        </span>
      </div>

      <div class="flex flex-col !divide-y !divide-slate-100 !overflow-y-auto !max-h-[350px] xl:!max-h-[calc(100vh-220px)] custom-scrollbar !gap-y-3">
        <div 
          v-for="(upcomingBooking, index) in store.upcomingBookings" 
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

        <div v-if="store.upcomingBookings.length === 0" class="!text-center !py-6 flex flex-col items-center justify-center">
          <el-empty description="No bookings yet." :image-size="60"/>
        </div>
      </div>
    </div>
  </div>

  <!-- BOOKING FORM DIALOG -->
  <el-dialog 
    v-model="dialog.bookingForm" 
    :title="title" 
    center 
    :before-close="clear"
    class="!w-[95%] sm:!w-[80%] md:!w-[650px] lg:!w-[750px] !max-w-[800px] !rounded-xl"
  >
    <el-form 
      ref="bookingFormRef" 
      @submit.prevent="submitForm" 
      label-position="top" 
      :model="bookingForm" 
      v-loading="store.loading"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 !gap-x-5 !gap-y-2">
        <el-form-item 
          label="Service"
          prop="serviceId"
          :rules="[{ required: true, message: 'Please select service', trigger: 'change' }]"
        >
          <el-select 
            @focus="store.getServices('')" 
            filterable 
            :loading="store.loading" 
            placeholder="Select Service"
            v-model="bookingForm.serviceId"
            class="!w-full"
          >
            <el-option v-for="service in store.services" :key="service.id" :label="service.name" :value="service.id"/>
          </el-select>
        </el-form-item>

        <el-form-item 
          label="Status"
          prop="statusId"
          :rules="[{ required: true, message: 'Please select status', trigger: 'change' }]"
        >
          <el-select 
            placeholder="Select Status"
            v-model="bookingForm.statusId"
            class="!w-full"
          >
            <el-option v-for="status in store.statuses" :key="status.id" :label="status.name" :value="status.id"/>
          </el-select>
        </el-form-item>
      </div>

      <!-- Date & Time Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 !gap-5 !mt-2">
        <el-form-item class="!w-full" label="Preferred Date">
          <div class="!w-full !overflow-x-auto">
            <VCalendar expanded @dayclick="handleSelectDate" :min-date="new Date()" :attributes="vCalendarEvents"/>
          </div>
        </el-form-item>

        <el-form-item class="!w-full" label="Preferred Time">
          <div class="grid grid-cols-2 sm:grid-cols-3 !gap-2 !w-full !max-h-[280px] !overflow-y-auto !pr-1">
            <button
              type="button"
              v-for="slot in store.timeSlots"
              :key="slot.id"
              class="!w-full !border !border-[#ccc] !rounded-[5px] !py-2 !px-2 !text-xs !text-center transition-colors"
              :class="{ active: bookingForm.timeSlotId === slot.id, disabled: slot.disabled }"
              @click="!slot.disabled && handleSelectTime(slot.id)"
              :disabled="slot.disabled"
            >
              {{ slot.formattedTime }}
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
          <el-input v-model="bookingForm.fullName" placeholder="Enter Client Full Name"/>
        </el-form-item>

        <el-form-item 
          label="Email" 
          prop="email"
          :rules="[
            { required: true, message: 'Please input email address', trigger: 'blur' },
            { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: 'Please input correct email address', trigger: ['blur', 'change'] }
          ]"
        >
          <el-input v-model="bookingForm.email" placeholder="Enter Client Email"/>
        </el-form-item>

        <el-form-item 
          label="Phone" 
          prop="phone"
          :rules="[
            { required: true, message: 'Please input phone number', trigger: 'blur' },
            { pattern: /^09\d{9}$/, message: 'Must be a valid PH mobile number starting with 09', trigger: ['blur', 'change'] }
          ]"
        >
          <el-input v-model="bookingForm.phone" maxlength="11" placeholder="Enter Client Phone Number"/>
        </el-form-item>

        <el-form-item 
          label="No of Participants" 
          prop="noOfParticipants"
          :rules="[{ required: true, message: 'Please input a digit', trigger: 'blur' }]"
        >
          <el-input-number v-model="bookingForm.noOfParticipants" :min="1" class="!w-full" placeholder="Enter No of Participants"/>
        </el-form-item>
      </div>

      <div class="!mt-6 flex !justify-end !gap-2">
        <el-button @click="clear">Cancel</el-button>
        <el-button type="primary" color="#136cb3" class="!font-semibold" @click="submitForm">Confirm</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import moment from 'moment';
import debounce from 'lodash/debounce';
import { useBookingStore } from '@/stores/useBookingStore';

interface BookingFormData {
  id: string;
  serviceId: string;
  bookingDate: string;
  timeSlotId: string;
  statusId: string;
  fullName: string;
  email: string;
  phone: string;
  noOfParticipants: number;
}

interface TableScope {
  row: any;
  $index: number;
}

export default defineComponent({
  name: 'BookingView',
  components: {
    Search: markRaw(Search),
    Refresh: markRaw(Refresh)
  },
  setup() {
    const store = useBookingStore();
    return { store };
  },
  data() {
    return {
      Search,
      Refresh,
      title: '' as string,
      vCalendarEvents: [] as any[],
      selectedDateStr: '' as string,
      bookingForm: {
        id: '',
        serviceId: '',
        bookingDate: '',
        timeSlotId: '',
        statusId: '',
        fullName: '',
        email: '',
        phone: '',
        noOfParticipants: 1
      } as BookingFormData,
      dialog: {
        bookingForm: false
      },
      debouncedSearch: null as any
    };
  },

  methods: {
    async handleSelectDate(day: any) {
      try {
        const selected = moment(day.date).startOf('day');
        const today = moment().startOf('day');

        if (selected.isBefore(today) && this.title === 'Create Booking') {
          ElMessage.warning('Cannot select past date');
          return;
        }

        this.selectedDateStr = selected.format('YYYY-MM-DD');
        this.bookingForm.bookingDate = selected.toISOString();
        this.vCalendarEvents = [{
          highlight: { backgroundColor: '#ff8080' },
          dates: day.date instanceof Date ? day.date : new Date(day.date)
        }];

        const startOfDay = selected.format('YYYY-MM-DD 00:00:00');
        const endOfDay = selected.clone().endOf('day').format('YYYY-MM-DD 23:59:59');

        const bookedTimeSlotIds = new Set(await this.store.fetchBookedTimeSlots(startOfDay, endOfDay));

        this.store.timeSlots = this.store.timeSlots.map(slot => ({
          ...slot,
          disabled: bookedTimeSlotIds.has(slot.id) && slot.id !== this.bookingForm.timeSlotId
        }));

      } catch (error) {
        console.error(error);
      }
    },

    handleSelectTime(timeSlotId: string) {
      this.bookingForm.timeSlotId = timeSlotId;
    },

    async handleStatusChange(row: any) {
      try {
        this.store.loading = true;
        await this.store.updateBookingStatus(row.id, row.statusId);
        ElMessage.success('Booking status updated successfully.');
        await this.store.fetchDashboardData();
      } catch (error) {
        console.error(error);
      } finally {
        this.store.loading = false;
      }
    },

    async submitForm() {
      try {
        const formRef = this.$refs.bookingFormRef as FormInstance;
        if (!formRef) return;

        const isValid = await formRef.validate();
        if (!isValid) return;

        if (!this.bookingForm.bookingDate || !this.bookingForm.timeSlotId) {
          ElMessage.warning('Please select both a preferred date and time slot.');
          return;
        }

        this.store.loading = true;

        const payload = {
          serviceId: this.bookingForm.serviceId,
          statusId: this.bookingForm.statusId,
          bookingDate: this.bookingForm.bookingDate,
          timeSlotId: this.bookingForm.timeSlotId,
          fullName: this.bookingForm.fullName,
          email: this.bookingForm.email,
          phone: this.bookingForm.phone,
          noOfParticipants: this.bookingForm.noOfParticipants
        };

        if (this.title === 'Create Booking') {
          await this.store.createBooking(payload);
          ElMessage.success('Booking submitted successfully.');
        } else if (this.title === 'Edit Booking') {
          await this.store.updateBooking(this.bookingForm.id, payload);
          ElMessage.success('Booking updated successfully.');
        }

        this.clear();
        await this.store.fetchDashboardData();
      } catch (error) {
        console.error(error);
      } finally {
        this.store.loading = false;
      }
    },

    async formController(dialogTitle: string, data?: any) {
      try {
        this.title = dialogTitle;
        this.dialog.bookingForm = true;
        this.store.loading = true;

        await Promise.all([this.store.getServices(''), this.store.getTimeSlots()]);

        if (dialogTitle === 'Create Booking') {
          const pendingStatus = this.store.statuses.find((s: any) => s.name?.toLowerCase() === 'pending');
          if (pendingStatus) this.bookingForm.statusId = pendingStatus.id;
        } else if (dialogTitle === 'Edit Booking' && data) {
          this.bookingForm.id = data.id;
          this.bookingForm.serviceId = data.Service?.id || data.serviceId;
          this.bookingForm.statusId = data.Status?.id || data.statusId;
          this.bookingForm.timeSlotId = data.timeSlotId;
          this.bookingForm.fullName = data.fullName;
          this.bookingForm.email = data.email;
          this.bookingForm.phone = data.phone;
          this.bookingForm.noOfParticipants = data.noOfParticipants;

          const datePart = moment(data.bookingDate).format('YYYY-MM-DD');
          await this.handleSelectDate({ date: datePart });
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.store.loading = false;
      }
    },

    async deleteBooking(bookingId: string) {
      try {
        await ElMessageBox.confirm('Do you want to delete this booking?', 'Warning', { 
          confirmButtonText: 'OK', 
          cancelButtonText: 'Cancel', 
          type: 'warning' 
        });

        await this.store.deleteBooking(bookingId);

        ElMessage.success('Booking deleted successfully.');
        await this.store.fetchDashboardData();
      } catch (error) {
        console.error(error);
      }
    },

    clear(done?: (cancel?: boolean) => void) {
      Object.assign(this.bookingForm, {
        id: '',
        serviceId: '',
        bookingDate: '',
        timeSlotId: '',
        statusId: '',
        fullName: '',
        email: '',
        phone: '',
        noOfParticipants: 1
      });

      this.vCalendarEvents = [];
      this.selectedDateStr = '';

      this.store.timeSlots = this.store.timeSlots.map(slot => ({
        ...slot,
        disabled: false
      }));

      this.dialog.bookingForm = false;
      if (typeof done === 'function') done();
    },

    tableRowClassName({ row }: TableScope) {
      const statusName = row.Status?.name;
      if (statusName === 'Confirmed') return 'primary-row';
      if (statusName === 'Completed') return 'success-row';
      if (statusName === 'Pending') return 'warning-row';
      if (statusName === 'Cancelled') return 'danger-row';
      return '';
    }
  },

  created() {
    this.debouncedSearch = debounce(() => {
      this.store.getBookings();
    }, 500);
  },

  async mounted() {
    if (this.store.bookings.length === 0) {
      await this.store.fetchDashboardData();
    }
  }
});
</script>

<style scoped>
:deep(.el-form-item__content button.active) { background: #409eff !important; color: #fff !important; }
:deep(.el-form-item__content button.disabled) { color: #7f8c8d; opacity: 0.6; cursor: not-allowed; background-color: #ccc; }
:deep(.el-table .primary-row) { --el-table-tr-bg-color: var(--el-color-primary-light-9); }
:deep(.el-table .success-row) { --el-table-tr-bg-color: var(--el-color-success-light-9); }
:deep(.el-table .warning-row) { --el-table-tr-bg-color: var(--el-color-warning-light-9); }
:deep(.el-table .danger-row) { --el-table-tr-bg-color: var(--el-color-danger-light-9); }
</style>