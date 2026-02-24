<template>
  <ModalWrapper
    title="Черновик: Неисправность"
    :show-save="false"
    :show-cancel="false"
    :showDelete="false"
    @close="closeModal"
    :loading="isSaving"
  >
    <div class="draft-defect-content">
      <WorkHeaderInfo :record="record" :section="record?.nameLocationClsSection" :date="record?.date" />

      <ExistingDataBlock :existingRecords="existingDefects" dataType="defects" />

      <div class="defects-content">
        <div class="section-heading spaced-heading defect-heading">Местоположение неисправности</div>
        <div class="coordinates-input-group">
          <FullCoordinates
            v-model="defectForm.startCoordinates"
            label="Координаты начала"
            class="coord-start"
            :required="true"
          />
        </div>
        <div class="defect-info-group">
          <AppDropdown
            v-if="isOnline"
            :label="defectForm.componentText ? `Компонент (${defectForm.componentText})` : 'Компонент'"
            id="dd-component"
            :options="componentOptions"
            v-model="defectForm.component"
            placeholder="Выберите компонент"
            class="half-width"
            :loading="loadingComponents"
            @update:modelValue="handleComponentChange"
            :required="true"
          />
          <AppInput
            v-else
            label="Компонент"
            id="dd-component-text"
            v-model="defectForm.componentText"
            placeholder="Введите название компонента"
            class="half-width"
            :required="true"
          />
          <AppDropdown
            v-if="isOnline"
            :label="defectForm.defectText ? `Дефект / неисправность (${defectForm.defectText})` : 'Дефект / неисправность'"
            id="dd-defect"
            :options="defectOptions"
            v-model="defectForm.defectType"
            placeholder="Выберите дефект"
            class="half-width"
            :loading="loadingDefects"
            :required="true"
          />
          <AppInput
            v-else
            label="Дефект / неисправность"
            id="dd-defect-text"
            v-model="defectForm.defectText"
            placeholder="Введите описание дефекта"
            class="half-width"
            :required="true"
          />
        </div>
        <AppInput
          label="Примечание / заметка"
          id="dd-note"
          v-model="defectForm.note"
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
            label="Добавить неисправность"
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
import WorkHeaderInfo from '@/shared/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/shared/ui/ExistingDataBlock.vue';
import { useNotificationStore } from '@/app/stores/notificationStore';
import {
  saveFaultInfo, getUserData,
  loadComponentsByTypObjectForSelect, loadDefectsByComponentForSelect,
  loadInspectionEntriesForWorkPlan, loadFaultEntriesForInspection,
} from '@/shared/api/inspections/inspectionsApi';
import { formatDate } from '@/app/stores/date.js';
import { useNetworkStatus } from '@/shared/offline/useNetworkStatus';
import { updateDraft, deleteDraft } from '@/shared/offline/draftsStore';

const props = defineProps({
  record: { type: Object, default: null },
  // draftId = ID дочернего черновика дефекта в Dexie
  draftId: { type: Number, default: null },
  formFields: { type: Object, default: null },
  // parentDraftId = ID родительского info-черновика (для справки, не используется при submit)
  parentDraftId: { type: Number, default: null },
});

const emit = defineEmits(['close']);
const { isOnline } = useNetworkStatus();
const notificationStore = useNotificationStore();

const isSaving = ref(false);
const savedInspectionId = ref(null);
const existingDefects = ref([]);

const defectForm = ref({
  startCoordinates: { coordStartKm: 0, coordStartPk: 0, coordStartZv: 0, coordEndKm: 0, coordEndPk: 0, coordEndZv: 0 },
  component: null,
  componentText: '',
  defectType: null,
  defectText: '',
  note: '',
});

const componentOptions = ref([]);
const defectOptions = ref([]);
const loadingComponents = ref(false);
const loadingDefects = ref(false);

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
    existingDefects.value = [];
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

const loadDefects = async (objComponent) => {
  if (!objComponent) { defectOptions.value = []; return; }
  loadingDefects.value = true;
  try {
    const items = await loadDefectsByComponentForSelect(objComponent);
    defectOptions.value = items.map(d => ({ label: d.name || d.label, value: d.id || d.value, pv: d.pv || d.id || d.value }));
  } catch { defectOptions.value = []; }
  finally { loadingDefects.value = false; }
};

const handleComponentChange = async (selected) => {
  defectForm.value.defectType = null;
  defectOptions.value = [];
  if (selected) {
    const c = componentOptions.value.find(c => c.value === (selected.value || selected));
    if (c?.objComponent) await loadDefects(c.objComponent);
  }
};

// ── OFFLINE: Dexie ────────────────────────────────────────────────────────

const saveAsDraft = async () => {
  try {
    const fields = {
      tab: 'defects',
      defect: {
        startCoordinates: { ...defectForm.value.startCoordinates },
        componentText: defectForm.value.componentText,
        defectText: defectForm.value.defectText,
        note: defectForm.value.note,
      },
    };
    await updateDraft(props.draftId, fields);
    notificationStore.showNotification('Черновик неисправности обновлён!', 'success');
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
    const defect = defectOptions.value.find(d => d.value === (defectForm.value.defectType?.value || defectForm.value.defectType));
    if (!defect) throw new Error('Выбранный дефект не найден');
    const now = new Date();
    const kzTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const dt = kzTime.toISOString();
    await saveFaultInfo({
      name: `${dt.split('T')[0]}-${defect.value}`,
      objInspection: savedInspectionId.value,
      objDefect: defect.value,
      pvDefect: defect.pv || defect.value,
      pvLocationClsSection: parseInt(props.record.pvLocationClsSection),
      objLocationClsSection: props.record.objLocationClsSection,
      StartKm: defectForm.value.startCoordinates.coordStartKm,
      FinishKm: defectForm.value.startCoordinates.coordEndKm ?? 0,
      StartPicket: defectForm.value.startCoordinates.coordStartPk ?? 0,
      FinishPicket: defectForm.value.startCoordinates.coordEndPk ?? 0,
      StartLink: defectForm.value.startCoordinates.coordStartZv ?? 0,
      FinishLink: defectForm.value.startCoordinates.coordEndZv ?? 0,
      objUser: user.id,
      pvUser: user.pv,
      fullNameUser: user.fullName,
      nameLocation: user.nameLocation,
      Description: defectForm.value.note || '',
      CreationDateTime: dt,
    });
    if (props.draftId) await deleteDraft(props.draftId);
    notificationStore.showNotification('Дефект успешно сохранён!', 'success');
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
  const f = props.formFields?.defect;
  if (f) {
    if (f.startCoordinates) Object.assign(defectForm.value.startCoordinates, f.startCoordinates);
    defectForm.value.componentText = f.componentText || '';
    defectForm.value.defectText = f.defectText || '';
    defectForm.value.note = f.note || '';
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
          await loadExistingDefects(savedInspectionId.value);
        }
      } catch (err) {
        console.error('Не удалось загрузить осмотры:', err);
      }
    }
  }
});
</script>

<style scoped>
.draft-defect-content { padding: 24px; }
.defects-content { display: flex; flex-direction: column; gap: 16px; }
.section-heading.spaced-heading { margin-bottom: 24px; }
.defect-heading { color: #c70039; }
.coordinates-input-group { display: flex; gap: 24px; width: 100%; }
.coord-start { flex: 1; }
.defect-info-group { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.half-width { width: 100%; }
.full-width-input { width: 100%; }
.text-area { height: 100px; }
.button-container { display: flex; justify-content: flex-end; margin-top: 24px; }
.main-actions { display: flex; gap: 12px; }
.draft-btn { padding: 10px 20px; background: #fffbeb; color: #b45309; font-size: 16px; border-radius: 8px; border: 1px solid #fcd34d; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.draft-btn:hover { background: #fef3c7; border-color: #f59e0b; }
.no-inspection-warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; color: #856404; font-size: 14px; margin-top: 16px; }
@media (max-width: 768px) {
  .coordinates-input-group { flex-direction: column; gap: 12px; }
  .defect-info-group { grid-template-columns: 1fr; gap: 12px; }
}
</style>
