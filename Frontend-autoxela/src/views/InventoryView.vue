<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// Elementos reactivos
const searchQuery = ref('')
const selectedCategory = ref('')
const showAddDialog = ref(false)
const loading = ref(false)

// Datos de quemados para realizar pruebas de visualización
const inventory = ref([
    {
        id: 1,
        codigo: 'REP001',
        nombre: 'Filtro de Aceite',
        categoria: 'Filtros',
        marca: 'Mann',
        stock: 25,
        stockMinimo: 10,
        precio: 45.50,
        ubicacion: 'A-1-001',
        estado: 'Disponible'
    },
    {
        id: 2,
        codigo: 'REP002',
        nombre: 'Pastillas de Freno Delanteras',
        categoria: 'Frenos',
        marca: 'Brembo',
        stock: 8,
        stockMinimo: 5,
        precio: 125.75,
        ubicacion: 'B-2-003',
        estado: 'Stock Bajo'
    },
    {
        id: 3,
        codigo: 'REP003',
        nombre: 'Bujías NGK',
        categoria: 'Motor',
        marca: 'NGK',
        stock: 32,
        stockMinimo: 15,
        precio: 18.25,
        ubicacion: 'C-1-012',
        estado: 'Disponible'
    },
    {
        id: 4,
        codigo: 'REP004',
        nombre: 'Correa de Distribución',
        categoria: 'Motor',
        marca: 'Gates',
        stock: 3,
        stockMinimo: 8,
        precio: 85.90,
        ubicacion: 'A-3-005',
        estado: 'Crítico'
    },
    {
        id: 5,
        codigo: 'REP005',
        nombre: 'Amortiguadores Traseros',
        categoria: 'Suspensión',
        marca: 'KYB',
        stock: 12,
        stockMinimo: 6,
        precio: 195.00,
        ubicacion: 'D-1-008',
        estado: 'Disponible'
    },
    {
        id: 6,
        codigo: 'REP006',
        nombre: 'Filtro de Aire',
        categoria: 'Filtros',
        marca: 'Bosch',
        stock: 18,
        stockMinimo: 12,
        precio: 32.75,
        ubicacion: 'A-1-002',
        estado: 'Disponible'
    }
])

// Categorías disponibles
const categories = ref([
    'Filtros',
    'Frenos',
    'Motor',
    'Suspensión',
    'Eléctrico',
    'Transmisión',
    'Llantas'
])

const newRepuesto = reactive({
    codigo: '',
    nombre: '',
    categoria: '',
    marca: '',
    stock: 0,
    stockMinimo: 0,
    precio: 0,
    ubicacion: ''
})

// Busqueda de Productos
const filteredInventory = computed(() => {
    let filtered = inventory.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(item =>
            item.nombre.toLowerCase().includes(query) ||
            item.codigo.toLowerCase().includes(query) ||
            item.marca.toLowerCase().includes(query)
        )
    }

    if (selectedCategory.value) {
        filtered = filtered.filter(item => item.categoria === selectedCategory.value)
    }

    return filtered
})

// Funciones
const getStatusColor = (estado: string) => {
    switch (estado) {
        case 'Disponible': return 'success'
        case 'Stock Bajo': return 'warning'
        case 'Crítico': return 'error'
        default: return 'grey'
    }
}

const getStatusIcon = (estado: string) => {
    switch (estado) {
        case 'Disponible': return 'mdi-check-circle'
        case 'Stock Bajo': return 'mdi-alert-circle'
        case 'Crítico': return 'mdi-alert-octagon'
        default: return 'mdi-help-circle'
    }
}

const addRepuesto = () => {
    console.log('Agregando repuesto:', newRepuesto)
    showAddDialog.value = false
}

const editRepuesto = (repuesto: unknown) => {
    console.log('Editando repuesto:', repuesto)
}

const deleteRepuesto = (repuesto: unknown) => {
    console.log('Eliminando repuesto:', repuesto)
}

const exportInventory = () => {
    console.log('Exportando inventario...')
}
</script>

<template>
    <v-app>
        <div class="inventory-container">
            <v-container fluid class="pa-6">

                <v-row class="mb-4">
                    <v-col cols="12">
                        <v-card class="controls-card elevation-8" rounded="lg">

                            <div class="header-section">
                                <div class="d-flex align-center mb-4">
                                    <v-icon size="48" class="mr-4" color="orange darken-2">
                                        mdi-package-variant
                                    </v-icon>
                                    <div>
                                        <h1 class="text-h4 font-weight-bold">Inventario de Repuestos</h1>
                                        <p class="text-subtitle1 grey--text">Taller AutoXela</p>
                                    </div>
                                </div>

                                <v-card-text>
                                    <v-row align="center">
                                        <v-col cols="12" md="4">
                                            <v-text-field v-model="searchQuery" label="Buscar repuestos..."
                                                prepend-inner-icon="mdi-magnify" outlined dense clearable
                                                hint="Buscar por nombre, código o marca" persistent-hint />
                                        </v-col>

                                        <v-col cols="12" md="8" class="text-right">
                                            <v-btn class="custom-btn mr-2" @click="showAddDialog = true">
                                                <v-icon left>mdi-plus</v-icon>
                                                Agregar Repuesto
                                            </v-btn>
                                            <v-btn class="export-btn" @click="exportInventory">
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

                <!-- Tabla de inventario -->
                <v-row>
                    <v-col cols="12">
                        <v-card class="inventory-table-card elevation-12" rounded="lg">
                            <v-card-title class="table-header">
                                <v-icon left color="white">mdi-format-list-bulleted</v-icon>
                                Listado de Repuestos ({{ filteredInventory.length }} elementos)
                            </v-card-title>

                            <v-data-table :headers="[
                                { title: 'Código', value: 'codigo', sortable: true },
                                { title: 'Repuesto', value: 'nombre', sortable: true },
                                { title: 'Categoría', value: 'categoria', sortable: true },
                                { title: 'Marca', value: 'marca', sortable: true },
                                { title: 'Stock', value: 'stock', sortable: true },
                                { title: 'Stock Mín.', value: 'stockMinimo', sortable: true },
                                { title: 'Precio', value: 'precio', sortable: true },
                                { title: 'Ubicación', value: 'ubicacion', sortable: true },
                                { title: 'Estado', value: 'estado', sortable: false },
                                { title: 'Acciones', value: 'actions', sortable: false }
                            ]" :items="filteredInventory" :loading="loading" class="inventory-table" :items-per-page="10">
                                <template v-slot:[`item.precio`]="{ item }">
                                    Q{{ item.precio.toFixed(2) }}
                                </template>

                                <template v-slot:[`item.stock`]="{ item }">
                                    <v-chip small :color="item.stock <= item.stockMinimo ? 'red' : 'green'"
                                        text-color="white">
                                        {{ item.stock }}
                                    </v-chip>
                                </template>

                                <template v-slot:[`item.estado`]="{ item }">
                                    <v-chip :color="getStatusColor(item.estado)" text-color="white" small>
                                        <v-icon left small>{{ getStatusIcon(item.estado) }}</v-icon>
                                        {{ item.estado }}
                                    </v-chip>
                                </template>

                                <template v-slot:[`item.actions`]="{ item }">
                                    <v-btn icon small color="blue" @click="editRepuesto(item)" class="mr-1">
                                        <v-icon small>mdi-pencil</v-icon>
                                    </v-btn>
                                    <v-btn icon small color="red" @click="deleteRepuesto(item)">
                                        <v-icon small>mdi-delete</v-icon>
                                    </v-btn>
                                </template>
                            </v-data-table>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>

            <v-dialog v-model="showAddDialog" max-width="600">
                <v-card>
                    <v-card-title class="dialog-header">
                        <v-icon left color="white">mdi-plus-circle</v-icon>
                        Agregar Nuevo Repuesto
                    </v-card-title>
                    <v-card-text class="pt-4">
                        <v-form>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field v-model="newRepuesto.codigo" label="Código del repuesto" outlined
                                        dense required />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field v-model="newRepuesto.nombre" label="Nombre del repuesto" outlined
                                        dense required />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-select v-model="newRepuesto.categoria" :items="categories" label="Categoría"
                                        outlined dense required />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field v-model="newRepuesto.marca" label="Marca" outlined dense required />
                                </v-col>
                                <v-col cols="12" md="4">
                                    <v-text-field v-model="newRepuesto.stock" label="Stock actual" type="number"
                                        outlined dense required />
                                </v-col>
                                <v-col cols="12" md="4">
                                    <v-text-field v-model="newRepuesto.stockMinimo" label="Stock mínimo" type="number"
                                        outlined dense required />
                                </v-col>
                                <v-col cols="12" md="4">
                                    <v-text-field v-model="newRepuesto.precio" label="Precio (Q)" type="number"
                                        step="0.01" outlined dense required />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field v-model="newRepuesto.ubicacion" label="Ubicación en almacén" outlined
                                        dense required />
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn text @click="showAddDialog = false">Cancelar</v-btn>
                        <v-btn class="custom-btn" @click="addRepuesto">
                            <v-icon left>mdi-content-save</v-icon>
                            Guardar
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </v-app>
</template>

<style scoped>
.inventory-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    min-height: 100vh;
    position: relative;
    overflow-x: auto;
}

.inventory-container::before {
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

    0%,
    100% {
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

.stats-card {
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
    border-radius: 12px !important;
}

.stats-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
}

.controls-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.inventory-table-card {
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

@media (max-width: 768px) {
    .inventory-container {
        padding: 8px;
    }

    .header-section {
        padding: 16px;
    }

    .header-section h1 {
        font-size: 1.5rem !important;
    }

    .stats-card {
        margin-bottom: 12px;
    }

    .custom-btn,
    .export-btn {
        width: 100%;
        margin-bottom: 8px;
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