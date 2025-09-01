import AssignmentView from '@/views/AssignmentView.vue'
import BuyView from '@/views/BuyView.vue'
import CreateUserView from '@/views/CreateUserView.vue'
import FacturaView from '@/views/facturaView.vue'
import HomeView from '@/views/HomeView.vue'
import InventoryView from '@/views/InventoryView.vue'
import LoginView from '@/views/LoginView.vue'
import MovimientosView from '@/views/MovimientosView.vue'
import MyVehiclesView from '@/views/MyVehiclesView.vue'
import ReportsView from '@/views/ReportsView.vue'
import RestoreView from '@/views/RestoreView.vue'
import UserView from '@/views/UserView.vue'
import VehicleRegistrationView from '@/views/VehicleRegistrationView.vue'
import CreateVehicle from '@/views/vehicles/CreateVehicle.vue'
import DetailsVehicle from '@/views/vehicles/DetailsVehicle.vue'
import CreateWork from '@/views/works/CreateWork.vue'
import TrackWork from '@/views/works/TrackWork.vue'
import ViewWorks from '@/views/works/ViewWorks.vue'
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
    }, 
    {
      path: '/works/create',
      name: 'createWorks',
      component: CreateWork
    },
    {
      path: '/works/list',
      name: 'worksList',
      component: ViewWorks
    },
    {
      path: '/vehicle/create',
      name: 'createVehicle',
      component: CreateVehicle
    },
    {
      path: '/vehicle/addWork/:vehicleId',
      name: 'addWork',
      component: CreateWork,
      props: true
    },
    {
      path: '/vehicle/details/:vehicleId',
      name: 'viewVehicleDetails',
      component: DetailsVehicle,
      props: true
    },
    {
      path: '/works/add/progress/:workOrderId',
      name: 'workordersAddProgress',
      component: TrackWork,
      props: true
    },
    {
      path: '/assignment',
      name: 'assignment',
      component: AssignmentView,
    },
    {
      path: '/buy',
      name: 'buy',
      component: BuyView,
    },
    {
      path: '/factura',
      name: 'factura',
      component: FacturaView,
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
    },
    {
      path: '/mov',
      name: 'mov',
      component: MovimientosView,
    }
  ],
})
export default router
