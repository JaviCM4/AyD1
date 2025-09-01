<script setup lang="ts">
import { reactive, ref } from 'vue'
const API_URL = import.meta.env.VITE_API_URL;

const errorMss = ref('')
const mss = ref('')

const models = [
  { id: 1, name: 'Corolla' },
  { id: 2, name: 'Camry' },
  { id: 3, name: 'Hilux' },
  { id: 4, name: 'Prado' },
  { id: 5, name: 'Rav4' },
  { id: 6, name: 'Civic' },
  { id: 7, name: 'Accord' },
  { id: 8, name: 'Cr-v' },
  { id: 9, name: 'Pilot' },
  { id: 10, name: 'Sentra' },
  { id: 11, name: 'Altima' },
  { id: 12, name: 'X-trail' },
  { id: 13, name: 'Frontier' },
  { id: 14, name: 'Elantra' },
  { id: 15, name: 'Tucson' },
  { id: 16, name: 'Santa Fe' },
  { id: 17, name: 'Rio' },
  { id: 18, name: 'Forte' },
  { id: 19, name: 'Sportage' },
  { id: 20, name: 'Sorento' },
  { id: 21, name: 'Focus' },
  { id: 22, name: 'Escape' },
  { id: 23, name: 'Explorer' },
  { id: 24, name: 'F-150' },
  { id: 25, name: 'Spark' },
  { id: 26, name: 'Aveo' },
  { id: 27, name: 'Cruze' },
  { id: 28, name: 'Equinox' },
  { id: 29, name: 'Jetta' },
  { id: 30, name: 'Passat' },
  { id: 31, name: 'Tiguan' },
  { id: 32, name: 'Golf' },
]

// Estado reactivo del formulario
const newVehicle = reactive({
  licensePlate: '',
  modelId: 1,
  color: '',
  vin: '',
  ownerCui: ''
})

// Validación simple
const validForm = ref(false)
const rules = {
  required: (value: string) => !!value || 'Este campo es requerido'
}

// Función para enviar
const submitVehicle = async () => {

  console.log('Datos del vehículo:', newVehicle)
  // Aquí podrías hacer el fetch POST a tu API
  try {
    const res = await fetch(`${API_URL}/api/v1/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        licensePlate: newVehicle.licensePlate,
        modelId: newVehicle.modelId,
        color: newVehicle.color,
        vin: newVehicle.vin,
        ownerCui: newVehicle.ownerCui
      })
    })

    if (!res.ok) {
        try {
            const data = await res.json() // parseamos la respuesta del backend
            errorMss.value = data.message || `Error al crear vehículo`
        } catch (e) {
            errorMss.value = `Error al crear vehículo`
        }
    } else {
        mss.value = "Creado!";
        const savedVehicle = await res.json()
        console.log('Vehículo creado:', savedVehicle)
    }
  } catch (error: any) {
    errorMss.value = error.message || "No se pudo crear el vehiculo";
  }
}
</script>

<template>
  <div class="vehicle-form">
    <h2>Crear Nuevo Vehículo</h2>
    <v-alert
        v-if="mss"
        type="info"
        dense
        class="mt-3"
        >
        {{ mss }}
    </v-alert>
    <v-alert
        v-if="errorMss"
        type="error"
        dense
        class="mt-3"
        >
        {{ errorMss }}
    </v-alert>
    <v-form v-model="validForm">
      <v-text-field
        v-model="newVehicle.licensePlate"
        label="Placa"
        :rules="[rules.required]"
        outlined
      />
      <v-select
            v-model="newVehicle.modelId"
            :items="models"
            item-value="id"
            item-title="name"
            label="Modelo"
            :rules="[rules.required]"
            outlined
        />
      <v-text-field
        v-model="newVehicle.color"
        label="Color"
        :rules="[rules.required]"
        outlined
      />
      <v-text-field
        v-model="newVehicle.vin"
        label="VIN"
        :rules="[rules.required]"
        outlined
      />
      <v-text-field
        v-model="newVehicle.ownerCui"
        label="CUI del propietario"
        :rules="[rules.required]"
        outlined
      />

      <v-btn class="mt-4" color="primary" @click="submitVehicle">
        Guardar Vehículo
      </v-btn>
    </v-form>
  </div>
</template>

<style scoped>
.vehicle-form {
  max-width: 500px;
  margin: 40px auto;
}
</style>
