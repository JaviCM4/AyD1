<script setup lang="ts">
</script>

<template>
  <v-app>
    <v-main>
      <!-- Sección Principal -->
      <section class="main-section">
        <v-container>
          <v-row align="center">
            <v-col cols="12" md="6">
              <div class="company-info">
                <h1 class="display-1 font-weight-bold mb-4">AutoXela Taller Automotriz</h1>
                <p class="text-h6 mb-4 grey--text text--darken-1">
                  Somos un taller automotriz con más de 15 años de experiencia brindando servicios 
                  de calidad en Quetzaltenango, Quetzaltenango. Nuestro compromiso es mantener 
                  su vehículo en óptimas condiciones con la mejor atención y precios justos.
                </p>
                <p class="text-body-1 mb-4 grey--text text--darken-2">
                  Contamos con técnicos especializados y equipos modernos para ofrecerle el mejor 
                  servicio en mantenimiento preventivo, reparaciones mayores y diagnósticos 
                  computarizados. Su confianza es nuestro mayor compromiso.
                </p>
                <div class="workshop-badge-main d-inline-block">
                  <v-icon class="mr-2">mdi-shield-check</v-icon>
                  Taller Certificado desde 2010
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" md="6" class="text-center">
              <v-img
                src="https://tse3.mm.bing.net/th/id/OIP.ajm4-KZKjCKBgJxXWMcYaQHaE8?rs=1&pid=ImgDetMain&o=7&rm=3"
                max-width="500"
                class="car-image mx-auto"
              ></v-img>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Sección Misión, Visión y Valores -->
      <section class="values-section">
        <v-container>
          <v-row>
            <v-col cols="12" md="4">
              <v-card class="values-card elevation-8 h-100">
                <v-card-title class="text-center pb-2">
                  <div class="w-100">
                    <v-icon size="48" color="orange darken-2" class="mb-3">mdi-target</v-icon>
                    <h3 class="text-h5 font-weight-bold">Misión</h3>
                  </div>
                </v-card-title>
                <v-card-text class="text-center">
                  <p class="text-body-1">
                    Brindar servicios automotrices de alta calidad con honestidad, 
                    profesionalismo y tecnología moderna, garantizando la satisfacción 
                    total de nuestros clientes y la seguridad de sus vehículos.
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-card class="values-card elevation-8 h-100">
                <v-card-title class="text-center pb-2">
                  <div class="w-100">
                    <v-icon size="48" color="orange darken-2" class="mb-3">mdi-eye</v-icon>
                    <h3 class="text-h5 font-weight-bold">Visión</h3>
                  </div>
                </v-card-title>
                <v-card-text class="text-center">
                  <p class="text-body-1">
                    Ser el taller automotriz líder en la región de San Marcos, 
                    reconocido por nuestra excelencia en el servicio, innovación 
                    tecnológica y compromiso con la comunidad.
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-card class="values-card elevation-8 h-100">
                <v-card-title class="text-center pb-2">
                  <div class="w-100">
                    <v-icon size="48" color="orange darken-2" class="mb-3">mdi-heart</v-icon>
                    <h3 class="text-h5 font-weight-bold">Valores</h3>
                  </div>
                </v-card-title>
                <v-card-text class="text-center">
                  <p class="text-body-1">
                    Honestidad, Responsabilidad, Calidad, Puntualidad, 
                    Respeto y Compromiso con el medio ambiente. 
                    Trabajamos con transparencia y dedicación en cada servicio.
                  </p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Contacto -->
      <section class="contact-section">
        <v-container>
          <v-row>
            <v-col cols="12" class="text-center mb-8">
              <h2 class="display-1 font-weight-bold mb-4 text-white">Contáctanos</h2>
              <p class="text-h6 text-white">Estamos aquí para ayudarte</p>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="4" class="text-center">
              <v-card class="contact-card elevation-8 pa-6">
                <v-icon size="48" color="orange darken-2" class="mb-4">mdi-phone</v-icon>
                <h3 class="text-h6 font-weight-bold mb-2">Teléfono</h3>
                <p class="text-body-1">+502 7761-2345</p>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="4" class="text-center">
              <v-card class="contact-card elevation-8 pa-6">
                <v-icon size="48" color="orange darken-2" class="mb-4">mdi-map-marker</v-icon>
                <h3 class="text-h6 font-weight-bold mb-2">Ubicación</h3>
                <p class="text-body-1">Quetzaltenango<br>Quetzaltenango, Guatemala</p>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="4" class="text-center">
              <v-card class="contact-card elevation-8 pa-6">
                <v-icon size="48" color="orange darken-2" class="mb-4">mdi-clock</v-icon>
                <h3 class="text-h6 font-weight-bold mb-2">Horarios</h3>
                <p class="text-body-1">Lun - Vie: 8:00 - 18:00<br>Sáb: 8:00 - 14:00</p>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>
    </v-main>

    <!-- Footer -->
    <v-footer color="#1a1a1a" padless>
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <div class="d-flex align-center">
              <v-icon color="orange darken-2" class="mr-2">mdi-car-wrench</v-icon>
              <span class="text-h6 font-weight-bold text-white">AutoXela</span>
            </div>
            <p class="text-white mt-2 mb-0">
              &copy; 2025 AutoXela Taller Automotriz. Todos los derechos reservados.
            </p>
          </v-col>
          
          <v-col cols="12" md="6" class="text-md-right">
            <v-btn icon color="orange darken-2" class="mr-2">
              <v-icon>mdi-facebook</v-icon>
            </v-btn>
            <v-btn icon color="orange darken-2" class="mr-2">
              <v-icon>mdi-instagram</v-icon>
            </v-btn>
            <v-btn icon color="orange darken-2">
              <v-icon>mdi-whatsapp</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style scoped>
.main-section {
  padding: 80px 0;
  background: #f57b18;
}

.company-info {
  padding: 20px;
  background-color: #fff;
  border-radius: 16px !important;
}

.car-image {
  border-radius: 16px !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.workshop-badge-main {
  background: linear-gradient(45deg, #424242, #616161);
  color: white;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Sección Valores */
.values-section {
  padding: 80px 0;
  background: #fff;
}

.values-card {
  background: rgba(99, 99, 99, 0.95) !important;
  backdrop-filter: blur(10px);
  border-radius: 16px !important;
  transition: all 0.3s ease;
  padding: 20px;
}

.values-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(255, 107, 53, 0.15) !important;
}

/* Sección de contacto */
.contact-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
}

.contact-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border-radius: 16px !important;
  transition: all 0.3s ease;
  height: 100%;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .main-section {
    padding: 60px 0;
  }
  
  .values-section {
    padding: 60px 0;
  }
  
  .display-1 {
    font-size: 2rem !important;
  }
  
  .text-h6 {
    font-size: 1.1rem !important;
  }
  
  .car-image {
    margin-top: 40px;
  }
  
  .company-info {
    text-align: center;
  }
  
  .values-card {
    margin-bottom: 20px;
  }
  
  .contact-section {
    padding: 60px 0;
  }
  
  .contact-card {
    margin-bottom: 16px;
  }
  
  .v-footer .v-col:last-child {
    text-align: center !important;
    margin-top: 16px;
  }
}
</style>