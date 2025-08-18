import CreateUserView from '@/views/CreateUserView.vue'
import InventoryView from '@/views/InventoryView.vue'
import LoginView from '@/views/LoginView.vue'
import MyVehiclesView from '@/views/MyVehiclesView.vue'
import VehicleRegistrationView from '@/views/VehicleRegistrationView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/create-user',
      name: 'create-user',
      component: CreateUserView,
    },
    {
      path: '/my-vehicles',
      name: 'my-vehicles',
      component: MyVehiclesView,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView,
    },
    {
      path: '/vehicle-registration',
      name: 'vehicle-registration',
      component: VehicleRegistrationView,
    }
  ],
})

export default router
