<template>
  <!-- PUBLIC HEADER & NAV (Hidden on /admin routes) -->
  <div 
    v-if="!isAdminRoute" 
    class="header_con" 
    :style="isHomePage ? 'position:fixed' : 'position:relative'"
  >
    <!-- HEADER -->
    <header id="header">
      <div class="comp_logo">
        <RouterLink to="/">
          <img src="@/assets/image/logo.webp" alt="Upskills Facilitation Partners Logo" />
        </RouterLink>
      </div>
    </header>

    <!-- NAVIGATION DESKTOP -->
    <nav id="nav">
      <el-menu
        :default-active="activeLink"
        class="el-menu-desktop"
        mode="horizontal"
        background-color="transparent"
        text-color="var(--defaultColor, #ffffff)"
        active-text-color="var(--secColor, #ffd04b)"
        @select="handleSelect"
        :ellipsis="false"
      >
        <el-menu-item index="banner"><a :href="isHomePage ? '#' : '/'">Home</a></el-menu-item>
        <el-menu-item index="about"><a :href="isHomePage ? '#about' : '/#about'">About</a></el-menu-item>
        <el-menu-item index="services"><a :href="isHomePage ? '#services' : '/#services'">Services</a></el-menu-item>
        <el-menu-item index="team"><a :href="isHomePage ? '#team' : '/#team'">Team</a></el-menu-item>
        <el-menu-item index="contact"><a :href="isHomePage ? '#contact' : '/#contact'">Contact</a></el-menu-item>
      </el-menu>
    </nav>

    <!-- NAVIGATION MOBILE -->
    <button class="menu_toggle" id="menu_toggle">
      <svg width="40" height="40" viewBox="0 0 20 20" fill="none">
        <line class="bar bar-top" x1="3" y1="7" x2="17" y2="7" stroke="var(--defaultColor)" stroke-width="1.5" stroke-linecap="round"/>
        <line class="bar bar-mid" x1="3" y1="10" x2="17" y2="10" stroke="var(--defaultColor)" stroke-width="1.5" stroke-linecap="round"/>
        <line class="bar bar-bot" x1="3" y1="13" x2="17" y2="13" stroke="var(--defaultColor)" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
        
    <div class="nav" id="nav_mobile">
      <div class="nav_bg"></div>
      <nav class="nav_top nav_border nav_panel" id="navTop">
        <ul class="nav_list">
          <li class="nav_item"><a class="nav_link" :href="isHomePage ? '#' : '/'">Home</a></li>
          <li class="nav_item"><a class="nav_link" :href="isHomePage ? '#about' : '/#about'">About</a></li>
          <li class="nav_item"><a class="nav_link" :href="isHomePage ? '#services' : '/#services'">Services</a></li>
          <li class="nav_item"><a class="nav_link" :href="isHomePage ? '#team' : '/#team'">Team</a></li>
          <li class="nav_item"><a class="nav_link" :href="isHomePage ? '#contact' : '/#contact'">Contact</a></li>
        </ul>
      </nav>
    </div>
  </div>
  
  <!-- NON-HOME BANNER -->
  <div class="banner" v-if="!isAdminRoute && !isHomePage">
    <figure>
      <img src="@/assets/image/bnr-privacy-policy.webp" alt="hands holding a lock" />
      <figcaption><h1>{{ $route.name }}</h1></figcaption>
    </figure>
  </div>

  <!-- MAIN ROUTER VIEW -->
  <RouterView />

  <!-- FOOTER & OVERLAYS (Hidden on /admin routes) -->
  <template v-if="!isAdminRoute">
    <footer id="contact">
      <div class="footer_con">
        <div class="footer_cta">
          <div>
            <h2>Ready to design your next team building experience?</h2>
            <ul>
              <li>Email: <a href="mailto:hello.upskills@gmail.com">hello.upskills@gmail.com</a></li>
              <li>Phone: <a href="tel:09610115585">0961-011-5585</a></li>
            </ul>
            <ul>
              <li><a href="https://www.facebook.com/hello.upskills" target="_blank"><img src="../src/assets/image/fb.webp" alt="Facebook"></a></li>
            </ul>
          </div>
          <div class="footer_btn_con">
            <a class="footer_link cursor-pointer" @click="openBookingForm">Book Now</a>
          </div>
        </div>
        <div class="footer_meta">
          <div>
            <p>&copy; {{ currentYear }} <mark>Upskills Team Building Services</mark> · Cebu, Philippines</p>
            <p>
              <a class="privacy_policy" :href="isHomePage ? '/privacy-policy' : ''" target="_blank"> Privacy Policy </a>
            </p>
          </div>
          <nav>
            <el-menu
              :default-active="activeLink"
              class="el-menu-desktop"
              mode="horizontal"
              background-color="transparent"
              text-color="var(--defaultColor, #ffffff)"
              active-text-color="var(--secColor, #ffd04b)"
              @select="handleSelect"
              :ellipsis="false"
            >
              <el-menu-item index="banner"><a :href="isHomePage ? '#' : '/'">Home</a></el-menu-item>
              <el-menu-item index="about"><a :href="isHomePage ? '#about' : '/#about'">About</a></el-menu-item>
              <el-menu-item index="services"><a :href="isHomePage ? '#services' : '/#services'">Services</a></el-menu-item>
              <el-menu-item index="team"><a :href="isHomePage ? '#team' : '/#team'">Team</a></el-menu-item>
              <el-menu-item index="contact"><a :href="isHomePage ? '#contact' : '/#contact'">Contact</a></el-menu-item>
            </el-menu>
          </nav>
        </div>
      </div>
    </footer>

    <!-- BACK TO TOP -->
    <el-backtop :right="32" :bottom="100"/>

    <!-- CHATBOT -->
    <ChatBot />

    <!-- BOOKING FORM -->
    <BookingForm />
  </template>
</template>

<script lang="ts">
import { gsap } from 'gsap/all';
// @ts-ignore - GSAP utilities are provided as JS and do not have a TS declaration file.
import { initHeaderAnimations, initFooterAnimations, initMobileMenu } from '@/utils/gsap';
import ChatBot from './components/ChatBot.vue';
import BookingForm from '@/components/BookingForm.vue';

import { useTimeSlotStore } from '@/stores/useTimeSlotStore';
import { useServiceStore } from '@/stores/useServiceStore';
import { useBookingFormStore } from '@/stores/useBookingFormStore';

export default {
  name: 'App',
  components: {
    ChatBot,
    BookingForm,
  },
  setup() {
    const timeSlotStore = useTimeSlotStore()
    const serviceStore = useServiceStore()
    const bookingFormStore = useBookingFormStore()
    return { timeSlotStore, serviceStore, bookingFormStore }
  },
  data() {
    return {
      activeLink: localStorage.getItem('activeLink') || '',
      dialog: {
        bookingForm: false,
      },
    };
  },
  computed: {
    isAdminRoute() {
      return this.$route.path.includes('/admin');
    },
    isHomePage() {
      return this.$route.path === '/';
    },
   
    currentYear() {
      return new Date().getFullYear();
    },
  },
  watch: {
    '$route.path'(newPath) {
      this.updateActiveLink(newPath);
    },
  },
  methods: {
    handleSelect(index: string) {
      this.activeLink = index;
      localStorage.setItem('activeLink', index);
    },
    openBookingForm() {
      gsap.fromTo('#bookingForm',{
          opacity: 0,
          y: 300,
        },
        {
          visibility: 'visible',
          opacity: 1,
          y: 0,
          ease: 'back.out',
        });
        this.timeSlotStore.fetchTimeSlots()
        this.serviceStore.fetchServices()
    },
    clear() {
      this.dialog.bookingForm = false;
    },
    updateActiveLink(path: string) {
      if (path === '/') {
        this.activeLink = this.activeLink || 'banner';
        localStorage.setItem('activeLink', this.activeLink);
      } else {
        this.activeLink = '';
        localStorage.removeItem('activeLink');
      }
    },
  },
  mounted() {
    this.updateActiveLink(this.$route.path);

    setTimeout(() => {
      if (!this.isAdminRoute) {
        initHeaderAnimations();
        initFooterAnimations();
        initMobileMenu();
      }
    }, 500);
  },
}
</script>