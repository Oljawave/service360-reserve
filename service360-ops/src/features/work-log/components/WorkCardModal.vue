<template>
  <ModalWrapper
    title="Карточка осмотра/проверки"
    :show-save="false"
    :show-cancel="false"
    :showDelete="false"
    @close="closeModal"
    :loading="isSaving"
  >
    <div class="work-card-content">
      <WorkHeaderInfo :record="record" :section="section" :date="date" />

      <div class="tabs-block">
        <TabsHeader :tabs="tabs" :modelValue="activeTab" @update:modelValue="handleTabChange" />

        <div class="tab-content">
          <div v-if="activeTab === 'info'">
            <ExistingDataBlock :existingRecords="existingRecords" dataType="info" />
            <div class="new-info-content">
              <div class="section-heading spaced-heading info-heading">Местоположение работы</div>
              <div class="coordinates-input-group info-coords">
                <FullCoordinates
                  v-model="newRecord.coordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :isInspection="true"
                  :objectBounds="objectBounds"
                  :out-of-bounds-error="isCoordinatesOutOfBounds"
                  @update:modelValue="updateCoordinates"
                  :required="true" />
              </div>
              <div class="form-grid">
                <AppDatePicker
                  label="Дата"
                  placeholder="Выберите дату"
                  id="date-picker"
                  v-model="newRecord.date"
                  class="col-span-1"
                  :required="true" />
              </div>
              <AppInput
                label="Причина отклонения от плана"
                id="deviation-reason"
                v-model="newRecord.deviationReason"
                placeholder="Введите причину отклонения от плана..."
                class="full-width-input text-area"
                multiline
              />
            </div>
          </div>

          <div v-else-if="activeTab === 'defects'">
            <ExistingDataBlock :existingRecords="existingDefects" dataType="defects" />
            <div class="defects-content">
              <div class="section-heading spaced-heading defect-heading">Местоположение неисправности</div>
              <div class="coordinates-input-group defect-coords">
                <FullCoordinates
                  v-model="defectRecord.startCoordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="inspectionBounds"
                  :out-of-bounds-error="isDefectCoordinatesOutOfBounds"
                  @update:modelValue="updateDefectCoordinates"
                  :required="true" />
              </div>
              <div class="defect-info-group">
                <template v-if="isOnline">
                  <AppDropdown
                    label="Компонент"
                    id="component-dropdown"
                    :options="componentOptions"
                    v-model="defectRecord.component"
                    placeholder="Выберите компонент"
                    class="half-width"
                    :loading="loadingComponents"
                    @update:modelValue="handleDefectComponentChange"
                    :required="true" />
                  <AppDropdown
                    label="Дефект / неисправность"
                    id="defect-dropdown"
                    :options="defectOptions"
                    v-model="defectRecord.defectType"
                    placeholder="Выберите дефект"
                    class="half-width"
                    :loading="loadingDefects"
                    :required="true" />
                </template>
                <template v-else>
                  <AppInput
                    label="Компонент"
                    id="defect-component-text"
                    v-model="defectRecord.componentText"
                    placeholder="Введите компонент..."
                    class="half-width"
                    :required="true" />
                  <AppInput
                    label="Дефект / неисправность"
                    id="defect-type-text"
                    v-model="defectRecord.defectText"
                    placeholder="Введите дефект..."
                    class="half-width"
                    :required="true" />
                </template>
              </div>
              <AppInput
                label="Примечание / заметка"
                id="defect-note"
                v-model="defectRecord.note"
                placeholder="Введите примечание..."
                class="full-width-input text-area"
                multiline
                />
            </div>
          </div>

          <div v-else-if="activeTab === 'parameters'">
            <ExistingDataBlock :existingRecords="existingParameters" dataType="parameters" />
            <div class="parameters-content">
              <div class="section-heading spaced-heading parameters-heading">Местоположение параметра</div>
              <div class="coordinates-input-group parameter-coords">
                <FullCoordinates
                  v-model="parameterRecord.startCoordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="inspectionBounds"
                  :out-of-bounds-error="isParameterCoordinatesOutOfBounds"
                  @update:modelValue="updateParameterCoordinates"
                  :required="true" />
              </div>
              <div class="parameter-info-group">
                <template v-if="isOnline">
                  <AppDropdown
                    label="Компонент"
                    id="component-dropdown"
                    :options="componentOptions"
                    v-model="parameterRecord.component"
                    placeholder="Выберите компонент"
                    class="half-width"
                    :loading="loadingComponents"
                    @update:modelValue="handleParameterComponentChange"
                    :required="true" />
                  <AppDropdown
                    label="Параметр"
                    id="parameter-dropdown"
                    :options="parameterOptions"
                    v-model="parameterRecord.parameterType"
                    placeholder="Выберите параметр"
                    class="half-width"
                    :loading="loadingParameters"
                    @update:modelValue="handleParameterChange"
                    :required="true" />
                </template>
                <template v-else>
                  <AppInput
                    label="Компонент"
                    id="param-component-text"
                    v-model="parameterRecord.componentText"
                    placeholder="Введите компонент..."
                    class="half-width"
                    :required="true" />
                  <AppInput
                    label="Параметр"
                    id="param-type-text"
                    v-model="parameterRecord.parameterText"
                    placeholder="Введите параметр..."
                    class="half-width"
                    :required="true" />
                </template>
              </div>

              <div class="parameter-value-group">
                <AppNumberInput
                  label="Минимальное значение"
                  id="min-parameter-value"
                  v-model="parameterRecord.minValue"
                  placeholder="Введите минимальное значение"
                  class="half-width value-input"
                  :status="shouldShowMinMaxError && isMinMaxInvalid ? 'error' : null"
                  @focus="handleMinMaxFocus"
                  @blur="handleMinMaxBlur"
                  :required="true" />
                <AppNumberInput
                  label="Максимальное значение"
                  id="max-parameter-value"
                  v-model="parameterRecord.maxValue"
                  placeholder="Введите максимальное значение"
                  class="half-width value-input"
                  :status="shouldShowMinMaxError && isMinMaxInvalid ? 'error' : null"
                  @focus="handleMinMaxFocus"
                  @blur="handleMinMaxBlur"
                  :required="true" />
              </div>

              <AppNumberInput
                label="Значение"
                id="parameter-value"
                v-model="parameterRecord.value"
                placeholder="Введите значение"
                class="half-width value-input"
                :required="true" />
              <AppInput
                label="Примечание / заметка"
                id="parameter-note"
                v-model="parameterRecord.note"
                placeholder="Введите примечание..."
                class="full-width-input text-area"
                multiline
              />
            </div>
          </div>
        </div>
      </div>

      <div class="button-container">
        <div class="main-actions">
          <button v-if="!isOnline" class="draft-btn" @click="saveAsDraft">{{ getDraftButtonLabel() }}</button>
          <MainButton
            v-if="isOnline"
            :label="getButtonLabel()"
            :loading="isSaving"
            @click="saveWork"
            class="save-btn" />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue';
import MainButton from '@/shared/ui/MainButton.vue';
import FullCoordinates from '@/shared/ui/FormControls/FullCoordinates.vue';
import AppDatePicker from '@/shared/ui/FormControls/AppDatePicker.vue';
import AppInput from '@/shared/ui/FormControls/AppInput.vue';
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue';
import AppNumberInput from '@/shared/ui/FormControls/AppNumberInput.vue';
import TabsHeader from '@/shared/ui/TabsHeader.vue';
import WorkHeaderInfo from '@/shared/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/shared/ui/ExistingDataBlock.vue';
import { useNotificationStore } from '@/app/stores/notificationStore';
import {
  loadInspectionEntriesForWorkPlan,
  saveInspectionInfo,
  saveFaultInfo,
  saveParameterInfo,
  getUserData,
  loadComponentsByTypObjectForSelect,
  loadDefectsByComponentForSelect,
  loadComponentParametersForSelect,
  loadFaultEntriesForInspection,
  loadParameterEntriesForInspection,
} from '@/shared/api/inspections/inspectionsApi';
import { formatDate, formatDateToISO } from '@/app/stores/date.js';
import { useNetworkStatus } from '@/shared/offline/useNetworkStatus';
import { saveDraft, updateDraft } from '@/shared/offline/draftsStore';

const props = defineProps({
  record: { type: Object, default: null },
  section: { type: String, default: null },
  date: { type: String, default: null },
  sectionId: { type: [Number, String], default: null },
  sectionPv: { type: [Number, String], default: null },
});

const emit = defineEmits(['close']);

const notificationStore = useNotificationStore();
const { isOnline } = useNetworkStatus();
const localParentDraftId = ref(null);

const isSaving = ref(false);
const activeTab = ref('info');
const isInfoSaved = ref(false);
const savedInspectionId = ref(null);
const isCoordinatesOutOfBounds = ref(false);
const isDefectCoordinatesOutOfBounds = ref(false);
const isParameterCoordinatesOutOfBounds = ref(false);
const shouldShowMinMaxError = ref(false);
const isUserTypingMinMax = ref(false);

const tabs = ref([
  { name: 'info', label: 'Новая информация по работе', icon: 'Info' },
  { name: 'defects', label: 'Неисправности', icon: 'AlertTriangle' },
  { name: 'parameters', label: 'Параметры', icon: 'SlidersHorizontal' },
]);

const newRecord = ref({
  coordinates: {
    coordStartKm: 0, coordStartPk: 0, coordStartZv: 0,
    coordEndKm: 0, coordEndPk: 0, coordEndZv: 0,
  },
  date: null,
  deviationReason: '',
});

const defectRecord = ref({
  startCoordinates: {
    coordStartKm: 0, coordStartPk: 0, coordStartZv: 0,
    coordEndKm: 0, coordEndPk: 0, coordEndZv: 0,
  },
  defectType: null,
  note: '',
  component: null,
  componentText: '',
  defectText: '',
});

const parameterRecord = ref({
  startCoordinates: {
    coordStartKm: 0, coordStartPk: 0, coordStartZv: 0,
    coordEndKm: 0, coordEndPk: 0, coordEndZv: 0,
  },
  component: null,
  parameterType: null,
  minValue: null,
  maxValue: null,
  value: '',
  note: '',
  componentText: '',
  parameterText: '',
});

const existingRecords = ref([]);
const existingDefects = ref([]);
const existingParameters = ref([]);

const componentOptions = ref([]);
const defectOptions = ref([]);
const parameterOptions = ref([]);
const loadingComponents = ref(false);
const loadingDefects = ref(false);
const loadingParameters = ref(false);

const objectBounds = ref({
  StartKm: null, StartPicket: null, StartLink: null,
  FinishKm: null, FinishPicket: null, FinishLink: null,
});

const inspectionBounds = ref({
  StartKm: null, StartPicket: null, StartLink: null,
  FinishKm: null, FinishPicket: null, FinishLink: null,
});

const isMinMaxInvalid = computed(() => {
  const minVal = parseFloat(parameterRecord.value.minValue);
  const maxVal = parseFloat(parameterRecord.value.maxValue);
  return !isNaN(minVal) && !isNaN(maxVal) ? minVal > maxVal : false;
});

const handleMinMaxFocus = () => {
  isUserTypingMinMax.value = true;
  shouldShowMinMaxError.value = false;
};

const handleMinMaxBlur = () => {
  isUserTypingMinMax.value = false;
  setTimeout(() => {
    shouldShowMinMaxError.value = true;
    validateMinMax();
  }, 100);
};

const validateMinMax = () => {
  if (isMinMaxInvalid.value) {
    notificationStore.showNotification('Минимальное значение не может быть больше максимального значения!', 'error');
  }
};

const closeModal = () => emit('close');

const getMetadata = () => ({
  id: props.record?.id, pv: props.record?.pv, objObject: props.record?.objObject,
  name: props.record?.name, place: props.record?.place, objectType: props.record?.objectType,
  object: props.record?.object, nameLocationClsSection: props.record?.nameLocationClsSection,
  coordinates: props.record?.coordinates, objLocationClsSection: props.record?.objLocationClsSection,
  pvLocationClsSection: props.record?.pvLocationClsSection,
  StartKm: props.record?.StartKm, StartPicket: props.record?.StartPicket, StartLink: props.record?.StartLink,
  FinishKm: props.record?.FinishKm, FinishPicket: props.record?.FinishPicket, FinishLink: props.record?.FinishLink,
});

const getDraftButtonLabel = () => {
  if (activeTab.value === 'defects') return 'Сохранить неисправность в черновик';
  if (activeTab.value === 'parameters') return 'Сохранить параметр в черновик';
  return localParentDraftId.value ? 'Обновить черновик' : 'Сохранить черновик';
};

const saveAsDraft = async () => {
  try {
    if (activeTab.value === 'info') {
      const fields = {
        tab: 'info',
        info: {
          coordinates: { ...newRecord.value.coordinates },
          date: newRecord.value.date,
          deviationReason: newRecord.value.deviationReason,
        },
      };
      if (localParentDraftId.value) {
        await updateDraft(localParentDraftId.value, fields);
        notificationStore.showNotification('Черновик обновлён!', 'success');
      } else {
        const id = await saveDraft('workCard', getMetadata(), fields);
        localParentDraftId.value = id;
        notificationStore.showNotification('Черновик сохранён! Теперь доступны вкладки Неисправности и Параметры.', 'success');
      }
      isInfoSaved.value = true;
      const savedCoords = { ...newRecord.value.coordinates };
      defectRecord.value.startCoordinates = { ...savedCoords };
      parameterRecord.value.startCoordinates = { ...savedCoords };
      inspectionBounds.value = {
        StartKm: savedCoords.coordStartKm, StartPicket: savedCoords.coordStartPk, StartLink: savedCoords.coordStartZv,
        FinishKm: savedCoords.coordEndKm, FinishPicket: savedCoords.coordEndPk, FinishLink: savedCoords.coordEndZv,
      };
    } else if (activeTab.value === 'defects') {
      const fields = {
        tab: 'defects',
        defect: {
          startCoordinates: { ...defectRecord.value.startCoordinates },
          componentText: defectRecord.value.componentText,
          defectText: defectRecord.value.defectText,
          note: defectRecord.value.note,
        },
      };
      await saveDraft('workCard', getMetadata(), fields, localParentDraftId.value);
      defectRecord.value = { startCoordinates: { ...defectRecord.value.startCoordinates }, defectType: null, note: '', component: null, componentText: '', defectText: '' };
      defectOptions.value = [];
      notificationStore.showNotification('Неисправность сохранена в черновик!', 'success');
    } else if (activeTab.value === 'parameters') {
      const fields = {
        tab: 'parameters',
        parameter: {
          startCoordinates: { ...parameterRecord.value.startCoordinates },
          componentText: parameterRecord.value.componentText,
          parameterText: parameterRecord.value.parameterText,
          minValue: parameterRecord.value.minValue,
          maxValue: parameterRecord.value.maxValue,
          value: parameterRecord.value.value,
          note: parameterRecord.value.note,
        },
      };
      await saveDraft('workCard', getMetadata(), fields, localParentDraftId.value);
      parameterRecord.value = { startCoordinates: { ...parameterRecord.value.startCoordinates }, component: null, parameterType: null, minValue: null, maxValue: null, value: '', note: '', componentText: '', parameterText: '' };
      parameterOptions.value = [];
      notificationStore.showNotification('Параметр сохранён в черновик!', 'success');
    }
  } catch (err) {
    console.error(err);
    notificationStore.showNotification('Не удалось сохранить черновик.', 'error');
  }
};

const getButtonLabel = () => {
  switch (activeTab.value) {
    case 'info': return 'Добавить запись в журнал';
    case 'defects': return 'Добавить неисправность';
    case 'parameters': return 'Добавить параметр';
    default: return 'Сохранить';
  }
};

const handleTabChange = async (newTab) => {
  if (newTab !== 'info' && !isInfoSaved.value) {
    notificationStore.showNotification('Сначала необходимо сохранить информацию по работе!', 'error');
    return;
  }
  activeTab.value = newTab;
  if (newTab === 'defects' && savedInspectionId.value) {
    await loadExistingDefects(savedInspectionId.value);
  } else if (newTab === 'parameters' && savedInspectionId.value) {
    await loadExistingParameters(savedInspectionId.value);
  }
};

const saveWork = async () => {
  if (isSaving.value) return;

  if (activeTab.value === 'info') {
    const newStart = (newRecord.value.coordinates.coordStartKm || 0) * 1000
      + (newRecord.value.coordinates.coordStartPk || 0) * 100
      + (newRecord.value.coordinates.coordStartZv || 0) * 25;
    const newFinish = (newRecord.value.coordinates.coordEndKm || 0) * 1000
      + (newRecord.value.coordinates.coordEndPk || 0) * 100
      + (newRecord.value.coordinates.coordEndZv || 0) * 25;

    if (objectBounds.value?.StartKm !== null) {
      const objStart = (objectBounds.value.StartKm || 0) * 1000
        + (objectBounds.value.StartPicket || 0) * 100
        + (objectBounds.value.StartLink || 0) * 25;
      const objFinish = (objectBounds.value.FinishKm || 0) * 1000
        + (objectBounds.value.FinishPicket || 0) * 100
        + (objectBounds.value.FinishLink || 0) * 25;
      if (newStart < objStart || newStart > objFinish || newFinish < objStart || newFinish > objFinish) {
        notificationStore.showNotification('Координаты не могут выходить за границы выбранного объекта', 'error');
        return;
      }
    }

    if (!newRecord.value.date) {
      notificationStore.showNotification('Необходимо указать дату!', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const user = await getUserData();
      const formattedDate = formatDateToISO(newRecord.value.date);
      const response = await saveInspectionInfo({
        name: `${props.record.id}-${formattedDate}`,
        objLocationClsSection: props.record.objLocationClsSection ?? props.sectionId,
        pvLocationClsSection: parseInt(props.record.pvLocationClsSection ?? props.sectionPv),
        objWorkPlan: props.record.id,
        pvWorkPlan: props.record.pv,
        objUser: user.id,
        pvUser: user.pv,
        StartKm: newRecord.value.coordinates.coordStartKm,
        FinishKm: newRecord.value.coordinates.coordEndKm,
        StartPicket: newRecord.value.coordinates.coordStartPk,
        FinishPicket: newRecord.value.coordinates.coordEndPk,
        StartLink: newRecord.value.coordinates.coordStartZv,
        FinishLink: newRecord.value.coordinates.coordEndZv,
        FactDateEnd: formattedDate,
        CreatedAt: new Date().toISOString().split('T')[0],
        UpdatedAt: new Date().toISOString().split('T')[0],
        ReasonDeviation: newRecord.value.deviationReason,
        idStatus: props.record.idStatus,
        pvStatus: props.record.pvStatus,
        fvStatus: props.record.fvStatus,
      });

      if (response?.result?.id) savedInspectionId.value = response.result.id;
      else if (response?.id) savedInspectionId.value = response.id;
      else if (response?.result?.records?.[0]?.id) savedInspectionId.value = response.result.records[0].id;

      notificationStore.showNotification('Информация по работе успешно сохранена!', 'success');
      isInfoSaved.value = true;

      const existingData = await loadExistingData(props.record);
      if (!savedInspectionId.value && existingData?.length > 0) {
        const last = existingData[existingData.length - 1];
        if (last?.id) savedInspectionId.value = last.id;
      }

      const savedCoords = {
        coordStartKm: newRecord.value.coordinates.coordStartKm,
        coordStartPk: newRecord.value.coordinates.coordStartPk,
        coordStartZv: newRecord.value.coordinates.coordStartZv,
        coordEndKm: newRecord.value.coordinates.coordEndKm,
        coordEndPk: newRecord.value.coordinates.coordEndPk,
        coordEndZv: newRecord.value.coordinates.coordEndZv,
      };
      defectRecord.value.startCoordinates = { ...savedCoords };
      parameterRecord.value.startCoordinates = { ...savedCoords };
      inspectionBounds.value = {
        StartKm: newRecord.value.coordinates.coordStartKm,
        StartPicket: newRecord.value.coordinates.coordStartPk,
        StartLink: newRecord.value.coordinates.coordStartZv,
        FinishKm: newRecord.value.coordinates.coordEndKm,
        FinishPicket: newRecord.value.coordinates.coordEndPk,
        FinishLink: newRecord.value.coordinates.coordEndZv,
      };
    } catch (error) {
      const msg = error.response?.data?.error?.message
        || (error.response?.status === 500 ? 'Ошибка сервера. Попробуйте еще раз.' : 'Не удалось сохранить информацию по работе.');
      notificationStore.showNotification(msg, 'error');
    } finally {
      isSaving.value = false;
    }
  } else if (activeTab.value === 'defects') {
    if (!defectRecord.value.component || !defectRecord.value.defectType) {
      notificationStore.showNotification('Необходимо выбрать компонент и дефект!', 'error');
      return;
    }
    if (!savedInspectionId.value) {
      notificationStore.showNotification('Сначала необходимо сохранить информацию по работе!', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const user = await getUserData();
      const selectedDefect = defectOptions.value.find(
        d => d.value === (defectRecord.value.defectType?.value || defectRecord.value.defectType)
      );
      if (!selectedDefect) throw new Error('Выбранный дефект не найден');

      const now = new Date();
      const kzTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
      const currentDateTime = kzTime.toISOString();

      await saveFaultInfo({
        name: `${currentDateTime.split('T')[0]}-${selectedDefect.value}`,
        objInspection: savedInspectionId.value,
        objDefect: selectedDefect.value,
        pvDefect: selectedDefect.pv || selectedDefect.value,
        pvLocationClsSection: parseInt(props.record.pvLocationClsSection ?? props.sectionPv),
        objLocationClsSection: props.record.objLocationClsSection ?? props.sectionId,
        StartKm: defectRecord.value.startCoordinates.coordStartKm,
        FinishKm: defectRecord.value.startCoordinates.coordEndKm ?? 0,
        StartPicket: defectRecord.value.startCoordinates.coordStartPk ?? 0,
        FinishPicket: defectRecord.value.startCoordinates.coordEndPk ?? 0,
        StartLink: defectRecord.value.startCoordinates.coordStartZv ?? 0,
        FinishLink: defectRecord.value.startCoordinates.coordEndZv ?? 0,
        objUser: user.id,
        pvUser: user.pv,
        fullNameUser: user.fullName,
        nameLocation: user.nameLocation,
        Description: defectRecord.value.note || '',
        CreationDateTime: currentDateTime,
      });

      notificationStore.showNotification('Дефект успешно сохранен!', 'success');
      await loadExistingDefects(savedInspectionId.value);
      defectRecord.value = {
        startCoordinates: { ...defectRecord.value.startCoordinates },
        defectType: null, note: '', component: null,
      };
      defectOptions.value = [];
    } catch (error) {
      const msg = error.response?.data?.error?.message
        || (error.response?.status === 500 ? 'Ошибка сервера. Попробуйте еще раз.' : 'Не удалось сохранить дефект.');
      notificationStore.showNotification(msg, 'error');
    } finally {
      isSaving.value = false;
    }
  } else if (activeTab.value === 'parameters') {
    if (!parameterRecord.value.component || !parameterRecord.value.parameterType) {
      notificationStore.showNotification('Необходимо выбрать компонент и параметр!', 'error');
      return;
    }
    if (isMinMaxInvalid.value) {
      notificationStore.showNotification('Минимальное значение не может быть больше максимального значения!', 'error');
      shouldShowMinMaxError.value = true;
      return;
    }
    if (parameterRecord.value.value === null || parameterRecord.value.value === '') {
      notificationStore.showNotification('Необходимо ввести значение параметра!', 'error');
      return;
    }
    if (!savedInspectionId.value) {
      notificationStore.showNotification('Сначала необходимо сохранить информацию по работе!', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const user = await getUserData();
      const selectedParam = parameterOptions.value.find(
        p => p.value === (parameterRecord.value.parameterType?.value || parameterRecord.value.parameterType)
      );
      if (!selectedParam) throw new Error('Выбранный параметр не найден');

      const now = new Date();
      const kzTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
      const currentDateTime = kzTime.toISOString();

      await saveParameterInfo({
        name: `${currentDateTime.split('T')[0]}-${selectedParam.value}`,
        objInspection: savedInspectionId.value,
        relobjComponentParams: selectedParam.value,
        pvComponentParams: selectedParam.pv,
        objLocationClsSection: props.record.objLocationClsSection ?? props.sectionId,
        pvLocationClsSection: parseInt(props.record.pvLocationClsSection ?? props.sectionPv),
        ParamsLimit: parseFloat(parameterRecord.value.value),
        ParamsLimitMax: parseFloat(parameterRecord.value.maxValue) || 0,
        ParamsLimitMin: parseFloat(parameterRecord.value.minValue) || 0,
        StartKm: parameterRecord.value.startCoordinates.coordStartKm,
        FinishKm: parameterRecord.value.startCoordinates.coordEndKm ?? 0,
        StartPicket: parameterRecord.value.startCoordinates.coordStartPk ?? 0,
        FinishPicket: parameterRecord.value.startCoordinates.coordEndPk ?? 0,
        StartLink: parameterRecord.value.startCoordinates.coordStartZv ?? 0,
        FinishLink: parameterRecord.value.startCoordinates.coordEndZv ?? 0,
        objUser: user.id,
        pvUser: user.pv,
        fullNameUser: user.fullName,
        nameLocation: user.nameLocation,
        Description: parameterRecord.value.note || '',
        CreationDateTime: currentDateTime,
      });

      notificationStore.showNotification('Параметр успешно сохранен!', 'success');
      await loadExistingParameters(savedInspectionId.value);
      parameterRecord.value = {
        startCoordinates: { ...parameterRecord.value.startCoordinates },
        component: null, parameterType: null,
        minValue: null, maxValue: null, value: '', note: '',
      };
      parameterOptions.value = [];
      shouldShowMinMaxError.value = false;
    } catch (error) {
      const msg = error.response?.data?.error?.message
        || (error.response?.status === 500 ? 'Ошибка сервера. Попробуйте еще раз.' : 'Не удалось сохранить параметр.');
      notificationStore.showNotification(msg, 'error');
    } finally {
      isSaving.value = false;
    }
  }
};

const formatCoordinates = (startKm, startPk, startZv, finishKm, finishPk, finishZv) => {
  const ok = v => v !== null && v !== undefined && v !== '';
  const part = (km, pk, zv) => {
    if (!ok(km) && !ok(pk) && km !== 0 && pk !== 0) return '';
    return [ok(km) || km === 0 ? `${km}км` : '', ok(pk) || pk === 0 ? `${pk}пк` : '', ok(zv) || zv === 0 ? `${zv}зв` : '']
      .filter(Boolean).join(' ');
  };
  const s = part(startKm, startPk, startZv);
  const f = part(finishKm, finishPk, finishZv);
  return s && f ? `${s} — ${f}` : s || f || '';
};

const loadExistingData = async (record) => {
  if (!record?.id || !record?.pv) return [];
  try {
    const data = await loadInspectionEntriesForWorkPlan(record.id, record.pv);
    existingRecords.value = data.map(item => ({
      date: formatDate(item.FactDateEnd),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink),
    }));
    return data;
  } catch {
    notificationStore.showNotification('Не удалось загрузить ранее внесенные записи.', 'error');
    existingRecords.value = [];
    return [];
  }
};

const loadExistingDefects = async (inspectionId) => {
  if (!inspectionId) { existingDefects.value = []; return; }
  try {
    const data = await loadFaultEntriesForInspection(inspectionId);
    existingDefects.value = data.map(item => ({
      date: formatDate(item.CreationDateTime),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink),
      defect: item.nameDefect || 'Неизвестный дефект',
    }));
  } catch {
    notificationStore.showNotification('Не удалось загрузить ранее внесенные дефекты.', 'error');
    existingDefects.value = [];
  }
};

const loadExistingParameters = async (inspectionId) => {
  if (!inspectionId) { existingParameters.value = []; return; }
  try {
    const data = await loadParameterEntriesForInspection(inspectionId);
    existingParameters.value = data.map(item => ({
      date: formatDate(item.CreationDateTime),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink),
      component: item.nameComponent || 'Неизвестный компонент',
      parameter: item.nameComponentParams || 'Неизвестный параметр',
      value: item.ParamsLimit || 'Не указано',
    }));
  } catch {
    notificationStore.showNotification('Не удалось загрузить ранее внесенные параметры.', 'error');
    existingParameters.value = [];
  }
};

const loadComponents = async () => {
  if (!props.record?.objObject) return;
  loadingComponents.value = true;
  try {
    const items = await loadComponentsByTypObjectForSelect(props.record.objObject);
    componentOptions.value = items.map(c => ({
      label: c.name || c.label, value: c.id || c.value, objComponent: c.id || c.value,
    }));
  } catch {
    notificationStore.showNotification('Не удалось загрузить компоненты', 'error');
    componentOptions.value = [];
  } finally {
    loadingComponents.value = false;
  }
};

const loadDefects = async (objComponent) => {
  if (!objComponent) { defectOptions.value = []; return; }
  loadingDefects.value = true;
  try {
    const items = await loadDefectsByComponentForSelect(objComponent);
    defectOptions.value = items.map(d => ({
      label: d.name || d.label, value: d.id || d.value, pv: d.pv || d.id || d.value,
    }));
  } catch {
    notificationStore.showNotification('Не удалось загрузить дефекты', 'error');
    defectOptions.value = [];
  } finally {
    loadingDefects.value = false;
  }
};

const loadParameters = async (objComponent) => {
  if (!objComponent) { parameterOptions.value = []; return; }
  loadingParameters.value = true;
  try {
    const items = await loadComponentParametersForSelect(objComponent);
    parameterOptions.value = items.map(p => ({
      label: p.name || p.label, value: p.id || p.value,
      pv: p.pv || p.id || p.value,
      paramslimitmin: p.paramslimitmin, paramslimitmax: p.paramslimitmax,
    }));
  } catch {
    notificationStore.showNotification('Не удалось загрузить параметры', 'error');
    parameterOptions.value = [];
  } finally {
    loadingParameters.value = false;
  }
};

const handleDefectComponentChange = async (selected) => {
  defectRecord.value.defectType = null;
  defectOptions.value = [];
  if (selected) {
    const comp = componentOptions.value.find(c => c.value === (selected.value || selected));
    if (comp?.objComponent) await loadDefects(comp.objComponent);
  }
};

const handleParameterComponentChange = async (selected) => {
  parameterRecord.value.parameterType = null;
  parameterRecord.value.minValue = null;
  parameterRecord.value.maxValue = null;
  shouldShowMinMaxError.value = false;
  if (selected) {
    const comp = componentOptions.value.find(c => c.value === (selected.value || selected));
    if (comp?.objComponent) await loadParameters(comp.objComponent);
  } else {
    parameterOptions.value = [];
  }
};

const handleParameterChange = (selected) => {
  shouldShowMinMaxError.value = false;
  if (selected) {
    const param = parameterOptions.value.find(p => p.value === (selected.value || selected));
    if (param) {
      parameterRecord.value.minValue = param.paramslimitmin || null;
      parameterRecord.value.maxValue = param.paramslimitmax || null;
    }
  } else {
    parameterRecord.value.minValue = null;
    parameterRecord.value.maxValue = null;
  }
  parameterRecord.value.value = '';
};

const updateCoordinates = (newCoords) => {
  newRecord.value.coordinates = newCoords;
  if (objectBounds.value?.StartKm !== null) {
    const s = (newCoords.coordStartKm || 0) * 1000 + (newCoords.coordStartPk || 0) * 100 + (newCoords.coordStartZv || 0) * 25;
    const f = (newCoords.coordEndKm || 0) * 1000 + (newCoords.coordEndPk || 0) * 100 + (newCoords.coordEndZv || 0) * 25;
    const os = (objectBounds.value.StartKm || 0) * 1000 + (objectBounds.value.StartPicket || 0) * 100 + (objectBounds.value.StartLink || 0) * 25;
    const of2 = (objectBounds.value.FinishKm || 0) * 1000 + (objectBounds.value.FinishPicket || 0) * 100 + (objectBounds.value.FinishLink || 0) * 25;
    isCoordinatesOutOfBounds.value = s < os || s > of2 || f < os || f > of2;
    if (isCoordinatesOutOfBounds.value) notificationStore.showNotification('Координаты не могут выходить за границы выбранного объекта', 'error');
  } else {
    isCoordinatesOutOfBounds.value = false;
  }
};

const updateDefectCoordinates = (newCoords) => {
  defectRecord.value.startCoordinates = newCoords;
  if (inspectionBounds.value?.StartKm !== null) {
    const s = (newCoords.coordStartKm || 0) * 1000 + (newCoords.coordStartPk || 0) * 100 + (newCoords.coordStartZv || 0) * 25;
    const f = (newCoords.coordEndKm || 0) * 1000 + (newCoords.coordEndPk || 0) * 100 + (newCoords.coordEndZv || 0) * 25;
    const is2 = (inspectionBounds.value.StartKm || 0) * 1000 + (inspectionBounds.value.StartPicket || 0) * 100 + (inspectionBounds.value.StartLink || 0) * 25;
    const if2 = (inspectionBounds.value.FinishKm || 0) * 1000 + (inspectionBounds.value.FinishPicket || 0) * 100 + (inspectionBounds.value.FinishLink || 0) * 25;
    isDefectCoordinatesOutOfBounds.value = s < is2 || s > if2 || f < is2 || f > if2;
    if (isDefectCoordinatesOutOfBounds.value) notificationStore.showNotification('Координаты не могут выходить за границы записи осмотра', 'error');
  } else {
    isDefectCoordinatesOutOfBounds.value = false;
  }
};

const updateParameterCoordinates = (newCoords) => {
  parameterRecord.value.startCoordinates = newCoords;
  if (inspectionBounds.value?.StartKm !== null) {
    const s = (newCoords.coordStartKm || 0) * 1000 + (newCoords.coordStartPk || 0) * 100 + (newCoords.coordStartZv || 0) * 25;
    const f = (newCoords.coordEndKm || 0) * 1000 + (newCoords.coordEndPk || 0) * 100 + (newCoords.coordEndZv || 0) * 25;
    const is2 = (inspectionBounds.value.StartKm || 0) * 1000 + (inspectionBounds.value.StartPicket || 0) * 100 + (inspectionBounds.value.StartLink || 0) * 25;
    const if2 = (inspectionBounds.value.FinishKm || 0) * 1000 + (inspectionBounds.value.FinishPicket || 0) * 100 + (inspectionBounds.value.FinishLink || 0) * 25;
    isParameterCoordinatesOutOfBounds.value = s < is2 || s > if2 || f < is2 || f > if2;
    if (isParameterCoordinatesOutOfBounds.value) notificationStore.showNotification('Координаты не могут выходить за границы записи осмотра', 'error');
  } else {
    isParameterCoordinatesOutOfBounds.value = false;
  }
};

watch(
  () => [parameterRecord.value.minValue, parameterRecord.value.maxValue],
  () => {
    if (!isUserTypingMinMax.value && shouldShowMinMaxError.value) validateMinMax();
  }
);

watch(
  () => props.record,
  async (rec) => {
    if (!rec) return;
    objectBounds.value = {
      StartKm: rec.StartKm || null, StartPicket: rec.StartPicket || null, StartLink: rec.StartLink || null,
      FinishKm: rec.FinishKm || null, FinishPicket: rec.FinishPicket || null, FinishLink: rec.FinishLink || null,
    };
    inspectionBounds.value = { ...objectBounds.value };
    Object.assign(newRecord.value.coordinates, {
      coordStartKm: rec.StartKm || null, coordStartPk: rec.StartPicket || null, coordStartZv: rec.StartLink || null,
      coordEndKm: rec.FinishKm || null, coordEndPk: rec.FinishPicket || null, coordEndZv: rec.FinishLink || null,
    });

    await loadExistingData(rec);
    loadComponents();
  },
  { immediate: true }
);
</script>

<style scoped>
.work-card-content {
  padding: 24px;
}

.tabs-block {
  margin-bottom: 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-heading.spaced-heading {
  margin-bottom: 24px;
}

.coordinates-input-group {
  display: flex;
  gap: 24px;
  width: 100%;
}

.coord-start, .coord-end {
  flex: 1;
}

.full-width-input {
  width: 100%;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  margin-top: 24px;
}

.main-actions {
  display: flex;
  gap: 12px;
}

.draft-btn {
  padding: 10px 20px;
  background: #fffbeb;
  color: #b45309;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #fcd34d;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.draft-btn:hover {
  background: #fef3c7;
  border-color: #f59e0b;
}

.defects-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.defect-heading { color: #c70039; }

.defect-info-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.half-width { width: 100%; }

.text-area { height: 100px; }

.parameters-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameters-heading { color: #3182ce; }

.parameter-info-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.value-input { width: 50%; }

.new-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-heading { color: #3182ce; }

.parameter-value-group {
  display: flex;
  gap: 16px;
}

@media (max-width: 768px) {
  .coordinates-input-group { flex-direction: column; gap: 12px; }
  .button-container { flex-direction: column; gap: 16px; }
  .main-actions { width: 100%; justify-content: center; }
  .defect-info-group, .parameter-info-group { grid-template-columns: 1fr; gap: 12px; }
  .value-input { width: 100%; }
}
</style>
