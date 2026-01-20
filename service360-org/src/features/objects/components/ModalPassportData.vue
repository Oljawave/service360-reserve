<template>
  <ModalWrapper
    title="Паспортные данные"
    @close="closeModal"
    @save="saveData"
    :showSave="true"
    :loading="isSaving"
  >
    <div class="form-section">
      <div v-for="(item, index) in form.items" :key="item.id" class="col-span-2">
        <div class="item-header">
          <h4 class="section-title">Запись #{{ index + 1 }}</h4>
          <span v-if="index > 0" class="remove-item" @click="removeItem(index)">×</span>
        </div>

        <div class="item-grid">
          <AppDropdown
            class="full-width"
            :id="'component-' + item.id"
            label="Компонент"
            placeholder="Выберите компонент"
            v-model="item.component"
            :options="componentOptions"
            :loading="loadingComponents"
            @update:value="(val) => handleComponentChange(val, index)"
          />

          <AppDropdown
            class="full-width"
            :id="'parameter-' + item.id"
            label="Параметр"
            placeholder="Выберите параметр"
            v-model="item.parameter"
            :options="item.parameterOptions"
            :loading="item.loadingParameters"
            @update:value="(val) => handleParameterChange(val, index)"
          />

          <MultipleSelect
            class="full-width"
            :id="'signs-' + item.id"
            label="Признак"
            v-model="item.signs"
            :options="item.signOptions"
            :loading="item.loadingSigns"
            :singlePerGroup="true"
          />

          <AppDropdown
            :id="'unit-' + item.id"
            label="Единица измерения"
            placeholder="Выберите единицу"
            v-model="item.unit"
            :options="unitOptions"
            :loading="loadingUnits"
          />

          <AppNumberInput
            :id="'value-' + item.id"
            label="Значение"
            placeholder="Введите значение"
            v-model="item.value"
            :allowDecimal="true"
            :step="0.01"
          />
        </div>
      </div>

      <div class="divider col-span-2"></div>

      <div class="col-span-2">
        <UiButton
          text="Добавить запись"
          icon="Plus"
          :loading="isAddingItem"
          @click="addItem"
        />
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue'
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue'
import AppNumberInput from '@/shared/ui/FormControls/AppNumberInput.vue'
import MultipleSelect from '@/shared/ui/FormControls/MultipleSelect.vue'
import UiButton from '@/shared/ui/UiButton.vue'
import { loadComponentsByObjectType, loadParametersByComponent, loadMeasureUnits, loadSignsByParameter, saveComplexObjectPassport } from '@/shared/api/objects/objectService'
import { useNotificationStore } from '@/app/stores/notificationStore'

const notificationStore = useNotificationStore()

const props = defineProps({
  rowData: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save'])

let nextItemId = 1
const generateItemId = () => nextItemId++

const createNewItem = () => ({
  id: generateItemId(),
  component: null,
  parameter: null,
  signs: [],
  unit: null,
  value: null,
  parameterOptions: [],
  loadingParameters: false,
  signOptions: [],
  signRawData: [], // Сырые данные признаков для сохранения
  loadingSigns: false
})

const form = ref({
  items: [createNewItem()]
})

const componentOptions = ref([])
const unitOptions = ref([])

const loadingComponents = ref(false)
const loadingUnits = ref(false)
const isAddingItem = ref(false)
const isSaving = ref(false)

const loadComponents = async () => {
  if (!props.rowData?.id) {
    console.warn('id не найден в записи:', props.rowData)
    return
  }
  loadingComponents.value = true
  try {
    const components = await loadComponentsByObjectType(props.rowData.id)
    componentOptions.value = components.map(c => ({
      label: c.name || c.label,
      value: c.id || c.value,
      objComponent: c.id || c.value
    }))
  } catch (error) {
    console.error('Ошибка загрузки компонентов:', error)
    componentOptions.value = []
  } finally {
    loadingComponents.value = false
  }
}

const loadUnits = async () => {
  loadingUnits.value = true
  try {
    const units = await loadMeasureUnits()
    unitOptions.value = units.map(u => ({
      label: u.name || u.label,
      value: u.id || u.value,
      pv: u.pv
    }))
  } catch (error) {
    console.error('Ошибка загрузки единиц измерения:', error)
    unitOptions.value = []
  } finally {
    loadingUnits.value = false
  }
}

const handleComponentChange = async (componentId, index) => {
  const item = form.value.items[index]
  item.parameter = null
  item.parameterOptions = []
  item.signs = []
  item.signOptions = []

  if (componentId) {
    item.loadingParameters = true
    try {
      const parameters = await loadParametersByComponent(componentId)
      item.parameterOptions = parameters.map(p => ({
        label: p.name || p.label,
        value: p.id || p.value,
        pv: p.pv || p.id || p.value
      }))
    } catch (error) {
      console.error('Ошибка загрузки параметров:', error)
      item.parameterOptions = []
    } finally {
      item.loadingParameters = false
    }
  }
}

// Функция для преобразования плоского списка в дерево
const buildSignTree = (records) => {
  // Сначала найдем все родительские записи (без parent)
  const parents = records.filter(r => !r.parent)
  // И все дочерние записи (с parent)
  const children = records.filter(r => r.parent)

  // Строим дерево
  return parents.map(parent => {
    const parentChildren = children.filter(c => c.parent === parent.id)
    return {
      label: parent.name,
      value: parent.id,
      disabled: true, // Родители не выбираются
      children: parentChildren.map(child => ({
        label: child.name,
        value: child.id,
        pv: child.pv,
        cls: child.cls
      }))
    }
  }).filter(p => p.children.length > 0) // Показываем только родителей с детьми
}

const handleParameterChange = async (parameterId, index) => {
  const item = form.value.items[index]
  item.signs = []
  item.signOptions = []
  item.signRawData = []

  if (parameterId) {
    item.loadingSigns = true
    try {
      const signs = await loadSignsByParameter(parameterId)
      item.signRawData = signs // Сохраняем сырые данные для формирования payload
      item.signOptions = buildSignTree(signs)
    } catch (error) {
      console.error('Ошибка загрузки признаков:', error)
      item.signOptions = []
      item.signRawData = []
    } finally {
      item.loadingSigns = false
    }
  }
}

const addItem = () => {
  isAddingItem.value = true
  try {
    form.value.items.push(createNewItem())
  } finally {
    isAddingItem.value = false
  }
}

const removeItem = (index) => {
  if (form.value.items.length <= 1) return
  form.value.items.splice(index, 1)
}

const closeModal = () => {
  emit('close')
}

const validateForm = () => {
  for (let i = 0; i < form.value.items.length; i++) {
    const item = form.value.items[i]
    const recordNum = i + 1

    if (!item.parameter) {
      notificationStore.showNotification(`Запись #${recordNum}: не выбран "Параметр"`, 'error')
      return false
    }
    if (item.value === null || item.value === '') {
      notificationStore.showNotification(`Запись #${recordNum}: не заполнено "Значение"`, 'error')
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
    for (const item of form.value.items) {
      // Получаем id и pv параметра (item.parameter может быть объектом или числом)
      const parameterId = typeof item.parameter === 'object' ? item.parameter.value : item.parameter
      const parameterData = item.parameterOptions.find(p => p.value === parameterId)

      // Получаем id и pv единицы измерения
      const unitId = typeof item.unit === 'object' ? item.unit.value : item.unit
      const unitData = unitOptions.value.find(u => u.value === unitId)

      // Формируем массив выбранных признаков с полными данными
      const selectedSigns = item.signs.map(signId => {
        const signData = item.signRawData.find(s => s.id === signId)
        if (signData) {
          return {
            id: signData.id,
            cls: signData.cls,
            name: signData.name,
            fullName: signData.fullName || signData.name,
            pv: signData.pv
          }
        }
        return null
      }).filter(Boolean)

      const payload = {
        id: props.rowData.id,
        relobjPassportComponentParams: parameterId,
        pvPassportComponentParams: parameterData?.pv,
        objPassportSignMulti: selectedSigns,
        meaPassportMeasure: unitId,
        pvPassportMeasure: unitData?.pv,
        PassportVal: item.value
      }

      await saveComplexObjectPassport(payload)
    }

    notificationStore.showNotification('Паспортные данные успешно сохранены!', 'success')
    emit('save')
    closeModal()
  } catch (error) {
    notificationStore.showNotification('Ошибка при сохранении паспортных данных', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadComponents()
  loadUnits()
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

.section-title {
  font-weight: 600;
  color: #2b6cb0;
  font-size: 14px;
  margin-bottom: 8px;
}

.col-span-2 {
  grid-column: span 2;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 16px 0;
}

.item-header {
  position: relative;
}

.remove-item {
  color: red;
  cursor: pointer;
  font-size: 18px;
  position: absolute;
  right: 0;
  top: 0;
  margin-top: 0;
  margin-right: 8px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 16px;
  width: 100%;
}

.full-width {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .form-section {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0 16px 16px;
  }

  .col-span-2 {
    grid-column: span 1;
  }

  .item-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .full-width {
    grid-column: span 1;
  }
}
</style>
