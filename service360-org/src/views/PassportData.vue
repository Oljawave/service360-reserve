<template>
  <div class="passport-data-page">
    <div class="header">
      <BackButton @click="goBack" />
      <h1>Паспортные данные: {{ objectName }}</h1>
    </div>

    <div class="table-section">
      <div class="table-header">
        <h2>Список паспортных данных</h2>
        <div class="table-subheader">
          <p class="subtitle">
            Паспортные данные объекта
          </p>
          <span class="total-count">Всего записей: {{ tableData.length }}</span>
        </div>
      </div>
      <BaseTable
        :columns="columns"
        :rows="tableData"
        :loading="isLoading"
        :expanded-rows="[]"
        :toggle-row-expand="() => {}"
        :children-map="{}"
        :active-filters="{}"
        :showFilters="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '@/app/stores/notificationStore'
import BaseTable from '@/app/layouts/Table/BaseTable.vue'
import BackButton from '@/shared/ui/BackButton.vue'
import { loadComplexObjectPassport } from '@/shared/api/objects/objectService'

const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()

const isLoading = ref(false)
const tableData = ref([])
const objectName = ref('')

const objectId = computed(() => route.params.id)

const columns = [
  { key: 'nameComponent', label: 'Компонент' },
  { key: 'namePassportComponentParams', label: 'Параметр' },
  { key: 'signs', label: 'Признаки' },
  { key: 'namePassportMeasure', label: 'Единица измерения' },
  { key: 'PassportVal', label: 'Значение' },
]

const mapRecordToTableRow = (record) => ({
  id: record.id,
  idPassportComplex: record.idPassportComplex,
  PassportComplex: record.PassportComplex,
  idPassportComponentParams: record.idPassportComponentParams,
  relobjPassportComponentParams: record.relobjPassportComponentParams,
  pvPassportComponentParams: record.pvPassportComponentParams,
  namePassportComponentParams: record.namePassportComponentParams || '',
  objComponent: record.objComponent,
  nameComponent: record.nameComponent || '',
  idPassportMeasure: record.idPassportMeasure,
  meaPassportMeasure: record.meaPassportMeasure,
  pvPassportMeasure: record.pvPassportMeasure,
  namePassportMeasure: record.namePassportMeasure || '',
  idPassportVal: record.idPassportVal,
  PassportVal: record.PassportVal,
  objPassportSignMulti: record.objPassportSignMulti || [],
  signs: record.objPassportSignMulti?.map(s => s.name).join(', ') || ''
})

const goBack = () => {
  router.push({ name: 'ServicedObjects' })
}

const loadData = async () => {
  if (!objectId.value) {
    notificationStore.showNotification('ID объекта не указан', 'error')
    return
  }

  isLoading.value = true
  try {
    const records = await loadComplexObjectPassport(objectId.value)
    tableData.value = records.map(mapRecordToTableRow)

    // Получаем имя объекта из query параметров
    if (route.query.name) {
      objectName.value = route.query.name
    }
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке паспортных данных', 'error')
    tableData.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.passport-data-page {
  padding: 24px;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  font-family: system-ui;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.table-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

.total-count {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .passport-data-page {
    padding: 16px;
  }

  .header h1 {
    font-size: 18px;
  }

  .table-section {
    padding: 20px;
  }

  .table-header h2 {
    font-size: 16px;
  }

  .table-subheader {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .passport-data-page {
    padding: 12px;
  }

  .header {
    gap: 12px;
    margin-bottom: 16px;
  }

  .header h1 {
    font-size: 16px;
  }

  .table-section {
    padding: 16px;
    overflow-x: auto;
  }

  .table-header {
    margin-bottom: 16px;
  }

  .table-header h2 {
    font-size: 15px;
  }
}
</style>
