<script setup lang="ts">
import { ref } from "vue";

const API_URL = import.meta.env.VITE_API_URL;
const props = defineProps<{ workOrderId: string }>();
const workOrderId = Number(props.workOrderId);

const description = ref("");
const hoursWorked = ref<number | null>(null);
const notes = ref("");

const errorMessage = ref<string>("");

async function submitProgress() {
    if (!description.value || hoursWorked.value === null || description.value.length < 10) {
        alert("Por favor completa todos los campos obligatorios, La descripción debe tener al menos 10 caracteres.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/v1/workorders/progress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify({
                workId: workOrderId,
                progressDescription: description.value,
                hoursWorked: hoursWorked.value,
                notes: notes.value
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        const result = await response.json();
        alert("Progreso enviado correctamente.");
        console.log(result);

        // Opcional: limpiar formulario
        description.value = "";
        hoursWorked.value = null;
        notes.value = "";

    } catch (error: any) {
        errorMessage.value = error.message || "Error desconocido";
        alert(errorMessage.value);
        console.error(error);
    }
}
</script>

<template>
    <v-card class="pa-6 mx-auto" max-width="600">
        <v-card-title class="text-h6 font-weight-bold">Agregar Progreso de Trabajo</v-card-title>

        <v-card-text>
            <form @submit.prevent="submitProgress" class="form-container">
                <v-text-field v-model="description" label="Descripción" outlined dense required></v-text-field>

                <v-text-field v-model.number="hoursWorked" label="Horas trabajadas" type="number" step="0.1" outlined
                    dense required></v-text-field>

                <v-textarea v-model="notes" label="Notas" outlined dense rows="3"></v-textarea>

                <v-btn color="green" type="submit" class="mt-4" block>Enviar Progreso</v-btn>
            </form>
        </v-card-text>
    </v-card>
</template>
