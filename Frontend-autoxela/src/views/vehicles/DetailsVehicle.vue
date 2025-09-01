<script setup lang="ts">
import router from '@/router';
import { computed, onMounted, reactive, ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL;
const props = defineProps<{ vehicleId: string }>()

const userType = ref<string>('')
const isAdmin = computed(() => userType.value === 'Administrador')

const loadUserData = () => {
    const newUserType = localStorage.getItem('userType') || ''
    if (userType.value !== newUserType) userType.value = newUserType
}

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


const addServiceRedirect = (carId: number) => {
    router.push({ name: 'addWork', params: { vehicleId: carId } })
}

/*
* --------------------------------------------
* Eliminacion 
* --------------------------------------------
*/

const showConfirm = ref(false);

const confirmDelete = () => {
    showConfirm.value = true;
};

const deleteVehicle = async () => {

    try {
        const response = await fetch(`${API_URL}/api/v1/vehicles/${vehicle.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (!response.ok) {
            throw new Error(`El vehiculo tiene relacionados trabajos, no se puede eliminar`);
        }
        showConfirm.value = false;

        router.push({ name: 'vehicle-registration' })

    } catch (err: any) {
        errorMss.value = err.message || 'No se pudo obtener el vehículo'
        console.error("Error al eliminar vehículo:", err);
    }
};

/*
* --------------------------------------------
* Edicion 
* --------------------------------------------
*/
const color = ref("");
const vin = ref("");

const showEditDialogFlag = ref(false);
const showEditDialog = () => {
    showEditDialogFlag.value = true;
};

const updateVehicle = async () => {
    try {
        const response = await fetch(`${API_URL}/api/v1/vehicles/${vehicle.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                color: color.value && color.value.trim() !== "" ? color.value : vehicle.color,
                vin: vin.value && vin.value.trim() !== "" ? vin.value : vehicle.vin
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        loadVehicle()

    } catch (err) {
        console.error("Error al actualizar vehículo:", err);
    }
};


onMounted(() => {
    loadUserData()
    loadVehicle()
    console.log(loadVehicle);
})

</script>

<template>
    <!-- Edit -->
    <v-dialog v-model="showEditDialogFlag" max-width="500">
        <v-card>
            <v-card-title class="text-h6">Actualizar Vehículo</v-card-title>
            <v-card-text>
                <v-form @submit.prevent="updateVehicle">
                    <v-text-field v-model="color" label="Color" required></v-text-field>

                    <v-text-field v-model="vin" label="VIN" required></v-text-field>

                    <v-card-actions class="mt-4">
                        <v-spacer></v-spacer>
                        <v-btn text @click="showEditDialogFlag = false">Cancelar</v-btn>
                        <v-btn type="submit" color="blue">
                            <v-icon left>mdi-content-save</v-icon>
                            Guardar
                        </v-btn>
                    </v-card-actions>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Modal de confirmación de eliminacion -->
    <v-dialog v-model="showConfirm" max-width="400">
        <v-card>
            <v-card-title class="text-h6">Confirmar eliminación</v-card-title>
            <v-card-text>
                ¿Estás seguro de que deseas eliminar este vehículo?
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="showConfirm = false">Cancelar</v-btn>
                <v-btn color="red" text @click="deleteVehicle">Eliminar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-container class="mt-6">
        <v-card elevation="10" rounded="lg">
            <v-card-title class="justify-center">
                <v-icon left>mdi-car</v-icon>
                Vehículo: {{ vehicle.licensePlate }}
            </v-card-title>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex align-center">
                <!-- Botón Agregar Servicio -->
                <v-btn small class="custom-btn mr-3 ml-3" color="green" @click="addServiceRedirect(vehicle.id)">
                    <v-icon left>mdi-plus</v-icon>
                    Agregar Servicio
                </v-btn>

                <!-- Botones de administrador -->
                <div v-if="isAdmin" class="d-flex">
                    <v-btn small class="custom-btn mr-3" color="red" @click="confirmDelete">
                        <v-icon left>mdi-delete</v-icon>
                        Eliminar
                    </v-btn>

                    <v-btn color="orange" @click="showEditDialog">
                        <v-icon left>mdi-pencil</v-icon>
                        Editar Vehículo
                    </v-btn>
                </div>
            </div>

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