<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// Interfaces
interface WorkOrder {
  id: number
  vehicle: Record<string, unknown>
  serviceType: Record<string, unknown>
  workStatus: Record<string, unknown>
  assignedEmployee: Record<string, unknown> | null
  problemDescription: string
  estimatedHours: number
  actualHours: number | null
  estimatedCost: number
  actualCost: number | null
  clientApproved: boolean
  clientApprovedAt: string | null
  startedAt: string | null
  completedAt: string | null
  priorityLevel: number
  priorityDisplayName: string
  createdBy: Record<string, unknown>
  createdAt: string
  updatedAt: string
  progressHistory: Record<string, unknown>
  parts: Record<string, unknown>
  quotations: Record<string, unknown>
}

interface Employee {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string
  cui?: string | null
  nit?: string | null
  phone?: string | null
  addressDetailId?: number | null
  birthDate?: string | null
  userType?: string | null
  gender?: string | null
  isActive: boolean
  lastLogin?: string | null
  createdAt: string
}

interface EmployeeForSelection extends Employee {
  displayName: string
  category: string
  categoryLabel: string
}

interface ApiResponse {
  content: WorkOrder[]
  pageable: Record<string, unknown>
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  sort: Record<string, unknown>
  first: boolean
  numberOfElements: number
  empty: boolean
}

// Estados reactivos
const workOrders = ref<WorkOrder[]>([])
const loading = ref(false)
const error = ref('')
const selectedWorkOrder = ref<WorkOrder | null>(null)
const showDetailDialog = ref(false)
const showAssignDialog = ref(false)
const availableEmployees = ref<Employee[]>([])
const employeesWithCapacity = ref<Employee[]>([])
const assignLoading = ref(false)
const loadingEmployees = ref(false)

// Estados para paginación
const currentPage = ref(0)
const pageSize = ref(10)
const totalElements = ref(0)
const totalPages = ref(0)

// Estados para filtros
const searchQuery = ref('')
const priorityFilter = ref('')

// Opciones para el filtro de prioridad
const priorityOptions = [
  { text: 'Todas', value: '' },
  { text: 'Alta', value: '1' },
  { text: 'Media', value: '2' },
  { text: 'Baja', value: '3' }
]

// Estados para asignación
const assignForm = ref({
  employeeId: null,
  assignmentNotes: ''
})

// Función para obtener headers de autenticación
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Función para obtener las órdenes de trabajo
const fetchWorkOrders = async (page: number = 0) => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(`http://localhost:8080/api/v1/workorders?page=${page}&size=${pageSize.value}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Error al cargar las órdenes de trabajo')
    }
    
    const data: ApiResponse = await response.json()
    
    workOrders.value = data.content
    currentPage.value = data.number
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages

    console.log(data)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Error fetching work orders:', err)
  } finally {
    loading.value = false
  }
}

// Función para obtener empleados disponibles
const fetchAvailableEmployees = async () => {
  loadingEmployees.value = true
  
  try {
    const response = await fetch('http://localhost:8080/api/v1/workorders/assignments/employees/available', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (response.ok) {
      const data = await response.json()
      availableEmployees.value = Array.isArray(data) ? data : (data.content || [])
    }
  } catch (err) {
    console.error('Error fetching available employees:', err)
  }
}

// Función para obtener empleados con capacidad
const fetchEmployeesWithCapacity = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/workorders/assignments/employees/capacity', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    if (response.ok) {
      const data = await response.json()
      employeesWithCapacity.value = Array.isArray(data) ? data : (data.content || [])
    }
  } catch (err) {
    console.error('Error fetching employees with capacity:', err)
  } finally {
    loadingEmployees.value = false
  }
}

// Función para obtener todos los datos de empleados
const fetchEmployeesData = async () => {
  await Promise.all([
    fetchAvailableEmployees(),
    fetchEmployeesWithCapacity()
  ])
}

// Computed para empleados disponibles con etiqueta
const employeesForSelection = computed((): EmployeeForSelection[] => {
  const availableWithLabel: EmployeeForSelection[] = availableEmployees.value.map(employee => ({
    ...employee,
    displayName: `${employee.firstName} ${employee.lastName} (${employee.username})`,
    category: 'Disponible',
    categoryLabel: '(Por disponibilidad)'
  }))
  
  const capacityWithLabel: EmployeeForSelection[] = employeesWithCapacity.value.map(employee => ({
    ...employee,
    displayName: `${employee.firstName} ${employee.lastName} (${employee.username})`,
    category: 'Capacidad',
    categoryLabel: '(Por carga)'
  }))
  
  // Combinar y remover duplicados, priorizando disponibles
  const combined = [...availableWithLabel, ...capacityWithLabel]
  const uniqueEmployees = combined.filter((employee, index, self) => 
    index === self.findIndex(e => e.id === employee.id)
  )
  
  return uniqueEmployees
})

// Función para formatear el nombre completo del empleado
const getEmployeeDisplayName = (employee: EmployeeForSelection) => {
  return `${employee.firstName} ${employee.lastName} (${employee.username}) ${employee.categoryLabel}`
}

// Función para obtener el nombre del empleado asignado
const getAssignedEmployeeName = (assignedEmployee: any) => {
  if (!assignedEmployee) return null
  return `${assignedEmployee.firstName || ''} ${assignedEmployee.lastName || ''}`.trim()
}

// Función para asignar orden de trabajo
const assignWorkOrder = async () => {
  if (!selectedWorkOrder.value || !assignForm.value.employeeId) return
  
  assignLoading.value = true
  
  try {
    const response = await fetch(`http://localhost:8080/api/v1/workorders/assignments/${selectedWorkOrder.value.id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        employeeId: assignForm.value.employeeId,
        assignmentNotes: assignForm.value.assignmentNotes
      })
    })
    
    if (response.ok) {
      // Actualizar la orden de trabajo en la lista
      await fetchWorkOrders(currentPage.value)
      closeAssignDialog()
      // Mostrar mensaje de éxito (aquí podrías agregar una notificación)
    } else {
      throw new Error('Error al asignar la orden de trabajo')
    }
  } catch (err) {
    console.error('Error assigning work order:', err)
    error.value = 'Error al asignar la orden de trabajo'
  } finally {
    assignLoading.value = false
  }
}

// Función para mostrar detalles
const showDetails = (workOrder: WorkOrder) => {
  selectedWorkOrder.value = workOrder
  showDetailDialog.value = true
}

// Función para mostrar dialog de asignación
const showAssignWorkOrder = async (workOrder: WorkOrder) => {
  selectedWorkOrder.value = workOrder
  assignForm.value = {
    employeeId: null,
    assignmentNotes: ''
  }
  showAssignDialog.value = true
  
  // Cargar empleados cuando se abre el dialog
  await fetchEmployeesData()
}

// Función para cerrar el dialog de detalles
const closeDetailDialog = () => {
  showDetailDialog.value = false
  selectedWorkOrder.value = null
}

// Función para cerrar el dialog de asignación
const closeAssignDialog = () => {
  showAssignDialog.value = false
  selectedWorkOrder.value = null
  assignForm.value = {
    employeeId: null,
    assignmentNotes: ''
  }
}

// Función para formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ'
  }).format(amount)
}

// Función para obtener color de prioridad
const getPriorityColor = (level: number) => {
  switch (level) {
    case 1: return 'red'
    case 2: return 'orange'
    case 3: return 'green'
    default: return 'grey'
  }
}

// Función para obtener icono de prioridad
const getPriorityIcon = (level: number) => {
  switch (level) {
    case 1: return 'mdi-alert-circle'
    case 2: return 'mdi-alert'
    case 3: return 'mdi-check-circle'
    default: return 'mdi-minus-circle'
  }
}

// Función mejorada para obtener estado basado en work-stage
const getStatusText = (workOrder: WorkOrder) => {
  // Si hay información del workStatus, usarla
  if (workOrder.workStatus && typeof workOrder.workStatus === 'object') {
    const status = workOrder.workStatus as any
    if (status.id) {
      switch (status.id) {
        case 1: return 'Pendiente'
        case 2: return 'Asignado'
        case 3: return 'En Progreso'
        case 4: return 'Completado'
        case 5: return 'Cancelado'
        case 6: return 'Finalizado sin ejecución'
        default: return 'Estado desconocido'
      }
    }
  }
  
  // Fallback al comportamiento anterior
  if (workOrder.completedAt) return 'Completado'
  if (workOrder.startedAt) return 'En Progreso'
  if (workOrder.clientApproved) return 'Aprobado'
  if (workOrder.assignedEmployee) return 'Asignado'
  return 'Pendiente'
}

// Función mejorada para obtener color de estado
const getStatusColor = (workOrder: WorkOrder) => {
  // Si hay información del workStatus, usarla
  if (workOrder.workStatus && typeof workOrder.workStatus === 'object') {
    const status = workOrder.workStatus as any
    if (status.id) {
      switch (status.id) {
        case 1: return 'grey'           // Pendiente
        case 2: return 'blue'           // Asignado
        case 3: return 'info'           // En Progreso
        case 4: return 'success'        // Completado
        case 5: return 'error'          // Cancelado
        case 6: return 'warning'        // Finalizado sin ejecución
        default: return 'grey'
      }
    }
  }
  
  // Fallback al comportamiento anterior
  if (workOrder.completedAt) return 'success'
  if (workOrder.startedAt) return 'info'
  if (workOrder.clientApproved) return 'warning'
  if (workOrder.assignedEmployee) return 'blue'
  return 'grey'
}

// Función para cambiar página
const changePage = (page: number) => {
  fetchWorkOrders(page)
}

// Órdenes filtradas
const filteredWorkOrders = computed(() => {
  let filtered = workOrders.value

  if (searchQuery.value) {
    filtered = filtered.filter(order =>
      order.problemDescription.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.id.toString().includes(searchQuery.value)
    )
  }

  if (priorityFilter.value) {
    filtered = filtered.filter(order => order.priorityLevel.toString() === priorityFilter.value)
  }

  return filtered
})

// Cargar datos al montar el componente
onMounted(() => {
  fetchWorkOrders()
})
</script>

<template>
  <v-app>
    <div class="work-orders-container">
      <!-- Íconos flotantes de fondo -->
      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-car-wrench</v-icon>
        <v-icon class="floating-icon" size="32">mdi-engine</v-icon>
        <v-icon class="floating-icon" size="28">mdi-car-tire-alert</v-icon>
        <v-icon class="floating-icon" size="36">mdi-oil-lamp</v-icon>
        <v-icon class="floating-icon" size="20">mdi-car-battery</v-icon>
      </div>

      <v-container fluid class="pa-6">
        <!-- Header -->
        <div class="header-section mb-6">
          <div class="text-center">
            <v-icon size="64" class="mb-3" color="orange darken-2">
              mdi-clipboard-list
            </v-icon>
            <h1 class="text-h4 font-weight-bold mb-2">Órdenes de Trabajo</h1>
            <p class="text-subtitle1">AutoXela - Taller Automotriz</p>
          </div>
        </div>

        <!-- Filtros y búsqueda -->
        <v-card class="controls-card mb-6 elevation-4" rounded="lg">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchQuery"
                  label="Buscar por descripción o ID"
                  prepend-inner-icon="mdi-magnify"
                  outlined
                  dense
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="priorityFilter"
                  label="Filtrar por Prioridad"
                  :items="priorityOptions"
                  item-title="text"
                  item-value="value"
                  outlined
                  dense
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3" class="d-flex align-center">
                <v-btn
                  color="orange darken-2"
                  @click="fetchWorkOrders(0)"
                  :loading="loading"
                  class="custom-btn"
                  block
                >
                  <v-icon left>mdi-refresh</v-icon>
                  Actualizar
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Loading -->
        <v-overlay v-if="loading" absolute>
          <v-progress-circular indeterminate size="64" color="orange darken-2" />
        </v-overlay>

        <!-- Error -->
        <v-alert v-if="error" type="error" class="mb-4">
          {{ error }}
        </v-alert>

        <!-- Lista vacía -->
        <div v-if="!loading && !error && filteredWorkOrders.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey lighten-1">mdi-clipboard-off</v-icon>
          <h3 class="text-h6 grey--text mt-4">No se encontraron órdenes de trabajo</h3>
        </div>

        <!-- Lista de órdenes como tarjetas -->
        <v-row v-if="!loading && !error && filteredWorkOrders.length > 0">
          <v-col
            v-for="order in filteredWorkOrders"
            :key="order.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card class="work-order-card elevation-8" rounded="lg">
              <v-card-title class="pb-2">
                <div class="d-flex align-center justify-space-between w-100">
                  <div class="d-flex align-center">
                    <v-avatar size="40" :color="getPriorityColor(order.priorityLevel)" class="white--text mr-3">
                      <v-icon>{{ getPriorityIcon(order.priorityLevel) }}</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 mb-0">Orden #{{ order.id }}</h3>
                    </div>
                  </div>
                </div>
              </v-card-title>

              <v-card-text>
                <p class="text-body-2 mb-3">{{ order.problemDescription }}</p>
                
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <v-chip small :color="getPriorityColor(order.priorityLevel)" text-color="white">
                    <v-icon left small>{{ getPriorityIcon(order.priorityLevel) }}</v-icon>
                    {{ order.priorityDisplayName }}
                  </v-chip>
                  
                  <v-chip small :color="getStatusColor(order)" text-color="white">
                    <v-icon left small>mdi-information</v-icon>
                    {{ getStatusText(order) }}
                  </v-chip>
                </div>

                <!-- Mostrar empleado asignado si existe -->
                <div v-if="order.assignedEmployee" class="mb-3">
                  <v-chip small color="blue" text-color="white">
                    <v-icon left small>mdi-account</v-icon>
                    {{ getAssignedEmployeeName(order.assignedEmployee) }}
                  </v-chip>
                </div>

                <div class="d-flex flex-wrap gap-2 mb-3">
                  <v-chip small color="blue-grey" text-color="white">
                    <v-icon left small>mdi-currency-usd</v-icon>
                    {{ formatCurrency(order.estimatedCost) }}
                  </v-chip>
                  
                  <v-chip small color="purple" text-color="white">
                    <v-icon left small>mdi-clock</v-icon>
                    {{ order.estimatedHours }}h
                  </v-chip>
                </div>
                
                <div class="text-caption grey--text">
                  Creado: {{ formatDate(order.createdAt) }}
                </div>
              </v-card-text>

              <v-card-actions class="pt-0">
                <v-btn
                  color="orange darken-2"
                  text
                  @click="showDetails(order)"
                >
                  <v-icon left>mdi-eye</v-icon>
                  Ver Detalles
                </v-btn>
                
                <v-spacer />
                
                <v-btn
                  color="primary"
                  text
                  @click="showAssignWorkOrder(order)"
                  :disabled="!!order.assignedEmployee"
                >
                  <v-icon left>mdi-account-plus</v-icon>
                  {{ order.assignedEmployee ? 'Asignado' : 'Asignar' }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Paginación -->
        <div class="d-flex justify-center mt-6" v-if="totalPages > 1">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            color="orange darken-2"
            @input="changePage"
          />
        </div>
      </v-container>

      <!-- Dialog de detalles -->
      <v-dialog
        v-model="showDetailDialog"
        max-width="800px"
        persistent
      >
        <v-card v-if="selectedWorkOrder" class="detail-card">
          <v-card-title class="dialog-header text-center pb-2">
            <div class="w-100">
              <v-icon size="48" color="white" class="mb-3">
                {{ getPriorityIcon(selectedWorkOrder.priorityLevel) }}
              </v-icon>
              <h3 class="text-h5 font-weight-medium text-white">Orden de Trabajo #{{ selectedWorkOrder.id }}</h3>
            </div>
          </v-card-title>
          
          <v-card-text class="px-6">
            <v-row>
              <v-col cols="12" md="6">
                <div class="detail-section">
                  <h4 class="text-h6 orange--text text--darken-2 mb-3">Información General</h4>
                  
                  <div class="detail-item">
                    <strong>Descripción del Problema:</strong>
                    <p class="mt-1">{{ selectedWorkOrder.problemDescription }}</p>
                  </div>
                  
                  <div class="detail-item">
                    <strong>Prioridad:</strong>
                    <v-chip small :color="getPriorityColor(selectedWorkOrder.priorityLevel)" text-color="white" class="ml-2">
                      {{ selectedWorkOrder.priorityDisplayName }}
                    </v-chip>
                  </div>
                  
                  <div class="detail-item">
                    <strong>Estado:</strong>
                    <v-chip small :color="getStatusColor(selectedWorkOrder)" text-color="white" class="ml-2">
                      {{ getStatusText(selectedWorkOrder) }}
                    </v-chip>
                  </div>

                  <!-- Mostrar empleado asignado en detalles -->
                  <div class="detail-item" v-if="selectedWorkOrder.assignedEmployee">
                    <strong>Empleado Asignado:</strong>
                    <p class="mt-1">{{ getAssignedEmployeeName(selectedWorkOrder.assignedEmployee) }}</p>
                  </div>
                  
                  <div class="detail-item">
                    <strong>Aprobado por Cliente:</strong>
                    <v-chip small :color="selectedWorkOrder.clientApproved ? 'success' : 'warning'" text-color="white" class="ml-2">
                      {{ selectedWorkOrder.clientApproved ? 'Sí' : 'No' }}
                    </v-chip>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="detail-section">
                  <h4 class="text-h6 orange--text text--darken-2 mb-3">Costos y Tiempo</h4>
                  
                  <div class="detail-item">
                    <strong>Costo Estimado:</strong>
                    <p class="mt-1 text-h6 success--text">{{ formatCurrency(selectedWorkOrder.estimatedCost) }}</p>
                  </div>
                  
                  <div class="detail-item">
                    <strong>Costo Real:</strong>
                    <p class="mt-1 text-h6" :class="selectedWorkOrder.actualCost ? 'error--text' : 'grey--text'">
                      {{ selectedWorkOrder.actualCost ? formatCurrency(selectedWorkOrder.actualCost) : 'Pendiente' }}
                    </p>
                  </div>
                  
                  <div class="detail-item">
                    <strong>Horas Estimadas:</strong>
                    <p class="mt-1">{{ selectedWorkOrder.estimatedHours }} horas</p>
                  </div>
                  
                  <div class="detail-item">
                    <strong>Horas Reales:</strong>
                    <p class="mt-1">{{ selectedWorkOrder.actualHours ? selectedWorkOrder.actualHours + ' horas' : 'Pendiente' }}</p>
                  </div>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-4" />
            
            <div class="detail-section">
              <h4 class="text-h6 orange--text text--darken-2 mb-3">Fechas</h4>
              
              <v-row>
                <v-col cols="6" md="3">
                  <div class="detail-item">
                    <strong>Creado:</strong>
                    <p class="mt-1 text-caption">{{ formatDate(selectedWorkOrder.createdAt) }}</p>
                  </div>
                </v-col>
                
                <v-col cols="6" md="3">
                  <div class="detail-item">
                    <strong>Actualizado:</strong>
                    <p class="mt-1 text-caption">{{ formatDate(selectedWorkOrder.updatedAt) }}</p>
                  </div>
                </v-col>
                
                <v-col cols="6" md="3">
                  <div class="detail-item">
                    <strong>Iniciado:</strong>
                    <p class="mt-1 text-caption">{{ selectedWorkOrder.startedAt ? formatDate(selectedWorkOrder.startedAt) : 'Pendiente' }}</p>
                  </div>
                </v-col>
                
                <v-col cols="6" md="3">
                  <div class="detail-item">
                    <strong>Completado:</strong>
                    <p class="mt-1 text-caption">{{ selectedWorkOrder.completedAt ? formatDate(selectedWorkOrder.completedAt) : 'Pendiente' }}</p>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
          
          <v-card-actions class="px-6 pb-6 justify-center">
            <v-btn
              color="orange darken-2"
              large
              @click="closeDetailDialog"
              class="custom-btn"
            >
              <v-icon left>mdi-close</v-icon>
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog de asignación de empleado -->
      <v-dialog
        v-model="showAssignDialog"
        max-width="700px"
        persistent
      >
        <v-card v-if="selectedWorkOrder" class="detail-card">
          <v-card-title class="dialog-header text-center pb-2">
            <div class="w-100">
              <v-icon size="48" color="white" class="mb-3">
                mdi-account-plus
              </v-icon>
              <h3 class="text-h5 font-weight-medium text-white">Asignar Orden #{{ selectedWorkOrder.id }}</h3>
              <!-- Mostrar empleado ya asignado si existe -->
              <div v-if="selectedWorkOrder.assignedEmployee" class="mt-2">
                <v-chip color="white" text-color="orange darken-2" class="font-weight-bold">
                  <v-icon left small>mdi-account</v-icon>
                  Asignado a: {{ getAssignedEmployeeName(selectedWorkOrder.assignedEmployee) }}
                </v-chip>
              </div>
            </div>
          </v-card-title>
          
          <v-card-text class="px-6">
            <!-- Mostrar información del empleado actual si ya está asignado -->
            <v-alert 
              v-if="selectedWorkOrder.assignedEmployee"
              type="info"
              outlined
              class="mb-4"
            >
              <div class="d-flex align-center">
                <v-icon left>mdi-information</v-icon>
                <div>
                  <strong>Esta orden ya está asignada a:</strong> 
                  {{ getAssignedEmployeeName(selectedWorkOrder.assignedEmployee) }}
                  <br>
                  <small>Puede reasignar seleccionando otro empleado</small>
                </div>
              </div>
            </v-alert>

            <v-form>
              <!-- Loading de empleados -->
              <v-progress-linear
                v-if="loadingEmployees"
                indeterminate
                color="orange darken-2"
                class="mb-4"
              />
              
              <v-select
                v-model="assignForm.employeeId"
                :items="employeesForSelection"
                item-title="displayName"
                item-value="id"
                label="Seleccionar Empleado"
                outlined
                required
                :loading="loadingEmployees"
                :disabled="loadingEmployees"
                class="mb-4"
                :return-object="false"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="undefined">
                    <template v-slot:title>
                      {{ (item as any).firstName }} {{ (item as any).lastName }}
                      <v-chip x-small :color="(item as any).category === 'Disponible' ? 'success' : 'info'" text-color="white" class="ml-2">
                        {{ (item as any).categoryLabel }}
                      </v-chip>
                    </template>
                    <template v-slot:subtitle>
                      {{ (item as any).username }} - {{ (item as any).email }}
                    </template>
                  </v-list-item>
                </template>
              </v-select>

              <v-textarea
                v-model="assignForm.assignmentNotes"
                label="Notas de asignación"
                outlined
                rows="3"
                placeholder="Razón de la asignación, especialización requerida, etc."
              />

              <!-- Información de empleados disponibles -->
              <v-card outlined class="mb-4" v-if="!loadingEmployees && employeesForSelection.length > 0">
                <v-card-subtitle>
                  <v-icon left small>mdi-information</v-icon>
                  Empleados disponibles: {{ employeesForSelection.length }}
                  <v-divider vertical class="mx-2" />
                  <v-chip x-small color="success" text-color="white" class="mr-2">
                    {{ availableEmployees.length }} por disponibilidad
                  </v-chip>
                  <v-chip x-small color="info" text-color="white">
                    {{ employeesWithCapacity.length }} por carga
                  </v-chip>
                </v-card-subtitle>
              </v-card>

              <!-- Mensaje si no hay empleados -->
              <v-alert 
                v-if="!loadingEmployees && employeesForSelection.length === 0"
                type="warning"
                outlined
                class="mb-4"
              >
                No hay empleados disponibles en este momento
              </v-alert>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="px-6 pb-6 justify-space-between">
            <v-btn
              large
              @click="closeAssignDialog"
              :disabled="assignLoading"
            >
              <v-icon left>mdi-close</v-icon>
              Cancelar
            </v-btn>
            
            <v-btn
              color="orange darken-2"
              large
              @click="assignWorkOrder"
              :loading="assignLoading"
              :disabled="!assignForm.employeeId || loadingEmployees"
              class="custom-btn"
            >
              <v-icon left>mdi-check</v-icon>
              {{ selectedWorkOrder.assignedEmployee ? 'Reasignar Orden' : 'Asignar Orden' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-app>
</template>

<style scoped>
.work-orders-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    min-height: 100vh;
    position: relative;
    overflow-x: auto;
}

.work-orders-container::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
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
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
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

.header-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 24px;
    position: relative;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.controls-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.work-order-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    height: 100%;
}

.work-order-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
}

.detail-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.dialog-header {
    background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
    color: white !important;
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

.detail-section {
    margin-bottom: 24px;
}

.detail-item {
    margin-bottom: 16px;
}

.detail-item strong {
    color: #424242;
    font-weight: 600;
}

.gap-2 > * {
    margin-right: 8px;
    margin-bottom: 4px;
}

@media (max-width: 768px) {
    .work-orders-container {
        padding: 8px;
    }

    .header-section {
        padding: 16px;
    }

    .header-section h1 {
        font-size: 1.5rem !important;
    }

    .work-order-card {
        margin-bottom: 16px;
    }
}

@media (max-width: 600px) {
    .work-order-card {
        margin-bottom: 12px;
    }
    
    .custom-btn {
        font-size: 12px;
        padding: 8px 16px;
    }
}
</style>