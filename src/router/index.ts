import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
    },
   /*  {
      path: '/privacy-policy',
      name: 'Privacy Policy',
      component: () => import('../views/PrivacyPolicyView.vue'),
    }, */
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/AdminView.vue'),
      children: [
        {
          path: 'booking',
          name: 'Bookings',
          component: () => import('../views/BookingView.vue'),
        },
        {
          path: 'status',
          name: 'Booking Status',
          component: () => import('../views/BookingStatusView.vue'),
        },
        {
          path: 'timeslot',
          name: 'Booking Time Slot',
          component: () => import('../views/BookingTimeSlotView.vue'),
        },
        {
          path: 'services',
          name: 'Services',
          component: () => import('../views/ServiceView.vue'),
        },
        {
          path: 'calendar',
          name: 'Calendar',
          component: () => import('../views/CalendarView.vue'),
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404 Not Found',
      component: () => import('../components/NotFound.vue'),
      // meta: {
      //   isPublic: true,
      // },
    },
  ],
})

export default router