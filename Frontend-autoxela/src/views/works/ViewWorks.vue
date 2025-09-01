<script setup lang="ts">
import { onMounted, ref } from "vue"
const API_URL = import.meta.env.VITE_API_URL;

const headers = [
  { text: "ID", value: "id" },
  { text: "Servicio", value: "serviceTypeName" },
  { text: "Estado", value: "workStatusName" },
  { text: "Descripción", value: "problemDescription" },
  { text: "Horas Estimadas", value: "estimatedHours" },
  { text: "Costo Estimado", value: "estimatedCost" },
  { text: "Prioridad", value: "priorityDisplayName" },
  { text: "Acciones", value: "actions", sortable: false },
];



const orders = ref<any[]>([])
const currentPage = ref(0);
const pageSize = ref(10);
const totalPages = ref(0);
const totalElements = ref(0);

async function fetchWorkOrders(page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/workorders?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      }
    );

    if (!response.ok) throw new Error(`Error ${response.status}`);

    const data = await response.json();
    // Actualizar total de elementos para la paginación del servidor
    totalElements.value = data.totalElements;

    // Mapear solo la información que se mostrará en la tabla
    /*orders.value = data.content.map((item: any) => ({
      id: item.id,
      serviceTypeName: item.serviceType?.name || "",
      workStatusName: item.workStatus?.name || "",
      problemDescription: item.problemDescription,
      estimatedHours: item.estimatedHours,
      estimatedCost: item.estimatedCost,
      priorityDisplayName: item.priorityDisplayName,
      vehicle: item.vehicle,
    }));*/
    orders.value = data.content;


  } catch (error: any) {
    console.error("Error al obtener los workorders:", error.message || error);
  }
}


onMounted(() => {
  fetchWorkOrders(currentPage.value, pageSize.value);
});

// Funciones de paginación
function nextPage() {
  if (currentPage.value < totalPages.value - 1) {
    fetchWorkOrders(currentPage.value + 1, pageSize.value);
  }
}
function prevPage() {
  if (currentPage.value > 0) {
    fetchWorkOrders(currentPage.value - 1, pageSize.value);
  }
}

// Dialogos
const vehicleDialog = ref(false)
const ownerDialog = ref(false)

// Datos seleccionados
const selectedVehicle = ref<any>(null)
const selectedOwner = ref<any>(null)

const showVehicleDetails = (vehicle: any) => {
  selectedVehicle.value = vehicle
  vehicleDialog.value = true
}

const showOwnerDetails = (owner: any) => {
  selectedOwner.value = owner
  ownerDialog.value = true
}
</script>

<template>
  <v-card-title class="text-center font-weight-bold text-h6">
      Órdenes de Trabajo
    </v-card-title>
  <v-card class="mt-5 pa-4">
    <!-- Tabla -->
    <v-table class="custom-table mb-4">
      <thead>
        <tr>
          <th>ID</th>
          <th>Servicio</th>
          <th>Estado</th>
          <th>Descripción</th>
          <th>Horas</th>
          <th>Costo</th>
          <th>Prioridad</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>{{ order.id }}</td>
          <td>{{ order.serviceType?.name }}</td>
          <td>{{ order.workStatus?.name }}</td>
          <td>{{ order.problemDescription }}</td>
          <td>{{ order.estimatedHours }}</td>
          <td>{{ order.estimatedCost }}</td>
          <td>{{ order.priorityDisplayName }}</td>
          <td class="actions">
            <v-btn color="orange-darken-2" small class="mr-2" @click="showVehicleDetails(order.vehicle)">
              <v-icon left>mdi-car</v-icon> Vehículo
            </v-btn>
            <v-btn color="orange-darken-4" small @click="showOwnerDetails(order.vehicle.owner)">
              <v-icon left>mdi-account</v-icon> Dueño
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Paginación -->
    <div class="d-flex justify-center mb-4">
      <v-btn text @click="prevPage" :disabled="currentPage === 0">Anterior</v-btn>
      <span class="mx-4">Página {{ currentPage + 1 }} de {{ Math.ceil(totalElements / pageSize) }}</span>
      <v-btn text @click="nextPage" :disabled="(currentPage + 1) * pageSize >= totalElements">Siguiente</v-btn>
    </div>
  </v-card>

  <!-- Dialogo vehículo -->
    <v-dialog v-model="vehicleDialog" max-width="600">
      <v-card>
        <v-card-title>Detalles del Vehículo</v-card-title>
        <v-card-text v-if="selectedVehicle">
          <p><strong>Placa:</strong> {{ selectedVehicle.licensePlate }}</p>
          <p><strong>Color:</strong> {{ selectedVehicle.color }}</p>
          <p><strong>VIN:</strong> {{ selectedVehicle.vin }}</p>
          <p><strong>Modelo:</strong> {{ selectedVehicle.model.name }} ({{ selectedVehicle.model.year }})</p>
          <p><strong>Marca:</strong> {{ selectedVehicle.model.brand.name }}</p>
          <p><strong>Motor:</strong> {{ selectedVehicle.model.engineSize.size }}</p>
          <p><strong>Transmisión:</strong> {{ selectedVehicle.model.transmissionType.name }}</p>
          <p><strong>Combustible:</strong> {{ selectedVehicle.model.fuelType.name }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="vehicleDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo dueño -->
    <v-dialog v-model="ownerDialog" max-width="500">
      <v-card>
        <v-card-title>Detalles del Dueño</v-card-title>
        <v-card-text v-if="selectedOwner">
          <p><strong>Nombre:</strong> {{ selectedOwner.firstName }} {{ selectedOwner.lastName }}</p>
          <p><strong>CUI:</strong> {{ selectedOwner.cui }}</p>
          <p><strong>NIT:</strong> {{ selectedOwner.nit }}</p>
          <p><strong>Email:</strong> {{ selectedOwner.email }}</p>
          <p><strong>Teléfono:</strong> {{ selectedOwner.phone }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="ownerDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<style scoped>

.custom-table {
  width: 100%;       /* Ocupa todo el ancho del card */
  border-collapse: separate;
  border-spacing: 0 8px;
  table-layout: fixed; 
}

.custom-table th,
.custom-table td {
  word-wrap: break-word; /* Que el contenido largo haga wrap */
}

.custom-table thead th {
  background-color: #ffe0cc;
  color: #e65c00;
  font-weight: bold;
  text-align: left;
  padding: 12px 16px;
}

.custom-table tbody td {
  background-color: #fff;
  padding: 12px 16px;
  transition: background 0.2s;
}

.custom-table tbody tr:hover td {
  background-color: #fff3e0;
}

.actions {
  display: flex;
  gap: 4px;
}

.v-btn {
  border-radius: 6px;
  font-weight: 500;
  text-transform: none;
  min-width: 70px;
  font-size: 0.85rem;
}
.v-btn {
  border-radius: 6px;
  font-weight: 500;
  text-transform: none;
  min-width: 70px;
  font-size: 0.85rem;
}
</style>
