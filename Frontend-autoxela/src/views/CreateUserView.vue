<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
const API_URL = import.meta.env.VITE_API_URL;

interface UserTypeOption {
  value: number;
  text: string;
  icon: string;
}

interface GenderOption {
  value: number;
  text: string;
}

interface SpecializationOption {
  id: number;
  name: string;
  icon: string;
}

// Elementos del formulario reactivos
const cui = ref('')
const nit = ref('')
const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const birthDate = ref('')
const genderId = ref<number | null>(null)
const userType = ref<number | null>(null)
const showPassword = ref(false)
const loading = ref(false)

// Especialización
const showSpecializationDialog = ref(false)
const selectedSpecializations = ref<number[]>([])
const certificationDate = ref('')

// Mensajes de estado
const successMessage = ref('')
const errorMessage = ref('')
const formRef = ref(null)

const userTypeOptions: UserTypeOption[] = [
  { value: 2, text: 'Empleado', icon: 'mdi-account' },
  { value: 3, text: 'Especialista', icon: 'mdi-truck-delivery' },
  { value: 4, text: 'Cliente', icon: 'mdi-account-tie' },
  { value: 5, text: 'Proveedor', icon: 'mdi-account-wrench' }
]

const genderOptions: GenderOption[] = [
  { value: 1, text: 'Masculino' },
  { value: 2, text: 'Femenino' }
]

const specializationOptions: SpecializationOption[] = [
  { id: 1, name: 'Electricidad automotriz', icon: 'mdi-lightning-bolt' },
  { id: 2, name: 'Diagnóstico computarizado', icon: 'mdi-laptop' },
  { id: 3, name: 'Sistemas de frenos', icon: 'mdi-car-brake-parking' },
  { id: 4, name: 'Reparación de motores', icon: 'mdi-engine' },
  { id: 5, name: 'Transmisión', icon: 'mdi-cog' },
  { id: 6, name: 'Aire acondicionado', icon: 'mdi-air-conditioner' },
  { id: 7, name: 'Suspensión', icon: 'mdi-car-side' },
  { id: 8, name: 'Dirección', icon: 'mdi-steering' },
  { id: 9, name: 'Inyección electrónica', icon: 'mdi-chip' },
  { id: 10, name: 'Turbo y sobrealimentación', icon: 'mdi-turbine' },
  { id: 11, name: 'Híbridos', icon: 'mdi-car-electric' },
  { id: 12, name: 'Diésel', icon: 'mdi-gas-station' },
  { id: 13, name: 'Carrocería', icon: 'mdi-car' },
  { id: 14, name: 'Pintura', icon: 'mdi-palette' }
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
  },
  cui: (value: string) => {
    const pattern = /^[0-9]{13}$/
    return pattern.test(value) || 'CUI debe tener 13 dígitos'
  },
  nit: (value: string) => {
    const pattern = /^[0-9]{8,}$/
    return pattern.test(value) || 'NIT inválido (mínimo 8 dígitos)'
  },
  birthDate: (value: string) => {
    if (!value) return 'La fecha de nacimiento es requerida'
    const today = new Date()
    const birth = new Date(value)
    const age = today.getFullYear() - birth.getFullYear()
    return age >= 18 || 'Debe ser mayor de 18 años'
  }
})

const isFormValid = computed(() => {
  const baseValid = cui.value && 
         nit.value &&
         firstName.value && 
         lastName.value && 
         username.value && 
         email.value && 
         password.value && 
         phone.value && 
         birthDate.value &&
         genderId.value !== null &&
         userType.value !== null &&
         password.value.length >= 6 &&
         cui.value.length === 13 &&
         nit.value.length >= 8

  // Para empleados y especialistas, también necesitamos especialización
  if ((userType.value === 2 || userType.value === 3)) {
    return baseValid && selectedSpecializations.value.length > 0 && certificationDate.value
  }
  
  return baseValid
})

const isEmployeeOrSpecialist = computed(() => {
  return userType.value === 2 || userType.value === 3
})

const onUserTypeChange = (value: number) => {
  userType.value = value
  if (value === 2 || value === 3) {
    showSpecializationDialog.value = true
  } else {
    selectedSpecializations.value = []
    certificationDate.value = ''
  }
}

const confirmSpecializations = () => {
  if (selectedSpecializations.value.length === 0 || !certificationDate.value) {
    errorMessage.value = 'Debe seleccionar al menos una especialización y fecha de certificación'
    return
  }
  showSpecializationDialog.value = false
  clearMessages()
}

const cancelSpecializationSelection = () => {
  selectedSpecializations.value = []
  certificationDate.value = ''
  userType.value = null
  showSpecializationDialog.value = false
}

const openSpecializationDialog = () => {
  if (isEmployeeOrSpecialist.value) {
    showSpecializationDialog.value = true
  }
}

const getSelectedSpecializationsText = computed(() => {
  if (selectedSpecializations.value.length === 0) return 'Ninguna especialización seleccionada'
  const names = selectedSpecializations.value.map(id => 
    specializationOptions.find(opt => opt.id === id)?.name
  ).filter(Boolean)
  return names.join(', ')
})

const createAccount = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor, complete todos los campos correctamente'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  // Preparar datos base
  const requestData: Record<string, unknown> = {
    cui: cui.value,
    nit: nit.value,
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    phone: phone.value,
    birthDate: birthDate.value,
    genderId: genderId.value,
    username: username.value,
    password: password.value,
    userTypeId: userType.value
  }

  // Agregar especializaciones para empleados y especialistas
  if (isEmployeeOrSpecialist.value) {
    requestData.specializations = selectedSpecializations.value.map(id => ({
      specializationTypeId: id,
      certificationDate: certificationDate.value
    }))
  }

  // Determinar endpoint y token
  let endpoint = `${API_URL}/api/v1/auth/register`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (userType.value === 2) {
    endpoint = `${API_URL}/api/v1/employees`
    const token = localStorage.getItem('accessToken')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  } else if (userType.value === 3) {
    endpoint = `${API_URL}/api/v1/specialists`
    const token = localStorage.getItem('accessToken')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })
    
    const responseData = await response.json()
    
    if (response.ok) {
      successMessage.value = responseData.message || 'Cuenta creada exitosamente'
      console.log('Datos enviados:', requestData)
      console.log('Cuenta creada exitosamente:', responseData)
      
      resetForm()
      
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
      
    } else {
      errorMessage.value = responseData.message || 'Error al crear la cuenta'
      console.error('Error en la respuesta:', responseData)
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión. Verifique que el servidor esté ejecutándose.'
    console.error('Error al crear cuenta:', error)
  } finally {
    loading.value = false
  }
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

const resetForm = () => {
  cui.value = ''
  nit.value = ''
  firstName.value = ''
  lastName.value = ''
  username.value = ''
  email.value = ''
  password.value = ''
  phone.value = ''
  birthDate.value = ''
  genderId.value = null
  userType.value = null
  selectedSpecializations.value = []
  certificationDate.value = ''
  
  if (formRef.value) {
    formRef.value.resetValidation()
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
                    <v-form ref="formRef" @submit.prevent="createAccount" lazy-validation>
                      <div class="text-center mb-4">
                        <h2 class="text-h5 font-weight-medium grey--text text--darken-2">
                          <v-icon class="mr-2" color="grey darken-2">mdi-account-plus</v-icon>
                          Crear Cuenta
                        </h2>
                        <p class="text-body-2 grey--text">Únete a AutoXela</p>
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
                      
                      <!-- Fila CUI y NIT -->
                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="cui"
                            label="CUI"
                            prepend-inner-icon="mdi-card-account-details"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.cui]"
                            hint="13 dígitos"
                            persistent-hint
                            maxlength="13"
                          />
                        </v-col>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="nit"
                            label="NIT"
                            prepend-inner-icon="mdi-card-text"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.nit]"
                            hint="Número de identificación tributaria"
                            persistent-hint
                          />
                        </v-col>
                      </v-row>

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
                            label="Email"
                            prepend-inner-icon="mdi-email"
                            type="email"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.email]"
                            hint="tu@ejemplo.com"
                            persistent-hint
                          />
                        </v-col>
                      </v-row>
                      
                      <!-- Teléfono y Fecha de Nacimiento -->
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
                            v-model="birthDate"
                            label="Fecha de Nacimiento"
                            prepend-inner-icon="mdi-calendar"
                            type="date"
                            outlined
                            dense
                            required
                            :rules="[rules.required, rules.birthDate]"
                            hint="Debe ser mayor de 18 años"
                            persistent-hint
                          />
                        </v-col>
                      </v-row>

                      <!-- Género y Contraseña -->
                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-select
                            v-model="genderId"
                            :items="genderOptions"
                            item-title="text"
                            item-value="value"
                            label="Género"
                            prepend-inner-icon="mdi-human-male-female"
                            outlined
                            dense
                            required
                            :rules="[rules.required]"
                            hint="Seleccione su género"
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
                                  @click="onUserTypeChange(option.value)"
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

                      <!-- Sección de especialización para empleados y especialistas -->
                      <v-row v-if="isEmployeeOrSpecialist">
                        <v-col cols="12">
                          <v-card outlined class="specialization-card">
                            <v-card-title class="pb-2">
                              <v-icon class="mr-2" color="orange darken-2">mdi-star</v-icon>
                              Especialización
                            </v-card-title>
                            <v-card-text>
                              <v-row>
                                <v-col cols="12" sm="8">
                                  <div class="specialization-summary">
                                    <p class="mb-1"><strong>Especialidades seleccionadas:</strong></p>
                                    <p class="text-caption">{{ getSelectedSpecializationsText }}</p>
                                  </div>
                                </v-col>
                                <v-col cols="12" sm="4" class="text-right">
                                  <v-btn
                                    color="orange darken-2"
                                    outlined
                                    small
                                    @click="openSpecializationDialog"
                                  >
                                    <v-icon left small>mdi-cog</v-icon>
                                    Configurar
                                  </v-btn>
                                </v-col>
                              </v-row>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                      
                      <!-- Contenedor de botones -->
                      <div class="buttons-container mb-4">
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

      <!-- Diálogo de especialización -->
      <v-dialog v-model="showSpecializationDialog" max-width="800px" persistent>
        <v-card>
          <v-card-title class="headline">
            <v-icon class="mr-2" color="orange darken-2">mdi-star</v-icon>
            Seleccionar Especialización
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="certificationDate"
                  label="Fecha de Certificación"
                  type="date"
                  outlined
                  dense
                  required
                  prepend-inner-icon="mdi-calendar"
                  hint="Fecha en que obtuvo la certificación"
                  persistent-hint
                  class="mb-4"
                />
              </v-col>
            </v-row>

            <p class="mb-4"><strong>Seleccione las especialidades:</strong></p>
            
            <div class="specializations-grid">
              <v-card
                v-for="spec in specializationOptions"
                :key="spec.id"
                class="specialization-option"
                :class="{ 'selected': selectedSpecializations.includes(spec.id) }"
                @click="
                  selectedSpecializations.includes(spec.id)
                    ? selectedSpecializations.splice(selectedSpecializations.indexOf(spec.id), 1)
                    : selectedSpecializations.push(spec.id)
                "
                outlined
                elevation="1"
              >
                <v-card-text class="pa-3 text-center">
                  <v-icon
                    :color="selectedSpecializations.includes(spec.id) ? 'orange darken-2' : 'grey'"
                    size="32"
                    class="mb-2"
                  >
                    {{ spec.icon }}
                  </v-icon>
                  <div 
                    class="spec-name"
                    :class="{ 'selected-spec': selectedSpecializations.includes(spec.id) }"
                  >
                    {{ spec.name }}
                  </div>
                  <v-icon
                    v-if="selectedSpecializations.includes(spec.id)"
                    color="orange darken-2"
                    small
                    class="mt-1"
                  >
                    mdi-check-circle
                  </v-icon>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              text
              @click="cancelSpecializationSelection"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="orange darken-2"
              @click="confirmSpecializations"
              :disabled="selectedSpecializations.length === 0 || !certificationDate"
            >
              Confirmar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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