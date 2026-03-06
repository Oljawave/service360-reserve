<template>
  <ModalWrapper title="Запланировать по участку" @close="closeModal" @save="saveData" :show-save="true" :loading="isSaving">
    <div class="form-section">
      <AppDropdown
        class="full-width-item"
        id="work"
        label="Работа"
        placeholder="Выберите работу"
        v-model="form.work"
        :options="workOptions"
        :loading="loadingWorks"
        :required="true"
        @update:value="onWorkChange"
      />

      <AppDropdown
        id="section"
        label="Участок"
        placeholder="Выберите участок"
        v-model="form.section"
        :options="sectionOptions"
        :loading="loadingSections"
        :required="true"
        @update:value="onSectionChange"
      />

      <AppDropdown
        id="objectType"
        label="Тип объекта"
        placeholder="Выберите тип объекта"
        v-model="form.objectType"
        :options="objectTypeOptions"
        :loading="loadingObjectTypes"
        :required="true"
        @update:value="onObjectTypeChange"
      />

      <AppDropdown
        class="full-width-item"
        id="object"
        label="Объект"
        placeholder="Выберите объект"
        v-model="form.object"
        :options="objectOptions"
        :loading="loadingObjects"
        :required="true"
        @update:value="onObjectChange"
      />

      <FullCoordinates
        class="full-width-item"
        v-model="form.coordinates"
        @update:modelValue="updateCoordinates"
        :out-of-bounds-error="isCoordinatesOutOfBounds"
        :required="true"
      />

      <AppInput
        class="full-width-item"
        id="description"
        label="Описание"
        placeholder="Введите описание..."
        v-model="form.description"
        type="textarea"
      />

      <AppDatePicker
        id="plannedDate"
        label="Плановый срок завершения"
        placeholder="Выберите дату"
        v-model="form.plannedDate"
        :required="true"
      />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue'
import AppDatePicker from '@/shared/ui/FormControls/AppDatePicker.vue'
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue'
import AppInput from '@/shared/ui/FormControls/AppInput.vue'
import FullCoordinates from '@/shared/ui/FormControls/FullCoordinates.vue'
import { useNotificationStore } from '@/app/stores/notificationStore'
import { loadWorksList, loadSectionsByWork, loadObjectsByTypeAndCoord, savePlanBySection } from '@/shared/api/plans/planByObjectsApi'

const emit = defineEmits(['close', 'update-table'])
const notificationStore = useNotificationStore()

const form = ref({
  work: null,
  section: null,
  objectType: null,
  plannedDate: null,
  object: null,
  description: '',
  coordinates: {
    coordStartKm: 0,
    coordStartPk: 0,
    coordStartZv: 0,
    coordEndKm: 0,
    coordEndPk: 0,
    coordEndZv: 0
  }
})

const selectedSectionData = ref(null)

const selectedObjectData = ref(null)

const objectBounds = ref(null)
const isCoordinatesOutOfBounds = ref(false)

const workOptions = ref([])
const sectionOptions = ref([])
const objectTypeOptions = ref([])
const objectOptions = ref([])

const loadingWorks = ref(false)
const loadingSections = ref(false)
const loadingObjectTypes = ref(false)
const loadingObjects = ref(false)

const isSaving = ref(false)

const closeModal = () => {
  emit('close')
}

const onWorkChange = async (workId) => {
  
  form.value.section = null
  form.value.objectType = null
  form.value.object = null
  form.value.coordinates = {
    coordStartKm: 0,
    coordStartPk: 0,
    coordStartZv: 0,
    coordEndKm: 0,
    coordEndPk: 0,
    coordEndZv: 0
  }
  objectTypeOptions.value = []
  objectOptions.value = []
  selectedSectionData.value = null
  selectedObjectData.value = null
  objectBounds.value = null
  isCoordinatesOutOfBounds.value = false

  if (!workId) {
    sectionOptions.value = []
    return
  }

  loadingSections.value = true
  try {
    const sections = await loadSectionsByWork(workId)
    sectionOptions.value = sections
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке участков', 'error')
    sectionOptions.value = []
  } finally {
    loadingSections.value = false
  }
}

const onSectionChange = (sectionId) => {
  
  form.value.objectType = null
  form.value.object = null
  form.value.coordinates = {
    coordStartKm: 0,
    coordStartPk: 0,
    coordStartZv: 0,
    coordEndKm: 0,
    coordEndPk: 0,
    coordEndZv: 0
  }
  objectOptions.value = []
  selectedObjectData.value = null
  objectBounds.value = null
  isCoordinatesOutOfBounds.value = false

  if (!sectionId) {
    objectTypeOptions.value = []
    selectedSectionData.value = null
    return
  }

  const section = sectionOptions.value.find(s => s.value === sectionId)
  if (section) {
    selectedSectionData.value = section
    
    objectTypeOptions.value = (section.objObjectTypeMulti || []).map(t => ({
      label: t.name,
      value: t.id,
      cls: t.cls,
      fullName: t.fullname
    }))
  } else {
    objectTypeOptions.value = []
    selectedSectionData.value = null
  }
}

const onObjectTypeChange = async (objectTypeId) => {
  
  form.value.object = null
  form.value.coordinates = {
    coordStartKm: 0,
    coordStartPk: 0,
    coordStartZv: 0,
    coordEndKm: 0,
    coordEndPk: 0,
    coordEndZv: 0
  }
  selectedObjectData.value = null
  objectBounds.value = null
  isCoordinatesOutOfBounds.value = false

  if (!objectTypeId || !selectedSectionData.value) {
    objectOptions.value = []
    return
  }

  loadingObjects.value = true
  try {
    const objects = await loadObjectsByTypeAndCoord(
      objectTypeId,
      selectedSectionData.value.beg,
      selectedSectionData.value.end
    )
    objectOptions.value = objects
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке объектов', 'error')
    objectOptions.value = []
  } finally {
    loadingObjects.value = false
  }
}

const onObjectChange = (objectId) => {
  if (!objectId) {
    form.value.coordinates = {
      coordStartKm: 0,
      coordStartPk: 0,
      coordStartZv: 0,
      coordEndKm: 0,
      coordEndPk: 0,
      coordEndZv: 0
    }
    selectedObjectData.value = null
    objectBounds.value = null
    isCoordinatesOutOfBounds.value = false
    return
  }

  const object = objectOptions.value.find(o => o.value === objectId)
  if (object) {
    selectedObjectData.value = object

    const startZv = object.StartLink ?? 0
    const finishZv = object.FinishLink ?? 0

    form.value.coordinates = {
      coordStartKm: object.StartKm ?? null,
      coordStartPk: object.StartPicket ?? null,
      coordStartZv: startZv || null,
      coordEndKm: object.FinishKm ?? null,
      coordEndPk: object.FinishPicket ?? null,
      coordEndZv: finishZv || null
    }

    objectBounds.value = {
      startAbs: (object.StartKm || 0) * 1000 + (object.StartPicket || 0) * 100 + startZv * 25,
      endAbs: (object.FinishKm || 0) * 1000 + (object.FinishPicket || 0) * 100 + finishZv * 25,
      StartKm: object.StartKm,
      StartPicket: object.StartPicket,
      StartLink: startZv,
      FinishKm: object.FinishKm,
      FinishPicket: object.FinishPicket,
      FinishLink: finishZv
    }

    isCoordinatesOutOfBounds.value = false
  } else {
    form.value.coordinates = {
      coordStartKm: 0,
      coordStartPk: 0,
      coordStartZv: 0,
      coordEndKm: 0,
      coordEndPk: 0,
      coordEndZv: 0
    }
    selectedObjectData.value = null
    objectBounds.value = null
    isCoordinatesOutOfBounds.value = false
  }
}

const updateCoordinates = (newCoords) => {
  form.value.coordinates = newCoords

  if (objectBounds.value) {
    const newStartCoordinates = (newCoords.coordStartKm || 0) * 1000 + (newCoords.coordStartPk || 0) * 100 + (newCoords.coordStartZv || 0) * 25
    const newFinishCoordinates = (newCoords.coordEndKm || 0) * 1000 + (newCoords.coordEndPk || 0) * 100 + (newCoords.coordEndZv || 0) * 25

    const objectStartCoordinates = objectBounds.value.startAbs
    const objectFinishCoordinates = objectBounds.value.endAbs

    const isStartInBounds = newStartCoordinates >= objectStartCoordinates && newStartCoordinates <= objectFinishCoordinates

    const isFinishInBounds = newFinishCoordinates >= objectStartCoordinates && newFinishCoordinates <= objectFinishCoordinates

    if (!isStartInBounds || !isFinishInBounds) {
      isCoordinatesOutOfBounds.value = true
      notificationStore.showNotification('Координаты выходят за границы объекта', 'error')
    } else {
      isCoordinatesOutOfBounds.value = false
    }
  } else {
    isCoordinatesOutOfBounds.value = false
  }
}

const formatDateToString = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const validateForm = () => {
  if (!form.value.work) {
    notificationStore.showNotification('Не выбрана работа', 'error')
    return false
  }
  if (!form.value.section) {
    notificationStore.showNotification('Не выбран участок', 'error')
    return false
  }
  if (!form.value.objectType) {
    notificationStore.showNotification('Не выбран тип объекта', 'error')
    return false
  }
  if (!form.value.object) {
    notificationStore.showNotification('Не выбран объект', 'error')
    return false
  }
  if (!form.value.plannedDate) {
    notificationStore.showNotification('Не указан плановый срок завершения', 'error')
    return false
  }

  const coords = form.value.coordinates
  const newStartCoordinates = (coords.coordStartKm || 0) * 1000 + (coords.coordStartPk || 0) * 100 + (coords.coordStartZv || 0) * 25
  const newFinishCoordinates = (coords.coordEndKm || 0) * 1000 + (coords.coordEndPk || 0) * 100 + (coords.coordEndZv || 0) * 25

  if (objectBounds.value) {
    const objectStartCoordinates = objectBounds.value.startAbs
    const objectFinishCoordinates = objectBounds.value.endAbs

    const isStartInBounds = newStartCoordinates >= objectStartCoordinates && newStartCoordinates <= objectFinishCoordinates
    const isFinishInBounds = newFinishCoordinates >= objectStartCoordinates && newFinishCoordinates <= objectFinishCoordinates

    if (!isStartInBounds || !isFinishInBounds) {
      notificationStore.showNotification('Координаты выходят за границы объекта', 'error')
      return false
    }
  }

  return true
}

const saveData = async () => {
  if (isSaving.value) return

  if (!validateForm()) return

  isSaving.value = true
  try {
    
    const work = typeof form.value.work === 'object'
      ? form.value.work
      : workOptions.value.find(w => w.value === form.value.work)

    const section = typeof form.value.section === 'object'
      ? form.value.section
      : sectionOptions.value.find(s => s.value === form.value.section)

    const object = typeof form.value.object === 'object'
      ? form.value.object
      : objectOptions.value.find(o => o.value === form.value.object)

    await savePlanBySection({
      work,
      section,
      object,
      coordinates: form.value.coordinates,
      plannedDate: formatDateToString(form.value.plannedDate),
      description: form.value.description
    })

    notificationStore.showNotification('План успешно сохранен!', 'success')
    emit('update-table')
    closeModal()
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    const errorMessage = error.response?.data?.error?.message || error.message || 'Ошибка при сохранении'
    notificationStore.showNotification(errorMessage, 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  
  loadingWorks.value = true

  try {
    const works = await loadWorksList()
    workOptions.value = works
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке работ', 'error')
  } finally {
    loadingWorks.value = false
  }
})
</script>

<style scoped>
.form-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 0 32px 32px;
  background-color: #f9fafb;
}

.full-width-item {
  grid-column: span 2;
}

@media (max-width: 1024px) {
  .form-section {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0 16px 16px;
  }

  .full-width-item {
    grid-column: span 1;
  }
}
</style>
