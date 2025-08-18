<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref<boolean | null>(null)
const router = useRouter()

// Estados reactivos para el usuario
const userId = ref<string>('')
const username = ref<string>('')
const userEmail = ref<string>('')
const userRole = ref<string>('')

// Computed property
const isLoggedIn = computed(() => !!userId.value && !!username.value)

// Función para cargar datos del usuario desde localStorage
const loadUserData = () => {
  userId.value = localStorage.getItem('userId') || ''
  username.value = localStorage.getItem('username') || ''
  userEmail.value = localStorage.getItem('userEmail') || ''
  userRole.value = localStorage.getItem('userRol') || ''
}

// Función para logout
const logout = () => {
  localStorage.removeItem('userId')
  localStorage.removeItem('username')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userRol')

  userId.value = ''
  username.value = ''
  userEmail.value = ''
  userRole.value = ''

  drawer.value = false
  router.push('/')
}

// Ciclo de vida
onMounted(() => {
  loadUserData()
  window.addEventListener('user-logged-in', loadUserData)
})

onUnmounted(() => {
  window.removeEventListener('user-logged-in', loadUserData)
})
</script>


<template>
    <v-app-bar height="80" color="teal-darken-4" image="https://eu-images.contentstack.com/v3/assets/blt6d90778a997de1cd/blt70f7629113e2f0fb/675b51d01f4cab9b998e3192/Olena_Ivanova-open-source-tools-shutterstock.jpg?width=1280&auto=webp&quality=95&format=jpg&disable=upscale">
        <template v-slot:prepend>
            <v-btn icon @click.stop="drawer = !drawer">
                <v-icon>mdi-view-headline</v-icon>
            </v-btn>
        </template>

        <v-app-bar-title>AutoXela</v-app-bar-title>
        
        <v-spacer></v-spacer>
        
        <!-- Mostrar información del usuario si está logueado -->
        <div v-if="isLoggedIn" class="text-white mr-4">
            <v-chip color="cyan-accent-2" text-color="black" size="small">
                <v-icon start>mdi-account</v-icon>
                {{ username }}
            </v-chip>
            <v-btn icon @click="logout" class="ml-2">
                <v-icon>mdi-logout</v-icon>
            </v-btn>
        </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
        <v-divider></v-divider>

        <v-list>
            <!-- Elementos para usuarios no logueados -->
            <template v-if="!isLoggedIn">
                <v-list-item to="/" title="Iniciar Sesión" prepend-icon="mdi-login" router></v-list-item>
            </template>
            
            <template v-if="userRole === '1'">
                <v-list-item to="/create-user" title="Registro Usuario" prepend-icon="mdi-account-plus" router></v-list-item>
            </template>

            <v-list-item to="/create-user" title="Crear Usuarios" prepend-icon="mdi-account-multiple-plus" router></v-list-item>
            <v-list-item to="/my-vehicles" title="Mis Vehículos" prepend-icon="mdi-car" router></v-list-item>
            <v-list-item to="/inventory" title="Inventario" prepend-icon="mdi-package-variant" router></v-list-item>
            <v-list-item to="/vehicle-registration" title="Vehículos Registrados" prepend-icon="mdi-package-variant" router></v-list-item>

            <!-- Separador y opción de cerrar sesión para usuarios logueados -->
            <template v-if="isLoggedIn">
                <v-divider class="my-2"></v-divider>
                <v-list-item @click="logout" title="Cerrar Sesión" prepend-icon="mdi-logout" class="text-red-accent-2"></v-list-item>
            </template>
        </v-list>
    </v-navigation-drawer>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
.v-chip {
    font-weight: 600;
}

.text-red-accent-2 {
    color: rgb(255, 82, 82) !important;
}
</style>