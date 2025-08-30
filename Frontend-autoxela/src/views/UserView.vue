<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

// Interfaces de TypeScript
interface User {
  id: number
  cui: string
  nit?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  username: string
  userType: string
  gender?: string
  isActive: boolean
  lastLogin?: string
  createdAt?: string
  addressDetailId?: number
  birthDate?: string
  genderId?: number
}

interface UserWithFullName extends User {
  fullName: string
}

interface PaginationResponse {
  content: User[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

interface UpdateUserRequest {
  nit?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  addressDetailId: number
  birthDate: string
  genderId?: number
  isActive: boolean
}

// Estados reactivos
const users = ref<User[]>([])
const loading = ref<boolean>(false)
const searchLoading = ref<boolean>(false)
const errorMessage = ref<string>('')
const successMessage = ref<string>('')

// Estados para acciones de usuario
const actionLoading = ref<boolean>(false)

// Estados para paginación
const pagination = reactive({
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
})

// Estados para filtros y búsqueda
const searchByCUI = ref<string>('')
const searchById = ref<string>('')
const selectedUserType = ref<string>('')

// Estados para dialogs
const showUserDetailDialog = ref<boolean>(false)
const selectedUser = ref<User | null>(null)
const showDeleteConfirmDialog = ref<boolean>(false)
const showEditUserDialog = ref<boolean>(false)

// Estados para edición de usuario
const editingUser = ref<User | null>(null)
const editForm = reactive<UpdateUserRequest>({
  nit: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressDetailId: 1,
  birthDate: '',
  genderId: undefined,
  isActive: true
})

// Opciones de filtro
const userTypes: string[] = [
  'Todos',
  'Administrador',
  'Empleado',
  'Especialista',
  'Cliente',
  'Proveedor'
]

const pageSizeOptions: number[] = [5, 10, 25, 50]

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true, width: 80 },
  { title: 'CUI', key: 'cui', sortable: true, width: 120 },
  { title: 'Nombre Completo', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Teléfono', key: 'phone', sortable: true, width: 120 },
  { title: 'Usuario', key: 'username', sortable: true, width: 120 },
  { title: 'Tipo', key: 'userType', sortable: true, width: 120 },
  { title: 'Género', key: 'gender', sortable: true, width: 100 },
  { title: 'Estado', key: 'isActive', sortable: true, width: 100 },
  { title: 'Último Login', key: 'lastLogin', sortable: true, width: 150 },
  { title: 'Acciones', key: 'actions', sortable: false, width: 100 }
]

// Computed para nombre completo
const computedUsers = computed<UserWithFullName[]>(() => {
  return users.value.map(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`
  }))
})

// Función para obtener el token de autorización
const getAuthHeaders = (): Record<string, string> | null => {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    errorMessage.value = 'Token de autorización no encontrado'
    return null
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Función para cargar usuarios paginados
const loadUsers = async (page: number = 0, size: number = pagination.size): Promise<void> => {
  loading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    loading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/paginated?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      if (responseData.content) {
        // Respuesta paginada
        const paginatedData = responseData as PaginationResponse
        users.value = paginatedData.content
        pagination.page = paginatedData.number
        pagination.size = paginatedData.size
        pagination.totalElements = paginatedData.totalElements
        pagination.totalPages = paginatedData.totalPages
        pagination.first = paginatedData.first
        pagination.last = paginatedData.last
      } else {
        // Respuesta simple (array)
        users.value = Array.isArray(responseData) ? responseData : []
        pagination.totalElements = users.value.length
        pagination.totalPages = 1
      }
      console.log('Usuarios cargados exitosamente:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Error al cargar usuarios'
      console.error('Error al cargar usuarios:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión con el servidor'
    console.error('Error al cargar usuarios:', error)
  } finally {
    loading.value = false
  }
}

// Función para buscar usuarios por tipo
const searchByUserType = async (userType: string): Promise<void> => {
  if (userType === 'Todos' || !userType) {
    loadUsers(0, pagination.size)
    return
  }
  
  searchLoading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    searchLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/type/${encodeURIComponent(userType)}`,
      {
        method: 'GET',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      users.value = Array.isArray(responseData) ? responseData : []
      pagination.totalElements = users.value.length
      pagination.totalPages = 1
      console.log('Búsqueda por tipo exitosa:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Error en la búsqueda por tipo'
      console.error('Error en búsqueda por tipo:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión durante la búsqueda'
    console.error('Error en búsqueda por tipo:', error)
  } finally {
    searchLoading.value = false
  }
}

// Función para buscar por CUI
const searchUserByCUI = async (): Promise<void> => {
  if (!searchByCUI.value.trim()) {
    loadUsers(0, pagination.size)
    return
  }
  
  searchLoading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    searchLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/cui/${encodeURIComponent(searchByCUI.value)}`,
      {
        method: 'GET',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      users.value = [responseData as User] // Un solo usuario
      pagination.totalElements = 1
      pagination.totalPages = 1
      successMessage.value = 'Usuario encontrado exitosamente'
      console.log('Búsqueda por CUI exitosa:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Usuario no encontrado'
      users.value = []
      console.error('Error en búsqueda por CUI:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión durante la búsqueda'
    console.error('Error en búsqueda por CUI:', error)
  } finally {
    searchLoading.value = false
  }
  clearMessages()
}

// Función para buscar por ID
const searchUserById = async (): Promise<void> => {
  if (!searchById.value.trim()) {
    loadUsers(0, pagination.size)
    return
  }
  
  searchLoading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    searchLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/${encodeURIComponent(searchById.value)}`,
      {
        method: 'GET',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      users.value = [responseData as User] // Un solo usuario
      pagination.totalElements = 1
      pagination.totalPages = 1
      successMessage.value = 'Usuario encontrado exitosamente'
      console.log('Búsqueda por ID exitosa:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Usuario no encontrado'
      users.value = []
      console.error('Error en búsqueda por ID:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión durante la búsqueda'
    console.error('Error en búsqueda por ID:', error)
  } finally {
    searchLoading.value = false
  }
  clearMessages()
}

// Función para eliminar usuario
const deleteUser = async (): Promise<void> => {
  if (!selectedUser.value) return
  
  actionLoading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    actionLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/${selectedUser.value.id}`,
      {
        method: 'DELETE',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      successMessage.value = responseData.message || 'Usuario eliminado exitosamente'
      showUserDetailDialog.value = false
      showDeleteConfirmDialog.value = false
      // Recargar la lista de usuarios
      loadUsers(pagination.page, pagination.size)
      console.log('Usuario eliminado exitosamente:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Error al eliminar usuario'
      console.error('Error al eliminar usuario:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión al eliminar usuario'
    console.error('Error al eliminar usuario:', error)
  } finally {
    actionLoading.value = false
  }
  clearMessages()
}

// Función para activar usuario
const activateUser = async (): Promise<void> => {
  if (!selectedUser.value) return
  
  actionLoading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    actionLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/${selectedUser.value.id}/activate`,
      {
        method: 'PUT',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      successMessage.value = responseData.message || 'Usuario activado exitosamente'
      // Actualizar el estado del usuario en el objeto seleccionado
      selectedUser.value.isActive = true
      // Actualizar también en la lista principal
      const userIndex = users.value.findIndex(u => u.id === selectedUser.value!.id)
      if (userIndex !== -1) {
        users.value[userIndex].isActive = true
      }
      console.log('Usuario activado exitosamente:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Error al activar usuario'
      console.error('Error al activar usuario:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión al activar usuario'
    console.error('Error al activar usuario:', error)
  } finally {
    actionLoading.value = false
  }
  clearMessages()
}

// Función para desactivar usuario
const deactivateUser = async (): Promise<void> => {
  if (!selectedUser.value) return
  
  actionLoading.value = true
  errorMessage.value = ''
  
  const headers = getAuthHeaders()
  if (!headers) {
    actionLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/${selectedUser.value.id}/deactivate`,
      {
        method: 'PUT',
        headers
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      successMessage.value = responseData.message || 'Usuario desactivado exitosamente'
      // Actualizar el estado del usuario en el objeto seleccionado
      selectedUser.value.isActive = false
      // Actualizar también en la lista principal
      const userIndex = users.value.findIndex(u => u.id === selectedUser.value!.id)
      if (userIndex !== -1) {
        users.value[userIndex].isActive = false
      }

      console.log('Usuario desactivado exitosamente:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Error al desactivar usuario'
      console.error('Error al desactivar usuario:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión al desactivar usuario'
    console.error('Error al desactivar usuario:', error)
  } finally {
    actionLoading.value = false
  }
  clearMessages()
}

// Función para actualizar usuario
const updateUser = async (): Promise<void> => {
  if (!editingUser.value) return
  
  actionLoading.value = true
  errorMessage.value = ''
  editForm.addressDetailId = 1
  editForm.birthDate = '1990-05-15'
  
  const headers = getAuthHeaders()
  if (!headers) {
    actionLoading.value = false
    return
  }
  
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/admin/users/${editingUser.value.id}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm)
      }
    )
    
    const responseData = await response.json()
    
    if (response.ok) {
      successMessage.value = responseData.message || 'Usuario actualizado exitosamente'
      showEditUserDialog.value = false
      
      // Actualizar el usuario en la lista
      const userIndex = users.value.findIndex(u => u.id === editingUser.value!.id)
      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...editForm }
      }
      
      // Actualizar selectedUser si es el mismo
      if (selectedUser.value?.id === editingUser.value.id) {
        selectedUser.value = { ...selectedUser.value, ...editForm }
      }
      console.log('Usuario actualizado exitosamente:', responseData)
    } else {
      errorMessage.value = responseData.message || 'Error al actualizar usuario'
      console.error('Error al actualizar usuario:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión al actualizar usuario'
    console.error('Error al actualizar usuario:', error)
  } finally {
    actionLoading.value = false
  }
  clearMessages()
}

// Función para mostrar confirmación de eliminación
const confirmDeleteUser = (): void => {
  showDeleteConfirmDialog.value = true
}

// Función para mostrar detalles del usuario
const showUserDetails = (user: User): void => {
  selectedUser.value = user
  showUserDetailDialog.value = true
}

// Función para mostrar dialog de edición
const showEditUser = (): void => {
  if (!selectedUser.value) return
  
  editingUser.value = selectedUser.value
  // Llenar el formulario con los datos actuales
  editForm.nit = selectedUser.value.nit || ''
  editForm.firstName = selectedUser.value.firstName
  editForm.lastName = selectedUser.value.lastName
  editForm.email = selectedUser.value.email
  editForm.phone = selectedUser.value.phone || ''
  editForm.isActive = selectedUser.value.isActive
  
  showEditUserDialog.value = true
}

// Función para cambiar página
const changePage = (newPage: number): void => {
  if (selectedUserType.value && selectedUserType.value !== 'Todos') {
    // Si hay filtro por tipo, mantener la búsqueda filtrada
    return
  }
  loadUsers(newPage, pagination.size)
}

// Función para cambiar tamaño de página
const changePageSize = (newSize: number): void => {
  pagination.size = newSize
  loadUsers(0, newSize)
}

// Función para limpiar filtros
const clearFilters = (): void => {
  searchByCUI.value = ''
  searchById.value = ''
  selectedUserType.value = ''
  successMessage.value = ''
  errorMessage.value = ''
  loadUsers(0, pagination.size)
}

// Función para limpiar mensajes
const clearMessages = (): void => {
  setTimeout(() => {
    successMessage.value = ''
    errorMessage.value = ''
  }, 5000)
}

// Función para formatear fecha
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para formatear fecha para input
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return ''
  return dateString.split('T')[0] // Obtener solo la parte de fecha YYYY-MM-DD
}

// Función para obtener color del chip de estado
const getStatusColor = (isActive: boolean): string => {
  return isActive ? 'success' : 'error'
}

// Función para obtener color del chip de tipo de usuario
const getUserTypeColor = (userType: string): string => {
  const colors: Record<string, string> = {
    'Administrador': 'red',
    'Empleado': 'blue',
    'Especialista': 'orange',
    'Cliente': 'green',
    'Proveedor': 'purple'
  }
  return colors[userType] || 'grey'
}

// Watchers
watch(selectedUserType, (newValue: string) => {
  if (newValue) {
    searchByUserType(newValue)
  }
})

// Cargar usuarios al montar el componente
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <v-app>
    <div class="users-container">
      <v-container fluid class="pa-6">
        <!-- Mensajes de estado -->
        <v-row v-if="successMessage || errorMessage" class="mb-4">
          <v-col cols="12">
            <v-alert
              v-if="successMessage"
              type="success"
              dismissible
              @input="clearMessages"
            >
              {{ successMessage }}
            </v-alert>
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
              @input="clearMessages"
            >
              {{ errorMessage }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Filtros y búsqueda -->
        <v-card class="filter-card mb-6" elevation="2">
          <v-card-title class="pb-2">
            <v-icon class="mr-2" color="orange darken-2">mdi-filter</v-icon>
            Filtros de Búsqueda
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <!-- Búsqueda por ID -->
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="searchById"
                  label="Buscar por ID"
                  prepend-inner-icon="mdi-identifier"
                  outlined
                  dense
                  clearable
                  placeholder="Ej: 123"
                  @keyup.enter="searchUserById"
                />
              </v-col>

              <!-- Búsqueda por CUI -->
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="searchByCUI"
                  label="Buscar por CUI"
                  prepend-inner-icon="mdi-card-account-details"
                  outlined
                  dense
                  clearable
                  placeholder="Ej: 3140315290901"
                  @keyup.enter="searchUserByCUI"
                />
              </v-col>

              <!-- Filtro por tipo de usuario -->
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedUserType"
                  label="Tipo de Usuario"
                  prepend-inner-icon="mdi-account-group"
                  :items="userTypes"
                  outlined
                  dense
                  clearable
                />
              </v-col>

              <!-- Tamaño de página -->
              <v-col cols="12" md="3">
                <v-select
                  :model-value="pagination.size"
                  @update:model-value="changePageSize"
                  label="Usuarios por página"
                  prepend-inner-icon="mdi-view-list"
                  :items="pageSizeOptions"
                  outlined
                  dense
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <div class="d-flex gap-3">
                  <v-btn
                    color="orange darken-2"
                    @click="searchUserById"
                    :loading="searchLoading"
                    :disabled="!searchById"
                  >
                    <v-icon left>mdi-magnify</v-icon>
                    Buscar por ID
                  </v-btn>

                  <v-btn
                    color="orange darken-2"
                    @click="searchUserByCUI"
                    :loading="searchLoading"
                    :disabled="!searchByCUI"
                  >
                    <v-icon left>mdi-magnify</v-icon>
                    Buscar por CUI
                  </v-btn>

                  <v-btn
                    outlined
                    color="grey darken-1"
                    @click="clearFilters"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Limpiar Filtros
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Tabla de usuarios -->
        <v-card class="users-table-card" elevation="3">
          <v-card-title class="pb-2">
            <v-icon class="mr-2" color="orange darken-2">mdi-table</v-icon>
            Lista de Usuarios
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="computedUsers"
            :loading="loading"
            loading-text="Cargando usuarios..."
            no-data-text="No se encontraron usuarios"
            class="users-table"
            item-value="id"
            density="comfortable"
          >
            <!-- Slot para CUI -->
            <template v-slot:[`item.cui`]="{ item }">
              <v-chip size="small" color="blue-grey" text-color="white">
                {{ item.cui }}
              </v-chip>
            </template>

            <!-- Slot para tipo de usuario -->
            <template v-slot:[`item.userType`]="{ item }">
              <v-chip 
                size="small" 
                :color="getUserTypeColor(item.userType)"
                text-color="white"
              >
                {{ item.userType }}
              </v-chip>
            </template>

            <!-- Slot para estado -->
            <template v-slot:[`item.isActive`]="{ item }">
              <v-chip 
                size="small" 
                :color="getStatusColor(item.isActive)"
                text-color="white"
              >
                <v-icon left small>
                  {{ item.isActive ? 'mdi-check' : 'mdi-close' }}
                </v-icon>
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>

            <!-- Slot para último login -->
            <template v-slot:[`item.lastLogin`]="{ item }">
              <span class="text-caption">
                {{ formatDate(item.lastLogin) }}
              </span>
            </template>

            <!-- Slot para acciones -->
            <template v-slot:[`item.actions`]="{ item }">
              <v-btn
                size="small"
                color="orange darken-2"
                variant="outlined"
                @click="showUserDetails(item)"
              >
                <v-icon small>mdi-eye</v-icon>
              </v-btn>
            </template>
          </v-data-table>

          <!-- Paginación -->
          <v-card-actions class="justify-center pa-4" v-if="pagination.totalPages > 1">
            <v-pagination
              :model-value="pagination.page + 1"
              @update:model-value="(page) => changePage(page - 1)"
              :length="pagination.totalPages"
              color="orange darken-2"
              :disabled="loading"
              total-visible="7"
            />
          </v-card-actions>
        </v-card>

        <!-- Dialog de detalles del usuario -->
        <v-dialog
          v-model="showUserDetailDialog"
          max-width="600px"
          persistent
        >
          <v-card v-if="selectedUser" class="user-detail-card">
            <v-card-title class="pb-2">
              <div class="w-100 d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon size="32" color="orange darken-2" class="mr-3">
                    mdi-account-details
                  </v-icon>
                  <div>
                    <h3 class="text-h6 font-weight-medium">Detalles del Usuario</h3>
                    <p class="text-body-2 grey--text ma-0">ID: {{ selectedUser.id }}</p>
                  </div>
                </div>
                <v-chip 
                  :color="getStatusColor(selectedUser.isActive)"
                  text-color="white"
                >
                  {{ selectedUser.isActive ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </div>
            </v-card-title>

            <v-card-text class="pb-2">
              <v-row>
                <v-col cols="12" md="6">
                  <v-list dense>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">CUI</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.cui }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">NIT</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.nit || 'N/A' }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Nombre</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.firstName }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Apellido</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.lastName }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Género</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.gender || 'N/A' }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-col cols="12" md="6">
                  <v-list dense>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Email</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.email }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Teléfono</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.phone || 'N/A' }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Usuario</v-list-item-title>
                        <v-list-item-subtitle>{{ selectedUser.username }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Tipo</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            size="small" 
                            :color="getUserTypeColor(selectedUser.userType)"
                            text-color="white"
                          >
                            {{ selectedUser.userType }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Último Login</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(selectedUser.lastLogin) }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

              <v-row>
                <v-col cols="12">
                  <v-list dense>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title class="font-weight-medium">Fecha de Registro</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(selectedUser.createdAt) }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </v-card-text>

            <!-- Sección de acciones del usuario -->
            <v-divider />
            <v-card-actions class="px-6 py-4">
              <div class="w-100">
                <!-- Botones de acción -->
                <div class="d-flex justify-space-between align-center mb-3">
                  <span class="text-subtitle-2 font-weight-medium grey--text">Acciones del Usuario:</span>
                </div>
                
                <div class="d-flex gap-3 flex-wrap">
                  <!-- Botón Editar -->
                  <v-btn
                    color="primary"
                    :loading="actionLoading"
                    @click="showEditUser"
                    variant="elevated"
                  >
                    <v-icon left>mdi-pencil</v-icon>
                    Editar Usuario
                  </v-btn>

                  <!-- Botón Activar -->
                  <v-btn
                    v-if="!selectedUser.isActive"
                    color="success"
                    :loading="actionLoading"
                    @click="activateUser"
                    variant="elevated"
                  >
                    <v-icon left>mdi-check-circle</v-icon>
                    Activar Usuario
                  </v-btn>

                  <!-- Botón Desactivar -->
                  <v-btn
                    v-if="selectedUser.isActive"
                    color="warning"
                    :loading="actionLoading"
                    @click="deactivateUser"
                    variant="elevated"
                  >
                    <v-icon left>mdi-pause-circle</v-icon>
                    Desactivar Usuario
                  </v-btn>

                  <!-- Botón Eliminar -->
                  <v-btn
                    color="error"
                    :loading="actionLoading"
                    @click="confirmDeleteUser"
                    variant="elevated"
                  >
                    <v-icon left>mdi-delete</v-icon>
                    Eliminar
                  </v-btn>
                </div>

                <!-- Botón cerrar -->
                <v-divider class="my-3" />
                <div class="d-flex justify-end">
                  <v-btn
                    color="orange darken-2"
                    @click="showUserDetailDialog = false"
                    variant="outlined"
                  >
                    <v-icon left>mdi-close</v-icon>
                    Cerrar
                  </v-btn>
                </div>
              </div>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Dialog de edición de usuario -->
        <v-dialog
          v-model="showEditUserDialog"
          max-width="700px"
          persistent
        >
          <v-card v-if="editingUser" class="user-detail-card">
            <v-card-title class="pb-2">
              <div class="d-flex align-center">
                <v-icon size="32" color="primary" class="mr-3">
                  mdi-account-edit
                </v-icon>
                <div>
                  <h3 class="text-h6 font-weight-medium">Editar Usuario</h3>
                  <p class="text-body-2 grey--text ma-0">ID: {{ editingUser.id }} - {{ editingUser.username }}</p>
                </div>
              </div>
            </v-card-title>

            <v-card-text class="pb-2">
              <v-form>
                <v-row>
                  <!-- NIT -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editForm.nit"
                      label="NIT"
                      prepend-inner-icon="mdi-card-account-details-outline"
                      outlined
                      dense
                      placeholder="Ej: 103107169"
                    />
                  </v-col>

                  <!-- Nombre -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editForm.firstName"
                      label="Nombre *"
                      prepend-inner-icon="mdi-account"
                      outlined
                      dense
                      required
                    />
                  </v-col>

                  <!-- Apellido -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editForm.lastName"
                      label="Apellido *"
                      prepend-inner-icon="mdi-account"
                      outlined
                      dense
                      required
                    />
                  </v-col>

                  <!-- Email -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editForm.email"
                      label="Email *"
                      prepend-inner-icon="mdi-email"
                      outlined
                      dense
                      type="email"
                      required
                    />
                  </v-col>

                  <!-- Teléfono -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editForm.phone"
                      label="Teléfono"
                      prepend-inner-icon="mdi-phone"
                      outlined
                      dense
                      placeholder="Ej: 12345678"
                    />
                  </v-col>

                </v-row>
              </v-form>
            </v-card-text>

            <v-card-actions class="px-6 py-4">
              <v-spacer />
              <v-btn
                color="grey darken-1"
                @click="showEditUserDialog = false"
                variant="outlined"
                :disabled="actionLoading"
              >
                <v-icon left>mdi-cancel</v-icon>
                Cancelar
              </v-btn>
              <v-btn
                color="primary"
                @click="updateUser"
                :loading="actionLoading"
                variant="elevated"
              >
                <v-icon left>mdi-content-save</v-icon>
                Guardar Cambios
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Dialog de confirmación de eliminación -->
        <v-dialog
          v-model="showDeleteConfirmDialog"
          max-width="400px"
          persistent
        >
          <v-card class="delete-confirm-card">
            <v-card-title class="pb-2">
              <div class="d-flex align-center">
                <v-icon size="32" color="error" class="mr-3">
                  mdi-alert-circle
                </v-icon>
                <div>
                  <h3 class="text-h6 font-weight-medium">Confirmar Eliminación</h3>
                </div>
              </div>
            </v-card-title>

            <v-card-text class="pb-2">
              <div v-if="selectedUser">
                <p class="text-body-1 mb-3">
                  ¿Estás seguro de que deseas eliminar al usuario?
                </p>
                <div class="user-info-box pa-3 rounded" style="background-color: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.2);">
                  <div class="d-flex align-center mb-2">
                    <v-icon color="error" class="mr-2">mdi-account</v-icon>
                    <span class="font-weight-medium">{{ selectedUser.firstName }} {{ selectedUser.lastName }}</span>
                  </div>
                  <div class="d-flex align-center mb-1">
                    <v-icon color="grey" class="mr-2" size="small">mdi-card-account-details</v-icon>
                    <span class="text-body-2">CUI: {{ selectedUser.cui }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon color="grey" class="mr-2" size="small">mdi-email</v-icon>
                    <span class="text-body-2">{{ selectedUser.email }}</span>
                  </div>
                </div>
                <v-alert
                  type="warning"
                  variant="tonal"
                  class="mt-3"
                  density="compact"
                >
                  <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                </v-alert>
              </div>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
              <v-spacer />
              <v-btn
                color="grey darken-1"
                @click="showDeleteConfirmDialog = false"
                variant="outlined"
                :disabled="actionLoading"
              >
                <v-icon left>mdi-cancel</v-icon>
                Cancelar
              </v-btn>
              <v-btn
                color="error"
                @click="deleteUser"
                :loading="actionLoading"
                variant="elevated"
              >
                <v-icon left>mdi-delete</v-icon>
                Eliminar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </div>
  </v-app>
</template>

<style scoped>
.users-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.users-container::before {
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
  animation: float 6s ease-in-out infinite;
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

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.v-container {
  position: relative;
  z-index: 2;
}

.page-header {
  background: linear-gradient(45deg, rgba(255, 107, 53, 0.1), rgba(247, 147, 30, 0.1));
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 107, 53, 0.2);
}

.filter-card, .stats-card, .users-table-card, .user-detail-card, .delete-confirm-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px !important;
}

.users-table {
  background: transparent !important;
}

.users-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
}

.users-table :deep(.v-data-table-header) {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  color: white;
}

.users-table :deep(.v-data-table-header th) {
  color: white !important;
  font-weight: bold;
}

.users-table :deep(tr:hover) {
  background: rgba(255, 107, 53, 0.05) !important;
}

.d-flex.gap-3 {
  gap: 12px;
}

/* Estilos para la sección de acciones */
.user-info-box {
  transition: all 0.3s ease;
}

.user-info-box:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Estilos para botones de acción */
.v-btn.v-btn--variant-elevated {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.v-btn.v-btn--variant-elevated:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
}

/* Colores específicos para botones de acción */
.v-btn.v-btn--color-success:hover {
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.v-btn.v-btn--color-warning:hover {
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
}

.v-btn.v-btn--color-error:hover {
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }
  
  .page-header h1 {
    font-size: 1.75rem !important;
  }
  
  .v-container {
    padding: 12px;
  }
  
  .users-table :deep(.v-data-table__wrapper) {
    font-size: 12px;
  }
  
  .d-flex.gap-3 {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .filter-card .v-card-text .v-row .v-col {
    padding: 4px 8px;
  }
  
  .d-flex.gap-3 {
    gap: 8px;
    flex-direction: column;
  }
  
  .d-flex.gap-3 .v-btn {
    width: 100%;
  }
}

/* Animaciones personalizadas */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.15) !important;
}

.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
}

/* Estilos para chips personalizados */
.v-chip {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Scroll personalizado */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #f7931e, #ff6b35);
}

/* Mejorar el diseño de la paginación */
.v-pagination :deep(.v-pagination__item) {
  font-weight: 500;
}

.v-pagination :deep(.v-pagination__item--is-active) {
  background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
  color: white !important;
}

/* Animación para alertas */
.v-alert {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>