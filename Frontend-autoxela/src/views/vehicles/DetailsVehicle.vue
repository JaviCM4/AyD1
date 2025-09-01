<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL;
const props = defineProps<{ vehicleId: string }>()

const errorMss = ref('')

const vehicle = reactive({
  id: 0,
  licensePlate: '',
  color: '',
  vin: '',
  model: {
    id: 0,
    name: '',
    year: 0,
    brand: { id: 0, name: '', country: { id: 0, name: '' } },
    engineSize: { id: 0, size: '', description: '' },
    transmissionType: { id: 0, name: '', description: '' },
    fuelType: { id: 0, name: '', description: '' }
  },
  owner: {
    cui: '',
    nit: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  createdAt: '',
  updatedAt: ''
})

const loadVehicle = async () => {
    try {
        const res = await fetch(`${API_URL}/api/v1/vehicles/${props.vehicleId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })

        if (!res.ok) {
            let errorMsg = `Error al obtener vehículo: ${res.status}`
            try {
                const errorData = await res.json()
                if (errorData.message) errorMsg = errorData.message
            } catch { }
            errorMss.value = errorMsg
            return
        }

        const data = await res.json()
        Object.assign(vehicle, data) // copia los datos de la API al estado reactivo

    } catch (err: any) {
        errorMss.value = err.message || 'No se pudo obtener el vehículo'
    }
}

onMounted(() => {
    loadVehicle()
    console.log(loadVehicle);
})

</script>

<template>
    <v-container class="mt-6">
        <v-card elevation="10" rounded="lg">
            <v-card-title class="justify-center">
                <v-icon left>mdi-car</v-icon>
                Vehículo: {{ vehicle.licensePlate }}
            </v-card-title>

            <v-divider class="my-4"></v-divider>

            <v-card-text>
                <v-alert v-if="errorMss" type="error" dense class="mb-4">
                    {{ errorMss }}
                </v-alert>
                <v-row>
                    <v-col cols="12" sm="6">
                        <strong>Modelo:</strong> {{ vehicle.model.name }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Año:</strong> {{ vehicle.model.year }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Marca:</strong> {{ vehicle.model.brand.name }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>País:</strong> {{ vehicle.model.brand.country.name }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Motor:</strong> {{ vehicle.model.engineSize.description }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Transmisión:</strong> {{ vehicle.model.transmissionType.name }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Combustible:</strong> {{ vehicle.model.fuelType.name }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Color:</strong> {{ vehicle.color }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>VIN:</strong> {{ vehicle.vin }}
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <h3>Propietario</h3>
                <v-row>
                    <v-col cols="12" sm="6">
                        <strong>Nombre:</strong> {{ vehicle.owner.firstName }} {{ vehicle.owner.lastName }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>CUI:</strong> {{ vehicle.owner.cui }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>NIT:</strong> {{ vehicle.owner.nit }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Email:</strong> {{ vehicle.owner.email }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Teléfono:</strong> {{ vehicle.owner.phone }}
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <v-row>
                    <v-col cols="12" sm="6">
                        <strong>Creado:</strong> {{ new Date(vehicle.createdAt).toLocaleString() }}
                    </v-col>
                    <v-col cols="12" sm="6">
                        <strong>Actualizado:</strong> {{ new Date(vehicle.updatedAt).toLocaleString() }}
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<style scoped>
h3 {
    margin-bottom: 12px;
}
</style>
