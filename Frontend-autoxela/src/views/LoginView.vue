<script setup lang="ts">
  import router from '@/router'
import { ref, reactive, computed } from 'vue'

  // Estado reactivo del formulario
  const username = ref('')
  const password = ref('')
  const rememberMe = ref(false)
  const showPassword = ref(false)
  const loading = ref(false)

  // Estados para 2FA
  const show2FADialog = ref(false)
  const verificationCode = ref('')
  const verificationLoading = ref(false)

  // Estados para forgot password
  const showForgotPasswordDialog = ref(false)
  const forgotPasswordEmail = ref('')
  const forgotPasswordLoading = ref(false)

  // Mensajes de estado
  const successMessage = ref('')
  const errorMessage = ref('')
  const forgotPasswordMessage = ref('')
  const forgotPasswordError = ref('')

  // Reglas de validación
  const rules = reactive({
    required: (value: string) => !!value || 'Este campo es requerido',
    minLength: (value: string) => value.length >= 3 || 'Mínimo 3 caracteres',
    codeLength: (value: string) => value.length === 6 || 'El código debe tener 6 dígitos',
    email: (value: string) => {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return pattern.test(value) || 'Ingrese un email válido'
    }
  })

  // Computed para validar el código de verificación
  const isCodeValid = computed(() => {
    return verificationCode.value.length === 6 && /^\d{6}$/.test(verificationCode.value)
  })

  // Computed para validar email en forgot password
  const isEmailValid = computed(() => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(forgotPasswordEmail.value)
  })

  // Función de login inicial
  const login = async () => {
    if (!username.value || !password.value) {
      errorMessage.value = 'Por favor complete todos los campos'
      return
    }
    
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const requestData = {
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const responseData = await response.json()
      
      if (response.ok) {
        successMessage.value = responseData.message || 'Código de verificación enviado a su email'
        show2FADialog.value = true
        console.log('Login inicial exitoso:', responseData)
      } else {
        errorMessage.value = responseData.message || 'Credenciales inválidas'
        console.error('Error en login:', responseData)
      }
    } catch (error) {
      errorMessage.value = 'Error de conexión. Verifique que el servidor esté ejecutándose.'
      console.error('Error al hacer login:', error)
    } finally {
      loading.value = false
    }
  }

  // Función para verificar el código 2FA
  const verify2FA = async () => {
    if (!isCodeValid.value) {
      return
    }
    
    verificationLoading.value = true
    errorMessage.value = ''
    
    const requestData = {
      username: username.value,
      code: verificationCode.value
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      
      const responseData = await response.json()
      
      if (response.ok) {
        // Autenticación completa exitosa
        successMessage.value = responseData.message || 'Autenticación exitosa'
        
        // Guardar tokens y datos del usuario
        if (responseData.accessToken) {
          localStorage.setItem('accessToken', responseData.accessToken)
          localStorage.setItem('refreshToken', responseData.refreshToken)
          localStorage.setItem('tokenType', responseData.tokenType || 'Bearer')
          localStorage.setItem('username', responseData.username)
          localStorage.setItem('userType', responseData.userType)
          localStorage.setItem('fullName', responseData.fullName)
          localStorage.setItem('userId', responseData.username) // Usando username como userId
        }
        
        console.log('Autenticación 2FA exitosa:', responseData)
        
        show2FADialog.value = false
        setTimeout(() => {
          router.push('/')
        }, 3000)
        
      } else {
        errorMessage.value = responseData.message || 'Código de verificación inválido'
        console.error('Error en verificación 2FA:', responseData)
      }
    } catch (error) {
      errorMessage.value = 'Error de conexión durante la verificación.'
      console.error('Error al verificar 2FA:', error)
    } finally {
      verificationLoading.value = false
    }
  }

  // Función para cerrar el dialog de 2FA
  const close2FADialog = () => {
    show2FADialog.value = false
    verificationCode.value = ''
    errorMessage.value = ''
  }

  // Función para mostrar dialog de recuperar contraseña
  const forgotPassword = () => {
    showForgotPasswordDialog.value = true
    forgotPasswordEmail.value = ''
    forgotPasswordMessage.value = ''
    forgotPasswordError.value = ''
  }

  // Función para enviar solicitud de recuperación de contraseña
  const sendForgotPasswordRequest = async () => {
    if (!isEmailValid.value) {
      forgotPasswordError.value = 'Por favor ingrese un email válido'
      return
    }

    forgotPasswordLoading.value = true
    forgotPasswordError.value = ''
    forgotPasswordMessage.value = ''

    const requestData = {
      email: forgotPasswordEmail.value
    }

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const responseData = await response.json()

      if (response.ok) {
        forgotPasswordMessage.value = responseData.message || 'Instrucciones enviadas a su email'
        console.log('Solicitud de recuperación exitosa:', responseData)
        
        // Redirigir a la página de restaurar después de 2 segundos
        setTimeout(() => {
          router.push('/restaurar')
          showForgotPasswordDialog.value = false
        }, 2000)
        
      } else {
        forgotPasswordError.value = responseData.message || 'Error al procesar la solicitud'
        console.error('Error en forgot password:', responseData)
      }
    } catch (error) {
      forgotPasswordError.value = 'Error de conexión. Verifique que el servidor esté ejecutándose.'
      console.error('Error al enviar forgot password:', error)
    } finally {
      forgotPasswordLoading.value = false
    }
  }

  // Función para cerrar el dialog de forgot password
  const closeForgotPasswordDialog = () => {
    showForgotPasswordDialog.value = false
    forgotPasswordEmail.value = ''
    forgotPasswordMessage.value = ''
    forgotPasswordError.value = ''
  }

  // Función para limpiar mensajes
  const clearMessages = () => {
    successMessage.value = ''
    errorMessage.value = ''
  }

  // Función para solo permitir números en el código de verificación
  const onCodeInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value.replace(/\D/g, '') // Solo números
    verificationCode.value = value.slice(0, 6) // Máximo 6 dígitos
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
                    <v-form @submit.prevent="login" lazy-validation>
                      <div class="text-center mb-6">
                        <h2 class="text-h5 font-weight-medium grey--text text--darken-2">
                          <v-icon class="mr-2" color="grey darken-2">mdi-account-circle</v-icon>
                          Iniciar Sesión
                        </h2>
                        <p class="text-body-2 grey--text">Accede a tu cuenta</p>
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

                      <!-- Checkbox Recordarme -->
                      <v-checkbox
                        v-model="rememberMe"
                        label="Recordarme"
                        color="orange darken-2"
                        class="mt-0 mb-4"
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

      <!-- Dialog de verificación 2FA -->
      <v-dialog
        v-model="show2FADialog"
        max-width="500px"
        persistent
      >
        <v-card class="verification-card">
          <v-card-title class="text-center pb-2">
            <div class="w-100">
              <v-icon size="48" color="orange darken-2" class="mb-3">
                mdi-shield-lock
              </v-icon>
              <h3 class="text-h5 font-weight-medium">Verificación Requerida</h3>
            </div>
          </v-card-title>
          
          <v-card-text class="text-center px-6 pb-2">
            <p class="text-body-1 mb-4">
              Hemos enviado un código de 6 dígitos a su email registrado.
            </p>
            
            <v-text-field
              v-model="verificationCode"
              label="Código de Verificación"
              prepend-inner-icon="mdi-numeric"
              outlined
              dense
              required
              class="verification-input"
              :rules="[rules.required, rules.codeLength]"
              hint="Ingrese el código de 6 dígitos"
              persistent-hint
              maxlength="6"
              @input="onCodeInput"
              placeholder="123456"
            />

            <v-alert
              v-if="errorMessage && show2FADialog"
              type="error"
              dense
              class="mt-3"
            >
              {{ errorMessage }}
            </v-alert>
          </v-card-text>
          
          <v-card-actions class="px-6 pb-6">
            <v-btn
              outlined
              color="grey"
              @click="close2FADialog"
              :disabled="verificationLoading"
            >
              <v-icon left>mdi-close</v-icon>
              Cancelar
            </v-btn>
            
            <v-spacer />
            
            <v-btn
              color="orange darken-2"
              :loading="verificationLoading"
              :disabled="!isCodeValid"
              @click="verify2FA"
            >
              <v-icon left>mdi-check-circle</v-icon>
              Verificar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog de recuperar contraseña -->
      <v-dialog
        v-model="showForgotPasswordDialog"
        max-width="500px"
        persistent
      >
        <v-card class="forgot-password-card">
          <v-card-title class="text-center pb-2">
            <div class="w-100">
              <v-icon size="48" color="orange darken-2" class="mb-3">
                mdi-email-lock
              </v-icon>
              <h3 class="text-h5 font-weight-medium">Recuperar Contraseña</h3>
            </div>
          </v-card-title>
          
          <v-card-text class="text-center px-6 pb-2">
            <p class="text-body-1 mb-4">
              Ingrese su email para recibir instrucciones de recuperación.
            </p>
            
            <v-text-field
              v-model="forgotPasswordEmail"
              label="Correo Electrónico"
              prepend-inner-icon="mdi-email"
              outlined
              dense
              required
              class="forgot-email-input"
              :rules="[rules.required, rules.email]"
              hint="Ingrese su email registrado"
              persistent-hint
              type="email"
              placeholder="usuario@ejemplo.com"
            />

            <!-- Mensajes de estado para forgot password -->
            <v-alert
              v-if="forgotPasswordMessage"
              type="success"
              dense
              class="mt-3"
            >
              {{ forgotPasswordMessage }}
            </v-alert>

            <v-alert
              v-if="forgotPasswordError"
              type="error"
              dense
              class="mt-3"
            >
              {{ forgotPasswordError }}
            </v-alert>
          </v-card-text>
          
          <v-card-actions class="px-6 pb-6">
            <v-btn
              outlined
              color="grey"
              @click="closeForgotPasswordDialog"
              :disabled="forgotPasswordLoading"
            >
              <v-icon left>mdi-close</v-icon>
              Cancelar
            </v-btn>
            
            <v-spacer />
            
            <v-btn
              color="orange darken-2"
              :loading="forgotPasswordLoading"
              :disabled="!isEmailValid"
              @click="sendForgotPasswordRequest"
            >
              <v-icon left>mdi-send</v-icon>
              Enviar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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

  /* Estilos para el dialog de verificación */
  .verification-card {
    background: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(10px);
    border-radius: 16px !important;
  }

  .verification-input {
    max-width: 300px;
    margin: 0 auto;
  }

  .verification-input input {
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 4px;
  }

  /* Estilos para el dialog de forgot password */
  .forgot-password-card {
    background: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(10px);
    border-radius: 16px !important;
  }

  .forgot-email-input {
    max-width: 350px;
    margin: 0 auto;
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