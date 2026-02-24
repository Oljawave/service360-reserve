<template>
  <ModalWrapper
    title="Черновик: Параметр"
    :show-save="false"
    :show-cancel="false"
    :showDelete="false"
    @close="closeModal"
    :loading="isSaving"
  >
    <div class="draft-parameter-content">
      <WorkHeaderInfo :record="record" :section="record?.nameLocationClsSection" :date="record?.date" />

      <ExistingDataBlock :existingRecords="existingParameters" dataType="parameters" />

      <div class="parameters-content">
        <div class="section-heading spaced-heading parameters-heading">Местоположение параметра</div>
        <div class="coordinates-input-group">
          <FullCoordinates
            v-model="paramForm.startCoordinates"
            label="Координаты начала"
            class="coord-start"
            :required="true"
          />
        </div>
        <div class="parameter-info-group">
          <AppDropdown
            v-if="isOnline"
            :label="paramForm.componentText ? `Компонент (${paramForm.componentText})` : 'Компонент'"
            id="dp-component"
            :options="componentOptions"
            v-model="paramForm.component"
            placeholder="Выберите компонент"
            class="half-width"
            :loading="loadingComponents"
            @update:modelValue="handleComponentChange"
            :required="true"
          />
          <AppInput
            v-else
            label="Компонент"
            id="dp-component-text"
            v-model="paramForm.componentText"
            placeholder="Введите название компонента"
            class="half-width"
            :required="true"
          />
          <AppDropdown
            v-if="isOnline"
            :label="paramForm.parameterText ? `Параметр (${paramForm.parameterText})` : 'Параметр'"
            id="dp-param"
            :options="parameterOptions"
            v-model="paramForm.parameterType"
            placeholder="Выберите параметр"
            class="half-width"
            :loading="loadingParameters"
            @update:modelValue="handleParameterChange"
            :required="true"
          />
          <AppInput
            v-else
            label="Параметр"
            id="dp-param-text"
            v-model="paramForm.parameterText"
            placeholder="Введите название параметра"
            class="half-width"
            :required="true"
          />
        </div>
        <div class="parameter-value-group">
          <AppNumberInput :label="paramForm.minValue !== null && paramForm.minValue !== undefined ? `Минимальное значение (${paramForm.minValue})` : 'Минимальное значение'" id="dp-min" v-model="paramForm.minValue" placeholder="Введите минимальное значение" class="half-width value-input" :required="true" />
          <AppNumberInput :label="paramForm.maxValue !== null && paramForm.maxValue !== undefined ? `Максимальное значение (${paramForm.maxValue})` : 'Максимальное значение'" id="dp-max" v-model="paramForm.maxValue" placeholder="Введите максимальное значение" class="half-width value-input" :required="true" />
        </div>
        <AppNumberInput label="Значение" id="dp-val" v-model="paramForm.value" placeholder="Введите значение" class="half-width value-input" :required="true" />
        <AppInput
          label="Примечание / заметка"
          id="dp-note"
          v-model="paramForm.note"
          placeholder="Введите примечание..."
          class="full-width-input text-area"
          multiline
        />
      </div>

      <div v-if="isOnline && !savedInspectionId" class="no-inspection-warning">
        Осмотр для этой работы ещё не сохранён. Сначала отправьте информацию по работе.
      </div>

      <div class="button-container">
        <div class="main-actions">
          <button v-if="!isOnline" class="draft-btn" @click="saveAsDraft">Обновить черновик</button>
          <MainButton
            v-if="isOnline"
            label="Добавить параметр"
            :loading="isSaving"
            :disabled="!savedInspectionId"
            @click="submitOnline"
            class="save-btn"
          />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue';
import MainButton from '@/shared/ui/MainButton.vue';
import FullCoordinates from '@/shared/ui/FormControls/FullCoordinates.vue';
import AppInput from '@/shared/ui/FormControls/AppInput.vue';
import AppDropdown from '@/shared/ui/FormControls/AppDropdown.vue';
import AppNumberInput from '@/shared/ui/FormControls/AppNumberInput.vue';
import WorkHeaderInfo from '@/shared/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/shared/ui/ExistingDataBlock.vue';
import { useNotificationStore } from '@/app/stores/notificationStore';
import {
  saveParameterInfo, getUserData,
  loadComponentsByTypObjectForSelect, loadComponentParametersForSelect,
  loadInspectionEntriesForWorkPlan, loadParameterEntriesForInspection,
} from '@/shared/api/inspections/inspectionsApi';
import { formatDate } from '@/app/stores/date.js';
import { useNetworkStatus } from '@/shared/offline/useNetworkStatus';
import { updateDraft, deleteDraft } from '@/shared/offline/draftsStore';

const props = defineProps({
  record: { type: Object, default: null },
  // draftId = ID дочернего черновика параметра в Dexie
  draftId: { type: Number, default: null },
  formFields: { type: Object, default: null },
  // parentDraftId = ID родительского info-черновика (для справки)
  parentDraftId: { type: Number, default: null },
});

const emit = defineEmits(['close']);
const { isOnline } = useNetworkStatus();
const notificationStore = useNotificationStore();

const isSaving = ref(false);
const savedInspectionId = ref(null);
const existingParameters = ref([]);

const paramForm = ref({
  startCoordinates: { coordStartKm: 0, coordStartPk: 0, coordStartZv: 0, coordEndKm: 0, coordEndPk: 0, coordEndZv: 0 },
  component: null,
  componentText: '',
  parameterType: null,
  parameterText: '',
  minValue: null,
  maxValue: null,
  value: '',
  note: '',
});

const componentOptions = ref([]);
const parameterOptions = ref([]);
const loadingComponents = ref(false);
const loadingParameters = ref(false);

const closeModal = () => emit('close');

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
    existingParameters.value = [];
  }
};

// ── Dropdowns ─────────────────────────────────────────────────────────────

const loadComponents = async () => {
  if (!props.record?.objObject) return;
  loadingComponents.value = true;
  try {
    const items = await loadComponentsByTypObjectForSelect(props.record.objObject);
    componentOptions.value = items.map(c => ({ label: c.name || c.label, value: c.id || c.value, objComponent: c.id || c.value }));
  } catch { componentOptions.value = []; }
  finally { loadingComponents.value = false; }
};

const loadParameters = async (objComponent) => {
  if (!objComponent) { parameterOptions.value = []; return; }
  loadingParameters.value = true;
  try {
    const items = await loadComponentParametersForSelect(objComponent);
    parameterOptions.value = items.map(p => ({ label: p.name || p.label, value: p.id || p.value, pv: p.pv || p.id || p.value, paramslimitmin: p.paramslimitmin, paramslimitmax: p.paramslimitmax }));
  } catch { parameterOptions.value = []; }
  finally { loadingParameters.value = false; }
};

const handleComponentChange = async (selected) => {
  paramForm.value.parameterType = null;
  paramForm.value.minValue = null;
  paramForm.value.maxValue = null;
  parameterOptions.value = [];
  if (selected) {
    const c = componentOptions.value.find(c => c.value === (selected.value || selected));
    if (c?.objComponent) await loadParameters(c.objComponent);
  }
};

const handleParameterChange = (selected) => {
  if (selected) {
    const p = parameterOptions.value.find(p => p.value === (selected.value || selected));
    if (p) {
      paramForm.value.minValue = p.paramslimitmin || null;
      paramForm.value.maxValue = p.paramslimitmax || null;
    }
  } else {
    paramForm.value.minValue = null;
    paramForm.value.maxValue = null;
  }
  paramForm.value.value = '';
};

// ── OFFLINE: Dexie ────────────────────────────────────────────────────────

const saveAsDraft = async () => {
  try {
    const fields = {
      tab: 'parameters',
      parameter: {
        startCoordinates: { ...paramForm.value.startCoordinates },
        componentText: paramForm.value.componentText,
        parameterText: paramForm.value.parameterText,
        minValue: paramForm.value.minValue,
        maxValue: paramForm.value.maxValue,
        value: paramForm.value.value,
        note: paramForm.value.note,
      },
    };
    await updateDraft(props.draftId, fields);
    notificationStore.showNotification('Черновик параметра обновлён!', 'success');
    closeModal();
  } catch (err) {
    console.error(err);
    notificationStore.showNotification('Не удалось сохранить черновик.', 'error');
  }
};

// ── ONLINE: API ───────────────────────────────────────────────────────────

const submitOnline = async () => {
  if (isSaving.value || !savedInspectionId.value) return;
  isSaving.value = true;
  try {
    const user = await getUserData();
    const param = parameterOptions.value.find(p => p.value === (paramForm.value.parameterType?.value || paramForm.value.parameterType));
    if (!param) throw new Error('Выбранный параметр не найден');
    const now = new Date();
    const kzTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const dt = kzTime.toISOString();
    await saveParameterInfo({
      name: `${dt.split('T')[0]}-${param.value}`,
      objInspection: savedInspectionId.value,
      relobjComponentParams: param.value,
      pvComponentParams: param.pv,
      objLocationClsSection: props.record.objLocationClsSection,
      pvLocationClsSection: parseInt(props.record.pvLocationClsSection),
      ParamsLimit: parseFloat(paramForm.value.value),
      ParamsLimitMax: parseFloat(paramForm.value.maxValue) || 0,
      ParamsLimitMin: parseFloat(paramForm.value.minValue) || 0,
      StartKm: paramForm.value.startCoordinates.coordStartKm,
      FinishKm: paramForm.value.startCoordinates.coordEndKm ?? 0,
      StartPicket: paramForm.value.startCoordinates.coordStartPk ?? 0,
      FinishPicket: paramForm.value.startCoordinates.coordEndPk ?? 0,
      StartLink: paramForm.value.startCoordinates.coordStartZv ?? 0,
      FinishLink: paramForm.value.startCoordinates.coordEndZv ?? 0,
      objUser: user.id,
      pvUser: user.pv,
      fullNameUser: user.fullName,
      nameLocation: user.nameLocation,
      Description: paramForm.value.note || '',
      CreationDateTime: dt,
    });
    if (props.draftId) await deleteDraft(props.draftId);
    notificationStore.showNotification('Параметр успешно сохранён!', 'success');
    closeModal();
  } catch (err) {
    console.error(err);
    notificationStore.showNotification(err.response?.data?.error?.message || 'Не удалось сохранить.', 'error');
  } finally {
    isSaving.value = false;
  }
};

// ── Init ──────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Pre-fill from saved draft fields
  const f = props.formFields?.parameter;
  if (f) {
    if (f.startCoordinates) Object.assign(paramForm.value.startCoordinates, f.startCoordinates);
    paramForm.value.componentText = f.componentText || '';
    paramForm.value.parameterText = f.parameterText || '';
    paramForm.value.minValue = f.minValue ?? null;
    paramForm.value.maxValue = f.maxValue ?? null;
    paramForm.value.value = f.value || '';
    paramForm.value.note = f.note || '';
  }

  if (isOnline.value) {
    // Load components for dropdowns
    await loadComponents();

    // Try to find the existing inspection for this work plan
    if (props.record?.id && props.record?.pv) {
      try {
        const inspections = await loadInspectionEntriesForWorkPlan(props.record.id, props.record.pv);
        if (inspections?.length > 0) {
          const last = inspections[inspections.length - 1];
          savedInspectionId.value = last?.id || null;
          await loadExistingParameters(savedInspectionId.value);
        }
      } catch (err) {
        console.error('Не удалось загрузить осмотры:', err);
      }
    }
  }
});
</script>

<style scoped>
.draft-parameter-content { padding: 24px; }
.parameters-content { display: flex; flex-direction: column; gap: 16px; }
.section-heading.spaced-heading { margin-bottom: 24px; }
.parameters-heading { color: #3182ce; }
.coordinates-input-group { display: flex; gap: 24px; width: 100%; }
.coord-start { flex: 1; }
.parameter-info-group { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.parameter-value-group { display: flex; gap: 16px; }
.half-width { width: 100%; }
.full-width-input { width: 100%; }
.text-area { height: 100px; }
.value-input { width: 50%; }
.button-container { display: flex; justify-content: flex-end; margin-top: 24px; }
.main-actions { display: flex; gap: 12px; }
.draft-btn { padding: 10px 20px; background: #fffbeb; color: #b45309; font-size: 16px; border-radius: 8px; border: 1px solid #fcd34d; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.draft-btn:hover { background: #fef3c7; border-color: #f59e0b; }
.no-inspection-warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; color: #856404; font-size: 14px; margin-top: 16px; }
@media (max-width: 768px) {
  .coordinates-input-group { flex-direction: column; gap: 12px; }
  .parameter-info-group { grid-template-columns: 1fr; gap: 12px; }
  .value-input { width: 100%; }
}
</style>
