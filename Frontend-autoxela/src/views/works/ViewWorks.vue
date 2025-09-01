<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Estado de la tabla
const workOrders = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');

// Paginación
const page = ref(0);
const size = ref(10);
const sortBy = ref('createdAt');
const sortDir = ref('desc');

const fetchWorkOrders = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.get(`${API_URL}/workorders`, {
      params: {
        page: page.value,
        size: size.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value
      },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });

    workOrders.value = response.data.content || response.data;

  } catch (error: any) {
    console.error(error);
    errorMessage.value = error.response?.data?.message || 'Error al obtener las órdenes de trabajo';
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchWorkOrders();
});
</script>

<template>
  <v-container class="main-section">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <v-card class="company-info pa-6">
          <h2 class="text-h5 mb-4">Órdenes de Trabajo</h2>

          <v-alert v-if="errorMessage" type="error" dismissible class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <v-data-table
            :items="workOrders"
            :loading="loading"
            class="elevation-2"
            dense
            outlined
          >
            <template #item="{ item }">
              <tr>
                <td>{{ item.id }}</td>
                <td>{{ item.vehicleId }}</td>
                <td>{{ item.serviceTypeId }}</td>
                <td>{{ item.problemDescription }}</td>
                <td>{{ item.estimatedHours }}</td>
                <td>{{ item.estimatedCost }}</td>
                <td>{{ item.priorityLevel }}</td>
                <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
              </tr>
            </template>

            <template #headers>
              <tr>
                <th>ID</th>
                <th>ID Vehículo</th>
                <th>ID Servicio</th>
                <th>Descripción del Problema</th>
                <th>Horas Estimadas</th>
                <th>Costo Estimado</th>
                <th>Prioridad</th>
                <th>Fecha de Creación</th>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { createApp } from 'vue';

const app = createApp({});
app.config.globalProperties.$filters = {
  currency(value: number) {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  }
};
</script>

<style scoped>
.main-section {
  padding: 80px 0;
  background: #f57b18;
}

.company-info {
  padding: 20px;
  background-color: #fff;
  border-radius: 16px !important;
}
</style>
