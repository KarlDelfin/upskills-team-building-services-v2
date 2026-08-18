import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'
import { ElMessage, ElMessageBox } from 'element-plus'
import moment from 'moment'
import debounce from 'lodash/debounce';
import gsap from 'gsap';

import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'

import { useTimeSlotStore } from './useTimeSlotStore';
import { useStatusStore } from './useStatusStore';

export const useBookingFormStore = defineStore('bookingForm', {
    state: () => ({
        loading: false,
        formStep: 1,
        captchaToken: null,
        services: [],
        statuses: [],
        timeSlots: [],
        vCalendarEvents: [],
        steps: [
            { number: 1, title: 'Training Program', desc: 'Select the workshop or training service' },
            { number: 2, title: 'Schedule', desc: 'Choose your preferred date and time' },
            { number: 3, title: 'Organization Details', desc: 'Provide your contact and company information' }
        ],
        bookingForm: {
            serviceId: '',
            bookingDate: '',
            timeSlotId: '',
            statusId: '',
            fullName: '',
            email: '',
            phone: '',
            noOfParticipants: 1
        },
    }),
    actions: {
        onVerify(token: any) {
            this.captchaToken = token;
        },

        onExpired() {
            this.captchaToken = null;
        },

        // BOOKING FORM STEPS
        goToStep(step: number, action: string) {
            if (action === 'back') {
                this.formStep = step;
                return;
            }

            if (this.formStep === 1 && !this.bookingForm.serviceId) {
                ElMessage.warning('Please select a service.');
                return;
            }

            if (this.formStep === 2) {
                if (!this.bookingForm.bookingDate) {
                ElMessage.warning('Please select a preferred date.');
                return;
                }
                if (!this.bookingForm.timeSlotId) {
                ElMessage.warning('Please select a preferred time slot.');
                return;
                }
            }

            this.formStep = step;
        },

        // SELECT SERVICE
        handleSelectService(serviceId: any) {
            this.bookingForm.serviceId = serviceId;
        },

        /* SELECT TIME */
        handleSelectTime(timeSlotId: any) {
            this.bookingForm.timeSlotId = timeSlotId;
        },

        /* SELECT DATE */
        async handleSelectDate(day: any) {

            const timeSlotStore = useTimeSlotStore()
            const statusStore = useStatusStore()

            this.bookingForm.bookingDate = '';
            this.bookingForm.timeSlotId = '';

            const today = moment().startOf('day');
            const targetDate = moment(day.date).startOf('day');

            if (targetDate < today) {
                ElMessage.warning('Cannot select a past date.');
                return;
            }

            this.bookingForm.bookingDate = targetDate.toISOString();

           /*  this.vCalendarEvents = [
                {
                    highlight: { backgroundColor: 'var(--priColor, #3b82f6)' },
                    dates: new Date(day.date)
                }
            ]; */

            try {
                const startOfDay = targetDate.format('YYYY-MM-DD 00:00:00');
                const endOfDay = targetDate.format('YYYY-MM-DD 23:59:59');

                const { data, error } = await supabase
                .from('Booking')
                .select('timeSlotId')
                .gte('bookingDate', startOfDay)
                .lte('bookingDate', endOfDay);

                if (error) throw error;

                const bookedTimeSlotIds = new Set((data || []).map(item => item.timeSlotId));

                timeSlotStore.timeSlots = timeSlotStore.timeSlots.map((slot) => ({
                    ...slot,
                    disabled: bookedTimeSlotIds.has(slot.id)
                }))
            } catch (err) {
                console.error('Error fetching booked slots:', err);
            }
            },

        
        /* SUBMIT BOOKING */
        async submitBooking() {
            const timeSlotStore = useTimeSlotStore()
            const statusStore = useStatusStore()

            try {
                if (!this.captchaToken) {
                    ElMessage.warning('Please check the security box before submitting.');
                    return;
                }

                if (!this.bookingForm.statusId) {
                    const pendingStatus = statusStore.find(s => s.name?.toLowerCase() === 'pending');
                    if (pendingStatus) this.bookingForm.statusId = pendingStatus.id;
                }

                this.loading = true;

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

                const { error } = await supabase.from('Booking').insert(payload);

                if (error) throw error;

                /* SEND EMAIL TO OWNER */
                try {
                    await supabase.functions.invoke('send-booking-email', {
                        body: {
                        clientName: payload.fullName,
                        clientEmail: payload.email,
                        clientPhone: payload.phone,
                        bookingDate: payload.bookingDate,
                        timeSlotId: payload.timeSlotId,
                        noOfParticipants: payload.noOfParticipants
                        }
                    });
                } catch (emailErr) {

                console.error('Database saved, but email trigger failed:', emailErr);
                }

                ElMessage.success('Booking submitted successfully.');
                this.clear();
                
            } catch (err) {
                console.error('Booking submission error:', err);
            } finally {
                this.loading = false;
            }
        },

        // Form Reset
        clear() {
            const timeSlotStore = useTimeSlotStore()
            const statusStore = useStatusStore()
            const pendingStatus = statusStore.find(s => s.name?.toLowerCase() === 'pending');

            Object.assign(this.bookingForm, {
                serviceId: '',
                bookingDate: '',
                timeSlotId: '',
                statusId: pendingStatus ? pendingStatus.id : '',
                fullName: '',
                email: '',
                phone: '',
                noOfParticipants: 1
            });

            this.vCalendarEvents = [];
            timeSlotStore.timeSlots = timeSlotStore.timeSlots.map(s => ({ ...s, disabled: false }));

            setTimeout(() => {
                this.formStep = 1;
            }, 500);

            gsap.to('.bookingForm', {
                opacity: 0,
                y: window.innerHeight,
                duration: 0.5,
                ease: 'back.in'
            });
        },
    }
})