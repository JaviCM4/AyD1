import CreateUserView from '@/views/CreateUserView.vue'
import HomeView from '@/views/HomeView.vue'
import InventoryView from '@/views/InventoryView.vue'
import LoginView from '@/views/LoginView.vue'
import MyVehiclesView from '@/views/MyVehiclesView.vue'
import RestoreView from '@/views/RestoreView.vue'
import UserView from '@/views/UserView.vue'
import VehicleRegistrationView from '@/views/VehicleRegistrationView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    }, 
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/create-user',
      name: 'create-user',
      component: CreateUserView,
    },
    {
      path: '/users',
      name: 'users',
      component: UserView,
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
    },
    {
      path: '/restore',
      name: 'restore',
      component: RestoreView,
    }
  ],
})

export default router
