<template>
    <el-card class="shadow-sm border-0 rounded-xl overflow-hidden">
        <template #header>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="!text-xl !font-bold !m-0">Status Management</h2>
                    <p class="!text-xs !m-0 !mt-1">Configure and organize operational statuses for client bookings</p>
                </div>
            </div>
        </template>

        <div class="mb-6 flex justify-between w-full gap-3">
            <div class="w-full">
                <el-input
                    v-model="bookingStatusStore.search"
                    @input="bookingStatusStore.searchBookingStatus" 
                    placeholder="Search status by name..." 
                    :prefix-icon="Search"
                    clearable
                />
            </div>

            <div class="flex items-center justify-end">
                <el-button 
                    class="flex"
                    @click="bookingStatusStore.fetchBookingStatuses()"
                    title="Refresh Data"
                    :loading="bookingStatusStore.loading"
                >
                    <el-icon><Refresh /></el-icon>
                </el-button>
                <el-button 
                    class="custom-btn-primary flex items-center" 
                    @click="bookingStatusStore.formController('Create Status', {})"
                    type="primary"
                >
                    <el-icon><Plus /></el-icon>
                    <span>Create Status</span>
                </el-button>
            </div>
        </div>

        <el-table 
            class="mb-6 rounded-lg overflow-hidden custom-table min-h-[540px]" 
            :data="bookingStatusStore.bookingStatuses" 
            v-loading="bookingStatusStore.loading"
        >
            <el-table-column prop="name" label="Status Name" sortable>
                <template #default="scope">
                    <span class="font-semibold">{{ scope.row.name }}</span>
                </template>
            </el-table-column>

            <el-table-column label="Color" min-width="150">
              <template #default="scope">
                <div class="flex items-center gap-2">
                  <span 
                    class="w-4 h-4 rounded-full border border-slate-200 inline-block shadow-sm" 
                    :style="{ backgroundColor: scope.row.color || '#94a3b8' }"
                  ></span>
                  <span class="text-xs font-mono font-semibold text-slate-600">
                    {{ scope.row.color || 'N/A' }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Operations" width="160" fixed="right" align="center">
                <template #default="scope">
                    <div class="flex items-center justify-center">
                        <el-button 
                            size="small"
                            class="custom-btn-edit" 
                            @click="bookingStatusStore.formController('Edit Status', scope.row)"
                        >
                            <el-icon class="!mr-1"><Edit /></el-icon> Edit
                        </el-button>
                        <el-button 
                            size="small" 
                            type="danger" 
                            plain
                            @click="bookingStatusStore.deleteBookingStatus(scope.row.id)"
                        >
                            <el-icon class="!mr-1"><Delete /></el-icon> Delete
                        </el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>

        <!-- PRODUCT PAGINATION -->
        <div class="flex justify-end pt-2">
            <el-pagination
                v-model:current-page="bookingStatusStore.bookingStatusPagination.currentPage"
                v-model:page-size="bookingStatusStore.bookingStatusPagination.elementsPerPage"
                :page-sizes="[5, 10, 25, 50]"
                :total="bookingStatusStore.bookingStatusPagination.totalElements"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="bookingStatusStore.fetchBookingStatuses()"
                @size-change="bookingStatusStore.fetchBookingStatuses()"
            />
        </div>
    </el-card>

    <!-- FORM -->
    <el-dialog 
        :title="bookingStatusStore.title" 
        v-model="bookingStatusStore.dialog.bookingStatus" 
        :before-close="bookingStatusStore.clear"
        width="520px"
        class="custom-dialog rounded-xl overflow-hidden"
        destroy-on-close
        center
    >
        <el-form 
            ref="bookingStatusFormRef" 
            :model="bookingStatusStore.bookingStatusForm" 
            v-loading="bookingStatusStore.loading"
            label-position="top"
            class="pt-2"
        >
            <el-form-item 
                label="Status Name" 
                prop="name"
                :rules="[{ required: true, message: 'Please enter status name', trigger: 'blur' }]"
            >
                <el-input v-model="bookingStatusStore.bookingStatusForm.name" placeholder="Enter status name"  />
            </el-form-item>

            <el-form-item 
              label="Status Color" 
              prop="color"
              :rules="[{ required: true, message: 'Please select status color', trigger: 'change' }]"
            >
              <div class="flex items-center gap-3">
                <el-color-picker v-model="bookingStatusStore.bookingStatusForm.color" :show-alpha="false" :predefine="predefineColors"/>
                <el-input v-model="bookingStatusStore.bookingStatusForm.color" placeholder="#136cb3" class="w-32" />
              </div>
            </el-form-item>

            <div class="flex justify-end pt-4 border-t border-slate-200 mt-6">
                <el-button 
                    @click="bookingStatusStore.clear()" 
                    :loading="bookingStatusStore.loading"
                >Cancel</el-button>
                <el-button 
                    type="primary"
                    class="custom-btn-primary" 
                    @click="handleConfirm()" 
                    :loading="bookingStatusStore.loading"
                >
                    Confirm
                </el-button>
            </div>
        </el-form>
    </el-dialog>
</template>

<script lang="ts">
import { useBookingStatusStore } from '@/stores/useBookingStatusStore'
import { markRaw } from 'vue'
import { Search } from '@element-plus/icons-vue'

export default {
    components: {
        Search: markRaw(Search)
    },
    setup() {
        const bookingStatusStore = useBookingStatusStore()
        return { bookingStatusStore }
    },
    data() {
        return {
            Search,
             predefineColors: [
              '#ff4500',
              '#ff8c00',
              '#ffd700',
              '#90ee90',
              '#00ced1',
              '#1e90ff',
              '#c71585',
              'rgba(255, 69, 0, 0.68)',
              'rgb(255, 120, 0)',
              'hsv(51, 100, 98)',
              'hsva(120, 40, 94, 0.5)',
              'hsl(181, 100%, 37%)',
              'hsla(209, 100%, 56%, 0.73)',
              '#c7158577',
            ],
        }
    },
    methods: {
        async handleConfirm() {
            const formEl = await this.$refs.bookingStatusFormRef as any
            await formEl.validate()

            await this.bookingStatusStore.submitForm()
        }
    },
    mounted() {
        if(this.bookingStatusStore.bookingStatuses.length === 0) {
            this.bookingStatusStore.fetchBookingStatuses()
        }
    }
}
</script>