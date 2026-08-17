import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import debounce from 'lodash/debounce';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export interface BookingStatus {
    id: Number | String,
    name: String,
    color: String,
    dateTimeCreated: Date
}

export interface BookingStatusPagination {
    currentPage: number,
    elementsPerPage: number,
    totalElements: number,
}

export const useBookingStatusStore = defineStore('bookingStatus', {
    state: () => ({
        title: '' as String,
        loading: false as Boolean,
        search: '' as String,

        bookingStatuses: [] as BookingStatus[],
        
        bookingStatusForm: { } as BookingStatus,

        bookingStatusPagination: {
            currentPage: 1,
            elementsPerPage: 10,
            totalElements: 0,
        } as BookingStatusPagination,

        dialog: {
            bookingStatus: false as Boolean,
        }

    }),
    actions: {
        /* DEBEOUNCE SEARCH */
        searchBookingStatus: debounce(function(this: any) {
            this.fetchBookingStatuses()
        }, 300),
        
        /* GET */
        async fetchBookingStatuses() {
            try {
                this.loading = true

                const limit = this.bookingStatusPagination.elementsPerPage;
                const from = (this.bookingStatusPagination.currentPage - 1) * limit;
                const to = from + limit - 1;

                let query = supabase
                    .from('Status')
                    .select('*', { count: 'exact' })

                if (this.search && this.search.trim() !== '') {
                    query = query.ilike('name', `%${this.search}%`);
                }

                query = query.order('dateTimeCreated', { ascending: false }).range(from, to);

                const { data, error, count } = await query;

                if(error) throw error

                this.bookingStatuses = data.map((data) => ({
                    ...data,
                    dateTimeCreated: moment(data.dateTimeCreated).format('LLL')
                })) || []
                
                this.bookingStatusPagination.currentPage = this.bookingStatusPagination.currentPage;
                this.bookingStatusPagination.totalElements = count || 0;
            }
            catch(error) {
                console.log(error)
            }
            finally {
                this.loading = false
            }
        },

        /* DELETE */
        async deleteBookingStatus(id: Number) {
            try {
                await ElMessageBox.confirm('Do you want to delete this status?', 'Warning', {
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel',
                    type: 'warning',
                    icon: markRaw(Delete),
                })

                this.loading = true

                const { error } = await supabase
                    .from('Status')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                ElMessage.success('BookingStatus deleted successfully.')
                this.fetchBookingStatuses()

            } catch (error) {
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        /* CREATE / UPDATE FORM */
        async submitForm() {
            try{
                const payload = {
                    name: this.bookingStatusForm.name,
                    color: this.bookingStatusForm.color,
                }

                if(this.title === 'Create BookingStatus') {
                    const { error } = await supabase
                    .from('Status')
                    .insert(payload) 

                    if(error) throw error

                    ElMessage.success('BookingStatus created successfully.')
                }

                if(this.title === 'Edit BookingStatus') {
                    const { error } = await supabase
                    .from('Status')
                    .update(payload)
                    .eq('id', this.bookingStatusForm.id)

                    if(error) throw error

                    ElMessage.success('BookingStatus updated successfully.')
                }
            } catch (error) {
                console.error(error)
            } finally {
                this.loading = false
                this.fetchBookingStatuses()
                this.dialog.bookingStatus = false
            }
        },

        /* DIALOG CONTROLLER */
        formController(action: String, bookingStatus: any) {
            this.title = action
            this.dialog.bookingStatus = true
            this.bookingStatusForm.color = '#136cb3'

            if(action == "Created Status") {}

            if(action == "Edit Status") {
                this.bookingStatusForm = { ...bookingStatus }
                console.log(bookingStatus)
            }
        },

        /* CLEAR */
        clear() {
            Object.assign(this.bookingStatusForm, {
                id: undefined,
                name: '',
                color: '',
            })
            this.dialog.bookingStatus = false
        }
    }
})