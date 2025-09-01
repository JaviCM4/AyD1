<script setup lang="ts">
  import { ref, onMounted } from 'vue'

  // Types
  interface InventoryMovement {
    id: number
    part: {
      id: number
      name: string
      description: string
      category: {
        id: number
        name: string
        description: string
        createdAt: string
      }
      unitPrice: number
      minimumStock: number
      createdAt: string
      updatedAt: string
    }
    movementType: {
      id: number
      name: string
      description: string
      createdAt: string
    }
    quantity: number
    referenceType: {
      id: number
      name: string
      description: string
      createdAt: string
    }
    referenceId: number
    notes: string
    createdBy: {
      id: number
      cui: string
      nit: string
      firstName: string
      lastName: string
      email: string
      phone: string
      username: string
      userType: string
      isActive: boolean
      createdAt: string
    }
    createdAt: string
  }

  // Reactive data
  const inventoryMovements = ref<InventoryMovement[]>([])
  const loadingMovements = ref(false)
  const totalMovements = ref(0)
  const movementsPageSize = ref(10)
  const movementsCurrentPage = ref(1)

  // Options
  const itemsPerPageOptions = [
    { value: 5, title: '5' },
    { value: 10, title: '10' },
    { value: 20, title: '20' },
    { value: 50, title: '50' },
    { value: -1, title: 'Todos' }
  ]

  // API Base URL
  const BASE_URL = 'http://localhost:8080/api/v1'

  // Headers configuration
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('accessToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const getBasicHeaders = (): Record<string, string> => {
    return {
      'Content-Type': 'application/json'
    }
  }

  // Table headers
  const movementHeaders = [
    { title: 'ID', value: 'id', sortable: true },
    { title: 'Producto', value: 'part.name', sortable: true },
    { title: 'Tipo Movimiento', value: 'movementType.name', sortable: true },
    { title: 'Cantidad', value: 'quantity', sortable: true },
    { title: 'Tipo Referencia', value: 'referenceType.name', sortable: true },
    { title: 'ID Referencia', value: 'referenceId', sortable: true },
    { title: 'Fecha', value: 'createdAt', sortable: true },
    { title: 'Usuario', value: 'createdBy.username', sortable: true }
  ]

  // Methods
  const fetchInventoryMovements = async () => {
    try {
      loadingMovements.value = true
      const page = movementsCurrentPage.value - 1
      const size = movementsPageSize.value === -1 ? 1000 : movementsPageSize.value
      
      const url = `${BASE_URL}/inventory/movements?page=${page}&size=${size}&sortBy=createdAt&sortDir=desc`
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        inventoryMovements.value = data.content || data
        totalMovements.value = data.totalElements || data.length
      } else {
        console.error('Error fetching inventory movements:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching inventory movements:', error)
    } finally {
      loadingMovements.value = false
    }
  }

  const updateMovementsTable = (page: number) => {
    movementsCurrentPage.value = page
    fetchInventoryMovements()
  }

  const handleMovementsItemsPerPageChange = (itemsPerPage: number) => {
    movementsPageSize.value = itemsPerPage
    movementsCurrentPage.value = 1
    fetchInventoryMovements()
  }

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Entrada': 'success',
      'Salida': 'error',
      'Ajuste': 'warning'
    }
    return colors[type] || 'grey'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Lifecycle
  onMounted(() => {
    fetchInventoryMovements()
  })
</script>

<template>
  <v-app>
    <div class="inventory-movements-container">
      <!-- Floating Icons Background -->
      <div class="floating-icons">
        <v-icon class="floating-icon" size="48">mdi-swap-horizontal</v-icon>
        <v-icon class="floating-icon" size="32">mdi-package-variant</v-icon>
        <v-icon class="floating-icon" size="40">mdi-chart-line</v-icon>
        <v-icon class="floating-icon" size="36">mdi-database</v-icon>
        <v-icon class="floating-icon" size="44">mdi-trending-up</v-icon>
        <v-icon class="floating-icon" size="28">mdi-file-chart</v-icon>
      </div>

      <v-container fluid class="pa-6">
        <!-- Header Section -->
        <v-row class="mb-4">
          <v-col cols="12">
            <v-card class="controls-card elevation-8" rounded="lg">
              <div class="header-section">
                <div class="d-flex align-center mb-4">
                  <v-icon size="48" class="mr-4" color="blue darken-2">
                    mdi-swap-horizontal
                  </v-icon>
                  <div>
                    <h1 class="text-h4 font-weight-bold">Movimientos de Inventario</h1>
                    <p class="text-subtitle1 grey--text">Taller AutoXela - Historial de Movimientos</p>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Movements Table -->
        <v-row>
          <v-col cols="12">
            <v-card class="inventory-table-card elevation-12" rounded="lg">
              <v-card-title class="table-header">
                <v-icon left color="white">mdi-swap-horizontal</v-icon>
                Movimientos de Inventario ({{ totalMovements }} elementos)
              </v-card-title>

              <v-data-table
                :headers="movementHeaders"
                :items="inventoryMovements"
                :loading="loadingMovements"
                class="inventory-table"
                :items-per-page="movementsPageSize"
                :items-per-page-options="itemsPerPageOptions"
                :server-items-length="totalMovements"
                :page="movementsCurrentPage"
                @update:page="updateMovementsTable"
                @update:items-per-page="handleMovementsItemsPerPageChange"
                loading-text="Cargando movimientos..."
                no-data-text="No hay movimientos disponibles"
                :items-per-page-text="'Elementos por página:'"
                :page-text="'{0}-{1} de {2}'"
              >
                <!-- Movement Type Column -->
                <template v-slot:item.movementType.name="{ item }">
                  <v-chip :color="getMovementTypeColor(item.movementType.name)" text-color="white" small>
                    {{ item.movementType.name }}
                  </v-chip>
                </template>

                <!-- Quantity Column -->
                <template v-slot:item.quantity="{ item }">
                  <span :class="item.movementType.name === 'Entrada' ? 'text-success font-weight-bold' : 
                                item.movementType.name === 'Salida' ? 'text-error font-weight-bold' : 
                                'text-warning font-weight-bold'">
                    {{ item.movementType.name === 'Salida' ? '-' : '+' }}{{ item.quantity }}
                  </span>
                </template>

                <!-- Created At Column -->
                <template v-slot:item.createdAt="{ item }">
                  {{ formatDate(item.createdAt) }}
                </template>

                <!-- Expandable row for details -->
                <template v-slot:expanded-item="{ columns, item }">
                  <tr>
                    <td :colspan="columns.length" class="pa-4">
                      <v-card flat>
                        <v-card-title class="text-h6">
                          Detalles del Movimiento #{{ item.id }}
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col cols="12" md="6">
                              <h4 class="mb-2">Información del Producto</h4>
                              <p><strong>Nombre:</strong> {{ item.part.name }}</p>
                              <p><strong>Descripción:</strong> {{ item.part.description }}</p>
                              <p><strong>Categoría:</strong> {{ item.part.category.name }}</p>
                              <p><strong>Precio Unitario:</strong> Q{{ item.part.unitPrice.toFixed(2) }}</p>
                              <p><strong>Stock Mínimo:</strong> {{ item.part.minimumStock }}</p>
                            </v-col>
                            <v-col cols="12" md="6">
                              <h4 class="mb-2">Información del Movimiento</h4>
                              <p><strong>Tipo:</strong> {{ item.movementType.name }} - {{ item.movementType.description }}</p>
                              <p><strong>Cantidad:</strong> 
                                <span :class="item.movementType.name === 'Entrada' ? 'text-success font-weight-bold' : 
                                              item.movementType.name === 'Salida' ? 'text-error font-weight-bold' : 
                                              'text-warning font-weight-bold'">
                                  {{ item.movementType.name === 'Salida' ? '-' : '+' }}{{ item.quantity }}
                                </span>
                              </p>
                              <p><strong>Referencia:</strong> {{ item.referenceType.name }} #{{ item.referenceId }}</p>
                              <p><strong>Usuario:</strong> {{ item.createdBy.firstName }} {{ item.createdBy.lastName }} ({{ item.createdBy.username }})</p>
                              <p><strong>Fecha:</strong> {{ formatDate(item.createdAt) }}</p>
                              <p v-if="item.notes"><strong>Notas:</strong> {{ item.notes }}</p>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </td>
                  </tr>
                </template>

                <!-- Custom row click to expand -->
                <template v-slot:item="{ item, props }">
                  <tr @click="props.onClick" style="cursor: pointer;">
                    <td>{{ item.id }}</td>
                    <td>{{ item.part.name }}</td>
                    <td>
                      <v-chip :color="getMovementTypeColor(item.movementType.name)" text-color="white" small>
                        {{ item.movementType.name }}
                      </v-chip>
                    </td>
                    <td>
                      <span :class="item.movementType.name === 'Entrada' ? 'text-success font-weight-bold' : 
                                    item.movementType.name === 'Salida' ? 'text-error font-weight-bold' : 
                                    'text-warning font-weight-bold'">
                        {{ item.movementType.name === 'Salida' ? '-' : '+' }}{{ item.quantity }}
                      </span>
                    </td>
                    <td>{{ item.referenceType.name }}</td>
                    <td>{{ item.referenceId }}</td>
                    <td>{{ formatDate(item.createdAt) }}</td>
                    <td>{{ item.createdBy.username }}</td>
                  </tr>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-app>
</template>

<style scoped>
/* Floating Icons Background */
.floating-icons {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.floating-icon {
  position: absolute;
  opacity: 0.03;
  color: #2196F3;
  animation: float 20s infinite ease-in-out;
}

.floating-icon:nth-child(1) {
  top: 10%;
  left: 10%;
  animation-delay: -5s;
}

.floating-icon:nth-child(2) {
  top: 20%;
  right: 15%;
  animation-delay: -10s;
}

.floating-icon:nth-child(3) {
  top: 60%;
  left: 20%;
  animation-delay: -15s;
}

.floating-icon:nth-child(4) {
  bottom: 30%;
  right: 10%;
  animation-delay: -8s;
}

.floating-icon:nth-child(5) {
  bottom: 10%;
  left: 15%;
  animation-delay: -12s;
}

.floating-icon:nth-child(6) {
  top: 40%;
  right: 30%;
  animation-delay: -3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-30px) rotate(90deg);
  }
  50% {
    transform: translateY(20px) rotate(180deg);
  }
  75% {
    transform: translateY(-20px) rotate(270deg);
  }
}

/* Container */
.inventory-movements-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c0c 0%, #0f0c0c 100%);
  position: relative;
}

/* Header Section */
.controls-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.header-section {
  padding: 24px;
}

/* Table Styles */
.inventory-table-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.table-header {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  font-weight: bold;
}

.inventory-table {
  background: transparent;
}

.inventory-table .v-data-table__wrapper {
  border-radius: 12px;
  overflow: hidden;
}

.inventory-table tbody tr:hover {
  background-color: rgba(33, 150, 243, 0.08) !important;
}

.inventory-table tbody tr {
  transition: background-color 0.2s ease;
}

/* Typography */
.text-h4 {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>