<template>
  <ModalWrapper
    title="Редактировать услугу"
    @close="closeModal"
    @save="saveData"
    @delete="handleDelete"
    :show-delete="canDelete"
    :show-save="canUpdate"
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
        label="Ед. измерения"
        placeholder="Выберите единицу измерения"
        v-model="form.measure"
        :options="measureOptions"
        :loading="loadingMeasures"
        :required="true"
      />

      <AppNumberInput
        id="quantity"
        label="Количество"
        placeholder="Введите количество"
        v-model="form.quantity"
      />

      <AppNumberInput
        id="price"
        label="Цена за единицу (₸)"
        placeholder="Введите цену"
        v-model="form.price"
        :allowDecimal="true"
      />

      <AppNumberInput
        class="col-span-2"
        id="cost"
        label="Сумма (₸)"
        placeholder="0"
        v-model="form.cost"
        :disabled="true"
        :format="formatCost"
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
      @cancel="showConfirmModal = false"
    />
  </ModalWrapper>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue'
import AppInput from '@/shared/ui/FormControls/AppInput.vue'
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue'
import AppNumberInput from '@/shared/ui/FormControls/AppNumberInput.vue'
import ConfirmationModal from '@/shared/ui/ConfirmationModal.vue'
import { useNotificationStore } from '@/app/stores/notificationStore'
import { loadMeasures } from '@/shared/api/resources/resourceService'
import { updateService, deleteService } from '@/shared/api/services/serviceService'
import { usePermissions } from '@/shared/api/auth/usePermissions'

const props = defineProps({
  serviceData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'refresh'])
const notificationStore = useNotificationStore()

const { hasPermission } = usePermissions()
const canUpdate = computed(() => hasPermission('serv:upd'))
const canDelete = computed(() => hasPermission('serv:del'))

const form = ref({
  name: props.serviceData.name || '',
  measure: null,
  quantity: props.serviceData.quantity ?? null,
  price: props.serviceData.price ?? null,
  cost: props.serviceData.cost ?? null,
  description: props.serviceData.rawData?.Description || '',
  rawData: props.serviceData.rawData
})

const measureOptions = ref([])
const loadingMeasures = ref(false)
const isSaving = ref(false)

watch(
  () => [form.value.price, form.value.quantity],
  ([price, quantity]) => {
    form.value.cost = Math.round((price ?? 0) * (quantity ?? 0) * 1000) / 1000
  }
)

const formatCost = (v) => {
  if (v === null || v === undefined) return ''
  return v.toFixed(3).replace(/\.?0+$/, '')
}

const isDeleting = ref(false)
const showConfirmModal = ref(false)

const loadMeasuresData = async () => {
  loadingMeasures.value = true
  try {
    measureOptions.value = await loadMeasures()

    if (props.serviceData.rawData?.meaMeasure) {
      const selected = measureOptions.value.find(
        o => o.value === props.serviceData.rawData.meaMeasure
      )
      if (selected) form.value.measure = selected
    }
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке единиц измерения', 'error')
  } finally {
    loadingMeasures.value = false
  }
}

const saveData = async () => {
  if (isSaving.value) return

  if (!form.value.name || !form.value.measure) {
    notificationStore.showNotification('Пожалуйста, заполните все обязательные поля', 'error')
    return
  }

  try {
    isSaving.value = true
    await updateService(form.value)
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
    await deleteService(props.serviceData.id)
    notificationStore.showNotification('Услуга успешно удалена', 'success')
    emit('refresh')
    closeModal()
  } catch (error) {
    notificationStore.showNotification('Ошибка при удалении услуги', 'error')
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
