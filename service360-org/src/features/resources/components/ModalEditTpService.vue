<template>
  <ModalWrapper
    title="Редактировать услугу сторонней организации"
    @close="closeModal"
    :show-delete="canDelete"
    @save="saveData"
    @delete="handleDelete"
    :loading="isSaving || isDeleting"
  >
    <div class="form-section">
      <AppInput
        class="col-span-2"
        id="name"
        label="Наименование"
        placeholder="Введите наименование"
        v-model="form.name"
        :required="true"
      />

      <AppDropdown
        class="col-span-2"
        id="measure"
        label="Единица измерения"
        placeholder="Выберите единицу измерения"
        v-model="form.measure"
        :options="measureOptions"
        :loading="loadingMeasures"
        :required="true"
      />

      <AppInput
        class="col-span-2"
        id="description"
        label="Описание"
        placeholder="Введите описание..."
        v-model="form.description"
        type="textarea"
      />
    </div>

    <ConfirmationModal
      v-if="showConfirmModal"
      title="Удаление услуги"
      message="Вы действительно хотите удалить эту услугу?"
      @confirm="confirmDelete"
      @cancel="showConfirmModal = false" />
  </ModalWrapper>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue'
import AppInput from '@/shared/ui/FormControls/AppInput.vue'
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue'
import ConfirmationModal from '@/shared/ui/ConfirmationModal.vue'
import { useNotificationStore } from '@/app/stores/notificationStore'
import { loadMeasures, updateTpService, deleteResource } from '@/shared/api/resources/resourceService'
import { usePermissions } from '@/shared/api/auth/usePermissions'

const props = defineProps({
  serviceData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'refresh', 'deleted'])
const notificationStore = useNotificationStore()

const { hasPermission } = usePermissions()
const canDelete = computed(() => hasPermission('tps:del'))
const showConfirmModal = ref(false)

const form = ref({
  name: props.serviceData.name || '',
  measure: null,
  description: props.serviceData.rawData?.Description || '',
  rawData: props.serviceData.rawData
})

const measureOptions = ref([])

const loadingMeasures = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const loadMeasuresData = async () => {
  loadingMeasures.value = true
  try {
    measureOptions.value = await loadMeasures()

    if (props.serviceData.rawData?.meaMeasure) {
      const selectedMeasure = measureOptions.value.find(
        option => option.value === props.serviceData.rawData.meaMeasure
      )
      if (selectedMeasure) {
        form.value.measure = selectedMeasure
      }
    }
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке единиц измерения', 'error')
  } finally {
    loadingMeasures.value = false
  }
}

const saveData = async () => {
  if (isSaving.value) return

  try {
    isSaving.value = true

    if (!form.value.name || !form.value.measure) {
      notificationStore.showNotification('Пожалуйста, заполните все обязательные поля', 'error')
      return
    }

    await updateTpService(form.value)

    notificationStore.showNotification('Услуга успешно обновлена', 'success')

    emit('refresh')
    closeModal()
  } catch (error) {
    notificationStore.showNotification(error.message || 'Ошибка при обновлении услуги', 'error')
  } finally {
    isSaving.value = false
  }
}

const handleDelete = () => {
  if (!props.serviceData?.id) {
    notificationStore.showNotification('Не удалось получить ID услуги для удаления.', 'error')
    return
  }
  showConfirmModal.value = true
}

const confirmDelete = async () => {
  if (isDeleting.value) return

  showConfirmModal.value = false
  isDeleting.value = true
  try {
    await deleteResource(props.serviceData.id)
    notificationStore.showNotification('Услуга успешно удалена!', 'success')
    emit('deleted')
    closeModal()
  } catch (error) {
    console.error('Ошибка при удалении услуги:', error)
    notificationStore.showNotification('Ошибка при удалении услуги.', 'error')
  } finally {
    isDeleting.value = false
  }
}

const closeModal = () => {
  emit('close')
}

onMounted(() => {
  loadMeasuresData()
})
</script>

<style scoped>
.form-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.col-span-2 {
  grid-column: span 2;
}
</style>
