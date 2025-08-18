<script setup lang="ts">
import { ref, reactive } from 'vue'

// Estado reactivo del formulario
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

// Reglas de validación
const rules = reactive({
  required: (value: string) => !!value || 'Este campo es requerido',
  minLength: (value: string) => value.length >= 3 || 'Mínimo 3 caracteres'
})

// Función de login
const login = async () => {
  if (!username.value || !password.value) {
    return
  }
  
  loading.value = true
  
  try {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Login exitoso:', {
      username: username.value,
      password: password.value
    })
    
    // Aquí iría la lógica de autenticación real
    // router.push('/dashboard')
    
  } catch (error) {
    console.error('Error en login:', error)
  } finally {
    loading.value = false
  }
}

// Función para recuperar contraseña
const forgotPassword = () => {
  console.log('Recuperar contraseña para:', username.value)
  // Aquí iría la lógica para recuperar contraseña
}
</script>

<template>
  <v-app>
    <div class="login-container">

      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-car-wrench</v-icon>
        <v-icon class="floating-icon" size="32">mdi-engine</v-icon>
        <v-icon class="floating-icon" size="28">mdi-car-tire-alert</v-icon>
        <v-icon class="floating-icon" size="36">mdi-oil-lamp</v-icon>
        <v-icon class="floating-icon" size="20">mdi-car-battery</v-icon>
      </div>
      
      <v-container fluid fill-height class="d-flex align-center justify-center pa-0">
        <v-row justify="center" align="center" class="w-100 ma-0" style="min-height: 100vh;">
          <v-col cols="12" sm="10" md="10" lg="8" xl="6">
            <v-card class="login-card elevation-12" rounded="lg">
              <v-row no-gutters class="fill-height">
                <!-- Sección de marca/logo - Lado izquierdo -->
                <v-col cols="12" md="5" class="brand-section d-flex align-center justify-center">
                  <div class="logo-container text-center">
                    <v-icon size="64" class="mb-4" color="white">
                      mdi-car-wrench
                    </v-icon>
                    <h1 class="text-h4 font-weight-bold mb-2">AutoXela</h1>
                    <p class="text-subtitle1 mb-4">Taller Automotriz</p>
                    <div class="workshop-badge d-inline-block">
                      <v-icon small class="mr-2">mdi-shield-check</v-icon>
                      Taller Certificado
                    </div>
                  </div>
                </v-col>
                
                <!-- Formulario de login - Lado derecho -->
                <v-col cols="12" md="7" class="login-form d-flex align-center">
                  <div class="form-section w-100">
                    <v-form @submit.prevent="login">
                      <div class="text-center mb-6">
                        <h2 class="text-h5 font-weight-medium grey--text text--darken-2">
                          <v-icon class="mr-2" color="grey darken-2">mdi-account-circle</v-icon>
                          Iniciar Sesión
                        </h2>
                        <p class="text-body-2 grey--text">Accede a tu cuenta</p>
                      </div>
                      
                      <v-text-field
                        v-model="username"
                        label="Usuario"
                        prepend-inner-icon="mdi-account-wrench"
                        outlined
                        dense
                        required
                        class="mb-4"
                        :rules="[rules.required, rules.minLength]"
                        hint="Ingresa tu nombre de usuario del taller"
                        persistent-hint
                      />
                      
                      <v-text-field
                        v-model="password"
                        label="Contraseña"
                        prepend-inner-icon="mdi-lock"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append="showPassword = !showPassword"
                        :type="showPassword ? 'text' : 'password'"
                        outlined
                        dense
                        required
                        class="mb-4"
                        :rules="[rules.required]"
                      />
                      
                      <div class="text-center mb-4">
                        <v-btn
                          large
                          color="orange darken-2"
                          @click="forgotPassword"
                          class="forgot-password-btn"
                        >
                          ¿Olvidaste tu contraseña?
                        </v-btn>
                      </div>
                      
                      <v-btn
                        type="submit"
                        block
                        large
                        class="custom-btn"
                        :loading="loading"
                        :disabled="!username || !password"
                      >
                        <v-icon left>mdi-login</v-icon>
                        Ingresar
                      </v-btn>
                      
                      <v-divider class="mb-4" />
                    </v-form>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-app>
</template>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.login-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 0px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 2;
  min-height: 500px;
}

.brand-section {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  color: white;
  position: relative;
  overflow: hidden;
  min-height: 500px;
}

.logo-container {
  position: relative;
  z-index: 3;
}

.floating-icons {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-icon {
  position: absolute;
  opacity: 0.1;
  color: #ff6b35;
}

.floating-icon:nth-child(1) {
  top: 10%;
  left: 10%;
}

.floating-icon:nth-child(2) {
  top: 20%;
  right: 15%;
}

.floating-icon:nth-child(3) {
  bottom: 30%;
  left: 20%;
}

.floating-icon:nth-child(4) {
  bottom: 20%;
  right: 10%;
}

.floating-icon:nth-child(5) {
  top: 50%;
  left: 5%;
}

.login-form {
  position: relative;
  z-index: 2;
  padding: 48px 32px;
  min-height: 500px;
}

.workshop-badge {
  background: linear-gradient(45deg, #424242, #616161);
  color: white;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
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

.custom-btn:disabled {
  background: #ccc !important;
  color: #666 !important;
  transform: none !important;
  box-shadow: none !important;
}

.form-section {
  background: rgba(248, 248, 248, 0.8);
  border-radius: 8px;
  padding: 32px;
}

.forgot-password-btn {
  background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
  color: white !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border-radius: 20px !important;
  margin-bottom: 25px;
}

.forgot-password-btn:hover {
  background: linear-gradient(45deg, #f7931e, #ff6b35) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3) !important;
}

@media (max-width: 960px) {
  .login-card {
    margin: 16px;
    min-height: auto;
  }
  
  .brand-section {
    min-height: 200px;
    padding: 32px 16px;
  }
  
  .login-form {
    padding: 32px 16px;
    min-height: auto;
  }
  
  .form-section {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .brand-section {
    min-height: 150px;
    padding: 24px 16px;
  }
  
  .logo-container h1 {
    font-size: 1.5rem !important;
  }
  
  .logo-container .v-icon {
    font-size: 48px !important;
  }
  
  .forgot-password-btn {
    font-size: 12px !important;
    padding: 6px 12px !important;
  }
}
</style>