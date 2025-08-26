<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref<boolean | null>(null)
const router = useRouter()

// Estados reactivos para el usuario
const userId = ref<string>('')
const username = ref<string>('')
const userEmail = ref<string>('')
const userType = ref<string>('')
const fullName = ref<string>('')

// Computed properties
const isLoggedIn = computed(() => !!userId.value && !!username.value)

// Verificar roles específicos
const isAdmin = computed(() => userType.value === 'Administrador')
const isMechanic = computed(() => userType.value === 'Mecánico')
const isCustomer = computed(() => userType.value === 'Cliente')

// Función para cargar datos del usuario desde localStorage
const loadUserData = () => {
  userId.value = localStorage.getItem('userId') || ''
  username.value = localStorage.getItem('username') || ''
  userEmail.value = localStorage.getItem('userEmail') || ''
  userType.value = localStorage.getItem('userType') || ''
  fullName.value = localStorage.getItem('fullName') || ''
}

// Función para logout con llamada a la API
const logout = async () => {
  const accessToken = localStorage.getItem('accessToken')
  
  // Si hay token, intentar hacer logout en el servidor
  if (accessToken) {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Verificar si la respuesta fue exitosa
      if (response.ok) {
        const data = await response.json()
        console.log('Logout exitoso:', data.message)
      } else {
        console.warn('Error en logout del servidor:', response.status)
        // Continuar con el logout local aunque falle el servidor
      }
    } catch (error) {
      console.error('Error al conectar con el servidor para logout:', error)
      // Continuar con el logout local aunque falle la conexión
    }
  }
  
  // Limpiar todos los datos de localStorage (siempre se ejecuta)
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('userId')
  localStorage.removeItem('username')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userType')
  localStorage.removeItem('fullName')

  // Limpiar estados reactivos
  userId.value = ''
  username.value = ''
  userEmail.value = ''
  userType.value = ''
  fullName.value = ''

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
            <!-- Chip con nombre de usuario y tipo -->
            <v-chip 
              :color="isAdmin ? 'red-accent-2' : isMechanic ? 'orange-accent-2' : 'cyan-accent-2'" 
              text-color="black" 
              size="small" 
              class="mr-2"
            >
                <v-icon start>
                  {{ isAdmin ? 'mdi-shield-crown' : isMechanic ? 'mdi-wrench' : 'mdi-account' }}
                </v-icon>
                {{ username }}
            </v-chip>
            
            <!-- Chip con tipo de usuario -->
            <v-chip 
              :color="isAdmin ? 'red-lighten-1' : isMechanic ? 'orange-lighten-1' : 'blue-lighten-1'" 
              text-color="white" 
              size="x-small"
              class="mr-2"
            >
                {{ userType }}
            </v-chip>
            
            <v-btn icon @click="logout" class="ml-2">
                <v-icon>mdi-logout</v-icon>
            </v-btn>
        </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
        <!-- Header del drawer con info del usuario -->
        <template v-if="isLoggedIn">
            <v-card class="mx-auto mb-2" flat>
                <v-card-text class="text-center">
                    <v-avatar 
                      :color="isAdmin ? 'red-accent-2' : isMechanic ? 'orange-accent-2' : 'cyan-accent-2'" 
                      size="64"
                    >
                        <v-icon color="white" size="32">
                            {{ isAdmin ? 'mdi-shield-crown' : isMechanic ? 'mdi-wrench' : 'mdi-account' }}
                        </v-icon>
                    </v-avatar>
                    <div class="text-h6 mt-2">{{ fullName || username }}</div>
                    <div class="text-caption text-medium-emphasis">{{ userType }}</div>
                </v-card-text>
            </v-card>
        </template>

        <v-divider></v-divider>

        <v-list>
            <!-- Elementos para usuarios no logueados -->
            <template v-if="!isLoggedIn">
                <v-list-item to="/" title="Inicio" prepend-icon="mdi-home" router></v-list-item>
                <v-list-item to="/login" title="Iniciar Sesión" prepend-icon="mdi-login" router></v-list-item>
            </template>
            
            <!-- Opciones para ADMINISTRADOR -->
            <template v-if="isAdmin">
                <v-list-subheader class="text-red-accent-2 font-weight-bold">
                    <v-icon class="mr-2">mdi-shield-crown</v-icon>
                    PANEL DE ADMINISTRACIÓN
                </v-list-subheader>
                
                <v-list-item to="/create-user" title="Crear Usuarios" prepend-icon="mdi-account-plus" router></v-list-item>
                
                <v-divider class="my-2"></v-divider>
                <v-list-subheader class="text-medium-emphasis">OPERACIONES</v-list-subheader>
                
                <v-list-item to="/inventory" title="Inventario" prepend-icon="mdi-package-variant" router></v-list-item>
                <v-list-item to="/vehicle-registration" title="Vehículos Registrados" prepend-icon="mdi-car-multiple" router></v-list-item>
            </template>

            <!-- Opciones para MECÁNICO -->
            <template v-if="isMechanic">
                <v-list-subheader class="text-orange-accent-2 font-weight-bold">
                    <v-icon class="mr-2">mdi-wrench</v-icon>
                    PANEL DE MECÁNICO
                </v-list-subheader>
                
                <v-list-item to="/inventory" title="Inventario" prepend-icon="mdi-package-variant" router></v-list-item>
            </template>

            <!-- Opciones para CLIENTE -->
            <template v-if="isCustomer">
                <v-list-subheader class="text-cyan-accent-2 font-weight-bold">
                    <v-icon class="mr-2">mdi-account</v-icon>
                    PANEL DE CLIENTE
                </v-list-subheader>
                
                <v-list-item to="/my-vehicles" title="Mis Vehículos" prepend-icon="mdi-car" router></v-list-item>
            </template>

            <!-- Opciones comunes para todos los usuarios logueados -->
            <template v-if="isLoggedIn">
                <v-divider class="my-2"></v-divider>
                <v-list-subheader class="text-medium-emphasis">GENERAL</v-list-subheader>
   
                <!-- Separador y opción de cerrar sesión -->
                <v-divider class="my-2"></v-divider>
                <v-list-item @click="logout" title="Cerrar Sesión" prepend-icon="mdi-logout" class="text-red-accent-2"></v-list-item>
            </template>
        </v-list>
    </v-navigation-drawer>
</template>

<style scoped>
    .v-chip {
        font-weight: 600;
    }

    .text-red-accent-2 {
        color: rgb(255, 82, 82) !important;
    }

    .text-orange-accent-2 {
        color: rgb(255, 171, 64) !important;
    }

    .text-cyan-accent-2 {
        color: rgb(24, 255, 255) !important;
    }

    .v-list-subheader {
        font-size: 0.75rem;
        font-weight: bold;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }
</style>