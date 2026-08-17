<template>
    <el-card class="shadow-sm border-0 rounded-xl overflow-hidden">
        <template #header>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-xl font-bold m-0">Time Slot Management</h2>
                    <p class="text-xs m-0 mt-1">Manage booking time slots</p>
                </div>
            </div>
        </template>

        <div class="mb-6 flex justify-between w-full gap-3">
            <div class="w-full">
                <el-input
                    v-model="timeSlotStore.search"
                    @input="timeSlotStore.searchTimeSlot" 
                    placeholder="Search time slot by name..." 
                    :prefix-icon="Search"
                    clearable
                />
            </div>

            <div class="flex items-center justify-end">
                <el-button 
                    class="custom-btn-secondary"
                    @click="timeSlotStore.fetchTimeSlots()"
                    title="Refresh Data"
                    :loading="timeSlotStore.loading"
                >
                    <el-icon><Refresh /></el-icon>
                </el-button>
                <el-button 
                    class="custom-btn-primary flex items-center" 
                    @click="timeSlotStore.formController('Create Time Slot', {})"
                    type="primary"
                >
                    <el-icon><Plus /></el-icon>
                    <span>Create Time Slot</span>
                </el-button>
            </div>
        </div>

        <!-- DATA TABLE -->
        <el-table 
          class="mb-6 rounded-lg overflow-hidden custom-table min-h-[540px]" 
          :data="timeSlotStore.timeSlots" 
          v-loading="timeSlotStore.loading"
        >
          <el-table-column label="Time Slot" min-width="160">
            <template #default="scope">
              <span class="font-bold text-slate-800 text-sm">
                {{ formatTime(scope.row.slotTime) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Status" width="140" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.isActive"
                active-color="#136cb3"
                @change="(val: boolean) => timeSlotStore.handleStatusToggle(scope.row.id, val)"
              />
            </template>
          </el-table-column>

          <el-table-column label="Operations" width="160" fixed="right" align="center">
              <template #default="scope">
                  <div class="flex items-center justify-center">
                      <el-button 
                          size="small"
                          class="custom-btn-edit" 
                          @click="timeSlotStore.formController('Edit Time Slot', scope.row)"
                      >
                          <el-icon class="mr-1"><Edit /></el-icon> Edit
                      </el-button>
                      <el-button 
                          size="small" 
                          type="danger" 
                          plain
                          @click="timeSlotStore.deleteTimeSlot(scope.row.id)"
                      >
                          <el-icon class="mr-1"><Delete /></el-icon> Delete
                      </el-button>
                  </div>
              </template>
          </el-table-column>
        </el-table>

        <!-- PRODUCT PAGINATION -->
        <div class="flex justify-end pt-2">
            <el-pagination
                v-model:current-page="timeSlotStore.timeSlotPagination.currentPage"
                v-model:page-size="timeSlotStore.timeSlotPagination.elementsPerPage"
                :page-sizes="[5, 10, 25, 50]"
                :total="timeSlotStore.timeSlotPagination.totalElements"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="timeSlotStore.fetchTimeSlots()"
                @size-change="timeSlotStore.fetchTimeSlots()"
            />
        </div>
    </el-card>

    <!-- PRODUCT FORM -->
    <el-dialog 
        :title="timeSlotStore.title" 
        v-model="timeSlotStore.dialog.timeSlot" 
        :before-close="timeSlotStore.clear"
        width="520px"
        class="custom-dialog rounded-xl overflow-hidden"
        destroy-on-close
        center
    >
        <el-form 
            ref="timeSlotFormRef" 
            :model="timeSlotStore.timeSlotForm" 
            v-loading="timeSlotStore.loading"
            label-position="top"
            class="pt-2"
        >
            <el-form-item 
              label="Slot Time" 
              prop="slotTime"
              :rules="[{ required: true, message: 'Please select a time slot', trigger: 'change' }]"
            >
              <el-time-picker
                v-model="timeSlotStore.timeSlotForm.slotTime"
                value-format="HH:mm:ss"
                format="hh:mm A"
                placeholder="Select time"
                class="!w-full"
              />
            </el-form-item>

            <el-form-item label="Active Status" prop="isActive">
              <el-switch v-model="timeSlotStore.timeSlotForm.isActive" active-text="Active" inactive-text="Inactive" />
            </el-form-item>


            <div class="flex justify-end pt-4 border-t border-slate-200 mt-6">
                <el-button 
                    @click="timeSlotStore.clear()" 
                    :loading="timeSlotStore.loading"
                >Cancel</el-button>
                <el-button 
                    type="primary"
                    class="custom-btn-primary" 
                    @click="handleConfirm()" 
                    :loading="timeSlotStore.loading"
                >
                    Confirm
                </el-button>
            </div>
        </el-form>
    </el-dialog>
</template>

<script lang="ts">
import { useTimeSlotStore } from '@/stores/useTimeSlotStore'
import { markRaw } from 'vue'
import { Search } from '@element-plus/icons-vue'
import moment from 'moment';

export default {
    components: {
        Search: markRaw(Search)
    },
    setup() {
        const timeSlotStore = useTimeSlotStore()
        return { timeSlotStore }
    },
    data() {
        return {
            Search,
        }
    },
    methods: {
        async handleConfirm() {
            const formEl = await this.$refs.timeSlotFormRef as any
            await formEl.validate()

            await this.timeSlotStore.submitForm()
        },

        // Moment.js Formatters
        formatTime(timeString: string) {
          if (!timeString) return ''
          return moment(timeString, 'HH:mm:ss').format('hh:mm A')
        },
    },
    mounted() {
        if(this.timeSlotStore.timeSlots.length === 0) {
            this.timeSlotStore.fetchTimeSlots()
        }
    }
}
</script>