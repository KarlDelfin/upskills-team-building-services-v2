<template>
  <div data-lenis-prevent id="bookingForm" v-loading="bookingFormStore.loading" class="booking_form">
    <!-- Close Button -->
    <button class="booking_form_close" aria-label="Close form" @click="bookingFormStore.clear">
      &times;
    </button>

    <div class="booking_form_wrapper">
      <!-- Dynamic Step Indicator -->
      <div class="steps_con">
        <template v-for="(step, index) in bookingFormStore.steps" :key="step.number">
          <div 
            class="step_item" 
            :class="{ 
              active: bookingFormStore.formStep === step.number, 
              completed: bookingFormStore.formStep > step.number 
            }"
          >
            <div class="step_circle">
              {{ step.number }}
            </div>
            <div class="step_title">
              {{ step.title }}
            </div>
            <div class="step_desc">
              {{ step.desc }}
            </div>
          </div>

          <!-- Connector Line -->
          <div 
            v-if="index < bookingFormStore.steps.length - 1" 
            class="step_line"
            :class="{ completed: bookingFormStore.formStep > step.number }"
          ></div>
        </template>
      </div>

      <div>
        <!-- STEP 1: SERVICES -->
        <div v-if="bookingFormStore.formStep === 1" class="service_panel">
          <div class="services_grid">
            <div
              v-for="service in serviceStore.services"
              :key="service.id"
              class="service_card"
              :class="{ active: bookingFormStore.bookingForm.serviceId === service.id }"
              @click="bookingFormStore.handleSelectService(service.id)"
            >
              <div class="service_header">
                <h3>{{ service.name }}</h3>
              </div>
              <p class="service_description">{{ service.description }}</p>
              <div class="service_footer">
                <i class="fa-solid fa-circle-check"></i>
                <span>{{ bookingFormStore.bookingForm.serviceId === service.id ? 'Selected' : 'Select Service' }}</span>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="form_nav">
            <span></span>
            <button class="btn_next" @click="bookingFormStore.goToStep(2, 'next')">
              Next <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- STEP 2: BOOKING TIME -->
        <div v-else-if="bookingFormStore.formStep === 2" class="service_panel">
          <div>
            <label class="field_label">Preferred Date</label>
            <VCalendar
              expanded
              :min-date="new Date()"
              :attributes="bookingFormStore.vCalendarEvents"
              @dayclick="bookingFormStore.handleSelectDate"
            />
          </div>

          <div style="margin-top: 20px;">
            <label class="field_label">Preferred Time</label>
            <div class="time_buttons">
              <button
                v-for="slot in timeSlotStore.timeSlots"
                :key="slot.id"
                type="button"
                class="time_btn"
                :class="{
                  active: slot.id === slot.id,
                  disabled: slot.disabled
                }"
                :disabled="slot.disabled"
                @click="!slot.disabled && bookingFormStore.handleSelectTime(slot.id)"
              >
                {{ slot.slotTime }}
              </button>
            </div>
          </div>

          <!-- Navigation -->
          <div class="form_nav">
            <button class="btn_back" @click="bookingFormStore.goToStep(1, 'back')">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <button class="btn_next" @click="bookingFormStore.goToStep(3, 'next')">
              Next <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- STEP 3: BOOKING FORM -->
        <div v-else class="form_panel">
          <el-form ref="bookingFormRef" label-position="top" :model="bookingFormStore.bookingForm">
            <el-form-item label="Full Name" prop="fullName" :rules="[{ fullName: [{ required: true, message: 'Please input full name', trigger: 'blur' }],}]">
              <el-input v-model="bookingFormStore.bookingForm.fullName" placeholder="John Doe" size="large" />
            </el-form-item>

            <el-form-item label="Email" prop="email" :rules="[{ email: [ { required: true, message: 'Please input email address', trigger: 'blur' }, { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: 'Please input a valid email address', trigger: ['blur', 'change'] } ],}]">
              <el-input v-model="bookingFormStore.bookingForm.email" placeholder="johndoe@example.com" size="large" />
            </el-form-item>

            <el-form-item 
              label="Phone"
              prop="phone"
              :rules="[ { phone: [ { required: true, message: 'Please input phone number', trigger: 'blur' }, { pattern: /^09\d{9}$/, message: 'Must be a valid PH mobile number starting with 09', trigger: ['blur', 'change'] } ] } ]">
              <el-input v-model="bookingFormStore.bookingForm.phone" maxlength="11" placeholder="09XXXXXXXXXX" size="large" />
            </el-form-item>

            <!-- <el-form-item label="Number of Participants" prop="noOfParticipants">
              <el-input-number v-model="bookingFormStore.bookingForm.noOfParticipants" :min="1" style="width: 100%" size="large" placeholder="Enter number" />
            </el-form-item> -->

            <el-form-item >
              <VueHcaptcha
                ref="hcaptchaRef"
                :sitekey="HCAPTCHA_SITEKEY"
                size="normal"
                @verify="bookingFormStore.onVerify"
                @expired="bookingFormStore.onExpired"
              />
            </el-form-item>
          </el-form>

          <!-- Navigation -->
          <div class="form_nav">
            <button class="btn_back" @click="bookingFormStore.goToStep(2, 'back')">
              <i class="fa-solid fa-arrow-left"></i> Back
            </button>
            <button class="btn_submit" :disabled="bookingFormStore.loading" @click="handleConfirm">
              Confirm Booking <i class="fa-solid fa-check"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha';
import { supabase } from '@/utils/supabaseClient';
import { ElMessage } from 'element-plus';
import gsap from 'gsap';
import moment from 'moment';
import { useTimeSlotStore } from '@/stores/useTimeSlotStore';
import { useServiceStore } from '@/stores/useServiceStore';
import { useBookingFormStore } from '@/stores/useBookingFormStore';

export default {
  components: {
    VueHcaptcha
  },

  setup() {
    const timeSlotStore = useTimeSlotStore()
    const serviceStore = useServiceStore()
    const bookingFormStore = useBookingFormStore()
    return { timeSlotStore, serviceStore, bookingFormStore }
  },

  data() {
    return {
      HCAPTCHA_SITEKEY: import.meta.env.VITE_HCAPTCHA_SITE_KEY
    };
  },
 
  methods: {
    async handleConfirm() {
        const formEl = await this.$refs.bookingFormRef as any
        await formEl.validate()

        await this.bookingFormStore.submitBooking()
        
    },
  
    async mounted() {
      
    },
  }
};
</script>

<style scoped>
.booking_form {position: fixed; background: var(--defaultColor); width: 100%; max-width: 900px; border-radius: 12px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,.35); bottom: 30px; left: 0; right: 0; margin: 0 auto; opacity: 0; visibility: hidden; z-index: 1;}
.booking_form_close {position:absolute; top:16px; right:20px; font-size:1.4rem; color:var(--bodyColor); cursor:pointer; background:none; border:none;}
.booking_form_wrapper { max-height: 80vh; overflow-y: auto; overflow-x: hidden; width: 100%;}
.steps_con {display:flex; align-items:center; justify-content:center; gap:0; margin-bottom:40px;}
.step_item {display:flex; flex-direction:column; align-items:center; text-align:center; width:220px;}
.step_circle {width:36px; height:36px; border-radius:50%; border:2px solid var(--bodyColor); color:var(--bodyColor); display:flex; align-items:center; justify-content:center; font-weight:700; margin-bottom:10px; background:var(--defaultColor);}
.step_item.active .step_circle, .step_item.completed .step_circle {border-color:var(--priColor); color:var(--priColor);}
.step_item.active .step_title {color:var(--priColor);}
.step_title {font-weight:700; color:var(--bodyColor); font-size:.95rem;}
.step_desc {font-size:.8rem; color:#888; margin-top:4px;}

.step_line {flex:1; height:2px; background:var(--bodyColor); margin-top:-24px; max-width:120px;}
.step_line.completed {background:var(--priColor);}

.services_grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }

.service_panel { padding: 0 10px; }
.service_card { background: #fff; border: 2px solid #e8eef7; border-radius: 16px; padding: 15px; cursor: pointer; transition: all 0.3s ease; position: relative; }
.service_card:hover { transform: translateY(-5px); border-color: #2e85e5; box-shadow: 0 10px 30px rgba(46, 133, 229, 0.15); }
.service_card.active { border-color: #2e85e5; background: linear-gradient( 180deg, rgba(46, 133, 229, 0.05), #fff ); box-shadow: 0 10px 30px rgba(46, 133, 229, 0.2); }
.service_card.active::after { content: "✓"; position: absolute; top: -12px; right: -10px; width: 28px; height: 28px; background: #2e85e5; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }

.service_header { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; margin-bottom: 12px; }
.service_header h3 { margin: 0; font-size: 1.2rem; color: #222; }

.service_price { background: #2e85e5; color: #fff; padding: 6px 12px; border-radius: 30px; font-weight: 600; white-space: nowrap; }

.service_description { color: #666; line-height: 1.6; margin-bottom: 20px; }

.service_footer { display: flex; align-items: center; gap: 8px; color: #2e85e5; font-weight: 600; }
.service_footer i { font-size: 18px; }

.form_panel form {display: grid; grid-template-columns: repeat(2,1fr); gap: 0 1rem}
.field_label {display:block; font-weight:700; color:var(--bodyColor); margin-bottom:8px; font-size:.9rem;}

.time_buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
.time_btn { padding: 8px 16px; border: 1px solid #ccc; border-radius: 5px; background: #f9f9f9; cursor: pointer; transition: 0.2s;width: 19%; }
.time_btn.active { background: var(--priColor); color: #fff; }
.time_btn.active:hover {background: var(--secColor); }
.time_btn:hover { background: #e9e9e9; }
.time_btn.disabled { color: #7f8c8d; opacity: 0.6; cursor: not-allowed; background-color: #ccc; }

.form_nav {display:flex; justify-content:space-between; align-items:center; margin-top:30px; border-top:1px solid #eee; padding-top:24px;}
.form_nav button:hover { background:var(--secColor); transition:all .3s ease; color:var(--defaultColor);}
.btn_back, .btn_next, .btn_submit {padding:12px 28px; border-radius:8px; font-weight:700; cursor:pointer; border:none; font-size:.95rem;}
.btn_back {background:var(--defaultColor); color:var(--bodyColor); border:1px solid #ddd;}
.btn_next, .btn_submit {background:var(--priColor); color:var(--defaultColor);}
.btn_next i, .btn_submit i {margin-left:8px;}
.btn_back i {margin-right:8px;}

@media(max-width:1000px) {
  .booking_form {max-width:95%;}
}

@media(max-width:800px) {
  .service_card {flex:1 1 calc(50% - 10px);}
  .step_title {font-size:.8rem;}
  .step_desc {display:none;}
  .time_btn {width: 48%;}
}

@media(max-width:600px) {
  .form_panel form {grid-template-columns: 1fr}
  .booking_form {padding:24px;}
  .service_card {flex:1 1 100%;}
  .steps_con {gap:0;}
  .step_line {max-width:30px;}
  .form_nav {flex-direction:column; gap:12px;}
  .btn_back, .btn_next, .btn_submit {width:100%; text-align:center;}
}
</style>