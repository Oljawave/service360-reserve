<template>
  <ModalWrapper
    title="Добавить услугу"
    @close="closeModal"
    @save="saveData"
    :loading="isSaving"
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
        class="col-span-2"
        id="price"
        label="Стоимость (₸)"
        placeholder="Введите стоимость"
        v-model="form.price"
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
  </ModalWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue'
import AppInput from '@/shared/ui/FormControls/AppInput.vue'
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue'
import AppNumberInput from '@/shared/ui/FormControls/AppNumberInput.vue'
import { useNotificationStore } from '@/app/stores/notificationStore'
import { loadMeasures } from '@/shared/api/resources/resourceService'
import { saveService } from '@/shared/api/services/serviceService'

const emit = defineEmits(['close', 'refresh'])
const notificationStore = useNotificationStore()

const form = ref({
  name: '',
  measure: null,
  price: null,
  description: ''
})

const measureOptions = ref([])
const loadingMeasures = ref(false)
const isSaving = ref(false)

const loadMeasuresData = async () => {
  loadingMeasures.value = true
  try {
    measureOptions.value = await loadMeasures()
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
    await saveService(form.value)
    notificationStore.showNotification('Услуга успешно добавлена', 'success')
    emit('refresh')
    closeModal()
  } catch (error) {
    notificationStore.showNotification(error.message || 'Ошибка при сохранении услуги', 'error')
  } finally {
    isSaving.value = false
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
