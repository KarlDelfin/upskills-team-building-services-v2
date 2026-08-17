import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import debounce from 'lodash/debounce';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export interface TimeSlot {
    id: number,
    slotTime: string,
    isActive: boolean,
    dateTimeCreated: string,
}

export interface TimeSlotPagination {
    currentPage: number,
    elementsPerPage: number,
    totalElements: number,
}

export const useTimeSlotStore = defineStore('timeSlot', {
    state: () => ({
        title: '' as String,
        loading: false as Boolean,
        search: '' as String,

        timeSlots: [] as TimeSlot[],
        timeSlotForm: {} as TimeSlot,
        timeSlotPagination: {
            currentPage: 1,
            elementsPerPage: 10,
            totalElements: 0,
        } as TimeSlotPagination,

        dialog: {
            timeSlot: false as Boolean,
        }

    }),
    actions: {
        /* SEARCH TIME SLOT */
        /* searchTimeSlot: debounce(function(this: any) {
            this.fetchTimeSlots()
        }, 300), */
        
        /* GET TIME SLOT WITH SEARCH */
        async fetchTimeSlots() {
            try {
                this.loading = true

                const limit = this.timeSlotPagination.elementsPerPage;
                const from = (this.timeSlotPagination.currentPage - 1) * limit;
                const to = from + limit - 1;

                let query = supabase
                    .from('TimeSlot')
                    .select('*', { count: 'exact' })

                /* if (this.search && this.search.trim() !== '') {
                    query = query.ilike('slotTime', `%${this.search}%`);
                } */

                query = query.order('dateTimeCreated', { ascending: false }).range(from, to);

                const { data, error, count } = await query;

                if(error) throw error

                this.timeSlots = data.map((data: TimeSlot) => ({
                    ...data,
                    dateTimeCreated: moment(data.dateTimeCreated).format('LLL'),
                })) || []
                this.timeSlotPagination.currentPage = this.timeSlotPagination.currentPage;
                this.timeSlotPagination.totalElements = count || 0;
            }
            catch(error) {
                console.log(error)
            }
            finally {
                this.loading = false
            }
        },

        /* DELETE */
        async deleteTimeSlot(id: string) {
            try {
                await ElMessageBox.confirm('Do you want to delete this time slot?', 'Warning', {
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel',
                    type: 'warning',
                    icon: markRaw(Delete),
                })

                this.loading = true

                const { error } = await supabase
                    .from('TimeSlot')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                ElMessage.success('Time Slot deleted successfully.')
                this.fetchTimeSlots()

            } catch (error) {
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        /* CREATE / UPDATE FORM */
        async submitForm() {
            try{
                if(this.title === 'Create Time Slot') {
                  const payload = {
                      slotTime: this.timeSlotForm.slotTime,
                  }
                  const { error } = await supabase
                  .from('TimeSlot')
                  .insert(payload) 

                  if(error) throw error

                  ElMessage.success('Time Slot created successfully.')
                }

                if(this.title === 'Edit Time Slot') {
                  const payload = {
                    slotTime: this.timeSlotForm.slotTime,
                    isActive: this.timeSlotForm.isActive
                  }
                    const { error } = await supabase
                    .from('TimeSlot')
                    .update(payload)
                    .eq('id', this.timeSlotForm.id)

                    if(error) throw error

                    ElMessage.success('Time Slot updated successfully.')
                }
            } catch (error) {
                console.error(error)
            } finally {
                this.loading = false
                this.fetchTimeSlots()
                this.dialog.timeSlot = false
            }
        },

        /* STATUS TOGGLE */
        async handleStatusToggle(timeSlotId: string, value: boolean) {
          try{
            const { error } = await supabase
              .from('TimeSlot')
              .update({ isActive: value })
              .eq('id', timeSlotId)

            if(error) throw error
          } catch (error) {
                console.error(error)
          } finally {
              this.loading = false
              this.dialog.timeSlot = false
          }
        },

        /* DIALOG CONTROLLER */
        formController(title: string, timeSlot: any) {
            this.title = title
            this.dialog.timeSlot = true

            if(title == "Created Time Slot") {}

            if(title == "Edit Time Slot") {
                this.timeSlotForm = { ...timeSlot }
            }
        },

        /* CLEAR */
        clear() {
            Object.assign(this.timeSlotForm, {
                id: undefined,
                name: '',
                description: '',
                price: null,
            })
            this.dialog.timeSlot = false
        }
    }
})