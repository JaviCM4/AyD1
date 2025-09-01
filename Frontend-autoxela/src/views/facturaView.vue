<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// Interfaces para tipado
interface Client {
    firstName: string
    lastName: string
    cui?: string
}

interface Vehicle {
    id: number
    licensePlate: string
    owner: Client
}

interface Work {
    id: number
    vehicle: Vehicle
    description?: string
    totalAmount?: number
}

interface PaymentStatus {
    id: number
    name: string
}

interface PaymentMethod {
    id: number
    name: string
}

interface User {
    firstName: string
    lastName: string
}

interface Invoice {
    id: number
    invoiceNumber: string
    work: Work
    subtotal: number
    tax: number
    totalAmount: number
    paymentStatus: PaymentStatus
    issuedDate: string
    dueDate: string
    notes?: string
    createdBy: User
    createdAt: string
}

interface Payment {
    id: number
    invoice: {
        id: number
        invoiceNumber: string
        totalAmount: number
    }
    paymentMethod: PaymentMethod
    amount: number
    referenceNumber?: string
    paymentDate: string
    notes?: string
    createdBy: User
    createdAt: string
}

interface NewInvoice {
    workId: number | null
    paymentMethodId: number | null
    notes: string
    dueDate: string
}

interface NewPayment {
    invoiceId: number | null
    paymentMethodId: number | null
    amount: number
    referenceNumber: string
    notes: string
}

interface ApiResponse<T> {
    content: T[]
    totalElements: number
}

interface SelectOption {
    value: number
    title: string
}

// Elementos reactivos
const searchQuery = ref<string>('')
const searchByInvoiceNumber = ref<string>('')
const selectedStatus = ref<string | null>(null)
const selectedClient = ref<string | null>(null)
const showInvoiceDialog = ref<boolean>(false)
const showPaymentDialog = ref<boolean>(false)
const showPaymentsViewDialog = ref<boolean>(false)
const loading = ref<boolean>(false)
const invoices = ref<Invoice[]>([])
const payments = ref<Payment[]>([])
const availableWorks = ref<SelectOption[]>([])
const paymentMethods = ref<SelectOption[]>([])
const paymentStatuses = ref<SelectOption[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const totalElements = ref<number>(0)
const sortBy = ref<string>('createdAt')
const sortDir = ref<string>('desc')
const selectedInvoice = ref<Invoice | null>(null)
const startDate = ref<string>('')
const endDate = ref<string>('')

// Opciones de paginación
const itemsPerPageOptions = [
    { value: 5, title: '5' },
    { value: 10, title: '10' },
    { value: 20, title: '20' },
    { value: 50, title: '50' },
    { value: -1, title: 'Todos' }
]

// Estados de pago predeterminados
const defaultPaymentStatuses = [
    { value: 'PENDIENTE', title: 'Pendiente' },
    { value: 'PARCIAL', title: 'Pago Parcial' },
    { value: 'PAGADO', title: 'Pagado' },
    { value: 'VENCIDO', title: 'Vencido' }
]

// Métodos de pago predeterminados
const defaultPaymentMethods = [
    { value: 1, title: 'Efectivo' },
    { value: 2, title: 'Tarjeta de Crédito' },
    { value: 3, title: 'Tarjeta de Débito' },
    { value: 4, title: 'Transferencia Bancaria' },
    { value: 5, title: 'Cheque' }
]

const newInvoice = reactive<NewInvoice>({
    workId: null,
    paymentMethodId: null,
    notes: '',
    dueDate: ''
})

const newPayment = reactive<NewPayment>({
    invoiceId: null,
    paymentMethodId: null,
    amount: 0,
    referenceNumber: '',
    notes: ''
})

// URL base de la API
const API_BASE = 'http://localhost:8080/api/v1'

// Función para obtener headers de autenticación
const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('accessToken')
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}

// Función para formatear fechas
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

// Función para formatear fecha y hora
const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Funciones de API
const fetchAllInvoices = async (): Promise<void> => {
    loading.value = true
    try {
        const page = currentPage.value - 1
        const size = pageSize.value === -1 ? 1000 : pageSize.value
        
        const response = await fetch(
            `${API_BASE}/invoices?page=${page}&size=${size}&sortBy=${sortBy.value}&sortDir=${sortDir.value}`,
            {
                headers: getAuthHeaders()
            }
        )
        const data: ApiResponse<Invoice> = await response.json()
        
        if (data.content) {
            invoices.value = data.content
            totalElements.value = data.totalElements || 0
        }
    } catch (error) {
        console.error('Error fetching invoices:', error)
    } finally {
        loading.value = false
    }
}

const searchInvoices = async (searchTerm: string): Promise<void> => {
    if (!searchTerm.trim()) {
        await fetchAllInvoices()
        return
    }
    
    loading.value = true
    try {
        const page = currentPage.value - 1
        const size = pageSize.value === -1 ? 1000 : pageSize.value
        
        // Buscar por cliente (CUI)
        const response = await fetch(
            `${API_BASE}/invoices/client/${encodeURIComponent(searchTerm)}?page=${page}&size=${size}`,
            {
                headers: getAuthHeaders()
            }
        )
        const data: ApiResponse<Invoice> = await response.json()
        
        if (data.content) {
            invoices.value = data.content
            totalElements.value = data.totalElements || 0
        }
    } catch (error) {
        console.error('Error searching invoices:', error)
    } finally {
        loading.value = false
    }
}

const fetchInvoicesByStatus = async (status: string): Promise<void> => {
    if (!status) {
        await fetchAllInvoices()
        return
    }
    
    loading.value = true
    try {
        const page = currentPage.value - 1
        const size = pageSize.value === -1 ? 1000 : pageSize.value
        
        const response = await fetch(
            `${API_BASE}/invoices/status/${status}?page=${page}&size=${size}`,
            {
                headers: getAuthHeaders()
            }
        )
        const data: ApiResponse<Invoice> = await response.json()
        
        if (data.content) {
            invoices.value = data.content
            totalElements.value = data.totalElements || 0
        }
    } catch (error) {
        console.error('Error fetching invoices by status:', error)
    } finally {
        loading.value = false
    }
}

const fetchInvoicesByDateRange = async (): Promise<void> => {
    if (!startDate.value || !endDate.value) {
        await fetchAllInvoices()
        return
    }
    
    loading.value = true
    try {
        const page = currentPage.value - 1
        const size = pageSize.value === -1 ? 1000 : pageSize.value
        
        const response = await fetch(
            `${API_BASE}/invoices/date-range?startDate=${startDate.value}&endDate=${endDate.value}&page=${page}&size=${size}`,
            {
                headers: getAuthHeaders()
            }
        )
        const data: ApiResponse<Invoice> = await response.json()
        
        if (data.content) {
            invoices.value = data.content
            totalElements.value = data.totalElements || 0
        }
    } catch (error) {
        console.error('Error fetching invoices by date range:', error)
    } finally {
        loading.value = false
    }
}

const fetchAvailableWorks = async (): Promise<void> => {
    try {
        // Esta sería la llamada para obtener trabajos disponibles para facturar
        const response = await fetch(`${API_BASE}/works/available-for-invoice`, {
            headers: getAuthHeaders()
        })
        const data: Work[] = await response.json()
        
        availableWorks.value = data.map(work => ({
            value: work.id,
            title: `Trabajo #${work.id} - ${work.vehicle.licensePlate} (${work.vehicle.owner.firstName} ${work.vehicle.owner.lastName})`
        }))
    } catch (error) {
        console.error('Error fetching available works:', error)
        // Datos de ejemplo si no se puede conectar
        availableWorks.value = [
            { value: 1, title: 'Trabajo #1 - P123ABC (Diego Maldonado)' },
            { value: 2, title: 'Trabajo #2 - P456DEF (María García)' },
            { value: 3, title: 'Trabajo #3 - P789GHI (Carlos López)' }
        ]
    }
}

const fetchPaymentsByInvoice = async (invoiceId: number): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE}/payments/invoice/${invoiceId}`, {
            headers: getAuthHeaders()
        })
        const data: Payment[] = await response.json()
        payments.value = data
    } catch (error) {
        console.error('Error fetching payments:', error)
    }
}

// Función para crear factura
const createInvoice = async (): Promise<void> => {
    if (!newInvoice.workId || !newInvoice.paymentMethodId || !newInvoice.dueDate) {
        console.error('Datos incompletos para crear factura')
        return
    }

    try {
        const response = await fetch(`${API_BASE}/invoices`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newInvoice)
        })
        
        if (response.ok) {
            console.log('Factura creada exitosamente')
            showInvoiceDialog.value = false
            resetInvoiceForm()
            await fetchAllInvoices()
        } else {
            const errorText = await response.text()
            console.error('Error al crear factura:', errorText)
        }
    } catch (error) {
        console.error('Error creating invoice:', error)
    }
}

// Función para crear pago
const createPayment = async (): Promise<void> => {
    if (!newPayment.invoiceId || !newPayment.paymentMethodId || newPayment.amount <= 0) {
        console.error('Datos incompletos para crear pago')
        return
    }

    try {
        const response = await fetch(`${API_BASE}/payments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newPayment)
        })
        
        if (response.ok) {
            console.log('Pago creado exitosamente')
            showPaymentDialog.value = false
            resetPaymentForm()
            await fetchAllInvoices()
            if (selectedInvoice.value) {
                await fetchPaymentsByInvoice(selectedInvoice.value.id)
            }
        } else {
            const errorText = await response.text()
            console.error('Error al crear pago:', errorText)
        }
    } catch (error) {
        console.error('Error creating payment:', error)
    }
}

// Funciones de reseteo de formularios
const resetInvoiceForm = (): void => {
    newInvoice.workId = null
    newInvoice.paymentMethodId = null
    newInvoice.notes = ''
    newInvoice.dueDate = ''
}

const resetPaymentForm = (): void => {
    newPayment.invoiceId = null
    newPayment.paymentMethodId = null
    newPayment.amount = 0
    newPayment.referenceNumber = ''
    newPayment.notes = ''
}

// Funciones de manejo de filtros
const handleStatusFilter = (): void => {
    currentPage.value = 1
    if (selectedStatus.value) {
        fetchInvoicesByStatus(selectedStatus.value)
    } else if (searchQuery.value.trim()) {
        searchInvoices(searchQuery.value)
    } else {
        fetchAllInvoices()
    }
}

const handleDateRangeFilter = (): void => {
    currentPage.value = 1
    fetchInvoicesByDateRange()
}

const handleTextSearchInput = (): void => {
    if (searchQuery.value.trim()) {
        searchByInvoiceNumber.value = ''
    }
}

const handleInvoiceNumberSearchInput = (): void => {
    if (searchByInvoiceNumber.value.trim()) {
        searchQuery.value = ''
    }
}

// Función unificada de búsqueda
const handleUnifiedSearch = (): void => {
    currentPage.value = 1
    
    if (searchQuery.value.trim()) {
        searchInvoices(searchQuery.value)
    } else if (searchByInvoiceNumber.value.trim()) {
        // Buscar por número de factura (implementar si es necesario)
        fetchAllInvoices()
    } else {
        if (selectedStatus.value) {
            fetchInvoicesByStatus(selectedStatus.value)
        } else {
            fetchAllInvoices()
        }
    }
}

const clearAllSearches = (): void => {
    searchQuery.value = ''
    searchByInvoiceNumber.value = ''
    selectedStatus.value = null
    selectedClient.value = null
    startDate.value = ''
    endDate.value = ''
    fetchAllInvoices()
}

// Computed para verificar si hay alguna búsqueda activa
const hasActiveSearch = computed((): boolean => {
    return searchQuery.value.trim() !== '' || 
           searchByInvoiceNumber.value.trim() !== '' || 
           startDate.value !== '' || 
           endDate.value !== ''
})

// Funciones de paginación
const handlePageChange = (page: number): void => {
    currentPage.value = page
    if (searchQuery.value.trim()) {
        searchInvoices(searchQuery.value)
    } else if (selectedStatus.value) {
        fetchInvoicesByStatus(selectedStatus.value)
    } else if (startDate.value && endDate.value) {
        fetchInvoicesByDateRange()
    } else {
        fetchAllInvoices()
    }
}

const handleItemsPerPageChange = (itemsPerPage: number): void => {
    pageSize.value = itemsPerPage
    currentPage.value = 1
    if (searchQuery.value.trim()) {
        searchInvoices(searchQuery.value)
    } else if (selectedStatus.value) {
        fetchInvoicesByStatus(selectedStatus.value)
    } else if (startDate.value && endDate.value) {
        fetchInvoicesByDateRange()
    } else {
        fetchAllInvoices()
    }
}

// Funciones para manejo de acciones
const openNewInvoiceDialog = async (): Promise<void> => {
    await fetchAvailableWorks()
    showInvoiceDialog.value = true
}

const openPaymentDialog = (invoice: Invoice): void => {
    selectedInvoice.value = invoice
    newPayment.invoiceId = invoice.id
    newPayment.amount = invoice.totalAmount
    showPaymentDialog.value = true
}

const viewPayments = async (invoice: Invoice): Promise<void> => {
    selectedInvoice.value = invoice
    await fetchPaymentsByInvoice(invoice.id)
    showPaymentsViewDialog.value = true
}

// Funciones de estilo
const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
        case 'PAGADO': return 'success'
        case 'PENDIENTE': return 'warning'
        case 'PARCIAL': return 'info'
        case 'VENCIDO': return 'error'
        default: return 'grey'
    }
}

const getStatusIcon = (status: string): string => {
    switch (status.toUpperCase()) {
        case 'PAGADO': return 'mdi-check-circle'
        case 'PENDIENTE': return 'mdi-clock-outline'
        case 'PARCIAL': return 'mdi-clock-check-outline'
        case 'VENCIDO': return 'mdi-alert-circle'
        default: return 'mdi-help-circle'
    }
}

const exportInvoices = (): void => {
    const dataStr = JSON.stringify(invoices.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'facturas.json'
    link.click()
}

// Headers de la tabla
const tableHeaders = [
    { title: 'N° Factura', value: 'invoiceNumber', sortable: true },
    { title: 'Cliente', value: 'client', sortable: false },
    { title: 'Vehículo', value: 'vehicle', sortable: false },
    { title: 'Subtotal', value: 'subtotal', sortable: true },
    { title: 'Impuesto', value: 'tax', sortable: true },
    { title: 'Total', value: 'totalAmount', sortable: true },
    { title: 'Estado', value: 'paymentStatus', sortable: false },
    { title: 'Fecha Emisión', value: 'issuedDate', sortable: true },
    { title: 'Fecha Vencimiento', value: 'dueDate', sortable: true },
    { title: 'Acciones', value: 'actions', sortable: false }
]

// Inicialización
onMounted(async () => {
    paymentMethods.value = defaultPaymentMethods
    paymentStatuses.value = defaultPaymentStatuses
    await fetchAllInvoices()
})
</script>

<template>
    <v-app>
        <div class="invoices-container">
            <div class="floating-icons">
                <v-icon class="floating-icon" size="120">mdi-receipt</v-icon>
                <v-icon class="floating-icon" size="80">mdi-currency-usd</v-icon>
                <v-icon class="floating-icon" size="100">mdi-file-document</v-icon>
                <v-icon class="floating-icon" size="90">mdi-credit-card</v-icon>
                <v-icon class="floating-icon" size="110">mdi-chart-line</v-icon>
                <v-icon class="floating-icon" size="70">mdi-bank</v-icon>
            </div>

            <v-container fluid class="pa-6">
                <!-- Header con controles -->
                <v-row class="mb-4">
                    <v-col cols="12">
                        <v-card class="controls-card elevation-8" rounded="lg">
                            <div class="header-section">
                                <div class="d-flex align-center mb-4">
                                    <v-icon size="48" class="mr-4" color="orange darken-2">
                                        mdi-receipt-text
                                    </v-icon>
                                    <div>
                                        <h1 class="text-h4 font-weight-bold">Gestión de Facturas</h1>
                                        <p class="text-subtitle1 grey--text">Taller AutoXela - Sistema de Facturación</p>
                                    </div>
                                </div>

                                <v-card-text>
                                    <v-row align="center">
                                        <v-col cols="12" md="2">
                                            <v-text-field 
                                                v-model="searchQuery" 
                                                label="Buscar por Cliente (CUI)..."
                                                prepend-inner-icon="mdi-magnify" 
                                                outlined 
                                                dense 
                                                clearable
                                                @input="handleTextSearchInput"
                                                @keyup.enter="handleUnifiedSearch"
                                                :disabled="searchByInvoiceNumber.trim() !== ''"
                                                hint="CUI del cliente" 
                                                persistent-hint />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <v-text-field 
                                                v-model="searchByInvoiceNumber" 
                                                label="N° de Factura..."
                                                prepend-inner-icon="mdi-file-document-outline" 
                                                outlined 
                                                dense 
                                                clearable
                                                @input="handleInvoiceNumberSearchInput"
                                                @keyup.enter="handleUnifiedSearch"
                                                :disabled="searchQuery.trim() !== ''"
                                                hint="Número de factura" 
                                                persistent-hint 
                                            />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <v-select
                                                v-model="selectedStatus"
                                                :items="paymentStatuses"
                                                label="Estado de Pago"
                                                outlined
                                                dense
                                                clearable
                                                @update:model-value="handleStatusFilter"
                                                hint="Filtrar por estado"
                                                persistent-hint
                                            />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <v-text-field
                                                v-model="startDate"
                                                label="Fecha Inicio"
                                                type="date"
                                                outlined
                                                dense
                                                hint="Desde fecha"
                                                persistent-hint
                                            />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <v-text-field
                                                v-model="endDate"
                                                label="Fecha Fin"
                                                type="date"
                                                outlined
                                                dense
                                                hint="Hasta fecha"
                                                persistent-hint
                                            />
                                        </v-col>
                                        <v-col cols="12" md="2">
                                            <div class="d-flex">
                                                <v-btn 
                                                    color="primary" 
                                                    @click="handleUnifiedSearch"
                                                    :disabled="!hasActiveSearch"
                                                    class="mr-2"
                                                    outlined
                                                >
                                                    <v-icon>mdi-magnify</v-icon>
                                                </v-btn>
                                                <v-btn 
                                                    color="grey" 
                                                    @click="clearAllSearches"
                                                    :disabled="!hasActiveSearch && !selectedStatus"
                                                    outlined
                                                >
                                                    <v-icon>mdi-close</v-icon>
                                                </v-btn>
                                            </div>
                                        </v-col>
                                    </v-row>

                                    <v-row class="mt-2">
                                        <v-col cols="12" md="3">
                                            <v-btn 
                                                color="primary" 
                                                @click="handleDateRangeFilter"
                                                :disabled="!startDate || !endDate"
                                                class="mr-2"
                                            >
                                                <v-icon left>mdi-calendar-range</v-icon>
                                                Buscar por Fechas
                                            </v-btn>
                                        </v-col>
                                        <v-col cols="12" md="6" class="text-center">
                                            <v-btn class="custom-btn mr-2" @click="openNewInvoiceDialog">
                                                <v-icon left>mdi-plus</v-icon>
                                                Nueva Factura
                                            </v-btn>
                                        </v-col>
                                        <v-col cols="12" md="3" class="text-right">
                                            <v-btn class="export-btn" @click="exportInvoices">
                                                <v-icon left>mdi-file-export</v-icon>
                                                Exportar
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Tabla de facturas -->
                <v-row>
                    <v-col cols="12">
                        <v-card class="invoices-table-card elevation-12" rounded="lg">
                            <v-card-title class="table-header">
                                <v-icon left color="white">mdi-format-list-bulleted</v-icon>
                                Listado de Facturas ({{ totalElements }} elementos)
                            </v-card-title>

                            <v-data-table 
                                :headers="tableHeaders"
                                :items="invoices" 
                                :loading="loading" 
                                class="invoices-table" 
                                :items-per-page="pageSize"
                                :items-per-page-options="itemsPerPageOptions"
                                :server-items-length="totalElements"
                                :page="currentPage"
                                @update:page="handlePageChange"
                                @update:items-per-page="handleItemsPerPageChange"
                                loading-text="Cargando facturas..."
                                no-data-text="No hay facturas disponibles"
                                :items-per-page-text="'Elementos por página:'"
                                :page-text="'{0}-{1} de {2}'"
                            >
                                <template v-slot:[`item.client`]="{ item }">
                                    {{ item.work.vehicle.owner.firstName }} {{ item.work.vehicle.owner.lastName }}
                                </template>

                                <template v-slot:[`item.vehicle`]="{ item }">
                                    {{ item.work.vehicle.licensePlate }}
                                </template>

                                <template v-slot:[`item.subtotal`]="{ item }">
                                    Q{{ item.subtotal.toFixed(2) }}
                                </template>

                                <template v-slot:[`item.tax`]="{ item }">
                                    Q{{ item.tax.toFixed(2) }}
                                </template>

                                <template v-slot:[`item.totalAmount`]="{ item }">
                                    <strong>Q{{ item.totalAmount.toFixed(2) }}</strong>
                                </template>

                                <template v-slot:[`item.paymentStatus`]="{ item }">
                                    <v-chip :color="getStatusColor(item.paymentStatus.name)" text-color="white" small>
                                        <v-icon left small>{{ getStatusIcon(item.paymentStatus.name) }}</v-icon>
                                        {{ item.paymentStatus.name }}
                                    </v-chip>
                                </template>

                                <template v-slot:[`item.issuedDate`]="{ item }">
                                    {{ formatDate(item.issuedDate) }}
                                </template>

                                <template v-slot:[`item.dueDate`]="{ item }">
                                    {{ formatDate(item.dueDate) }}
                                </template>

                                <template v-slot:[`item.actions`]="{ item }">
                                    <v-btn icon small color="green" @click="openPaymentDialog(item)" class="mr-1" v-if="item.paymentStatus.name !== 'PAGADO'">
                                        <v-icon small>mdi-cash</v-icon>
                                    </v-btn>
                                    <v-btn icon small color="blue" @click="viewPayments(item)" class="mr-1">
                                        <v-icon small>mdi-eye</v-icon>
                                    </v-btn>
                                    <v-btn icon small color="orange" class="mr-1">
                                        <v-icon small>mdi-printer</v-icon>
                                    </v-btn>
                                </template>
                            </v-data-table>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

            <!-- Dialog para crear factura -->
            <v-dialog v-model="showInvoiceDialog" max-width="800">
                <v-card>
                    <v-card-title class="dialog-header">
                        <v-icon left color="white">mdi-plus-circle</v-icon>
                        Crear Nueva Factura
                    </v-card-title>
                    <v-card-text class="pt-4">
                        <v-form>
                            <v-row>
                                <v-col cols="12">
                                    <v-select 
                                        v-model="newInvoice.workId" 
                                        :items="availableWorks" 
                                        label="Trabajo a Facturar" 
                                        outlined 
                                        dense 
                                        required 
                                        hint="Seleccione el trabajo que desea facturar"
                                        persistent-hint
                                    />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-select 
                                        v-model="newInvoice.paymentMethodId" 
                                        :items="paymentMethods" 
                                        label="Método de Pago" 
                                        outlined 
                                        dense 
                                        required 
                                        hint="Método de pago preferido"
                                        persistent-hint
                                    />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field 
                                        v-model="newInvoice.dueDate" 
                                        label="Fecha de Vencimiento" 
                                        type="date" 
                                        outlined 
                                        dense 
                                        required 
                                        hint="Fecha límite de pago"
                                        persistent-hint
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-textarea 
                                        v-model="newInvoice.notes" 
                                        label="Notas adicionales" 
                                        outlined 
                                        dense 
                                        rows="3"
                                        hint="Información adicional sobre la factura"
                                        persistent-hint
                                    />
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn text @click="showInvoiceDialog = false; resetInvoiceForm()">Cancelar</v-btn>
                        <v-btn 
                            class="custom-btn" 
                            @click="createInvoice"
                            :disabled="!newInvoice.workId || !newInvoice.paymentMethodId || !newInvoice.dueDate"
                        >
                            <v-icon left>mdi-content-save</v-icon>
                            Crear Factura
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Dialog para crear pago -->
            <v-dialog v-model="showPaymentDialog" max-width="600">
                <v-card>
                    <v-card-title class="dialog-header">
                        <v-icon left color="white">mdi-cash</v-icon>
                        Registrar Pago
                    </v-card-title>
                    <v-card-text class="pt-4">
                        <div v-if="selectedInvoice" class="mb-4">
                            <v-alert type="info" outlined>
                                <strong>Factura:</strong> {{ selectedInvoice.invoiceNumber }}
                                <br>
                                <strong>Cliente:</strong> {{ selectedInvoice.work.vehicle.owner.firstName }} {{ selectedInvoice.work.vehicle.owner.lastName }}
                                <br>
                                <strong>Total a Pagar:</strong> Q{{ selectedInvoice.totalAmount.toFixed(2) }}
                                <br>
                                <strong>Estado Actual:</strong> {{ selectedInvoice.paymentStatus.name }}
                            </v-alert>
                        </div>
                        
                        <v-form>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-select 
                                        v-model="newPayment.paymentMethodId" 
                                        :items="paymentMethods" 
                                        label="Método de Pago" 
                                        outlined 
                                        dense 
                                        required 
                                    />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field 
                                        v-model="newPayment.amount" 
                                        label="Monto del Pago (Q)" 
                                        type="number" 
                                        step="0.01" 
                                        outlined 
                                        dense 
                                        required 
                                        min="0.01"
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field 
                                        v-model="newPayment.referenceNumber" 
                                        label="Número de Referencia" 
                                        outlined 
                                        dense 
                                        hint="Número de transacción, cheque, etc."
                                        persistent-hint
                                    />
                                </v-col>
                                <v-col cols="12">
                                    <v-textarea 
                                        v-model="newPayment.notes" 
                                        label="Notas del Pago" 
                                        outlined 
                                        dense 
                                        rows="3"
                                        hint="Información adicional sobre el pago"
                                        persistent-hint
                                    />
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn text @click="showPaymentDialog = false; resetPaymentForm()">
                            Cancelar
                        </v-btn>
                        <v-btn 
                            class="custom-btn" 
                            @click="createPayment"
                            :disabled="!newPayment.paymentMethodId || newPayment.amount <= 0"
                        >
                            <v-icon left>mdi-check</v-icon>
                            Registrar Pago
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Dialog para ver historial de pagos -->
            <v-dialog v-model="showPaymentsViewDialog" max-width="900">
                <v-card>
                    <v-card-title class="dialog-header">
                        <v-icon left color="white">mdi-history</v-icon>
                        Historial de Pagos
                    </v-card-title>
                    <v-card-text class="pt-4">
                        <div v-if="selectedInvoice" class="mb-4">
                            <v-alert type="info" outlined>
                                <strong>Factura:</strong> {{ selectedInvoice.invoiceNumber }}
                                <br>
                                <strong>Cliente:</strong> {{ selectedInvoice.work.vehicle.owner.firstName }} {{ selectedInvoice.work.vehicle.owner.lastName }}
                                <br>
                                <strong>Total de la Factura:</strong> Q{{ selectedInvoice.totalAmount.toFixed(2) }}
                                <br>
                                <strong>Estado:</strong> 
                                <v-chip :color="getStatusColor(selectedInvoice.paymentStatus.name)" text-color="white" small class="ml-2">
                                    {{ selectedInvoice.paymentStatus.name }}
                                </v-chip>
                            </v-alert>
                        </div>

                        <v-data-table
                            :headers="[
                                { title: 'Fecha', value: 'paymentDate' },
                                { title: 'Método', value: 'paymentMethod.name' },
                                { title: 'Monto', value: 'amount' },
                                { title: 'Referencia', value: 'referenceNumber' },
                                { title: 'Notas', value: 'notes' },
                                { title: 'Creado por', value: 'createdBy' }
                            ]"
                            :items="payments"
                            class="elevation-1"
                            no-data-text="No hay pagos registrados para esta factura"
                        >
                            <template v-slot:[`item.paymentDate`]="{ item }">
                                {{ formatDateTime(item.paymentDate) }}
                            </template>

                            <template v-slot:[`item.amount`]="{ item }">
                                <strong class="success--text">Q{{ item.amount.toFixed(2) }}</strong>
                            </template>

                            <template v-slot:[`item.referenceNumber`]="{ item }">
                                {{ item.referenceNumber || 'N/A' }}
                            </template>

                            <template v-slot:[`item.notes`]="{ item }">
                                {{ item.notes || 'Sin notas' }}
                            </template>

                            <template v-slot:[`item.createdBy`]="{ item }">
                                {{ item.createdBy.firstName }} {{ item.createdBy.lastName }}
                            </template>
                        </v-data-table>

                        <div v-if="payments.length > 0" class="mt-4">
                            <v-divider class="mb-3"></v-divider>
                            <div class="d-flex justify-space-between">
                                <strong>Total Pagado:</strong>
                                <strong class="success--text">
                                    Q{{ payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2) }}
                                </strong>
                            </div>
                            <div class="d-flex justify-space-between" v-if="selectedInvoice">
                                <strong>Saldo Pendiente:</strong>
                                <strong class="error--text">
                                    Q{{ Math.max(0, selectedInvoice.totalAmount - payments.reduce((sum, payment) => sum + payment.amount, 0)).toFixed(2) }}
                                </strong>
                            </div>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn text @click="showPaymentsViewDialog = false">
                            Cerrar
                        </v-btn>
                        <v-btn 
                            class="custom-btn" 
                            @click="showPaymentsViewDialog = false; openPaymentDialog(selectedInvoice)"
                            v-if="selectedInvoice && selectedInvoice.paymentStatus.name !== 'PAGADO'"
                        >
                            <v-icon left>mdi-plus</v-icon>
                            Agregar Pago
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </v-app>
</template>

<style scoped>
.invoices-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    min-height: 100vh;
    position: relative;
    overflow-x: auto;
}

.invoices-container::before {
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
}

.invoices-table-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.2);
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

.invoices-table {
    position: relative;
    z-index: 2;
}

.invoices-table :deep(.v-data-table-header) {
    background: linear-gradient(45deg, #f5f5f5, #e0e0e0) !important;
}

.invoices-table :deep(tbody tr:hover) {
    background-color: rgba(255, 107, 53, 0.1) !important;
}

@media (max-width: 768px) {
    .invoices-container {
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
}

@media (max-width: 600px) {
    .invoices-table :deep(.v-data-table) {
        font-size: 12px;
    }

    .invoices-table :deep(.v-data-table__wrapper) {
        overflow-x: auto;
    }
}
</style>