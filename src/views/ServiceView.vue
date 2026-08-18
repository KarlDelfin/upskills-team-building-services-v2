<template>
   <el-card class="shadow-sm border-0 rounded-xl overflow-hidden">
        <template #header>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 class="!text-xl !font-bold !m-0">Services</h2>
                  <p class="!text-xs !m-0 !mt-1">Manage and offer high-impact upskilling programs and team-building workshops</p>
                </div>
            </div>
        </template>

        <div class="!mb-6 flex justify-between w-full gap-3">
            <div class="w-full">
                <el-input
                    v-model="serviceStore.search"
                    @input="serviceStore.searchService" 
                    placeholder="Search time slot by name..." 
                    :prefix-icon="Search"
                    clearable
                />
            </div>

            <div class="flex items-center justify-end">
                <el-button 
                    class="custom-btn-secondary"
                    @click="serviceStore.fetchServices"
                    title="Refresh Data"
                    :loading="serviceStore.loading"
                >
                    <el-icon><Refresh /></el-icon>
                </el-button>
                <el-button 
                    class="custom-btn-primary flex items-center" 
                    @click="serviceStore.formController('Create Service', {})"
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
          :data="serviceStore.services" 
          v-loading="serviceStore.loading"
          element-loading-text="Loading service..."
        >

        <el-table-column label="Date/Time Created" min-width="150">
            <template #default="scope">
              <span class="text-slate-500 font-medium text-sm">{{ scope.row.dateTimeCreated }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Service Name" min-width="180">
            <template #default="scope">
              <div class="font-bold text-slate-800 text-sm">{{ scope.row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="Service Description" min-width="220" show-overflow-tooltip />
          
          <el-table-column label="Price" min-width="120" align="right">
            <template #default="scope">
              <span class="font-bold text-[#136cb3] text-sm">
                ₱{{ Number(scope.row.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Operations" width="160" fixed="right" align="center">
              <template #default="scope">
                  <div class="flex items-center justify-center">
                      <el-button 
                          size="small"
                          class="custom-btn-edit" 
                          @click="serviceStore.formController('Edit Service', scope.row)"
                      >
                          <el-icon class="!mr-1"><Edit /></el-icon> Edit
                      </el-button>
                      <el-button 
                          size="small" 
                          type="danger" 
                          plain
                          @click="serviceStore.deleteService(scope.row.id)"
                      >
                          <el-icon class="!mr-1"><Delete /></el-icon> Delete
                      </el-button>
                  </div>
              </template>
          </el-table-column>
        </el-table>

        <!-- PAGINATION -->
        <div class="flex justify-end pt-2">
            <el-pagination
                v-model:current-page="serviceStore.servicePagination.currentPage"
                v-model:page-size="serviceStore.servicePagination.elementsPerPage"
                :page-sizes="[5, 10, 25, 50]"
                :total="serviceStore.servicePagination.totalElements"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="serviceStore.fetchServices()"
                @size-change="serviceStore.fetchServices()"
            />
        </div>
    </el-card>

    <!-- FORM -->
    <el-dialog 
        :title="serviceStore.title" 
        v-model="serviceStore.dialog.service" 
        :before-close="serviceStore.clear"
        width="520px"
        class="custom-dialog rounded-xl overflow-hidden"
        destroy-on-close
        center
    >
        <el-form 
            ref="serviceFormRef" 
            :model="serviceStore.serviceForm" 
            v-loading="serviceStore.loading"
            label-position="top"
            class="pt-2"
        >
            <el-form-item 
              label="Name"
              prop="name"
              :rules="[{ required: true, message: 'Please input name', trigger: 'blur' }]"
            >
              <el-input v-model="serviceStore.serviceForm.name" placeholder="Enter name" />
            </el-form-item>

            <el-form-item 
              label="Description" 
              prop="description"
              :rules="[{ required: true, message: 'Please input description', trigger: 'blur' }]"
            >
              <el-input v-model="serviceStore.serviceForm.description" type="textarea" placeholder="Enter description" />
            </el-form-item>

            <el-form-item 
              label="Price" 
              prop="price"
              :rules="[
                { required: true, message: 'Please input price', trigger: 'blur' },
                { type: 'number', message: 'Price must be a number', trigger: 'blur' }]"
            >
              <el-input v-model.number="serviceStore.serviceForm.price" placeholder="Enter price" />
            </el-form-item>



            <div class="flex justify-end pt-4 border-t border-slate-200 mt-6">
                <el-button 
                    @click="serviceStore.clear()" 
                    :loading="serviceStore.loading"
                >Cancel</el-button>
                <el-button 
                    type="primary"
                    class="custom-btn-primary" 
                    @click="handleConfirm()" 
                    :loading="serviceStore.loading"
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
import { useServiceStore } from '@/stores/useServiceStore'

export default {
  components: {
    Search: markRaw(Search),
  },
  setup() {
    const serviceStore = useServiceStore()
    return { serviceStore }
  },
  data() {
    return {
      Search,
    }
  },

  methods: {
    async handleConfirm() {
      const formEl = await this.$refs.serviceFormRef as any
      await formEl.validate()

      await this.serviceStore.submitForm()
    },
  },

  mounted() {
    if (this.serviceStore.services.length === 0) {
      this.serviceStore.fetchServices()
    }
  },
}
</script>