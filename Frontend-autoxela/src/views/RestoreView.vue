<script setup lang="ts">
  import router from '@/router'
  import { ref, reactive, computed } from 'vue'

  // Estado reactivo del formulario
  const token = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const showNewPassword = ref(false)
  const showConfirmPassword = ref(false)
  const loading = ref(false)

  // Mensajes de estado
  const successMessage = ref('')
  const errorMessage = ref('')

  // Reglas de validación
  const rules = reactive({
    required: (value: string) => !!value || 'Este campo es requerido',
    minLength: (value: string) => value.length >= 6 || 'La contraseña debe tener al menos 8 caracteres',
    tokenLength: (value: string) => value.length >= 10 || 'El token debe tener al menos 10 caracteres',
    passwordMatch: (value: string) => value === newPassword.value || 'Las contraseñas no coinciden',
    passwordStrength: (value: string) => {
      const hasUpperCase = /[A-Z]/.test(value)
      const hasLowerCase = /[a-z]/.test(value)
      const hasNumbers = /\d/.test(value)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
      
      if (value.length < 8) return 'Mínimo 8 caracteres'
      if (!hasUpperCase) return 'Debe contener al menos una mayúscula'
      if (!hasLowerCase) return 'Debe contener al menos una minúscula'
      if (!hasNumbers) return 'Debe contener al menos un número'
      if (!hasSpecialChar) return 'Debe contener al menos un carácter especial'
      
      return true
    }
  })

  // Computed para validar el formulario
  const isFormValid = computed(() => {
    return token.value.length >= 10 && 
           newPassword.value.length >= 8 && 
           confirmPassword.value === newPassword.value &&
           rules.passwordStrength(newPassword.value) === true
  })

  // Función principal para restablecer contraseña
  const resetPassword = async () => {
    if (!isFormValid.value) {
      errorMessage.value = 'Por favor complete todos los campos correctamente'
      return
    }
    
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const requestData = {
      token: token.value.trim(),
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const responseData = await response.json()
      
      if (response.ok) {
        successMessage.value = responseData.message || 'Contraseña cambiada exitosamente'
        console.log('Contraseña restablecida exitosamente:', responseData)
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/')
        }, 3000)
        
      } else {
        errorMessage.value = responseData.message || 'Error al restablecer la contraseña'
        console.error('Error en reset password:', responseData)
      }
    } catch (error) {
      errorMessage.value = 'Error de conexión. Verifique que el servidor esté ejecutándose.'
      console.error('Error al restablecer contraseña:', error)
    } finally {
      loading.value = false
    }
  }

  // Función para volver al login
  const goToLogin = () => {
    router.push('/login')
  }

  // Función para limpiar mensajes
  const clearMessages = () => {
    successMessage.value = ''
    errorMessage.value = ''
  }

  // Función para pegar token desde clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      token.value = text.trim()
    } catch (error) {
      console.log('No se pudo acceder al clipboard:', error)
    }
  }
</script>

<template>
  <v-app>
    <div class="reset-container">
      
      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-car-wrench</v-icon>
        <v-icon class="floating-icon" size="32">mdi-engine</v-icon>
        <v-icon class="floating-icon" size="28">mdi-car-tire-alert</v-icon>
        <v-icon class="floating-icon" size="36">mdi-oil-lamp</v-icon>
        <v-icon class="floating-icon" size="20">mdi-car-battery</v-icon>
        <v-icon class="floating-icon" size="30">mdi-key</v-icon>
        <v-icon class="floating-icon" size="26">mdi-lock-reset</v-icon>
      </div>
      
      <v-container fluid fill-height class="d-flex align-center justify-center pa-0">
        <v-row justify="center" align="center" class="w-100 ma-0" style="min-height: 100vh;">
          <v-col cols="12" sm="10" md="8" lg="6" xl="5">
            <v-card class="reset-card elevation-12" rounded="lg">
              <v-row no-gutters class="fill-height">
                
                <!-- Sección de marca/logo - Parte superior -->
                <v-col cols="12" class="brand-section d-flex align-center justify-center">
                  <div class="logo-container text-center">
                    <v-icon size="56" class="mb-3" color="white">
                      mdi-lock-reset
                    </v-icon>
                    <h1 class="text-h5 font-weight-bold mb-1">AutoXela</h1>
                    <p class="text-subtitle2 mb-3">Restaurar Contraseña</p>
                    <div class="workshop-badge d-inline-block">
                      <v-icon small class="mr-1">mdi-shield-check</v-icon>
                      Seguro y Confiable
                    </div>
                  </div>
                </v-col>
                
                <!-- Formulario de reset - Parte inferior -->
                <v-col cols="12" class="reset-form">
                  <div class="form-section w-100">
                    <v-form @submit.prevent="resetPassword" lazy-validation>
                      <div class="text-center mb-5">
                        <h2 class="text-h6 font-weight-medium grey--text text--darken-2">
                          <v-icon class="mr-2" color="grey darken-2">mdi-key-change</v-icon>
                          Nueva Contraseña
                        </h2>
                        <p class="text-body-2 grey--text">Ingrese el token y su nueva contraseña</p>
                      </div>

                      <!-- Mensajes de estado -->
                      <v-alert
                        v-if="successMessage"
                        type="success"
                        dismissible
                        @input="clearMessages"
                        class="mb-4"
                      >
                        {{ successMessage }}
                        <div class="mt-2">
                          <small>Redirigiendo al login en unos momentos...</small>
                        </div>
                      </v-alert>

                      <v-alert
                        v-if="errorMessage"
                        type="error"
                        dismissible
                        @input="clearMessages"
                        class="mb-4"
                      >
                        {{ errorMessage }}
                      </v-alert>
                      
                      <!-- Campo Token -->
                      <v-text-field
                        v-model="token"
                        label="Token de Recuperación"
                        prepend-inner-icon="mdi-key-variant"
                        :append-icon="'mdi-content-paste'"
                        @click:append="pasteFromClipboard"
                        outlined
                        dense
                        required
                        class="mb-4"
                        :rules="[rules.required, rules.tokenLength]"
                        hint="Pegue el token recibido por email"
                        persistent-hint
                        placeholder="Ej: abc123def456ghi789..."
                      />
                      
                      <!-- Campo Nueva Contraseña -->
                      <v-text-field
                        v-model="newPassword"
                        label="Nueva Contraseña"
                        prepend-inner-icon="mdi-lock"
                        :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append="showNewPassword = !showNewPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        outlined
                        dense
                        required
                        class="mb-2"
                        :rules="[rules.required, rules.passwordStrength]"
                        hint="Mínimo 6 caracteres, mayúsculas, minúsculas, números y símbolos"
                        persistent-hint
                      />
                      
                      <!-- Campo Confirmar Contraseña -->
                      <v-text-field
                        v-model="confirmPassword"
                        label="Confirmar Nueva Contraseña"
                        prepend-inner-icon="mdi-lock-check"
                        :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append="showConfirmPassword = !showConfirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        outlined
                        dense
                        required
                        class="mb-4"
                        :rules="[rules.required, rules.passwordMatch]"
                        hint="Repita exactamente la contraseña anterior"
                        persistent-hint
                      />
                      
                      <v-btn
                        type="submit"
                        block
                        large
                        class="custom-btn mb-3"
                        :loading="loading"
                        :disabled="!isFormValid"
                      >
                        <v-icon left>mdi-check-circle</v-icon>
                        Cambiar Contraseña
                      </v-btn>
                      
                      <v-btn
                        outlined
                        block
                        large
                        color="grey"
                        @click="goToLogin"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-arrow-left</v-icon>
                        Volver al Login
                      </v-btn>
                      
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
  .reset-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .reset-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }

  .reset-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 0px solid rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 2;
    min-height: 600px;
    max-width: 500px;
  }

  .brand-section {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    color: white;
    position: relative;
    overflow: hidden;
    min-height: 180px;
    border-radius: 8px 8px 0 0;
  }

  .logo-container {
    position: relative;
    z-index: 3;
    padding: 24px;
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
    top: 15%;
    left: 10%;
  }

  .floating-icon:nth-child(2) {
    top: 25%;
    right: 15%;
  }

  .floating-icon:nth-child(3) {
    bottom: 35%;
    left: 20%;
  }

  .floating-icon:nth-child(4) {
    bottom: 25%;
    right: 10%;
  }

  .floating-icon:nth-child(5) {
    top: 60%;
    left: 5%;
  }

  .floating-icon:nth-child(6) {
    top: 45%;
    right: 25%;
  }

  .floating-icon:nth-child(7) {
    bottom: 45%;
    left: 35%;
  }

  .reset-form {
    position: relative;
    z-index: 2;
    padding: 32px;
  }

  .workshop-badge {
    background: linear-gradient(45deg, #424242, #616161);
    color: white;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 11px;
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
    padding: 24px;
  }

  /* Estilos para progress bar de contraseña */
  .v-progress-linear {
    border-radius: 4px !important;
  }

  /* Colores para indicador de fuerza */
  .red--text {
    color: #f44336 !important;
  }

  .orange--text {
    color: #ff9800 !important;
  }

  .green--text {
    color: #4caf50 !important;
  }

  @media (max-width: 768px) {
    .reset-card {
      margin: 16px;
      min-height: auto;
      max-width: none;
    }
    
    .brand-section {
      min-height: 140px;
      padding: 16px;
    }
    
    .logo-container {
      padding: 16px;
    }
    
    .logo-container h1 {
      font-size: 1.3rem !important;
    }
    
    .logo-container .v-icon {
      font-size: 48px !important;
    }
    
    .reset-form {
      padding: 24px 16px;
    }
    
    .form-section {
      padding: 16px;
    }
  }

  @media (max-width: 480px) {
    .brand-section {
      min-height: 120px;
    }
    
    .logo-container h1 {
      font-size: 1.2rem !important;
    }
    
    .workshop-badge {
      font-size: 10px !important;
      padding: 4px 8px !important;
    }
  }
</style>