<template>
  <div class="!w-full">
    <el-card shadow="never" class="rounded-lg bg-white border border-slate-200 !p-2 sm:!p-4">
      <!-- Search and Action Top Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-5 gap-3">
        <div class="flex items-center !gap-2 !w-full sm:!w-auto">
          <el-input
            v-model="store.searchQuery"
            placeholder="Search by service..."
            class="!w-full sm:!w-80 md:!w-96"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
            @clear="clearSearch"
          />
          <!-- REFRESH BUTTON -->
          <el-button 
            class="!p-2.5" 
            :icon="Refresh" 
            :loading="store.loading" 
            @click="store.fetchServices()"
            title="Refresh Services"
          />
        </div>
        <el-button 
          type="primary" 
          color="#136cb3" 
          class="font-semibold w-full sm:w-auto" 
          @click="openForm('Create Service')"
        >
          Create Service
        </el-button>
      </div>

      <!-- Responsive Table Container -->
      <div class="overflow-x-auto">
        <el-table class="mt-5! w-full" :data="store.services" v-loading="store.loading">
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

          <el-table-column label="Operation" min-width="140" fixed="right" align="center">
            <template #default="scope">
              <div class="flex items-center justify-center gap-1">
                <el-button 
                  size="small" 
                  type="primary" 
                  link 
                  class="!text-[#136cb3] !font-bold"
                  @click="openForm('Edit Service', scope.row)"
                >
                  Edit
                </el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  link 
                  class="!text-rose-500 !font-bold"
                  @click="handleDelete(scope.row.id)"
                >
                  Delete
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination Container -->
      <div class="!mt-5 flex justify-end overflow-x-auto pb-2">
        <el-pagination
          v-model:current-page="store.pagination.currentPage"
          v-model:page-size="store.pagination.elementsPerPage"
          :page-sizes="[5, 10, 25, 50]"
          :total="store.pagination.totalElements"
          layout="total, sizes, prev, pager, next"
          @current-change="store.fetchServices"
          @size-change="store.fetchServices"
        />
      </div>
    </el-card>

    <!-- SERVICE FORM DIALOG -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="formTitle" 
      center 
      class="!w-[92vw] sm:!w-[480px] !max-w-[480px] !rounded-2xl"
      :before-close="clearForm"
    >
      <el-form 
        ref="serviceFormRef" 
        label-position="top" 
        :model="serviceForm"
        @submit.prevent="submitForm"
      >
        <el-form-item 
          label="Name"
          prop="name"
          :rules="[{ required: true, message: 'Please input name', trigger: 'blur' }]"
        >
          <el-input v-model="serviceForm.name" placeholder="Enter name" />
        </el-form-item>

        <el-form-item 
          label="Description" 
          prop="description"
          :rules="[{ required: true, message: 'Please input description', trigger: 'blur' }]"
        >
          <el-input v-model="serviceForm.description" type="textarea" placeholder="Enter description" />
        </el-form-item>

        <el-form-item 
          label="Price" 
          prop="price"
          :rules="[
            { required: true, message: 'Please input price', trigger: 'blur' },
            { type: 'number', message: 'Price must be a number', trigger: 'blur' }]"
        >
          <el-input v-model.number="serviceForm.price" placeholder="Enter price" />
        </el-form-item>

        <div class="flex flex-col-reverse sm:flex-row justify-end gap-2 !mt-6">
          <el-button class="w-full sm:w-auto !m-0" @click="clearForm">Cancel</el-button>
          <el-button 
            type="primary" 
            color="#136cb3" 
            class="w-full sm:w-auto font-semibold" 
            @click="submitForm" 
            :loading="store.loading"
          >
            Confirm
          </el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { markRaw } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import debounce from 'lodash/debounce'
import { useServiceStore } from '@/stores/useServiceStore'
import { supabase } from '@/utils/supabaseClient' // Directly imported for mutations

export default {
  name: 'ServicesList',
  components: {
    Search: markRaw(Search),
    Refresh: markRaw(Refresh)
  },
  setup() {
    const store = useServiceStore()
    return { store }
  },
  data() {
    return {
      Search,
      Refresh,
      dialogVisible: false,
      formTitle: '',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,

      serviceForm: {
        id: '',
        name: '',
        description: '',
        price: ''
      },

      debouncedSearch: null
    }
  },

  mounted() {
    if (this.store.services.length === 0) {
      this.store.fetchServices()
    }

    this.debouncedSearch = debounce(() => {
      this.store.pagination.currentPage = 1
      this.store.fetchServices()
    }, 500)
  },

  methods: {
    // Search Handlers
    handleSearch() {
      if (this.debouncedSearch) {
        this.debouncedSearch()
      }
    },

    clearSearch() {
      this.store.resetSearch()
      this.store.fetchServices()
    },

    // Dialog & Form Handlers
    openForm(title, rowData = {}) {
      this.formTitle = title
      this.dialogVisible = true

      if (title === 'Edit Service' && rowData.id) {
        this.serviceForm.id = rowData.id
        this.serviceForm.name = rowData.name
        this.serviceForm.description = rowData.description
        this.serviceForm.price = rowData.price
      }
    },

    clearForm(done) {
      this.serviceForm = {
        id: '',
        name: '',
        description: '',
        price: ''
      }
      
      if (this.$refs.serviceFormRef) {
        this.$refs.serviceFormRef.resetFields()
      }
      this.dialogVisible = false

      if (typeof done === 'function') {
        done()
      }
    },

    // Local Component Mutations (CREATE & UPDATE)
    async submitForm() {
      const formRef = this.$refs.serviceFormRef
      if (!formRef) return

      try {
        await formRef.validate()
        this.store.loading = true

        const payload = {
          name: this.serviceForm.name,
          description: this.serviceForm.description,
          price: Number(this.serviceForm.price)
        }

        if (this.formTitle === 'Create Service') {
          const { error } = await supabase.from('Service').insert(payload)
          if (error) throw error
          ElMessage.success('Service created successfully.')
        } else if (this.formTitle === 'Edit Service') {
          const { error } = await supabase
            .from('Service')
            .update(payload)
            .eq('id', this.serviceForm.id)

          if (error) throw error
          ElMessage.success('Service updated successfully.')
        }

        await this.store.fetchServices()
        this.clearForm()
      } catch (error) {
        if (error && error !== false) {
          console.error(error)
          ElMessage.error(error.message || 'Failed to save service.')
        }
      } finally {
        this.store.loading = false
      }
    },

    // Local Component Mutation (DELETE)
    async handleDelete(serviceId) {
      try {
        await ElMessageBox.confirm(
          'Do you want to delete this service?',
          'Warning',
          { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' }
        )

        this.store.loading = true

        const { error } = await supabase
          .from('Service')
          .delete()
          .eq('id', serviceId)

        if (error) throw error

        ElMessage.success('Service deleted successfully.')
        await this.store.fetchServices()
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
          ElMessage.error(error.message || 'Failed to delete service.')
        }
      } finally {
        this.store.loading = false
      }
    }
  }
}
</script>