<script setup lang="ts">
import { ref, computed } from 'vue'

// Interfaces
interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  año: number;
  placa: string;
  chasis: string;
  color: string;
  motor: string;
  ultimoMantenimiento: string;
  estado: 'activo' | 'mantenimiento' | 'inactivo';
}

interface Repuesto {
  nombre: string;
  precio: number;
}

interface Service {
  id: number;
  vehicleId: number;
  nombre: string;
  descripcion: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'programado';
  fechaInicio: string;
  fechaEstimada: string;
  costo: number;
  mecanico: string;
  categoria: string;
  observaciones?: string;
  repuestos?: Repuesto[];
  tiempoEstimado?: string;
}

// Elementos reactivos
const selectedVehicle = ref<Vehicle | null>(null)
const searchQuery = ref('')
const selectedService = ref<Service | null>(null)
const serviceDialog = ref(false)
const activeTab = ref('activos')
const messageText = ref('')

// Datos de ejemplo para pruebas de visualización
const vehicles = ref<Vehicle[]>([
  {
    id: 1,
    marca: 'Toyota',
    modelo: 'Corolla',
    año: 2020,
    placa: 'ABC-123',
    chasis: 'JT2BF22K5X0123456',
    color: 'Blanco',
    motor: '1.8L 4 cilindros',
    ultimoMantenimiento: '2024-01-15',
    estado: 'activo'
  },
  {
    id: 2,
    marca: 'Honda',
    modelo: 'Civic',
    año: 2019,
    placa: 'XYZ-789',
    chasis: 'JHMFC2F59KX012345',
    color: 'Negro',
    motor: '1.5L Turbo',
    ultimoMantenimiento: '2024-02-20',
    estado: 'mantenimiento'
  },
  {
    id: 3,
    marca: 'Ford',
    modelo: 'Escape',
    año: 2021,
    placa: 'DEF-456',
    chasis: 'WF0MXXGCXM3012345',
    color: 'Azul',
    motor: '2.0L EcoBoost',
    ultimoMantenimiento: '2024-03-10',
    estado: 'activo'
  }
])

const services = ref<Service[]>([
  {
    id: 1,
    vehicleId: 1,
    nombre: 'Cambio de aceite',
    descripcion: 'Cambio de aceite motor y filtro',
    estado: 'completado',
    fechaInicio: '2024-01-15',
    fechaEstimada: '2024-01-15',
    costo: 150,
    mecanico: 'Roberto Méndez',
    categoria: 'Mantenimiento',
    observaciones: 'Servicio realizado sin inconvenientes. Se recomienda próximo cambio en 5,000 km.',
    repuestos: [
      { nombre: 'Aceite 5W-30', precio: 85 },
      { nombre: 'Filtro de aceite', precio: 45 },
      { nombre: 'Empaque de carter', precio: 20 }
    ],
    tiempoEstimado: '45 minutos'
  },
  {
    id: 2,
    vehicleId: 1,
    nombre: 'Revisión de frenos',
    descripcion: 'Inspección completa del sistema de frenos',
    estado: 'programado',
    fechaInicio: '2024-08-20',
    fechaEstimada: '2024-08-20',
    costo: 200,
    mecanico: 'Ana López',
    categoria: 'Seguridad',
    observaciones: 'Revisión programada del sistema de frenos delantero y trasero',
    repuestos: [
      { nombre: 'Pastillas de freno', precio: 120 },
      { nombre: 'Líquido de frenos', precio: 35 }
    ],
    tiempoEstimado: '2 horas'
  },
  {
    id: 3,
    vehicleId: 2,
    nombre: 'Reparación de transmisión',
    descripcion: 'Reparación mayor de la transmisión automática',
    estado: 'en_proceso',
    fechaInicio: '2024-08-10',
    fechaEstimada: '2024-08-25',
    costo: 1200,
    mecanico: 'Miguel Hernández',
    categoria: 'Reparación',
    observaciones: 'Reparación en progreso. Se detectó problema en el convertidor de torque.',
    repuestos: [
      { nombre: 'Kit de reparación transmisión', precio: 450 },
      { nombre: 'Convertidor de torque', precio: 650 },
      { nombre: 'Aceite ATF', precio: 75 }
    ],
    tiempoEstimado: '3-4 días'
  },
  {
    id: 4,
    vehicleId: 3,
    nombre: 'Mantenimiento preventivo',
    descripcion: 'Revisión general de 30,000 km',
    estado: 'pendiente',
    fechaInicio: '2024-08-18',
    fechaEstimada: '2024-08-18',
    costo: 350,
    mecanico: 'Luis Morales',
    categoria: 'Mantenimiento',
    observaciones: 'Mantenimiento programado según kilometraje del vehículo',
    repuestos: [
      { nombre: 'Aceite motor', precio: 90 },
      { nombre: 'Filtros varios', precio: 65 },
      { nombre: 'Bujías', precio: 80 }
    ],
    tiempoEstimado: '3-4 horas'
  },
  {
    id: 5,
    vehicleId: 1,
    nombre: 'Alineación y balanceo',
    descripcion: 'Alineación de dirección y balanceo de ruedas',
    estado: 'completado',
    fechaInicio: '2024-07-10',
    fechaEstimada: '2024-07-10',
    costo: 80,
    mecanico: 'Carlos Ruiz',
    categoria: 'Mantenimiento',
    observaciones: 'Servicio completado exitosamente. Neumáticos en buen estado.',
    repuestos: [],
    tiempoEstimado: '1 hora'
  }
])

const filteredVehicles = computed(() => {
  if (!searchQuery.value) return vehicles.value
  return vehicles.value.filter(vehicle => 
    vehicle.marca.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    vehicle.modelo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    vehicle.placa.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const vehicleServices = computed(() => {
  if (!selectedVehicle.value) return []
  return services.value.filter(service => service.vehicleId === selectedVehicle.value?.id)
})

const activeServices = computed(() => {
  return vehicleServices.value.filter(service => 
    service.estado === 'pendiente' || service.estado === 'en_proceso' || service.estado === 'programado'
  )
})

const completedServices = computed(() => {
  return vehicleServices.value.filter(service => service.estado === 'completado')
})

const currentServices = computed(() => {
  return activeTab.value === 'activos' ? activeServices.value : completedServices.value
})

// Métodos
const selectVehicle = (vehicle: Vehicle) => {
  selectedVehicle.value = vehicle
  activeTab.value = 'activos'
}

const openServiceDialog = (service: Service) => {
  selectedService.value = service
  serviceDialog.value = true
  messageText.value = ''
}

const closeServiceDialog = () => {
  serviceDialog.value = false
  selectedService.value = null
  messageText.value = ''
}

const sendMessage = () => {
  // Aquí irá la lógica para enviar mensaje
  console.log('Enviando mensaje:', messageText.value)
  console.log('Servicio:', selectedService.value?.nombre)
  // Aquí puedes agregar la lógica para enviar el mensaje
  messageText.value = ''
}

const confirmService = () => {
  // Aquí irá la lógica para confirmar el servicio
  console.log('Confirmando servicio:', selectedService.value?.nombre)
}

const printInvoice = () => {
  // Aquí irá la lógica para imprimir factura
  console.log('Imprimiendo factura del servicio:', selectedService.value?.nombre)
}

const getServiceEstadoColor = (estado: string) => {
  const colors: { [key: string]: string } = {
    'completado': 'success',
    'en_proceso': 'info',
    'pendiente': 'warning',
    'programado': 'purple'
  }
  return colors[estado] || 'grey'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-GT')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(amount)
}

const calculateTotalRepuestos = (repuestos: Repuesto[]) => {
  return repuestos.reduce((total, repuesto) => total + repuesto.precio, 0)
}
</script>

<template>
  <v-app>
    <div class="vehicle-container">
      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-car-wrench</v-icon>
        <v-icon class="floating-icon" size="32">mdi-engine</v-icon>
        <v-icon class="floating-icon" size="28">mdi-car-tire-alert</v-icon>
        <v-icon class="floating-icon" size="36">mdi-oil-lamp</v-icon>
        <v-icon class="floating-icon" size="20">mdi-car-battery</v-icon>
      </div>
      
      <v-container fluid class="pa-4">
        <!-- Header -->
        <v-row class="mb-4">
          <v-col cols="12">
            <div class="header-section">
              <div class="d-flex align-center mb-4">
                <v-icon size="48" color="orange darken-2" class="mr-3">mdi-garage</v-icon>
                <div>
                  <h1 class="text-h4 font-weight-bold grey--text text--darken-2">
                    Gestión de Vehículos
                  </h1>
                  <p class="text-subtitle1 grey--text mb-0">AutoXela - Taller Automotriz</p>
                </div>
              </div>
              
              <!-- Buscador -->
              <v-text-field
                v-model="searchQuery"
                label="Buscar vehículos..."
                prepend-inner-icon="mdi-magnify"
                outlined
                dense
                clearable
                hint="Buscar por marca, modelo, placa o propietario"
                persistent-hint
                class="search-field"
              />
            </div>
          </v-col>
        </v-row>
        
        <v-row>
          <!-- Lista de Vehículos -->
          <v-col cols="12" lg="4">
            <v-card class="vehicles-card elevation-8" rounded="lg">
              <v-card-title class="vehicles-header">
                <v-icon class="mr-2">mdi-car-multiple</v-icon>
                Vehículos Registrados
                <v-spacer />
                <v-chip small color="orange darken-2" text-color="white">
                  {{ filteredVehicles.length }}
                </v-chip>
              </v-card-title>
              
              <v-card-text class="pa-0">
                <v-list class="vehicles-list">
                  <v-list-item
                    v-for="vehicle in filteredVehicles"
                    :key="vehicle.id"
                    @click="selectVehicle(vehicle)"
                    :class="{ 'selected-vehicle': selectedVehicle?.id === vehicle.id }"
                    class="vehicle-item"
                  >
                    <v-list-item-avatar>
                      <v-icon :color="selectedVehicle?.id === vehicle.id ? 'orange darken-2' : 'grey'">
                        mdi-car
                      </v-icon>
                    </v-list-item-avatar>
                    
                    <v-list-item-content>
                      <v-list-item-title class="font-weight-medium">
                        {{ vehicle.marca }} {{ vehicle.modelo }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="d-flex align-center">
                        <span class="mr-2">{{ vehicle.placa }}</span>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                    
                    <v-list-item-action>
                      <v-icon small>mdi-chevron-right</v-icon>
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Panel de Detalles del Vehículo -->
          <v-col cols="12" lg="8">
            <v-card v-if="selectedVehicle" class="details-card elevation-8" rounded="lg">
              <v-card-title class="details-header">
                <v-icon class="mr-2">mdi-car-info</v-icon>
                Detalles del Vehículo
                <v-spacer />
              </v-card-title>
              
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="detail-section">
                      <h3 class="section-title">
                        <v-icon class="mr-2" color="orange darken-2">mdi-information</v-icon>
                        Información General
                      </h3>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Marca:</span>
                          <span class="detail-value">{{ selectedVehicle.marca }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Modelo:</span>
                          <span class="detail-value">{{ selectedVehicle.modelo }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Año:</span>
                          <span class="detail-value">{{ selectedVehicle.año }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Color:</span>
                          <span class="detail-value">{{ selectedVehicle.color }}</span>
                        </div>
                      </div>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="detail-section">
                      <h3 class="section-title">
                        <v-icon class="mr-2" color="orange darken-2">mdi-card-account-details</v-icon>
                        Datos Técnicos
                      </h3>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Placa:</span>
                          <span class="detail-value font-weight-bold">{{ selectedVehicle.placa }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Chasis:</span>
                          <span class="detail-value">{{ selectedVehicle.chasis }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Motor:</span>
                          <span class="detail-value">{{ selectedVehicle.motor }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Último Mantenimiento:</span>
                          <span class="detail-value">{{ formatDate(selectedVehicle.ultimoMantenimiento) }}</span>
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            
            <!-- Panel de Servicios -->
            <v-card v-if="selectedVehicle" class="services-card elevation-8 mt-4" rounded="lg">
              <v-card-title class="services-header">
                <v-icon class="mr-2">mdi-wrench</v-icon>
                Servicios del Vehículo
                <v-spacer />
              </v-card-title>
              
              <!-- Tabs para servicios -->
              <v-tabs v-model="activeTab" color="orange darken-2" slider-color="orange darken-2">
                <v-tab value="activos">
                  <v-icon class="mr-2">mdi-clock-outline</v-icon>
                  Activos ({{ activeServices.length }})
                </v-tab>
                <v-tab value="completados">
                  <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
                  Completados ({{ completedServices.length }})
                </v-tab>
              </v-tabs>
              
              <v-card-text>
                <v-row v-if="currentServices.length > 0">
                  <v-col
                    v-for="service in currentServices"
                    :key="service.id"
                    cols="12"
                    md="6"
                  >
                    <v-card 
                      class="service-card" 
                      elevation="2" 
                      outlined 
                      @click="openServiceDialog(service)"
                    >
                      <v-card-text>
                        <div class="d-flex justify-space-between align-start mb-2">
                          <div>
                            <h4 class="service-name">{{ service.nombre }}</h4>
                            <p class="service-description">{{ service.descripcion }}</p>
                          </div>
                          <v-chip
                            small
                            :color="getServiceEstadoColor(service.estado)"
                            text-color="white"
                          >
                            {{ service.estado.replace('_', ' ') }}
                          </v-chip>
                        </div>
                        
                        <div class="service-details">
                          <div class="service-detail-item">
                            <v-icon small class="mr-1">mdi-calendar</v-icon>
                            <span class="service-detail-text">{{ formatDate(service.fechaEstimada) }}</span>
                          </div>
                          <div class="service-detail-item">
                            <v-icon small class="mr-1">mdi-account-wrench</v-icon>
                            <span class="service-detail-text">{{ service.mecanico }}</span>
                          </div>
                          <div class="service-detail-item">
                            <v-icon small class="mr-1">mdi-currency-usd</v-icon>
                            <span class="service-detail-text font-weight-bold">{{ formatCurrency(service.costo) }}</span>
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                
                <div v-else class="text-center py-8">
                  <v-icon size="64" color="grey lighten-1">mdi-wrench-outline</v-icon>
                  <p class="text-h6 grey--text mt-4">
                    No hay servicios {{ activeTab === 'activos' ? 'activos' : 'completados' }}
                  </p>
                  <p class="grey--text">
                    {{ activeTab === 'activos' ? 
                      'Este vehículo no tiene servicios activos o programados' : 
                      'Este vehículo no tiene servicios completados' 
                    }}
                  </p>
                </div>
              </v-card-text>
            </v-card>
            
            <!-- Mensaje cuando no hay vehículo seleccionado -->
            <v-card v-else class="welcome-card elevation-8" rounded="lg">
              <v-card-text class="text-center py-12">
                <v-icon size="120" color="grey lighten-2">mdi-car-select</v-icon>
                <h2 class="text-h5 grey--text text--darken-1 mt-4 mb-2">
                  Selecciona un Vehículo
                </h2>
                <p class="text-body-1 grey--text">
                  Haz clic en un vehículo de la lista para ver sus detalles y servicios
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Dialog de Detalle de Servicio -->
    <v-dialog v-model="serviceDialog" max-width="800px" persistent>
      <v-card v-if="selectedService" class="service-dialog">
        <v-card-title class="service-dialog-header">
          <v-icon class="mr-2">mdi-wrench-cog</v-icon>
          Detalle del Servicio
          <v-spacer />
          <v-btn icon @click="closeServiceDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-6">
          <!-- Información Principal -->
          <div class="mb-4">
            <h3 class="service-dialog-title">{{ selectedService.nombre }}</h3>
            <p class="service-dialog-description">{{ selectedService.descripcion }}</p>
            
            <div class="d-flex gap-2 mb-4">
              <v-chip
                :color="getServiceEstadoColor(selectedService.estado)"
                text-color="white"
                class="font-weight-medium"
              >
                {{ selectedService.estado.replace('_', ' ').toUpperCase() }}
              </v-chip>
            </div>
          </div>

          <!-- Información Detallada -->
          <v-row>
            <v-col cols="12" md="6">
              <div class="info-section">
                <h4 class="info-section-title">
                  <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                  Información de Fechas
                </h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Fecha de Inicio:</span>
                    <span class="info-value">{{ formatDate(selectedService.fechaInicio) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Fecha Estimada:</span>
                    <span class="info-value">{{ formatDate(selectedService.fechaEstimada) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tiempo Estimado:</span>
                    <span class="info-value">{{ selectedService.tiempoEstimado || 'No especificado' }}</span>
                  </div>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="info-section">
                <h4 class="info-section-title">
                  <v-icon class="mr-2">mdi-account-details</v-icon>
                  Información del Servicio
                </h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Mecánico:</span>
                    <span class="info-value">{{ selectedService.mecanico }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Categoría:</span>
                    <span class="info-value">{{ selectedService.categoria }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Costo:</span>
                    <span class="info-value font-weight-bold text-success">{{ formatCurrency(selectedService.costo) }}</span>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Repuestos -->
          <div class="info-section" v-if="selectedService.repuestos && selectedService.repuestos.length > 0">
            <h4 class="info-section-title">
              <v-icon class="mr-2">mdi-cog</v-icon>
              Repuestos Necesarios
            </h4>
            <div class="repuestos-list">
              <div 
                v-for="repuesto in selectedService.repuestos" 
                :key="repuesto.nombre"
                class="repuesto-item"
              >
                <span class="repuesto-nombre">{{ repuesto.nombre }}</span>
                <span class="repuesto-precio">{{ formatCurrency(repuesto.precio) }}</span>
              </div>
              <div class="repuesto-total">
                <span class="repuesto-nombre font-weight-bold">Total Repuestos:</span>
                <span class="repuesto-precio font-weight-bold text-primary">
                  {{ formatCurrency(calculateTotalRepuestos(selectedService.repuestos)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="info-section" v-if="selectedService.observaciones">
            <h4 class="info-section-title">
              <v-icon class="mr-2">mdi-note-text</v-icon>
              Observaciones
            </h4>
            <p class="observaciones-text">{{ selectedService.observaciones }}</p>
          </div>

          <!-- Área de Mensaje/Solicitud -->
          <div class="info-section">
            <h4 class="info-section-title">
              <v-icon class="mr-2">mdi-message-text</v-icon>
              Enviar Mensaje o Solicitud
            </h4>
            <v-textarea
              v-model="messageText"
              outlined
              label="Escribe tu mensaje o solicitud..."
              placeholder="Describe cualquier consulta, cambio o solicitud especial para este servicio..."
              rows="3"
              counter="500"
              maxlength="500"
            />
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-btn
            color="orange darken-2"
            outlined
            @click="sendMessage"
            :disabled="!messageText.trim()"
          >
            <v-icon class="mr-2">mdi-send</v-icon>
            Enviar Mensaje
          </v-btn>

          <v-spacer />

          <v-btn
            color="success"
            @click="confirmService"
            v-if="selectedService.estado !== 'completado'"
          >
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            Confirmar Servicio
          </v-btn>

          <v-btn
            color="primary"
            @click="printInvoice"
            v-if="selectedService.estado === 'completado'"
          >
            <v-icon class="mr-2">mdi-printer</v-icon>
            Imprimir Factura
          </v-btn>

          <v-btn
            color="grey"
            text
            @click="closeServiceDialog"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
  .vehicle-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    min-height: 100vh;
    position: relative;
  }

  .vehicle-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }

  .floating-icons {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  .floating-icon {
    position: absolute;
    opacity: 0.1;
    color: #ff6b35;
  }

  .floating-icon:nth-child(1) {
    top: 10%;
    left: 10%;
  }

  .floating-icon:nth-child(2) {
    top: 20%;
    right: 15%;
  }

  .floating-icon:nth-child(3) {
    bottom: 30%;
    left: 20%;
  }

  .floating-icon:nth-child(4) {
    bottom: 20%;
    right: 10%;
  }

  .floating-icon:nth-child(5) {
    top: 50%;
    left: 5%;
  }

  .header-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 32px;
    position: relative;
    z-index: 2;
  }

  .search-field {
    max-width: 400px;
  }

  .vehicles-card,
  .details-card,
  .services-card,
  .welcome-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;
  }

  .vehicles-header,
  .details-header,
  .services-header {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    color: white !important;
    font-weight: bold;
  }

  .vehicles-list {
    max-height: 600px;
    overflow-y: auto;
  }

  .vehicle-item {
    cursor: pointer;
    transition: all 0.3s ease;
    border-left: 4px solid transparent;
  }

  .vehicle-item:hover {
    background: rgba(255, 107, 53, 0.1);
    border-left-color: #ff6b35;
  }

  .selected-vehicle {
    background: rgba(255, 107, 53, 0.15) !important;
    border-left-color: #ff6b35 !important;
  }

  .detail-section {
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    color: rgba(0, 0, 0, 0.87);
  }

  .detail-grid {
    display: grid;
    gap: 12px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .detail-label {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
    min-width: 120px;
  }

  .detail-value {
    font-weight: 400;
    color: rgba(0, 0, 0, 0.87);
    text-align: right;
  }

  .service-card {
    height: 100%;
    transition: all 0.3s ease;
  }

  .service-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  .service-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
    color: rgba(0, 0, 0, 0.87);
  }

  .service-description {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 12px;
  }

  .service-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .service-detail-item {
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  .service-detail-text {
    color: rgba(0, 0, 0, 0.7);
  }

  .welcome-card {
    min-height: 400px;
    display: flex;
    align-items: center;
  }

  /* Responsive */
  @media (max-width: 960px) {
    .header-section {
      padding: 24px 16px;
    }
    
    .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    
    .detail-label {
      min-width: auto;
    }
    
    .detail-value {
      text-align: left;
    }
  }

  @media (max-width: 600px) {
    .vehicles-list {
      max-height: 400px;
    }
    
    .section-title {
      font-size: 16px;
    }
    
    .service-details {
      gap: 6px;
    }
  }
</style>