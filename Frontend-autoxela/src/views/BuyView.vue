<script setup lang="ts">
  import { ref, onMounted, computed, watch } from 'vue'

  // Types - Updated to match API response
  interface PurchaseOrder {
    id: number
    supplier: {
      id: number
      person: {
        cui: string
        nit: string
        firstName: string
        lastName: string
        email: string
        phone: string
        birthDate: string
        createdAt: string
        updatedAt: string
      }
      companyName: string
      contactEmail: string
      contactPhone: string
      isActive: boolean
      createdAt: string
      updatedAt: string
    }
    totalAmount: number
    orderDate: string
    expectedDeliveryDate: string
    actualDeliveryDate?: string
    status: {
      id: number
      name: string
      description: string
      createdAt: string
    }
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
    updatedAt: string
    items: PurchaseOrderItem[]
  }

  interface PurchaseOrderItem {
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
      isActive: boolean
      createdAt: string
      updatedAt: string
    }
    quantityOrdered: number
    quantityReceived: number
    unitPrice: number
    totalPrice: number
    createdAt: string
    isFullyReceived: boolean
  }

  interface Supplier {
    id: number
    person: {
      cui: string
      nit: string
      firstName: string
      lastName: string
      email: string
      phone: string
      birthDate: string
      createdAt: string
      updatedAt: string
    }
    companyName: string
    contactEmail: string
    contactPhone: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  interface Status {
    id: number
    name: string
    description: string
    createdAt: string
  }

  interface Part {
    id: number
    name: string
  }

  interface PartWithDisplay extends Part {
    displayName: string
  }

  interface Filters {
    supplierId?: number
    statusId?: number
    startDate?: string
    endDate?: string
  }

  // Reactive data
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const suppliers = ref<Supplier[]>([])
  const statuses = ref<Status[]>([])
  const parts = ref<Part[]>([])
  const loading = ref(false)
  const totalOrders = ref(0)
  const pageSize = ref(10)
  const currentPage = ref(1)

  // Dialogs
  const showCreateDialog = ref(false)
  const showStatusDialog = ref(false)
  const showReceiveDialog = ref(false)
  const showDetailsDialog = ref(false)

  // Forms
  const createFormValid = ref(false)
  const creating = ref(false)
  const updatingStatus = ref(false)
  const receivingItems = ref(false)
  const completingDelivery = ref(false)

  // Selected items
  const selectedOrder = ref<PurchaseOrder | null>(null)
  const selectedStatusId = ref<number>()

  // Supplier info
  const supplierInfo = ref<Supplier | null>(null)
  const loadingSupplierInfo = ref(false)

  // Filters
  const filters = ref<Filters>({})


  // Options
  const itemsPerPageOptions = [
    { value: 5, title: '5' },
    { value: 10, title: '10' },
    { value: 20, title: '20' },
    { value: 50, title: '50' },
    { value: -1, title: 'Todos' }
  ]

  // New order form
  const newOrder = ref({
    supplierId: null as number | null,
    expectedDeliveryDate: '',
    items: [
      {
        partId: null as number | null,
        quantityOrdered: 1,
        unitPrice: 0.00
      }
    ]
  })

  // API Base URL
  const BASE_URL = 'http://localhost:8080/api/v1'

  // Función para obtener headers de autenticación
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('accessToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const userType = ref<string>('')

  // En la función loadUserData (que debes agregar o modificar):
  const loadUserData = () => {
    const newUserType = localStorage.getItem('userType') || ''
    if (userType.value !== newUserType) userType.value = newUserType
  }

  // Agregar computed properties para verificar roles:
  const isAdmin = computed(() => userType.value === 'Administrador')

  // Table headers - Updated to match API response
  const headers = [
    { title: 'ID', value: 'id', sortable: true },
    { title: 'Proveedor', value: 'supplier.companyName', sortable: true },
    { title: 'Estado', value: 'status.name', sortable: true },
    { title: 'Fecha', value: 'orderDate', sortable: true },
    { title: 'Total', value: 'totalAmount', sortable: true },
    { title: 'Acciones', value: 'actions', sortable: false }
  ]

  const itemHeaders = [
    { title: 'Producto', value: 'part.name' },
    { title: 'Cantidad Ordenada', value: 'quantityOrdered' },
    { title: 'Cantidad Recibida', value: 'quantityReceived' },
    { title: 'Precio Unit.', value: 'unitPrice' },
    { title: 'Total', value: 'totalPrice' }
  ]

  // Computed property for parts with numbers
  const partsWithNumbers = computed((): PartWithDisplay[] => {
    return parts.value.map((part, index) => ({
      ...part,
      displayName: `${index + 1}. ${part.name}`
    }))
  })

  // Watch for supplier ID changes
  watch(() => newOrder.value.supplierId, async (newSupplierId) => {
    if (newSupplierId && newSupplierId > 0) {
      await fetchSupplierInfo(newSupplierId)
    } else {
      supplierInfo.value = null
    }
  })

  // Función para obtener información del proveedor
  const fetchSupplierInfo = async (supplierId: number) => {
    try {
      loadingSupplierInfo.value = true
      const response = await fetch(`${BASE_URL}/inventory/suppliers/${supplierId}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        supplierInfo.value = data
      } else {
        supplierInfo.value = null
      }
    } catch (error) {
      console.error('Error fetching supplier info:', error)
      supplierInfo.value = null
    } finally {
      loadingSupplierInfo.value = false
    }
  }

  // Función para convertir tipos de datos antes de enviar
  const prepareOrderData = (orderData: any) => {
    const prepared = {
      supplierId: parseInt(orderData.supplierId),
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      items: orderData.items
        .filter((item: any) => item.partId && item.quantityOrdered > 0 && item.unitPrice > 0)
        .map((item: any) => ({
          partId: parseInt(item.partId),
          quantityOrdered: parseInt(item.quantityOrdered),
          unitPrice: parseFloat(item.unitPrice)
        }))
    }
    
    console.log('Datos originales:', orderData)
    console.log('Datos preparados:', prepared)
    
    return prepared
  }

  // Methods
  const fetchPurchaseOrders = async () => {
    try {
      loading.value = true
      const page = currentPage.value - 1 // API usa páginas base 0
      const size = pageSize.value === -1 ? 1000 : pageSize.value
      
      let url = `${BASE_URL}/inventory/purchase-orders?page=${page}&size=${size}&sortBy=orderDate&sortDir=desc`
      
      if (filters.value.supplierId) {
        url = `${BASE_URL}/inventory/purchase-orders/supplier/${filters.value.supplierId}?page=${page}&size=${size}`
      } else if (filters.value.statusId) {
        url = `${BASE_URL}/inventory/purchase-orders/status/${filters.value.statusId}?page=${page}&size=${size}`
      } else if (filters.value.startDate && filters.value.endDate) {
        url = `${BASE_URL}/inventory/purchase-orders/date-range?startDate=${filters.value.startDate}&endDate=${filters.value.endDate}&page=${page}&size=${size}`
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        purchaseOrders.value = data.content || data
        totalOrders.value = data.totalElements || data.length
      } else {
        console.error('Error fetching purchase orders:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/inventory/suppliers`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        suppliers.value = data.content || data
      } else {
        console.error('Error fetching suppliers:', response.status)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchStatuses = async () => {
    try {
      // Try to fetch from API first
      const response = await fetch(`${BASE_URL}/inventory/purchase-order-statuses`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        statuses.value = data.content || data
      } else {
        // Fallback to mock data
        const mockStatuses: Status[] = [
          { id: 1, name: 'Pendiente', description: 'Orden creada pero no enviada', createdAt: '2025-08-24T23:08:57.50538' },
          { id: 2, name: 'Aprobado', description: 'Orden aprobada', createdAt: '2025-08-24T23:08:57.50538' },
          { id: 3, name: 'Enviado', description: 'Orden enviada', createdAt: '2025-08-24T23:08:57.50538' },
          { id: 4, name: 'Recibido', description: 'Orden recibida', createdAt: '2025-08-24T23:08:57.50538' },
          { id: 5, name: 'Completado', description: 'Orden completada', createdAt: '2025-08-24T23:08:57.50538' }
        ]
        statuses.value = mockStatuses
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
    }
  }

  const fetchParts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/inventory/parts`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        parts.value = data.content || data
      } else {
        // Fallback to mock data
        const mockParts: Part[] = [
          { id: 1, name: 'Filtro de aceite' },
          { id: 2, name: 'Filtro de aire' },
          { id: 3, name: 'Filtro de combustible' },
          { id: 4, name: 'Filtro de cabina' },
          { id: 5, name: 'Aceite de motor 5w30' },
          { id: 6, name: 'Aceite de motor 10w40' },
          { id: 7, name: 'Líquido de frenos' },
          { id: 8, name: 'Refrigerante' },
          { id: 9, name: 'Pastillas de freno delanteras' },
          { id: 10, name: 'Pastillas de freno traseras' },
          { id: 11, name: 'Discos de freno delanteros' },
          { id: 12, name: 'Discos de freno traseros' },
          { id: 13, name: 'Bujías' },
          { id: 14, name: 'Correa de distribución' },
          { id: 15, name: 'Bomba de agua' },
          { id: 16, name: 'Termostato' },
          { id: 17, name: 'Batería' },
          { id: 18, name: 'Alternador' },
          { id: 19, name: 'Motor de arranque' },
          { id: 20, name: 'Fusibles' },
          { id: 21, name: 'Amortiguadores delanteros' },
          { id: 22, name: 'Amortiguadores traseros' },
          { id: 23, name: 'Resortes delanteros' },
          { id: 24, name: 'Resortes traseros' }
        ]
        parts.value = mockParts
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
    }
  }

  const createPurchaseOrder = async () => {
    if (creating.value) return // Prevent multiple submissions
    
    try {
      creating.value = true
      
      // Validar que todos los campos requeridos estén completos
      if (!newOrder.value.supplierId || newOrder.value.supplierId <= 0) {
        alert('Por favor, ingresa un ID de proveedor válido')
        return
      }

      if (!newOrder.value.expectedDeliveryDate) {
        alert('Por favor, selecciona una fecha de entrega esperada')
        return
      }
      
      // Validar que haya al menos un item válido
      const validItems = newOrder.value.items.filter(item => 
        item.partId && item.quantityOrdered > 0 && item.unitPrice > 0
      )
      
      if (validItems.length === 0) {
        alert('Por favor, agrega al menos un item válido con todos los campos completos')
        return
      }
      
      // Preparar datos con conversión de tipos
      const orderData = prepareOrderData(newOrder.value)
      console.log('=== DATOS A ENVIAR ===')
      console.log('URL:', `${BASE_URL}/inventory/purchase-orders`)
      console.log('Headers:', getAuthHeaders())
      console.log('Body:', JSON.stringify(orderData, null, 2))

      const response = await fetch(`${BASE_URL}/inventory/purchase-orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      })
      
      console.log('=== RESPUESTA DEL SERVIDOR ===')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Respuesta exitosa:', responseData)
        alert('¡Orden de compra creada exitosamente!')
        await fetchPurchaseOrders()
        closeCreateDialog()
      } else {
        const errorData = await response.text()
        console.error('Error en la respuesta:')
        console.error('Status:', response.status)
        console.error('Response:', errorData)
        
        // Intentar parsear como JSON si es posible
        try {
          const errorJson = JSON.parse(errorData)
          console.error('Error JSON:', errorJson)
          alert(`Error ${response.status}: ${errorJson.message || errorJson.error || 'Error desconocido'}`)
        } catch {
          alert(`Error ${response.status}: ${errorData || 'Error desconocido'}`)
        }
      }
    } catch (error) {
      console.error('Error de conexión:', error)
      alert(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      creating.value = false
    }
  }

  const updateStatus = (order: PurchaseOrder) => {
    selectedOrder.value = order
    selectedStatusId.value = undefined
    showStatusDialog.value = true
  }

  const confirmUpdateStatus = async () => {
    if (!selectedOrder.value || !selectedStatusId.value || updatingStatus.value) return
    
    try {
      updatingStatus.value = true
      
      const response = await fetch(
        `${BASE_URL}/inventory/purchase-orders/${selectedOrder.value.id}/status/${selectedStatusId.value}`,
        {
          method: 'PUT',
          headers: getAuthHeaders()
        }
      )
      
      if (response.ok) {
        await fetchPurchaseOrders()
        showStatusDialog.value = false
        alert('Estado actualizado exitosamente')
      } else {
        alert('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error de conexión al actualizar el estado')
    } finally {
      updatingStatus.value = false
    }
  }

  const receiveItems = (order: PurchaseOrder) => {
    selectedOrder.value = { ...order }
    selectedOrder.value.items = selectedOrder.value.items.map(item => ({
      ...item,
      quantityReceived: item.quantityReceived || 0
    }))
    showReceiveDialog.value = true
  }

  const confirmReceiveItems = async () => {
    if (!selectedOrder.value || receivingItems.value) return
    
    try {
      receivingItems.value = true
      
      for (const item of selectedOrder.value.items) {
        if (item.quantityReceived && item.quantityReceived > 0) {
          const response = await fetch(
            `${BASE_URL}/inventory/purchase-orders/${selectedOrder.value.id}/items/${item.id}/receive?quantityReceived=${item.quantityReceived}`,
            {
              method: 'POST',
              headers: getAuthHeaders()
            }
          )
          
          if (!response.ok) {
            console.error('Error receiving item:', item.id)
          }
        }
      }
      
      await fetchPurchaseOrders()
      showReceiveDialog.value = false
      alert('Items recibidos exitosamente')
    } catch (error) {
      console.error('Error receiving items:', error)
      alert('Error al recibir los items')
    } finally {
      receivingItems.value = false
    }
  }

  const completeDelivery = async () => {
    if (!selectedOrder.value || completingDelivery.value) return
    
    try {
      completingDelivery.value = true
      
      const response = await fetch(
        `${BASE_URL}/inventory/purchase-orders/${selectedOrder.value.id}/complete-delivery`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      )
      
      if (response.ok) {
        await fetchPurchaseOrders()
        showReceiveDialog.value = false
        alert('Entrega completada exitosamente')
      } else {
        alert('Error al completar la entrega')
      }
    } catch (error) {
      console.error('Error completing delivery:', error)
      alert('Error al completar la entrega')
    } finally {
      completingDelivery.value = false
    }
  }

  const viewOrder = (order: PurchaseOrder) => {
    selectedOrder.value = order
    showDetailsDialog.value = true
  }

  const addItem = () => {
    newOrder.value.items.push({
      partId: null,
      quantityOrdered: 1,
      unitPrice: 0.00
    })
  }

  const removeItem = (index: number) => {
    if (newOrder.value.items.length > 1) {
      newOrder.value.items.splice(index, 1)
    }
  }

  const closeCreateDialog = () => {
    if (creating.value) return // Prevent closing while creating
    
    showCreateDialog.value = false
    supplierInfo.value = null
    newOrder.value = {
      supplierId: null,
      expectedDeliveryDate: '',
      items: [
        {
          partId: null,
          quantityOrdered: 1,
          unitPrice: 0.00
        }
      ]
    }
  }

  const resetReceiveForm = () => {
    selectedOrder.value = null
  }

  const applyFilters = () => {
    currentPage.value = 1
    fetchPurchaseOrders()
  }

  const clearFilters = () => {
    filters.value = {}
    currentPage.value = 1
    fetchPurchaseOrders()
  }

  const updateTable = (page: number) => {
    currentPage.value = page
    fetchPurchaseOrders()
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    pageSize.value = itemsPerPage
    currentPage.value = 1
    fetchPurchaseOrders()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pendiente': 'orange',
      'Aprobado': 'blue',
      'Enviado': 'purple',
      'Recibido': 'green',
      'Completado': 'success'
    }
    return colors[status] || 'grey'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'Pendiente': 'mdi-clock',
      'Aprobado': 'mdi-check-circle',
      'Enviado': 'mdi-truck',
      'Recibido': 'mdi-package-down',
      'Completado': 'mdi-check-all'
    }
    return icons[status] || 'mdi-help-circle'
  }

  // Lifecycle
  onMounted(() => {
    loadUserData()
    
    window.addEventListener('user-logged-in', loadUserData)
    window.addEventListener('user-logged-out', loadUserData)
    
    window.addEventListener('storage', (event) => {
      if (event.key === 'userType') {
        loadUserData()
      }
    })
    fetchPurchaseOrders()
    fetchSuppliers()
    fetchStatuses()
    fetchParts()
  })
</script>

<template>
  <v-app>
    <div class="purchase-orders-container">
      <!-- Floating Icons Background -->
      <div class="floating-icons">
        <v-icon class="floating-icon" size="48">mdi-package-variant</v-icon>
        <v-icon class="floating-icon" size="32">mdi-truck-delivery</v-icon>
        <v-icon class="floating-icon" size="40">mdi-clipboard-list</v-icon>
        <v-icon class="floating-icon" size="36">mdi-store</v-icon>
        <v-icon class="floating-icon" size="44">mdi-chart-line</v-icon>
        <v-icon class="floating-icon" size="28">mdi-file-document</v-icon>
      </div>

      <v-container fluid class="pa-6">
        <!-- Header Section -->
        <v-row class="mb-4">
          <v-col cols="12">
            <v-card class="controls-card elevation-8" rounded="lg">
              <div class="header-section">
                <div class="d-flex align-center mb-4">
                  <v-icon size="48" class="mr-4" color="orange darken-2">
                    mdi-package-variant
                  </v-icon>
                  <div>
                    <h1 class="text-h4 font-weight-bold">Gestión de Órdenes de Compra</h1>
                    <p class="text-subtitle1 grey--text">Taller AutoXela - API Connected</p>
                  </div>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="isAdmin"
                    class="custom-btn"
                    @click="showCreateDialog = true"
                    :disabled="creating"
                  >
                    <v-icon left>mdi-plus</v-icon>
                    Nueva Orden
                  </v-btn>
                </div>

                <v-card-text>
                  <v-row align="center">
                    <v-col cols="12" md="3">
                      <v-select
                        v-model="filters.supplierId"
                        :items="suppliers"
                        item-title="companyName"
                        item-value="id"
                        label="Filtrar por Proveedor"
                        outlined
                        dense
                        clearable
                        prepend-inner-icon="mdi-store"
                        hint="Seleccionar proveedor"
                        persistent-hint
                        @update:model-value="applyFilters"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-select
                        v-model="filters.statusId"
                        :items="statuses"
                        item-title="name"
                        item-value="id"
                        label="Filtrar por Estado"
                        outlined
                        dense
                        clearable
                        prepend-inner-icon="mdi-timeline"
                        hint="Seleccionar estado"
                        persistent-hint
                        @update:model-value="applyFilters"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-text-field
                        v-model="filters.startDate"
                        type="date"
                        label="Fecha Inicio"
                        outlined
                        dense
                        prepend-inner-icon="mdi-calendar-start"
                        hint="Fecha desde"
                        persistent-hint
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2">
                      <v-text-field
                        v-model="filters.endDate"
                        type="date"
                        label="Fecha Fin"
                        outlined
                        dense
                        prepend-inner-icon="mdi-calendar-end"
                        hint="Fecha hasta"
                        persistent-hint
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2">
                      <div class="d-flex">
                        <v-btn 
                          color="primary" 
                          @click="applyFilters"
                          class="mr-2"
                          outlined
                        >
                          <v-icon>mdi-magnify</v-icon>
                        </v-btn>
                        <v-btn 
                          color="grey" 
                          @click="clearFilters"
                          outlined
                        >
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Purchase Orders Table -->
        <v-row>
          <v-col cols="12">
            <v-card class="inventory-table-card elevation-12" rounded="lg">
              <v-card-title class="table-header">
                <v-icon left color="white">mdi-format-list-bulleted</v-icon>
                Listado de Órdenes de Compra ({{ totalOrders }} elementos)
              </v-card-title>

              <v-data-table
                :headers="headers"
                :items="purchaseOrders"
                :loading="loading"
                class="inventory-table"
                :items-per-page="pageSize"
                :items-per-page-options="itemsPerPageOptions"
                :server-items-length="totalOrders"
                :page="currentPage"
                @update:page="updateTable"
                @update:items-per-page="handleItemsPerPageChange"
                loading-text="Cargando órdenes..."
                no-data-text="No hay órdenes disponibles"
                :items-per-page-text="'Elementos por página:'"
                :page-text="'{0}-{1} de {2}'"
              >
                <!-- Status Column -->
                <template v-slot:[`item.status.name`]="{ item }">
                  <v-chip :color="getStatusColor(item.status.name)" text-color="white" small>
                    <v-icon left small>{{ getStatusIcon(item.status.name) }}</v-icon>
                    {{ item.status.name }}
                  </v-chip>
                </template>

                <!-- Total Column -->
                <template v-slot:[`item.totalAmount`]="{ item }">
                  Q{{ item.totalAmount.toFixed(2) }}
                </template>

                <!-- Actions Column -->
                <template v-slot:[`item.actions`]="{ item }">
                  <v-btn icon small color="blue" @click="viewOrder(item)" class="mr-1">
                    <v-icon small>mdi-eye</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="isAdmin"
                    icon
                    small
                    color="orange"
                    @click="updateStatus(item)"
                    class="mr-1"
                  >
                    <v-icon small>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="isAdmin && item.status.name !== 'Completado'"
                    icon
                    small
                    color="green"
                    @click="receiveItems(item)"
                  >
                    <v-icon small>mdi-truck-check</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Create Purchase Order Dialog -->
      <v-dialog v-model="showCreateDialog" max-width="900px" persistent>
        <v-card>
          <v-card-title class="dialog-header">
            <v-icon left color="white">mdi-plus-circle</v-icon>
            Crear Nueva Orden de Compra
          </v-card-title>
          <v-card-text class="pt-4">
            <v-form ref="createForm" v-model="createFormValid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="newOrder.supplierId"
                    type="number"
                    label="ID Proveedor *"
                    :rules="[v => !!v || 'ID Proveedor es requerido', v => v > 0 || 'Debe ser mayor a 0']"
                    outlined
                    dense
                    prepend-inner-icon="mdi-store"
                    hint="Ingresa el número de ID del proveedor"
                    persistent-hint
                    min="1"
                    :loading="loadingSupplierInfo"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newOrder.expectedDeliveryDate"
                    type="date"
                    label="Fecha de Entrega Esperada *"
                    :rules="[v => !!v || 'Fecha de entrega es requerida']"
                    outlined
                    dense
                    prepend-inner-icon="mdi-calendar-check"
                    hint="Selecciona la fecha esperada de entrega"
                    persistent-hint
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <!-- Supplier Info Display -->
              <div v-if="supplierInfo" class="mb-4">
                <v-alert type="info" outlined>
                  <div class="supplier-info">
                    <h4 class="mb-2">{{ supplierInfo.companyName }}</h4>
                    <v-row>
                      <v-col cols="12" md="6">
                        <p><strong>Contacto:</strong> {{ supplierInfo.person.firstName }} {{ supplierInfo.person.lastName }}</p>
                        <p><strong>Email:</strong> {{ supplierInfo.contactEmail }}</p>
                        <p><strong>Teléfono:</strong> {{ supplierInfo.contactPhone }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <p><strong>CUI:</strong> {{ supplierInfo.person.cui }}</p>
                        <p><strong>NIT:</strong> {{ supplierInfo.person.nit }}</p>
                        <p><strong>Estado:</strong> 
                          <v-chip :color="supplierInfo.isActive ? 'success' : 'error'" text-color="white" small>
                            {{ supplierInfo.isActive ? 'Activo' : 'Inactivo' }}
                          </v-chip>
                        </p>
                      </v-col>
                    </v-row>
                  </div>
                </v-alert>
              </div>

              <div v-else-if="newOrder.supplierId && loadingSupplierInfo" class="mb-4">
                <v-skeleton-loader type="card"></v-skeleton-loader>
              </div>

              <div v-else-if="newOrder.supplierId && !loadingSupplierInfo && !supplierInfo" class="mb-4">
                <v-alert type="warning" outlined>
                  <v-icon left>mdi-alert</v-icon>
                  No se encontró información para el proveedor con ID {{ newOrder.supplierId }}
                </v-alert>
              </div>
              
              <!-- Items Section -->
              <v-divider class="my-4"></v-divider>
              <h3 class="mb-3">Items de la Orden</h3>
              
              <div v-for="(item, index) in newOrder.items" :key="index" class="mb-4">
                <v-card variant="outlined" class="pa-3">
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="item.partId"
                        :items="partsWithNumbers"
                        item-title="displayName"
                        item-value="id"
                        label="Producto *"
                        :rules="[v => !!v || 'Producto es requerido']"
                        outlined
                        dense
                        prepend-inner-icon="mdi-package"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model.number="item.quantityOrdered"
                        type="number"
                        label="Cantidad Ordenada *"
                        :rules="[v => !!v || 'Cantidad es requerida', v => v > 0 || 'Debe ser mayor a 0']"
                        outlined
                        dense
                        prepend-inner-icon="mdi-counter"
                        min="1"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field
                        v-model.number="item.unitPrice"
                        type="number"
                        step="0.01"
                        label="Precio Unitario *"
                        :rules="[v => !!v || 'Precio es requerido', v => v > 0 || 'Debe ser mayor a 0']"
                        outlined
                        dense
                        prepend-inner-icon="mdi-currency-usd"
                        min="0.01"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2" class="d-flex align-center">
                      <div class="text-center">
                        <div class="text-subtitle2 mb-1">Total</div>
                        <div class="text-h6 font-weight-bold">
                          Q{{ ((item.quantityOrdered || 0) * (item.unitPrice || 0)).toFixed(2) }}
                        </div>
                        <v-btn
                          icon
                          small
                          color="red"
                          @click="removeItem(index)"
                          :disabled="newOrder.items.length === 1"
                          class="mt-2"
                        >
                          <v-icon small>mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </v-card>
              </div>
              
              <v-btn
                color="primary"
                outlined
                @click="addItem"
                class="mb-4"
              >
                <v-icon left>mdi-plus</v-icon>
                Agregar Item
              </v-btn>

              <!-- Order Summary -->
              <v-divider class="my-4"></v-divider>
              <v-card variant="outlined" class="pa-3">
                <h4 class="mb-2">Resumen de la Orden</h4>
                <v-row>
                  <v-col cols="12" md="6">
                    <p><strong>Total de Items:</strong> {{ newOrder.items.length }}</p>
                    <p><strong>Items Válidos:</strong> {{ newOrder.items.filter(item => item.partId && item.quantityOrdered > 0 && item.unitPrice > 0).length }}</p>
                  </v-col>
                  <v-col cols="12" md="6" class="text-right">
                    <div class="text-h5 font-weight-bold">
                      Total: Q{{ newOrder.items.reduce((sum, item) => sum + ((item.quantityOrdered || 0) * (item.unitPrice || 0)), 0).toFixed(2) }}
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeCreateDialog" :disabled="creating">
              Cancelar
            </v-btn>
            <v-btn
              class="custom-btn"
              :loading="creating"
              :disabled="!createFormValid || creating"
              @click="createPurchaseOrder"
            >
              <v-icon left>mdi-check</v-icon>
              Crear Orden
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Update Status Dialog -->
      <v-dialog v-model="showStatusDialog" max-width="500px" persistent>
        <v-card>
          <v-card-title class="dialog-header">
            <v-icon left color="white">mdi-timeline</v-icon>
            Actualizar Estado
          </v-card-title>
          <v-card-text class="pt-4">
            <div v-if="selectedOrder" class="mb-4">
              <v-alert type="info" outlined>
                <strong>Orden seleccionada:</strong> #{{ selectedOrder.id }}
                <br>
                <strong>Proveedor:</strong> {{ selectedOrder.supplier.companyName }}
                <br>
                <strong>Estado actual:</strong> {{ selectedOrder.status.name }}
              </v-alert>
            </div>
            
            <v-select
              v-model="selectedStatusId"
              :items="statuses"
              item-title="name"
              item-value="id"
              label="Nuevo Estado"
              outlined
              dense
              prepend-inner-icon="mdi-timeline"
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showStatusDialog = false" :disabled="updatingStatus">
              Cancelar
            </v-btn>
            <v-btn
              class="custom-btn"
              :loading="updatingStatus"
              :disabled="!selectedStatusId || updatingStatus"
              @click="confirmUpdateStatus"
            >
              <v-icon left>mdi-check</v-icon>
              Actualizar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Receive Items Dialog -->
      <v-dialog v-model="showReceiveDialog" max-width="700px" persistent>
        <v-card>
          <v-card-title class="dialog-header">
            <v-icon left color="white">mdi-truck-check</v-icon>
            Recibir Items
          </v-card-title>
          <v-card-text class="pt-4">
            <div v-if="selectedOrder" class="mb-4">
              <v-alert type="info" outlined>
                <strong>Orden #{{ selectedOrder.id }}</strong>
                <br>
                <strong>Proveedor:</strong> {{ selectedOrder.supplier.companyName }}
                <br>
                <strong>Estado:</strong> {{ selectedOrder.status.name }}
                <br>
                <strong>Fecha de Entrega Esperada:</strong> {{ selectedOrder.expectedDeliveryDate }}
              </v-alert>
            </div>
            
            <div v-if="selectedOrder">
              <h4 class="mb-3">Items de la Orden</h4>
              <div v-for="item in selectedOrder.items" :key="item.id" class="mb-3">
                <v-card variant="outlined" class="pa-3">
                  <v-row align="center">
                    <v-col cols="12" md="6">
                      <div>
                        <strong>{{ item.part.name }}</strong><br>
                        <small class="grey--text">Cantidad ordenada: {{ item.quantityOrdered }}</small><br>
                        <small class="grey--text">Cantidad recibida: {{ item.quantityReceived }}</small><br>
                        <small class="grey--text">Precio unitario: Q{{ item.unitPrice }}</small>
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model.number="item.quantityReceived"
                        type="number"
                        :max="item.quantityOrdered"
                        label="Cantidad a Recibir"
                        outlined
                        dense
                        prepend-inner-icon="mdi-package-down"
                        min="0"
                        :disabled="item.isFullyReceived"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card>
              </div>
              
              <v-btn
                class="export-btn mt-4"
                @click="completeDelivery"
                :loading="completingDelivery"
                :disabled="completingDelivery || receivingItems"
                block
              >
                <v-icon left>mdi-check-all</v-icon>
                Completar Entrega Total
              </v-btn>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showReceiveDialog = false; resetReceiveForm()" :disabled="receivingItems || completingDelivery">
              Cancelar
            </v-btn>
            <v-btn
              class="custom-btn"
              :loading="receivingItems"
              :disabled="receivingItems || completingDelivery"
              @click="confirmReceiveItems"
            >
              <v-icon left>mdi-check</v-icon>
              Recibir Items
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- View Order Details Dialog -->
      <v-dialog v-model="showDetailsDialog" max-width="900px">
        <v-card>
          <v-card-title class="dialog-header">
            <v-icon left color="white">mdi-eye</v-icon>
            Detalles de la Orden #{{ selectedOrder?.id }}
          </v-card-title>
          <v-card-text class="pt-4" v-if="selectedOrder">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3 mb-3">
                  <h4 class="mb-2">Información General</h4>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title><strong>ID:</strong> {{ selectedOrder.id }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title><strong>Proveedor:</strong> {{ selectedOrder.supplier.companyName }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title><strong>Estado:</strong> 
                        <v-chip :color="getStatusColor(selectedOrder.status.name)" text-color="white" small class="ml-2">
                          {{ selectedOrder.status.name }}
                        </v-chip>
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title><strong>Fecha de Orden:</strong> {{ selectedOrder.orderDate }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title><strong>Fecha de Entrega Esperada:</strong> {{ selectedOrder.expectedDeliveryDate }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item v-if="selectedOrder.actualDeliveryDate">
                      <v-list-item-title><strong>Fecha de Entrega Real:</strong> {{ selectedOrder.actualDeliveryDate }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3 mb-3">
                  <h4 class="mb-2">Información Financiera</h4>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title><strong>Total:</strong> Q{{ selectedOrder.totalAmount.toFixed(2) }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title><strong>Items:</strong> {{ selectedOrder.items.length }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title><strong>Creado por:</strong> {{ selectedOrder.createdBy.firstName }} {{ selectedOrder.createdBy.lastName }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
            </v-row>
            
            <v-divider class="my-4"></v-divider>
            
            <h4 class="mb-3">Items de la Orden</h4>
            <v-data-table
              :headers="itemHeaders"
              :items="selectedOrder.items"
              class="inventory-table"
              density="compact"
              :items-per-page="10"
              no-data-text="No hay items"
            >
              <template v-slot:[`item.unitPrice`]="{ item }">
                Q{{ item.unitPrice.toFixed(2) }}
              </template>
              <template v-slot:[`item.totalPrice`]="{ item }">
                Q{{ item.totalPrice.toFixed(2) }}
              </template>
              <template v-slot:[`item.isFullyReceived`]="{ item }">
                <v-chip :color="item.isFullyReceived ? 'success' : 'warning'" text-color="white" small>
                  {{ item.isFullyReceived ? 'Completo' : 'Pendiente' }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              class="custom-btn"
              @click="showDetailsDialog = false"
            >
              <v-icon left>mdi-close</v-icon>
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-app>
</template>

<style scoped>
.purchase-orders-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.purchase-orders-container::before {
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

.floating-icon:nth-child(6) {
  top: 60%;
  right: 30%;
  animation-delay: 5s;
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
  transition: all 0.3s ease;
}

.controls-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
}

.inventory-table-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.inventory-table-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
}

.table-header {
  background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
  color: white !important;
  font-weight: bold;
}

.dialog-header {
  background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
  color: white !important;
  font-weight: bold;
}

.workshop-badge {
  background: linear-gradient(45deg, #424242, #616161);
  color: white;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
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

.export-btn {
  background: linear-gradient(45deg, #424242, #616161) !important;
  color: white !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border-radius: 20px !important;
}

.export-btn:hover {
  background: linear-gradient(45deg, #616161, #424242) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 66, 66, 0.3) !important;
}

.inventory-table {
  position: relative;
  z-index: 2;
}

.inventory-table :deep(.v-data-table-header) {
  background: linear-gradient(45deg, #f5f5f5, #e0e0e0) !important;
}

.inventory-table :deep(tbody tr:hover) {
  background-color: rgba(255, 107, 53, 0.1) !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .purchase-orders-container {
    padding: 8px;
  }

  .header-section {
    padding: 16px;
  }

  .header-section h1 {
    font-size: 1.5rem !important;
  }

  .custom-btn,
  .export-btn {
    width: 100%;
    margin-bottom: 8px;
  }

  .workshop-badge {
    font-size: 10px !important;
    padding: 6px 12px !important;
  }
}

@media (max-width: 600px) {
  .inventory-table :deep(.v-data-table) {
    font-size: 12px;
  }

  .inventory-table :deep(.v-data-table__wrapper) {
    overflow-x: auto;
  }
}
</style>