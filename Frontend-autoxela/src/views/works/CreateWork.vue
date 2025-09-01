<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const vehicleId = ref<number | null>(null);
const serviceTypeId = ref<number | null>(null);
const problemDescription = ref('');
const estimatedHours = ref<number | null>(null);
const estimatedCost = ref<number | null>(null);
const priorityLevel = ref<number | null>(null);

const successMessage = ref('');
const errorMessage = ref('');
const loading = ref(false);

const submitWorkOrder = async () => {
  successMessage.value = '';
  errorMessage.value = '';
  
  if (!vehicleId.value || !serviceTypeId.value || !problemDescription.value || !estimatedHours.value || !estimatedCost.value || !priorityLevel.value) {
    errorMessage.value = 'Por favor complete todos los campos';
    return;
  }

  const requestBody = {
    vehicleId: vehicleId.value,
    serviceTypeId: serviceTypeId.value,
    problemDescription: problemDescription.value,
    estimatedHours: estimatedHours.value,
    estimatedCost: estimatedCost.value,
    priorityLevel: priorityLevel.value
  };

  loading.value = true;

  try {
    const response = await axios.post(`${API_URL}/workorders`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    successMessage.value = 'Orden de trabajo creada exitosamente';
    console.log(response.data);
  } catch (error: any) {
    console.error(error);
    errorMessage.value = error.response?.data?.message || 'Error al crear la orden';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="main-section">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="company-info pa-6">
          <h2 class="text-h5 mb-4">Nueva Orden de Trabajo</h2>

          <v-alert v-if="successMessage" type="success" dismissible class="mb-4">
            {{ successMessage }}
          </v-alert>
          <v-alert v-if="errorMessage" type="error" dismissible class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <v-form @submit.prevent="submitWorkOrder">
            <v-text-field
              v-model="vehicleId"
              label="ID del Vehículo"
              type="number"
              required
              outlined
              class="mb-4"
            />

            <v-text-field
              v-model="serviceTypeId"
              label="ID del Tipo de Servicio"
              type="number"
              required
              outlined
              class="mb-4"
            />

            <v-textarea
              v-model="problemDescription"
              label="Descripción del Problema"
              required
              outlined
              class="mb-4"
            />

            <v-text-field
              v-model="estimatedHours"
              label="Horas Estimadas"
              type="number"
              step="0.1"
              required
              outlined
              class="mb-4"
            />

            <v-text-field
              v-model="estimatedCost"
              label="Costo Estimado"
              type="number"
              step="0.01"
              required
              outlined
              class="mb-4"
            />

            <v-text-field
              v-model="priorityLevel"
              label="Nivel de Prioridad"
              type="number"
              required
              outlined
              class="mb-4"
            />

            <v-btn
              type="submit"
              color="orange darken-2"
              large
              block
              :loading="loading"
            >
              Crear Orden
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

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
