<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface UserTypeOption {
  value: number;
  text: string;
  icon: string;
}

// Elementos del formulario reactivos
const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const userType = ref<number | null>(null)
const showPassword = ref(false)
const loading = ref(false)

const userTypeOptions: UserTypeOption[] = [
  { value: 1, text: 'Cliente', icon: 'mdi-account' },
  { value: 2, text: 'Proveedor', icon: 'mdi-truck-delivery' },
  { value: 3, text: 'Empleado', icon: 'mdi-account-tie' },
  { value: 4, text: 'Especialista', icon: 'mdi-account-wrench' }
]

const rules = reactive({
  required: (value: string | number | null) => !!value || 'Este campo es requerido',
  minLength: (value: string) => value.length >= 3 || 'Mínimo 3 caracteres',
  minPasswordLength: (value: string) => value.length >= 6 || 'La contraseña debe tener al menos 6 caracteres',
  email: (value: string) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Email inválido'
  },
  phone: (value: string) => {
    const pattern = /^[0-9]{8,}$/
    return pattern.test(value) || 'Número de teléfono inválido (mínimo 8 dígitos)'
  }
})

const isFormValid = computed(() => {
  return firstName.value && 
         lastName.value && 
         username.value && 
         email.value && 
         password.value && 
         phone.value && 
         userType.value !== null &&
         password.value.length >= 6
})

const createAccount = async () => {
  if (!isFormValid.value) {
    return
  }
  
  loading.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Cuenta creada exitosamente:', {
      firstName: firstName.value,
      lastName: lastName.value,
      username: username.value,
      email: email.value,
      phone: phone.value,
      userType: userType.value,
      password: password.value
    })
  } catch (error) {
    console.error('Error al crear cuenta:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-app>
    <div class="register-container">

      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-car-wrench</v-icon>
        <v-icon class="floating-icon" size="32">mdi-engine</v-icon>
        <v-icon class="floating-icon" size="28">mdi-car-tire-alert</v-icon>
        <v-icon class="floating-icon" size="36">mdi-oil-lamp</v-icon>
        <v-icon class="floating-icon" size="20">mdi-car-battery</v-icon>
      </div>
      
      <v-container fluid fill-height class="d-flex align-center justify-center pa-0">
        <v-row justify="center" align="center" class="w-100 ma-0" style="min-height: 100vh;">
          <v-col cols="12" sm="10" md="11" lg="10" xl="8">
            <v-card class="register-card elevation-12" rounded="lg">
              <v-row no-gutters class="fill-height">
                <!-- Sección de marca/logo - Lado izquierdo -->
                <v-col cols="12" md="4" class="brand-section d-flex align-center justify-center">
                  <div class="logo-container text-center">
                    <v-icon size="64" class="mb-4" color="white">
                      mdi-car-wrench
                    </v-icon>
                    <h1 class="text-h4 font-weight-bold mb-2">AutoXela</h1>
                    <p class="text-subtitle1 mb-4">Taller Automotriz</p>
                    <div class="workshop-badge d-inline-block mb-4">
                      <v-icon small class="mr-2">mdi-shield-check</v-icon>
                      Taller Certificado
                    </div>
                  </div>
                </v-col>
                
                <!-- Formulario de registro - Lado derecho -->
                <v-col cols="12" md="8" class="register-form">
                  <div class="form-section w-100">
                    <v-form @submit.prevent="createAccount">
                      <div class="text-center mb-4">
                        <h2 class="text-h5 font-weight-medium grey--text text--darken-2">
                          <v-icon class="mr-2" color="grey darken-2">mdi-account-plus</v-icon>
                          Crear Cuenta
                        </h2>
                        <p class="text-body-2 grey--text">Únete a AutoXela</p>
                      </div>
                      
                      <!-- Fila de nombres -->
                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="firstName"
                            label="Nombres"
                            prepend-inner-icon="mdi-account"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.minLength]"
                            hint="Tu nombre completo"
                            persistent-hint
                          />
                        </v-col>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="lastName"
                            label="Apellidos"
                            prepend-inner-icon="mdi-account"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.minLength]"
                            hint="Tus apellidos"
                            persistent-hint
                          />
                        </v-col>
                      </v-row>
                      
                      <!-- Usuario y Email -->
                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="username"
                            label="Usuario"
                            prepend-inner-icon="mdi-account-wrench"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.minLength]"
                            hint="Nombre de usuario único"
                            persistent-hint
                          />
                        </v-col>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="email"
                            label="Gmail"
                            prepend-inner-icon="mdi-email"
                            type="email"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.email]"
                            hint="tu@gmail.com"
                            persistent-hint
                          />
                        </v-col>
                      </v-row>
                      
                      <!-- Teléfono y Contraseña -->
                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="phone"
                            label="Teléfono"
                            prepend-inner-icon="mdi-phone"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.phone]"
                            hint="Número de teléfono (solo números)"
                            persistent-hint
                          />
                        </v-col>
                        <v-col cols="12" sm="6">
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
                            :rules="[rules.required, rules.minPasswordLength]"
                            hint="Mínimo 6 caracteres"
                            persistent-hint
                          />
                        </v-col>
                      </v-row>
                      
                      <!-- Tipo de Usuario -->
                      <v-row>
                        <v-col>
                          <div class="user-type-selection">
                            <label class="selection-label">
                              <v-icon small class="mr-2">mdi-account-group</v-icon>
                              Tipo de Usuario
                            </label>
                            <p class="selection-hint">Selecciona tu rol</p>
                            
                            <v-radio-group
                              v-model="userType"
                              class="user-type-radio-group"
                              :rules="[rules.required]"
                              required
                            >
                              <div class="radio-cards-container">
                                <v-card
                                  v-for="option in userTypeOptions"
                                  :key="option.value"
                                  class="radio-card"
                                  :class="{ 'selected': userType === option.value }"
                                  @click="userType = option.value"
                                  elevation="2"
                                  outlined
                                >
                                  <v-card-text class="pa-3 text-center">
                                    <v-radio
                                      :value="option.value"
                                      color="orange darken-2"
                                      class="radio-hidden"
                                    />
                                    <v-icon
                                      :color="userType === option.value ? 'orange darken-2' : 'grey'"
                                      size="32"
                                      class="mb-2"
                                    >
                                      {{ option.icon }}
                                    </v-icon>
                                    <div 
                                      class="option-text"
                                      :class="{ 'selected-text': userType === option.value }"
                                    >
                                      {{ option.text }}
                                    </div>
                                  </v-card-text>
                                </v-card>
                              </div>
                            </v-radio-group>
                          </div>
                        </v-col>
                      </v-row>
                      
                      <!-- Contenedor de botones -->
                      <div class="buttons-container mb-4">
                        <!-- Botón Crear Cuenta - Izquierda -->
                        <div class="left-button">
                          <v-btn
                            type="submit"
                            large
                            class="custom-btn register-btn"
                            :loading="loading"
                            :disabled="!isFormValid"
                          >
                            <v-icon left>mdi-account-plus</v-icon>
                            Crear Cuenta
                          </v-btn>
                        </div>
                      </div>
                      
                      <v-divider class="mt-4" />
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
  .register-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .register-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }

  .register-card {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 0px solid rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 2;
    min-height: 600px;
  }

  .brand-section {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    color: white;
    position: relative;
    overflow: hidden;
    min-height: 600px;
    padding: 40px 24px;
  }

  .logo-container {
    position: relative;
    z-index: 3;
  }

  .register-benefits {
    text-align: left;
    max-width: 200px;
    margin: 0 auto;
  }

  .benefit-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    opacity: 0.9;
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

  .register-form {
    position: relative;
    z-index: 2;
    padding: 40px 32px;
    min-height: 600px;
    display: flex;
    align-items: center;
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

  /* Contenedor de botones */
  .buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .left-button {
    flex: 0 0 auto;
  }

  .right-buttons {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: flex-end;
  }

  /* Botón principal de crear cuenta */
  .register-btn {
    background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
    color: white !important;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    border-radius: 20px !important;
    min-width: 160px;
  }

  .register-btn:hover {
    background: linear-gradient(45deg, #f7931e, #ff6b35) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3) !important;
  }

  .register-btn:disabled {
    background: #ccc !important;
    color: #666 !important;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Botón de volver al login */
  .login-link-btn {
    font-size: 13px !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    transition: all 0.2s ease;
  }

  .login-link-btn:hover {
    transform: translateY(-1px);
  }

  .form-section {
    background: rgba(248, 248, 248, 0.8);
    border-radius: 8px;
    padding: 32px;
    width: 100%;
  }

  /* User Type Selection Styles */
  .user-type-selection {
    width: 100%;
  }

  .selection-label {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.87);
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }

  .selection-hint {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0 0 16px 0;
  }

  .user-type-radio-group {
    margin-top: 0 !important;
  }

  .radio-cards-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .radio-card {
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    position: relative;
  }

  .radio-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  .radio-card.selected {
    border-color: #ff6b35;
    background: rgba(255, 107, 53, 0.05);
  }

  .radio-hidden {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .option-text {
    font-size: 14px;
    font-weight: 500;
    color: #666;
    transition: color 0.3s ease;
  }

  .option-text.selected-text {
    color: #ff6b35;
    font-weight: 600;
  }

  /* Responsive para radio cards */
  @media (max-width: 600px) {
    .radio-cards-container {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 960px) {
    .register-card {
      margin: 16px;
      min-height: auto;
    }
    
    .brand-section {
      min-height: 250px;
      padding: 32px 16px;
    }
    
    .register-form {
      padding: 32px 16px;
      min-height: auto;
    }
    
    .form-section {
      padding: 24px;
    }
    
    .buttons-container {
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .right-buttons {
      justify-content: center;
      width: 100%;
    }
    
    .register-btn {
      width: 100%;
    }
    
    .register-benefits {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .brand-section {
      min-height: 180px;
      padding: 24px 16px;
    }
    
    .logo-container h1 {
      font-size: 1.5rem !important;
    }
    
    .logo-container .v-icon {
      font-size: 48px !important;
    }
    
    .buttons-container {
      flex-direction: column;
      gap: 12px;
    }
    
    .login-link-btn {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 600px) {
    .form-section {
      padding: 16px;
    }
    
    .register-form {
      padding: 16px 8px;
    }
  }
</style>