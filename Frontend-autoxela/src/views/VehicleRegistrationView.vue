<script setup lang="ts">
  import { ref, reactive } from 'vue'

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

  // Formularios
  const newCar = reactive({
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    color: '',
    placa: '',
    chasis: '',
    motor: '',
    nit: ''
  })

  const newService = reactive({
    nombre: '',
    descripcion: '',
    precio: 0,
    tipo: 'Correctivo' as 'Correctivo' | 'Preventivo'
  })

  // Reglas de validación
  const rules = {
    required: (value: string) => !!value || 'Este campo es requerido'
  }

  // Datos de ejemplo
  const cars = ref<Carro[]>([
    {
      id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      año: 2020,
      color: 'Blanco',
      placa: 'P123ABC',
      chasis: 'JT2BF22K2X0123456',
      motor: '1.8L 4cil',
      servicios: [
        {
          id: 1,
          nombre: 'Cambio de aceite',
          descripcion: 'Cambio completo de aceite y filtro',
          precio: 150,
          estado: 'Finalizado',
          empleados: [
            { id: 1, nombre: 'Juan Pérez', especialidad: 'Mecánico' }
          ],
          tipo: 'Correctivo',
          pagado: false,
          cancelado: false
        },
        {
          id: 2,
          nombre: 'Revisión de frenos',
          descripcion: 'Inspección completa del sistema de frenos',
          precio: 200,
          estado: 'En proceso',
          empleados: [
            { id: 2, nombre: 'María López', especialidad: 'Especialista en frenos' }
          ],
          tipo: 'Correctivo',
          pagado: false,
          cancelado: false
        }
      ]
    },
    {
      id: 2,
      marca: 'Honda',
      modelo: 'Civic',
      año: 2019,
      color: 'Azul',
      placa: 'P456DEF',
      chasis: 'JHMFC1F39KX123456',
      motor: '2.0L 4cil',
      servicios: [
        {
          id: 3,
          nombre: 'Afinación mayor',
          descripcion: 'Afinación completa del motor',
          precio: 500,
          estado: 'Pendiente',
          empleados: [],
          tipo: 'Correctivo',
          pagado: false,
          cancelado: false
        }
      ]
    }
  ])

  const availableEmployees: Empleado[] = [
    { id: 1, nombre: 'Juan Pérez', especialidad: 'Mecánico General' },
    { id: 2, nombre: 'María López', especialidad: 'Especialista en frenos' },
    { id: 3, nombre: 'Carlos García', especialidad: 'Electricista automotriz' },
    { id: 4, nombre: 'Ana Martínez', especialidad: 'Especialista en transmisiones' },
    { id: 5, nombre: 'Roberto Silva', especialidad: 'Mecánico de motor' }
  ]

  // Métodos
  const openCarServices = (car: Carro) => {
    selectedCar.value = car
    showServicesDialog.value = true
  }

  const closeServicesDialog = () => {
    showServicesDialog.value = false
    selectedCar.value = null
  }

  const addNewCar = () => {
    const newCarData: Carro = {
      id: Date.now(),
      marca: newCar.marca,
      modelo: newCar.modelo,
      año: newCar.año,
      color: newCar.color,
      placa: newCar.placa,
      chasis: newCar.chasis,
      motor: newCar.motor,
      servicios: []
    }
    
    cars.value.push(newCarData)
    console.log(`Vehículo registrado para el cliente con NIT: ${newCar.nit}`)
    closeNewCarDialog()
  }

  const closeNewCarDialog = () => {
    showNewCarDialog.value = false
    Object.assign(newCar, {
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      color: '',
      placa: '',
      chasis: '',
      motor: '',
      nit: ''
    })
  }

  const addNewService = () => {
    if (selectedCar.value) {
      const serviceData: Servicio = {
        id: Date.now(),
        nombre: newService.nombre,
        descripcion: newService.descripcion,
        precio: newService.precio,
        tipo: newService.tipo,
        estado: 'Pendiente',
        pagado: false,
        cancelado: false,
        empleados: []
      }
      
      selectedCar.value.servicios.push(serviceData)
      closeNewServiceDialog()
    }
  }

  const closeNewServiceDialog = () => {
    showNewServiceDialog.value = false
    newService.nombre = ''
    newService.descripcion = ''
    newService.precio = 0
    newService.tipo = 'Correctivo'
  }

  const openEmployeeSelector = (service: Servicio) => {
    selectedService.value = service
    selectedEmployees.value = [...service.empleados]
    showEmployeeDialog.value = true
  }

  const closeEmployeeDialog = () => {
    showEmployeeDialog.value = false
    selectedService.value = null
    selectedEmployees.value = []
  }

  const assignEmployees = () => {
    if (selectedService.value) {
      selectedService.value.empleados = [...selectedEmployees.value]
      closeEmployeeDialog()
    }
  }

  const processPayment = (service: Servicio) => {
    // Marcar como finalizado y pagado
    service.estado = 'Finalizado'
    service.pagado = true
    alert(`¡Pago procesado exitosamente!\nServicio: ${service.nombre}\nMonto: Q${service.precio}`)
  }

  const cancelService = (service: Servicio) => {
    if (confirm(`¿Está seguro de que desea cancelar el servicio "${service.nombre}"?`)) {
      service.estado = 'Cancelado'
      service.cancelado = true
      alert(`Servicio "${service.nombre}" cancelado.`)
    }
  }

  const getCarStatus = (car: Carro) => {
    if (car.servicios.length === 0) return 'Sin servicios'
    
    const pendientes = car.servicios.filter(s => s.estado === 'Pendiente').length
    const enProceso = car.servicios.filter(s => s.estado === 'En proceso').length
    //const finalizados = car.servicios.filter(s => s.estado === 'Finalizado').length
    
    if (enProceso > 0) return 'En proceso'
    if (pendientes > 0) return 'Pendiente'
    return 'Completo'
  }

  const getStatusColor = (car: Carro) => {
    const status = getCarStatus(car)
    switch (status) {
      case 'En proceso': return 'blue'
      case 'Pendiente': return 'orange'
      case 'Completo': return 'green'
      default: return 'grey'
    }
  }

  const getServiceStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'orange'
      case 'En proceso': return 'blue'
      case 'Finalizado': return 'green'
      case 'Cancelado': return 'red'
      default: return 'grey'
    }
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

        <!-- Botón para agregar nuevo carro -->
        <v-row class="mb-4">
          <v-col cols="12" class="text-center">
            <v-btn 
              large
              class="custom-btn"
              @click="showNewCarDialog = true"
            >
              <v-icon left>mdi-car-plus</v-icon>
              Agregar Nuevo Vehículo
            </v-btn>
          </v-col>
        </v-row>

        <!-- Lista de carros -->
        <v-row>
          <v-col 
            v-for="car in cars" 
            :key="car.id" 
            cols="12" 
            sm="6" 
            md="4" 
            lg="3"
          >
            <v-card 
              class="car-card elevation-8" 
              rounded="lg"
              @click="openCarServices(car)"
              hover
            >
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
                <v-chip 
                  small 
                  :color="getStatusColor(car)" 
                  text-color="white"
                >
                  {{ getCarStatus(car) }}
                </v-chip>
                <v-spacer></v-spacer>
                <v-btn small text color="orange darken-2">
                  Ver Servicios
                  <v-icon right>mdi-arrow-right</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dialog para agregar nuevo carro -->
        <v-dialog v-model="showNewCarDialog" max-width="600px" persistent>
          <v-card class="dialog-card">
            <div class="dialog-header">
              <v-icon size="32" color="white" class="mr-3">mdi-car-plus</v-icon>
              <h2 class="text-h5 font-weight-bold">Agregar Nuevo Vehículo</h2>
            </div>
            <v-card-text class="pa-6">
              <v-form ref="newCarForm" v-model="validForm">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="newCar.marca"
                      label="Marca"
                      prepend-inner-icon="mdi-car-info"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="newCar.modelo"
                      label="Modelo"
                      prepend-inner-icon="mdi-car-side"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="newCar.año"
                      label="Año"
                      prepend-inner-icon="mdi-calendar"
                      outlined
                      dense
                      type="number"
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="newCar.color"
                      label="Color"
                      prepend-inner-icon="mdi-palette"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="newCar.placa"
                      label="Placa"
                      prepend-inner-icon="mdi-identifier"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="newCar.chasis"
                      label="Número de Chasis"
                      prepend-inner-icon="mdi-car-back"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="newCar.nit"
                      label="NIT del Cliente"
                      prepend-inner-icon="mdi-card-account-details"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                      hint="NIT para enlazar el vehículo con el cliente"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="newCar.motor"
                      label="Motor"
                      prepend-inner-icon="mdi-engine"
                      outlined
                      dense
                      required
                      :rules="[rules.required]"
                    />
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-6 pt-0">
              <v-spacer></v-spacer>
              <v-btn text @click="closeNewCarDialog">
                Cancelar
              </v-btn>
              <v-btn 
                class="custom-btn ml-2"
                @click="addNewCar"
                :disabled="!validForm"
              >
                <v-icon left>mdi-content-save</v-icon>
                Guardar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Dialog para servicios del carro -->
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
                <v-btn 
                  small
                  class="custom-btn"
                  @click="showNewServiceDialog = true"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Agregar Servicio
                </v-btn>
              </div>

              <!-- Lista de servicios -->
              <div class="services-list">
                <div 
                  v-for="service in selectedCar.servicios" 
                  :key="service.id"
                  class="service-item pa-4 border-bottom"
                >
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div>
                      <div class="d-flex align-center mb-2">
                        <h4 class="text-h6 font-weight-medium mr-3">{{ service.nombre }}</h4>
                        <v-chip 
                          small 
                          :color="service.tipo === 'Correctivo' ? 'red lighten-1' : 'blue lighten-1'" 
                          text-color="white"
                          class="mr-2"
                        >
                          {{ service.tipo }}
                        </v-chip>
                        <v-chip 
                          :color="getServiceStatusColor(service.estado)" 
                          text-color="white"
                          small
                        >
                          {{ service.estado }}
                        </v-chip>
                      </div>
                      <p class="text-body-2 grey--text mb-1">{{ service.descripcion }}</p>
                      <p class="text-subtitle-2 mb-0"><strong>Precio:</strong> Q{{ service.precio }}</p>
                    </div>
                  </div>

                  <!-- Empleados asignados -->
                  <div class="mb-3">
                    <p class="text-subtitle-2 font-weight-medium mb-2">Empleados asignados:</p>
                    <div class="d-flex flex-wrap">
                      <v-chip 
                        v-for="empleado in service.empleados" 
                        :key="empleado.id"
                        small
                        class="mr-2 mb-1"
                        color="blue-grey lighten-1"
                        text-color="white"
                      >
                        <v-icon left small>mdi-account</v-icon>
                        {{ empleado.nombre }}
                      </v-chip>
                      <v-btn 
                        small
                        outlined
                        color="orange darken-2"
                        @click="openEmployeeSelector(service)"
                      >
                        <v-icon left>mdi-account-plus</v-icon>
                        Asignar
                      </v-btn>
                    </div>
                  </div>

                  <!-- Acciones del servicio -->
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <v-btn-toggle 
                        v-model="service.estado" 
                        mandatory
                        dense
                        class="status-toggle"
                        :disabled="service.pagado || service.cancelado"
                      >
                        <v-btn small value="Pendiente" color="orange" :disabled="service.pagado || service.cancelado">
                          <v-icon>mdi-clock</v-icon>
                          Pendiente
                        </v-btn>
                        <v-btn small value="En proceso" color="blue" :disabled="service.pagado || service.cancelado">
                          <v-icon>mdi-cog</v-icon>
                          En proceso
                        </v-btn>
                        <v-btn small value="Finalizado" color="green" :disabled="service.pagado || service.cancelado">
                          <v-icon>mdi-check</v-icon>
                          Finalizado
                        </v-btn>
                      </v-btn-toggle>
                    </div>
                    <div class="d-flex gap-2">
                      <v-btn 
                        class="custom-btn"
                        small
                        @click="processPayment(service)"
                        :disabled="service.pagado || service.cancelado"
                      >
                        <v-icon left>mdi-credit-card</v-icon>
                        {{ service.pagado ? 'Pagado' : 'Pagar' }}
                      </v-btn>
                      <v-btn 
                        color="red darken-1"
                        small
                        @click="cancelService(service)"
                        :disabled="service.pagado || service.cancelado"
                      >
                        <v-icon left>mdi-cancel</v-icon>
                        {{ service.cancelado ? 'Cancelado' : 'Cancelar' }}
                      </v-btn>
                    </div>
                  </div>
                </div>
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

        <!-- Dialog para agregar nuevo servicio -->
        <v-dialog v-model="showNewServiceDialog" max-width="500px" persistent>
          <v-card class="dialog-card">
            <div class="dialog-header">
              <v-icon size="32" color="white" class="mr-3">mdi-wrench</v-icon>
              <h2 class="text-h5 font-weight-bold">Nuevo Servicio</h2>
            </div>
            <v-card-text class="pa-6">
              <v-form ref="newServiceForm">
                <v-text-field
                  v-model="newService.nombre"
                  label="Nombre del Servicio"
                  prepend-inner-icon="mdi-wrench"
                  outlined
                  dense
                  required
                />
                <v-select
                  v-model="newService.tipo"
                  :items="['Correctivo', 'Preventivo']"
                  label="Tipo de Servicio"
                  prepend-inner-icon="mdi-list-box"
                  outlined
                  dense
                  required
                />
                <v-textarea
                  v-model="newService.descripcion"
                  label="Descripción"
                  prepend-inner-icon="mdi-text"
                  outlined
                  dense
                  rows="3"
                />
                <v-text-field
                  v-model="newService.precio"
                  label="Precio (Q)"
                  prepend-inner-icon="mdi-currency-usd"
                  outlined
                  dense
                  type="number"
                  required
                />
              </v-form>
            </v-card-text>
            <v-card-actions class="pa-6 pt-0">
              <v-spacer></v-spacer>
              <v-btn text @click="closeNewServiceDialog">
                Cancelar
              </v-btn>
              <v-btn 
                class="custom-btn ml-2"
                @click="addNewService"
              >
                <v-icon left>mdi-content-save</v-icon>
                Guardar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Dialog para seleccionar empleados -->
        <v-dialog v-model="showEmployeeDialog" max-width="400px" persistent>
          <v-card class="dialog-card">
            <div class="dialog-header">
              <v-icon size="32" color="white" class="mr-3">mdi-account-multiple</v-icon>
              <h2 class="text-h5 font-weight-bold">Asignar Empleados</h2>
            </div>
            <v-card-text class="pa-4">
              <div class="employee-list">
                <v-list>
                  <v-list-item 
                    v-for="empleado in availableEmployees" 
                    :key="empleado.id"
                    class="px-0"
                  >
                    <v-list-item-action>
                      <v-checkbox
                        :value="empleado"
                        v-model="selectedEmployees"
                        color="orange darken-2"
                      />
                    </v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>{{ empleado.nombre }}</v-list-item-title>
                      <v-list-item-subtitle>{{ empleado.especialidad }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn text @click="closeEmployeeDialog">
                Cancelar
              </v-btn>
              <v-btn 
                class="custom-btn ml-2"
                @click="assignEmployees"
              >
                <v-icon left>mdi-check</v-icon>
                Asignar
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
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  }

  .floating-icon:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
  .floating-icon:nth-child(2) { top: 20%; right: 15%; animation-delay: 1s; }
  .floating-icon:nth-child(3) { bottom: 30%; left: 20%; animation-delay: 2s; }
  .floating-icon:nth-child(4) { bottom: 20%; right: 10%; animation-delay: 3s; }
  .floating-icon:nth-child(5) { top: 50%; left: 5%; animation-delay: 4s; }
  .floating-icon:nth-child(6) { top: 60%; right: 25%; animation-delay: 5s; }
  .floating-icon:nth-child(7) { bottom: 60%; left: 50%; animation-delay: 6s; }

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