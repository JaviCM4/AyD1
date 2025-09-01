<script setup lang="ts">
import router from '@/router';
import { ref, reactive, onMounted } from 'vue'
const API_URL = import.meta.env.VITE_API_URL;

const errorMss = ref<string>("");

// Interfaces
interface Empleado {
  id: number
  nombre: string
  especialidad: string
}

interface Servicio {
  id: number
  nombre: string
  descripcion: string
  precio: number
  estado: 'Pendiente' | 'En proceso' | 'Finalizado' | 'Cancelado'
  tipo: 'Correctivo' | 'Preventivo'
  empleados: Empleado[]
  pagado: boolean
  cancelado: boolean
}

interface Carro {
  id: number
  marca: string
  modelo: string
  año: number
  color: string
  placa: string
  chasis: string
  motor: string
  servicios: Servicio[]
}

// Estado reactivo
const showNewCarDialog = ref(false)
const showServicesDialog = ref(false)
const showNewServiceDialog = ref(false)
const showEmployeeDialog = ref(false)
const validForm = ref(false)

const selectedCar = ref<Carro | null>(null)
const selectedService = ref<Servicio | null>(null)
const selectedEmployees = ref<Empleado[]>([])

// Reglas de validación
const rules = {
  required: (value: string) => !!value || 'Este campo es requerido'
}

// Datos de carros
const cars = ref<Carro[]>([])

const loadCars = async () => {
  try {
    const res = await fetch(`${API_URL}/api/v1/vehicles`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    if (!res.ok) {
      throw new Error(`Error cargando vehículos: ${res.status}`)
    }

    const data = await res.json()

    // Mapear la estructura que espera tu template
    cars.value = data.map((car: any) => ({
      id: car.id,
      marca: car.model.brand.name,
      modelo: car.model.name,
      año: car.model.year,
      color: car.color,
      placa: car.licensePlate,
      chasis: car.vin,
      motor: car.model.engineSize.size,
      owner: car.owner,
      servicios: []  // Si quieres más tarde agregar servicios
    }))

    console.log('Vehículos cargados:', cars.value)

  } catch (error: any) {
    console.error('No se pudieron cargar los vehículos:', error.message)
    errorMss.value = error.message || "No se pudieron cargar los vehiculos"
  }
}

// Llamar al cargar el componente
onMounted(() => {
  loadCars()
})

// Métodos
const openCarServices = (car: Carro) => {
  selectedCar.value = car
  showServicesDialog.value = true
}

const closeServicesDialog = () => {
  showServicesDialog.value = false
  selectedCar.value = null
}

const openAddCar = () => {
  router.push({ name: 'createVehicle' })
}

const addServiceRedirect = (carId: number) => {
  router.push({ name: 'addWork', params: { vehicleId: carId } })
}

const viewDetailsRedirect = (carId: number) => {
  router.push({ name: 'viewVehicleDetails', params: { vehicleId: carId } })
}

</script>

<template>
  <v-app>
    <div class="cars-container">
      <!-- Iconos flotantes de fondo -->
      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-car-wrench</v-icon>
        <v-icon class="floating-icon" size="32">mdi-engine</v-icon>
        <v-icon class="floating-icon" size="28">mdi-car-tire-alert</v-icon>
        <v-icon class="floating-icon" size="36">mdi-oil-lamp</v-icon>
        <v-icon class="floating-icon" size="20">mdi-car-battery</v-icon>
        <v-icon class="floating-icon" size="26">mdi-car-brake-abs</v-icon>
        <v-icon class="floating-icon" size="30">mdi-car-coolant-level</v-icon>
      </div>

      <v-container fluid class="pa-6">
        <!-- Header -->
        <v-row class="mb-6">
          <v-col cols="12">
            <div class="header-section text-center mb-4">
              <v-icon size="48" class="mb-2" color="orange darken-2">mdi-car-multiple</v-icon>
              <h1 class="text-h4 font-weight-bold mb-2">Gestión de Vehículos</h1>
              <p class="text-subtitle1">AutoXela - Taller Automotriz</p>
            </div>
          </v-col>
        </v-row>

        <v-alert v-if="errorMss" type="error" dense class="mt-3">
          {{ errorMss }}
        </v-alert>

        <!--Busqueda de vehiculos-->

        <!-- Botón para agregar nuevo carro -->
        <v-row class="mb-4">
          <v-col cols="12" class="text-center">
            <v-btn large class="custom-btn" @click="openAddCar">
              <v-icon left>mdi-car-plus</v-icon>
              Agregar Nuevo Vehículo
            </v-btn>
          </v-col>
        </v-row>

        <!-- Lista de carros -->
        <v-row>
          <v-col v-for="car in cars" :key="car.id" cols="12" sm="6" md="4" lg="3">
            <v-card class="car-card elevation-8" rounded="lg" @click="openCarServices(car)" hover>
              <div class="car-header">
                <v-icon size="32" color="white">mdi-car</v-icon>
                <div class="car-plate">{{ car.placa }}</div>
              </div>
              <v-card-text class="pb-2">
                <h3 class="text-h6 font-weight-bold mb-2">{{ car.marca }} {{ car.modelo }}</h3>
                <div class="car-details">
                  <p class="mb-1"><strong>Año:</strong> {{ car.año }}</p>
                  <p class="mb-1"><strong>Color:</strong> {{ car.color }}</p>
                  <p class="mb-1"><strong>Chasis:</strong> {{ car.chasis }}</p>
                  <p class="mb-0"><strong>Motor:</strong> {{ car.motor }}</p>
                </div>
              </v-card-text>
              <v-card-actions class="pt-0">
                <v-spacer></v-spacer>
                <v-btn small text color="orange darken-2">
                  Ver Opciones
                  <v-icon right>mdi-arrow-right</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dialog para opciones del carro -->
        <v-dialog v-model="showServicesDialog" max-width="800px" persistent>
          <v-card class="dialog-card" v-if="selectedCar">
            <div class="dialog-header">
              <v-icon size="32" color="white" class="mr-3">mdi-car-wrench</v-icon>
              <div>
                <h2 class="text-h5 font-weight-bold">{{ selectedCar.marca }} {{ selectedCar.modelo }}</h2>
                <p class="mb-0 text-subtitle2">Placa: {{ selectedCar.placa }}</p>
              </div>
            </div>
            <v-card-text class="pa-0">
              <!-- Botón para agregar nuevo servicio -->
              <div class="pa-4 border-bottom">
                <v-btn small class="custom-btn" @click="addServiceRedirect(selectedCar.id)">
                  <v-icon left>mdi-plus</v-icon>
                  Agregar Servicio
                </v-btn>
              </div>
              <!-- Botón para ver detalles -->
              <div class="pa-4 border-bottom">
                <v-btn small class="custom-btn" @click="viewDetailsRedirect(selectedCar.id)">
                  <v-icon left>mdi-plus</v-icon>
                  Detalles
                </v-btn>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn text @click="closeServicesDialog">
                Cerrar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </v-container>
    </div>
  </v-app>
</template>


<style scoped>
.cars-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  background-attachment: fixed;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.floating-icons {
  position: fixed;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-icon {
  position: absolute;
  opacity: 0.05;
  color: #ff6b35;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.floating-icon:nth-child(1) {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.floating-icon:nth-child(2) {
  top: 20%;
  right: 15%;
  animation-delay: 1s;
}

.floating-icon:nth-child(3) {
  bottom: 30%;
  left: 20%;
  animation-delay: 2s;
}

.floating-icon:nth-child(4) {
  bottom: 20%;
  right: 10%;
  animation-delay: 3s;
}

.floating-icon:nth-child(5) {
  top: 50%;
  left: 5%;
  animation-delay: 4s;
}

.floating-icon:nth-child(6) {
  top: 60%;
  right: 25%;
  animation-delay: 5s;
}

.floating-icon:nth-child(7) {
  bottom: 60%;
  left: 50%;
  animation-delay: 6s;
}

.header-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.car-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 2;
  cursor: pointer;
  transition: all 0.3s ease;
}

.car-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.2) !important;
}

.car-header {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.car-plate {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: bold;
  font-size: 14px;
}

.car-details p {
  font-size: 14px;
  color: #666;
}

.custom-btn {
  background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
  color: white !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border-radius: 20px !important;
}

.custom-btn:hover {
  background: linear-gradient(45deg, #f7931e, #ff6b35) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3) !important;
}

.custom-btn:disabled {
  background: #ccc !important;
  color: #666 !important;
  transform: none !important;
  box-shadow: none !important;
}

.dialog-card {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dialog-header {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  color: white;
  padding: 24px;
  display: flex;
  align-items: center;
}

.services-list {
  max-height: 400px;
  overflow-y: auto;
}

.service-item {
  transition: background-color 0.2s ease;
}

.service-item:hover {
  background-color: rgba(255, 107, 53, 0.05);
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.status-toggle .v-btn {
  font-size: 12px !important;
}

.employee-list {
  max-height: 300px;
  overflow-y: auto;
}

.d-flex.gap-2 {
  gap: 8px;
}

.header-section {
  padding: 24px 16px;
}

.header-section h1 {
  font-size: 1.8rem !important;
}

.car-header {
  padding: 12px;
}

.dialog-header {
  padding: 16px;
}

.dialog-header h2 {
  font-size: 1.3rem !important;
}

.status-toggle {
  flex-direction: column;
}

.status-toggle .v-btn {
  margin-bottom: 4px;
  font-size: 10px !important;
}
</style>