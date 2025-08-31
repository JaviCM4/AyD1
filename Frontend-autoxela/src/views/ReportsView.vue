<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";

// ================================
// INTERFACES Y TIPOS
// ================================

interface ChartData {
  label: string;
  value: number;
  category: string;
}

interface DashboardResponse {
  totalActiveWorks: number;
  totalCompletedWorks: number;
  totalPendingWorks: number;
  totalIncomeThisMonth: number;
  totalIncomeThisYear: number;
  totalPendingPayments: number;
  totalPartsInStock: number;
  lowStockParts: number;
  outOfStockParts: number;
  totalEmployees: number;
  busyEmployees: number;
  availableEmployees: number;
  incomeByMonth: ChartData[];
  worksByStatus: ChartData[];
  worksByType: ChartData[];
  topMechanicsByRevenue: ChartData[];
  topUsedParts: ChartData[];
}

interface ReportType {
  value: string;
  label: string;
}

interface ReportFormat {
  value: string;
  label: string;
  mimeType: string;
  extension: string;
}

interface ReportPeriod {
  value: string;
  label: string;
}

// Definir tipos específicos para los parámetros del reporte
interface ReportParameters {
  includeCharts?: boolean;
  includeDetails?: boolean;
  groupBy?: string;
  employeeId?: string;
  clientId?: string;
  vehicleType?: string;
  [key: string]: string | boolean | number | undefined;
}

interface ReportRequest {
  reportType: string;
  format: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  parameters?: ReportParameters; // Tipo específico en lugar de Record<string, any>
}

interface ReportResponse {
  reportId: string;
  reportType: string;
  format: string;
  fileName: string;
  downloadUrl: string;
  generatedAt: string;
  generatedBy: string;
  fileSize: number;
  expiresAt: string;
  status: string;
}

interface FinancialReport {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  incomeBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
}

interface OperationalReport {
  startDate: string;
  endDate: string;
  totalWorks: number;
  completedWorks: number;
  pendingWorks: number;
}

// ================================
// ESTADO REACTIVO
// ================================

const loading = ref(false);
const dashboardLoading = ref(false);
const activeTab = ref("dashboard");

// Dashboard data
const dashboardData = ref<DashboardResponse | null>(null);

// Configuraciones
const reportTypes = ref<ReportType[]>([]);
const reportFormats = ref<ReportFormat[]>([]);
const reportPeriods = ref<ReportPeriod[]>([]);

// Formulario de generación de reportes
const reportForm = reactive<ReportRequest>({
  reportType: "",
  format: "PDF",
  period: "THIS_MONTH",
  startDate: "",
  endDate: "",
  parameters: {},
});

// Historial de reportes
const reportHistory = ref<ReportResponse[]>([]);

// Reportes específicos
const financialReport = ref<FinancialReport | null>(null);
const operationalReport = ref<OperationalReport | null>(null);

// Chart data específica
const incomeChartData = ref<ChartData[]>([]);
const workStatusChartData = ref<ChartData[]>([]);
const workTypeChartData = ref<ChartData[]>([]);

// Estados de UI
const successMessage = ref("");
const errorMessage = ref("");
const showReportDialog = ref(false);
const showHistoryDialog = ref(false);
const showChartsDialog = ref(false);

// Filtros de fechas
const dateFilters = reactive({
  startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString()
    .split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
});

// ================================
// COMPUTED PROPERTIES
// ================================

const isFormValid = computed(() => {
  return (
    reportForm.reportType &&
    reportForm.format &&
    (reportForm.period !== "CUSTOM" || (reportForm.startDate && reportForm.endDate))
  );
});

const dashboardStats = computed(() => {
  if (!dashboardData.value) return [];

  const data = dashboardData.value;
  return [
    {
      title: "Trabajos Activos",
      value: data.totalActiveWorks,
      icon: "mdi-wrench",
      color: "blue",
      subtitle: "En progreso",
    },
    {
      title: "Trabajos Completados",
      value: data.totalCompletedWorks,
      icon: "mdi-check-circle",
      color: "green",
      subtitle: "Finalizados",
    },
    {
      title: "Trabajos Pendientes",
      value: data.totalPendingWorks,
      icon: "mdi-clock",
      color: "orange",
      subtitle: "Sin iniciar",
    },
    {
      title: "Ingresos del Mes",
      value: `Q${data.totalIncomeThisMonth.toLocaleString()}`,
      icon: "mdi-currency-usd",
      color: "green",
      subtitle: "Mes actual",
    },
    {
      title: "Ingresos del Año",
      value: `Q${data.totalIncomeThisYear.toLocaleString()}`,
      icon: "mdi-trending-up",
      color: "teal",
      subtitle: "Año actual",
    },
    {
      title: "Pagos Pendientes",
      value: `Q${data.totalPendingPayments.toLocaleString()}`,
      icon: "mdi-clock-alert",
      color: "red",
      subtitle: "Por cobrar",
    },
    {
      title: "Repuestos en Stock",
      value: data.totalPartsInStock,
      icon: "mdi-package-variant",
      color: "blue",
      subtitle: "Disponibles",
    },
    {
      title: "Stock Bajo",
      value: data.lowStockParts,
      icon: "mdi-alert",
      color: "orange",
      subtitle: "Requiere atención",
    },
    {
      title: "Sin Stock",
      value: data.outOfStockParts,
      icon: "mdi-alert-octagon",
      color: "red",
      subtitle: "Crítico",
    },
    {
      title: "Total Empleados",
      value: data.totalEmployees,
      icon: "mdi-account-group",
      color: "purple",
      subtitle: "Personal total",
    },
    {
      title: "Empleados Ocupados",
      value: data.busyEmployees,
      icon: "mdi-account-wrench",
      color: "orange",
      subtitle: "Trabajando",
    },
    {
      title: "Empleados Disponibles",
      value: data.availableEmployees,
      icon: "mdi-account-check",
      color: "green",
      subtitle: "Libres",
    },
  ];
});

// ================================
// MÉTODOS
// ================================

const loadDashboardData = async () => {
  dashboardLoading.value = true;
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get("http://localhost:8080/api/v1/reports/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    dashboardData.value = response.data;
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showError("Error al cargar el dashboard");
  } finally {
    dashboardLoading.value = false;
  }
};

const loadConfigurations = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    const [typesRes, formatsRes, periodsRes] = await Promise.all([
      axios.get("http://localhost:8080/api/v1/reports/types", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:8080/api/v1/reports/formats", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:8080/api/v1/reports/periods", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    reportTypes.value = typesRes.data;
    reportFormats.value = formatsRes.data;
    reportPeriods.value = periodsRes.data;
  } catch (error) {
    console.error("Error loading configurations:", error);
  }
};

const generateReport = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  clearMessages();

  try {
    const token = localStorage.getItem("accessToken");
    const payload = { ...reportForm };

    if (reportForm.period === "CUSTOM") {
      payload.startDate = reportForm.startDate + "T00:00:00";
      payload.endDate = reportForm.endDate + "T23:59:59";
    }

    await axios.post("http://localhost:8080/api/v1/reports/generate", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    showSuccess("Reporte generado exitosamente");
    showReportDialog.value = false;
    loadReportHistory();
  } catch (error: unknown) {
    // Tipo específico para el error de axios
    const axiosError = error as { response?: { data?: { message?: string } } };
    showError(axiosError.response?.data?.message || "Error al generar reporte");
  } finally {
    loading.value = false;
  }
};

const loadReportHistory = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get("http://localhost:8080/api/v1/reports/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    reportHistory.value = response.data;
  } catch (error) {
    console.error("Error loading report history:", error);
  }
};

const downloadReport = async (reportId: string) => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(`http://localhost:8080/api/v1/reports/download/${reportId}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Obtener nombre de archivo del header
    const contentDisposition = response.headers["content-disposition"];
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : `reporte_${reportId}`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (downloadError) {
    console.error("Error downloading report:", downloadError);
    showError("Error al descargar reporte");
  }
};

const loadFinancialReport = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get("http://localhost:8080/api/v1/reports/financial", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: dateFilters.startDate + "T00:00:00",
        endDate: dateFilters.endDate + "T23:59:59",
      },
    });
    financialReport.value = response.data;
  } catch (financialError) {
    console.error("Error loading financial report:", financialError);
    showError("Error al cargar reporte financiero");
  }
};

const loadOperationalReport = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get("http://localhost:8080/api/v1/reports/operational", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: dateFilters.startDate + "T00:00:00",
        endDate: dateFilters.endDate + "T23:59:59",
      },
    });
    operationalReport.value = response.data;
  } catch (operationalError) {
    console.error("Error loading operational report:", operationalError);
    showError("Error al cargar reporte operacional");
  }
};

const loadChartData = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    const [incomeRes, statusRes, typeRes] = await Promise.all([
      axios.get("http://localhost:8080/api/v1/reports/charts/income", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateFilters.startDate + "T00:00:00",
          endDate: dateFilters.endDate + "T23:59:59",
        },
      }),
      axios.get("http://localhost:8080/api/v1/reports/charts/work-status", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:8080/api/v1/reports/charts/work-types", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateFilters.startDate + "T00:00:00",
          endDate: dateFilters.endDate + "T23:59:59",
        },
      }),
    ]);

    incomeChartData.value = incomeRes.data;
    workStatusChartData.value = statusRes.data;
    workTypeChartData.value = typeRes.data;
  } catch (chartError) {
    console.error("Error loading chart data:", chartError);
    showError("Error al cargar datos de gráficos");
  }
};

const refreshDashboard = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    await axios.post(
      "http://localhost:8080/api/v1/reports/dashboard/refresh",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    showSuccess("Dashboard actualizado");
    loadDashboardData();
  } catch (refreshError) {
    console.error("Error refreshing dashboard:", refreshError);
    showError("Error al actualizar dashboard");
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getReportIcon = (type: string) => {
  const icons: Record<string, string> = {
    FINANCIAL_INCOME: "mdi-currency-usd",
    FINANCIAL_EXPENSES: "mdi-credit-card-outline",
    WORK_BY_DATE: "mdi-calendar-clock",
    WORK_BY_TYPE: "mdi-wrench",
    WORK_BY_EMPLOYEE: "mdi-account-wrench",
    PARTS_USAGE: "mdi-cog",
    CLIENT_HISTORY: "mdi-account-group",
    DASHBOARD_SUMMARY: "mdi-view-dashboard",
  };
  return icons[type] || "mdi-file-document";
};

const showSuccess = (message: string) => {
  successMessage.value = message;
  errorMessage.value = "";
  setTimeout(() => (successMessage.value = ""), 5000);
};

const showError = (message: string) => {
  errorMessage.value = message;
  successMessage.value = "";
};

const clearMessages = () => {
  successMessage.value = "";
  errorMessage.value = "";
};

// ================================
// LIFECYCLE
// ================================

onMounted(() => {
  loadDashboardData();
  loadConfigurations();
  loadReportHistory();
});
</script>

<template>
  <v-app>
    <div class="reports-container">
      <!-- Iconos flotantes de fondo -->
      <div class="floating-icons">
        <v-icon class="floating-icon" size="24">mdi-chart-line</v-icon>
        <v-icon class="floating-icon" size="32">mdi-file-chart</v-icon>
        <v-icon class="floating-icon" size="28">mdi-analytics</v-icon>
        <v-icon class="floating-icon" size="36">mdi-chart-bar</v-icon>
        <v-icon class="floating-icon" size="20">mdi-chart-pie</v-icon>
        <v-icon class="floating-icon" size="26">mdi-trending-up</v-icon>
        <v-icon class="floating-icon" size="30">mdi-finance</v-icon>
      </div>

      <v-container fluid class="pa-6">
        <!-- Header -->
        <v-row class="mb-6">
          <v-col cols="12">
            <div class="header-section text-center">
              <v-icon size="48" class="mb-3" color="orange darken-2">mdi-chart-box</v-icon>
              <h1 class="text-h4 font-weight-bold mb-2">Centro de Reportes y Análisis</h1>
              <p class="text-subtitle1 mb-4">AutoXela - Taller Automotriz</p>

              <!-- Filtros globales de fecha -->
              <div class="date-filters">
                <v-row justify="center" align="center">
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="dateFilters.startDate"
                      label="Fecha de inicio"
                      type="date"
                      outlined
                      dense
                      prepend-inner-icon="mdi-calendar"
                      @change="
                        loadChartData();
                        loadFinancialReport();
                        loadOperationalReport();
                      "
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="dateFilters.endDate"
                      label="Fecha final"
                      type="date"
                      outlined
                      dense
                      prepend-inner-icon="mdi-calendar"
                      @change="
                        loadChartData();
                        loadFinancialReport();
                        loadOperationalReport();
                      "
                    />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-btn class="custom-btn" @click="refreshDashboard" :loading="dashboardLoading">
                      <v-icon left>mdi-refresh</v-icon>
                      Actualizar
                    </v-btn>
                  </v-col>
                </v-row>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Mensajes de estado -->
        <v-row v-if="successMessage || errorMessage" class="mb-4">
          <v-col cols="12">
            <v-alert v-if="successMessage" type="success" dismissible @input="clearMessages">
              {{ successMessage }}
            </v-alert>

            <v-alert v-if="errorMessage" type="error" dismissible @input="clearMessages">
              {{ errorMessage }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Acciones principales -->
        <v-row class="mb-6">
          <v-col cols="12" class="text-center">
            <v-btn class="custom-btn mr-3" large @click="showReportDialog = true">
              <v-icon left>mdi-file-plus</v-icon>
              Generar Reporte
            </v-btn>

            <v-btn
              class="secondary-btn mr-3"
              large
              @click="
                showHistoryDialog = true;
                loadReportHistory();
              "
            >
              <v-icon left>mdi-history</v-icon>
              Historial
            </v-btn>

            <v-btn
              class="tertiary-btn"
              large
              @click="
                showChartsDialog = true;
                loadChartData();
              "
            >
              <v-icon left>mdi-chart-multiple</v-icon>
              Gráficos
            </v-btn>
          </v-col>
        </v-row>

        <!-- Tabs principales -->
        <v-card class="reports-tabs-card elevation-8" rounded="lg">
          <v-tabs
            v-model="activeTab"
            color="orange darken-2"
            slider-color="orange darken-2"
            centered
          >
            <v-tab value="dashboard">
              <v-icon class="mr-2">mdi-view-dashboard</v-icon>
              Dashboard
            </v-tab>
            <v-tab value="financial">
              <v-icon class="mr-2">mdi-currency-usd</v-icon>
              Financiero
            </v-tab>
            <v-tab value="operational">
              <v-icon class="mr-2">mdi-wrench</v-icon>
              Operacional
            </v-tab>
            <v-tab value="inventory">
              <v-icon class="mr-2">mdi-package-variant</v-icon>
              Inventario
            </v-tab>
          </v-tabs>

          <!-- Dashboard Tab -->
          <v-window v-model="activeTab">
            <v-window-item value="dashboard">
              <v-card-text>
                <div v-if="dashboardLoading" class="text-center py-12">
                  <v-progress-circular
                    indeterminate
                    color="orange darken-2"
                    size="60"
                  ></v-progress-circular>
                  <p class="mt-4 text-h6">Cargando dashboard...</p>
                </div>

                <div v-else-if="dashboardData">
                  <!-- Estadísticas principales -->
                  <v-row>
                    <v-col
                      v-for="stat in dashboardStats"
                      :key="stat.title"
                      cols="12"
                      sm="6"
                      md="4"
                      lg="3"
                    >
                      <v-card class="stat-card elevation-4" rounded="lg">
                        <v-card-text class="text-center">
                          <v-icon size="48" :color="stat.color" class="mb-3">
                            {{ stat.icon }}
                          </v-icon>
                          <h3 class="text-h4 font-weight-bold mb-2">{{ stat.value }}</h3>
                          <p class="text-subtitle1 font-weight-medium mb-1">{{ stat.title }}</p>
                          <p class="text-caption grey--text">{{ stat.subtitle }}</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Gráficos del dashboard -->
                  <v-row class="mt-6" v-if="dashboardData.incomeByMonth?.length">
                    <v-col cols="12" md="6">
                      <v-card class="chart-card elevation-6" rounded="lg">
                        <v-card-title class="chart-header">
                          <v-icon class="mr-2">mdi-chart-line</v-icon>
                          Ingresos por Mes
                        </v-card-title>
                        <v-card-text>
                          <div class="chart-placeholder">
                            <!-- Aquí iría Chart.js o similar -->
                            <div class="text-center py-8">
                              <v-icon size="64" color="grey lighten-1">mdi-chart-line</v-icon>
                              <p class="mt-2">Gráfico de ingresos mensuales</p>
                              <small
                                >{{ dashboardData.incomeByMonth.length }} datos disponibles</small
                              >
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-card class="chart-card elevation-6" rounded="lg">
                        <v-card-title class="chart-header">
                          <v-icon class="mr-2">mdi-chart-donut</v-icon>
                          Trabajos por Estado
                        </v-card-title>
                        <v-card-text>
                          <div class="chart-placeholder">
                            <div class="text-center py-8">
                              <v-icon size="64" color="grey lighten-1">mdi-chart-donut</v-icon>
                              <p class="mt-2">Distribución de trabajos</p>
                              <small
                                >{{ dashboardData.worksByStatus?.length || 0 }} categorías</small
                              >
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-window-item>

            <!-- Financial Tab -->
            <v-window-item value="financial">
              <v-card-text>
                <div class="financial-section">
                  <div class="d-flex align-center mb-4">
                    <h2 class="text-h5 font-weight-bold">
                      <v-icon class="mr-2" color="orange darken-2">mdi-currency-usd</v-icon>
                      Reportes Financieros
                    </h2>
                    <v-spacer />
                    <v-btn color="orange darken-2" @click="loadFinancialReport">
                      <v-icon left>mdi-refresh</v-icon>
                      Actualizar
                    </v-btn>
                  </div>

                  <v-row v-if="financialReport">
                    <v-col cols="12" md="3">
                      <v-card class="financial-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="green" class="mb-2">mdi-trending-up</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            Q{{ financialReport.totalIncome.toLocaleString() }}
                          </h3>
                          <p class="text-subtitle2">Ingresos Totales</p>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="3">
                      <v-card class="financial-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="red" class="mb-2">mdi-trending-down</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            Q{{ financialReport.totalExpenses.toLocaleString() }}
                          </h3>
                          <p class="text-subtitle2">Egresos Totales</p>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="3">
                      <v-card class="financial-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="blue" class="mb-2">mdi-calculator</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            Q{{ financialReport.netProfit.toLocaleString() }}
                          </h3>
                          <p class="text-subtitle2">Utilidad Neta</p>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="3">
                      <v-card class="financial-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="purple" class="mb-2">mdi-percent</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            {{ financialReport.profitMargin.toFixed(1) }}%
                          </h3>
                          <p class="text-subtitle2">Margen de Utilidad</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-row class="mt-4">
                    <v-col cols="12">
                      <v-btn
                        class="custom-btn mr-3"
                        @click="
                          showReportDialog = true;
                          reportForm.reportType = 'FINANCIAL_INCOME';
                        "
                      >
                        <v-icon left>mdi-file-plus</v-icon>
                        Reporte de Ingresos
                      </v-btn>

                      <v-btn
                        class="custom-btn"
                        @click="
                          showReportDialog = true;
                          reportForm.reportType = 'FINANCIAL_EXPENSES';
                        "
                      >
                        <v-icon left>mdi-file-plus</v-icon>
                        Reporte de Egresos
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-window-item>

            <!-- Operational Tab -->
            <v-window-item value="operational">
              <v-card-text>
                <div class="operational-section">
                  <div class="d-flex align-center mb-4">
                    <h2 class="text-h5 font-weight-bold">
                      <v-icon class="mr-2" color="orange darken-2">mdi-wrench</v-icon>
                      Reportes Operacionales
                    </h2>
                    <v-spacer />
                    <v-btn color="orange darken-2" @click="loadOperationalReport">
                      <v-icon left>mdi-refresh</v-icon>
                      Actualizar
                    </v-btn>
                  </div>

                  <v-row v-if="operationalReport">
                    <v-col cols="12" md="4">
                      <v-card class="operational-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="blue" class="mb-2">mdi-wrench</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            {{ operationalReport.totalWorks }}
                          </h3>
                          <p class="text-subtitle2">Total de Trabajos</p>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-card class="operational-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="green" class="mb-2">mdi-check-circle</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            {{ operationalReport.completedWorks }}
                          </h3>
                          <p class="text-subtitle2">Trabajos Completados</p>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-card class="operational-stat-card elevation-4">
                        <v-card-text class="text-center">
                          <v-icon size="36" color="orange" class="mb-2">mdi-clock</v-icon>
                          <h3 class="text-h5 font-weight-bold">
                            {{ operationalReport.pendingWorks }}
                          </h3>
                          <p class="text-subtitle2">Trabajos Pendientes</p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-row class="mt-4">
                    <v-col cols="12">
                      <v-btn
                        class="custom-btn mr-3"
                        @click="
                          showReportDialog = true;
                          reportForm.reportType = 'WORK_BY_DATE';
                        "
                      >
                        <v-icon left>mdi-file-plus</v-icon>
                        Trabajos por Fecha
                      </v-btn>

                      <v-btn
                        class="custom-btn mr-3"
                        @click="
                          showReportDialog = true;
                          reportForm.reportType = 'WORK_BY_EMPLOYEE';
                        "
                      >
                        <v-icon left>mdi-file-plus</v-icon>
                        Trabajos por Empleado
                      </v-btn>

                      <v-btn
                        class="custom-btn"
                        @click="
                          showReportDialog = true;
                          reportForm.reportType = 'PREVENTIVE_MAINTENANCE';
                        "
                      >
                        <v-icon left>mdi-file-plus</v-icon>
                        Mantenimientos
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-window-item>

            <!-- Inventory Tab -->
            <v-window-item value="inventory">
              <v-card-text>
                <div class="inventory-section">
                  <div class="d-flex align-center mb-4">
                    <h2 class="text-h5 font-weight-bold">
                      <v-icon class="mr-2" color="orange darken-2">mdi-package-variant</v-icon>
                      Reportes de Inventario
                    </h2>
                  </div>

                  <v-row>
                    <v-col cols="12" md="4">
                      <v-card class="inventory-option-card elevation-4" rounded="lg">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="blue" class="mb-3">mdi-cog</v-icon>
                          <h3 class="text-h6 font-weight-bold mb-2">Uso de Repuestos</h3>
                          <p class="text-body-2 mb-4">Estadísticas de utilización por período</p>
                          <v-btn
                            class="custom-btn"
                            @click="
                              showReportDialog = true;
                              reportForm.reportType = 'PARTS_USAGE';
                            "
                          >
                            Generar Reporte
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-card class="inventory-option-card elevation-4" rounded="lg">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="green" class="mb-3">mdi-car</v-icon>
                          <h3 class="text-h6 font-weight-bold mb-2">Repuestos por Vehículo</h3>
                          <p class="text-body-2 mb-4">Uso por marca y modelo</p>
                          <v-btn
                            class="custom-btn"
                            @click="
                              showReportDialog = true;
                              reportForm.reportType = 'PARTS_BY_BRAND';
                            "
                          >
                            Generar Reporte
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-card class="inventory-option-card elevation-4" rounded="lg">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="red" class="mb-3">mdi-alert</v-icon>
                          <h3 class="text-h6 font-weight-bold mb-2">Estado de Stock</h3>
                          <p class="text-body-2 mb-4">Alertas y disponibilidad</p>
                          <v-btn
                            class="custom-btn"
                            @click="
                              showReportDialog = true;
                              reportForm.reportType = 'INVENTORY_STOCK';
                            "
                          >
                            Generar Reporte
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </v-container>

      <!-- Dialog: Generar Reporte -->
      <v-dialog v-model="showReportDialog" max-width="600px" persistent>
        <v-card class="report-dialog-card">
          <v-card-title class="report-dialog-header">
            <v-icon size="32" color="white" class="mr-3">mdi-file-plus</v-icon>
            <h2 class="text-h5 font-weight-bold">Generar Nuevo Reporte</h2>
            <v-spacer />
            <v-btn icon @click="showReportDialog = false">
              <v-icon color="white">mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-6">
            <v-form @submit.prevent="generateReport">
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="reportForm.reportType"
                    :items="reportTypes"
                    item-title="label"
                    item-value="value"
                    label="Tipo de Reporte"
                    prepend-inner-icon="mdi-file-document"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="reportForm.format"
                    :items="reportFormats"
                    item-title="label"
                    item-value="value"
                    label="Formato"
                    prepend-inner-icon="mdi-file-export"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="reportForm.period"
                    :items="reportPeriods"
                    item-title="label"
                    item-value="value"
                    label="Período"
                    prepend-inner-icon="mdi-calendar-range"
                    outlined
                    dense
                  />
                </v-col>

                <v-col cols="12" sm="6" v-if="reportForm.period === 'CUSTOM'">
                  <v-text-field
                    v-model="reportForm.startDate"
                    label="Fecha de inicio"
                    type="date"
                    prepend-inner-icon="mdi-calendar"
                    outlined
                    dense
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6" v-if="reportForm.period === 'CUSTOM'">
                  <v-text-field
                    v-model="reportForm.endDate"
                    label="Fecha final"
                    type="date"
                    prepend-inner-icon="mdi-calendar"
                    outlined
                    dense
                    required
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions class="pa-6 pt-0">
            <v-spacer />
            <v-btn text @click="showReportDialog = false"> Cancelar </v-btn>
            <v-btn
              class="custom-btn ml-2"
              @click="generateReport"
              :loading="loading"
              :disabled="!isFormValid"
            >
              <v-icon left>mdi-check</v-icon>
              Generar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog: Historial de Reportes -->
      <v-dialog v-model="showHistoryDialog" max-width="800px" persistent>
        <v-card class="history-dialog-card">
          <v-card-title class="history-dialog-header">
            <v-icon size="32" color="white" class="mr-3">mdi-history</v-icon>
            <h2 class="text-h5 font-weight-bold">Historial de Reportes</h2>
            <v-spacer />
            <v-btn icon @click="showHistoryDialog = false">
              <v-icon color="white">mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-data-table
              :headers="[
                { title: 'Tipo', value: 'reportType', sortable: true },
                { title: 'Formato', value: 'format', sortable: true },
                { title: 'Generado', value: 'generatedAt', sortable: true },
                { title: 'Tamaño', value: 'fileSize', sortable: false },
                { title: 'Estado', value: 'status', sortable: true },
                { title: 'Acciones', value: 'actions', sortable: false },
              ]"
              :items="reportHistory"
              class="report-history-table"
            >
              <template v-slot:[`item.reportType`]="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">{{ getReportIcon(item.reportType) }}</v-icon>
                  {{
                    reportTypes.find((t) => t.value === item.reportType)?.label || item.reportType
                  }}
                </div>
              </template>

              <template v-slot:[`item.generatedAt`]="{ item }">
                {{ formatDate(item.generatedAt) }}
              </template>

              <template v-slot:[`item.fileSize`]="{ item }">
                {{ formatFileSize(item.fileSize) }}
              </template>

              <template v-slot:[`item.status`]="{ item }">
                <v-chip
                  :color="item.status === 'COMPLETED' ? 'green' : 'orange'"
                  text-color="white"
                  small
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:[`item.actions`]="{ item }">
                <v-btn
                  icon
                  small
                  color="blue"
                  @click="downloadReport(item.reportId)"
                  :disabled="item.status !== 'COMPLETED'"
                >
                  <v-icon small>mdi-download</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Dialog: Gráficos -->
      <v-dialog v-model="showChartsDialog" max-width="1000px" persistent>
        <v-card class="charts-dialog-card">
          <v-card-title class="charts-dialog-header">
            <v-icon size="32" color="white" class="mr-3">mdi-chart-multiple</v-icon>
            <h2 class="text-h5 font-weight-bold">Gráficos y Analítica</h2>
            <v-spacer />
            <v-btn icon @click="showChartsDialog = false">
              <v-icon color="white">mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <v-card class="chart-preview-card elevation-4">
                  <v-card-title>
                    <v-icon class="mr-2">mdi-chart-line</v-icon>
                    Ingresos por Período
                  </v-card-title>
                  <v-card-text>
                    <div class="chart-preview">
                      <v-icon size="64" color="grey lighten-1">mdi-chart-line</v-icon>
                      <p class="mt-2">{{ incomeChartData.length }} datos disponibles</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="chart-preview-card elevation-4">
                  <v-card-title>
                    <v-icon class="mr-2">mdi-chart-donut</v-icon>
                    Estados de Trabajo
                  </v-card-title>
                  <v-card-text>
                    <div class="chart-preview">
                      <v-icon size="64" color="grey lighten-1">mdi-chart-donut</v-icon>
                      <p class="mt-2">{{ workStatusChartData.length }} categorías</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="chart-preview-card elevation-4">
                  <v-card-title>
                    <v-icon class="mr-2">mdi-chart-bar</v-icon>
                    Tipos de Trabajo
                  </v-card-title>
                  <v-card-text>
                    <div class="chart-preview">
                      <v-icon size="64" color="grey lighten-1">mdi-chart-bar</v-icon>
                      <p class="mt-2">{{ workTypeChartData.length }} tipos</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card class="chart-preview-card elevation-4">
                  <v-card-title>
                    <v-icon class="mr-2">mdi-chart-pie</v-icon>
                    Rendimiento General
                  </v-card-title>
                  <v-card-text>
                    <div class="chart-preview">
                      <v-icon size="64" color="grey lighten-1">mdi-chart-pie</v-icon>
                      <p class="mt-2">Dashboard integrado</p>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
  </v-app>
</template>

<style scoped>
.reports-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  background-attachment: fixed;
  min-height: 100vh;
  position: relative;
}

.reports-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.floating-icons {
  position: fixed;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-icon {
  position: absolute;
  opacity: 0.05;
  color: #ff6b35;
  animation: float 8s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-25px) rotate(10deg);
  }
}

.floating-icon:nth-child(1) {
  top: 15%;
  left: 10%;
  animation-delay: 0s;
}
.floating-icon:nth-child(2) {
  top: 25%;
  right: 15%;
  animation-delay: 1s;
}
.floating-icon:nth-child(3) {
  bottom: 35%;
  left: 20%;
  animation-delay: 2s;
}
.floating-icon:nth-child(4) {
  bottom: 25%;
  right: 10%;
  animation-delay: 3s;
}
.floating-icon:nth-child(5) {
  top: 55%;
  left: 8%;
  animation-delay: 4s;
}
.floating-icon:nth-child(6) {
  top: 65%;
  right: 25%;
  animation-delay: 5s;
}
.floating-icon:nth-child(7) {
  bottom: 45%;
  left: 45%;
  animation-delay: 6s;
}

.header-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 32px;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.date-filters {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.reports-tabs-card,
.stat-card,
.chart-card,
.financial-stat-card,
.operational-stat-card,
.inventory-option-card,
.report-dialog-card,
.history-dialog-card,
.charts-dialog-card,
.chart-preview-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-header,
.report-dialog-header,
.history-dialog-header,
.charts-dialog-header {
  background: linear-gradient(45deg, #ff6b35, #f7931e) !important;
  color: white !important;
  font-weight: bold;
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

.secondary-btn {
  background: linear-gradient(45deg, #424242, #616161) !important;
  color: white !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border-radius: 20px !important;
}

.secondary-btn:hover {
  background: linear-gradient(45deg, #616161, #424242) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 66, 66, 0.3) !important;
}

.tertiary-btn {
  background: linear-gradient(45deg, #1976d2, #1565c0) !important;
  color: white !important;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border-radius: 20px !important;
}

.tertiary-btn:hover {
  background: linear-gradient(45deg, #1565c0, #1976d2) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.3) !important;
}

.stat-card,
.financial-stat-card,
.operational-stat-card {
  transition: all 0.3s ease;
  height: 100%;
}

.stat-card:hover,
.financial-stat-card:hover,
.operational-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.2) !important;
}

.inventory-option-card {
  transition: all 0.3s ease;
  height: 100%;
  cursor: pointer;
}

.inventory-option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.2) !important;
}

.chart-placeholder,
.chart-preview {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(248, 248, 248, 0.5);
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.report-history-table {
  background: transparent !important;
}

/* Responsive */
@media (max-width: 960px) {
  .header-section {
    padding: 24px 16px;
  }

  .header-section h1 {
    font-size: 1.8rem !important;
  }

  .date-filters .v-col {
    padding: 8px;
  }

  .stat-card,
  .financial-stat-card,
  .operational-stat-card,
  .inventory-option-card {
    margin-bottom: 16px;
  }
}

@media (max-width: 600px) {
  .floating-icons {
    display: none;
  }

  .header-section {
    padding: 16px;
  }

  .chart-placeholder,
  .chart-preview {
    min-height: 150px;
  }

  .custom-btn,
  .secondary-btn,
  .tertiary-btn {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style>
