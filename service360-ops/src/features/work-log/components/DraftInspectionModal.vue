<template>
  <ModalWrapper
    title="Черновик: Карточка осмотра"
    :show-save="false"
    :show-cancel="false"
    :showDelete="false"
    @close="closeModal"
    :loading="isSaving"
  >
    <div class="draft-inspection-content">
      <WorkHeaderInfo :record="record" :section="record?.nameLocationClsSection" :date="record?.date" />

      <ExistingDataBlock :existingRecords="existingRecords" dataType="info" />

      <div class="new-info-content">
        <div class="section-heading spaced-heading info-heading">Местоположение работы</div>
        <div class="coordinates-input-group">
          <FullCoordinates
            v-model="infoForm.coordinates"
            label="Координаты начала"
            class="coord-start"
            :isInspection="true"
            :objectBounds="objectBounds"
            :required="true"
          />
        </div>
        <div class="form-grid">
          <AppDatePicker label="Дата" placeholder="Выберите дату" id="di-date" v-model="infoForm.date" :required="true" />
        </div>
        <AppInput
          label="Причина отклонения от плана"
          id="di-deviation"
          v-model="infoForm.deviationReason"
          placeholder="Введите причину отклонения от плана..."
          class="full-width-input text-area"
          multiline
        />
      </div>

      <div class="button-container">
        <div class="main-actions">
          <button v-if="!isOnline" class="draft-btn" @click="saveAsDraft">Обновить черновик</button>
          <MainButton v-if="isOnline" label="Добавить запись в журнал" :loading="isSaving" @click="submitOnline" class="save-btn" />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue';
import MainButton from '@/shared/ui/MainButton.vue';
import FullCoordinates from '@/shared/ui/FormControls/FullCoordinates.vue';
import AppDatePicker from '@/shared/ui/FormControls/AppDatePicker.vue';
import AppInput from '@/shared/ui/FormControls/AppInput.vue';
import WorkHeaderInfo from '@/shared/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/shared/ui/ExistingDataBlock.vue';
import { useNotificationStore } from '@/app/stores/notificationStore';
import {
  saveInspectionInfo, getUserData, loadInspectionEntriesForWorkPlan,
} from '@/shared/api/inspections/inspectionsApi';
import { formatDate, formatDateToISO } from '@/app/stores/date.js';
import { useNetworkStatus } from '@/shared/offline/useNetworkStatus';
import { updateDraft, submitParentDraft } from '@/shared/offline/draftsStore';

const props = defineProps({
  record: { type: Object, default: null },
  draftId: { type: Number, default: null },
  formFields: { type: Object, default: null },
});

const emit = defineEmits(['close']);
const { isOnline } = useNetworkStatus();
const notificationStore = useNotificationStore();

const isSaving = ref(false);
const existingRecords = ref([]);

const infoForm = ref({
  coordinates: { coordStartKm: 0, coordStartPk: 0, coordStartZv: 0, coordEndKm: 0, coordEndPk: 0, coordEndZv: 0 },
  date: null,
  deviationReason: '',
});

const objectBounds = ref({
  StartKm: null, StartPicket: null, StartLink: null,
  FinishKm: null, FinishPicket: null, FinishLink: null,
});

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

const loadExistingInspections = async () => {
  if (!props.record?.id || !props.record?.pv) return;
  try {
    const data = await loadInspectionEntriesForWorkPlan(props.record.id, props.record.pv);
    existingRecords.value = data.map(item => ({
      date: formatDate(item.FactDateEnd),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink),
    }));
  } catch {
    existingRecords.value = [];
  }
};

const saveAsDraft = async () => {
  try {
    const fields = {
      tab: 'info',
      info: {
        coordinates: { ...infoForm.value.coordinates },
        date: infoForm.value.date,
        deviationReason: infoForm.value.deviationReason,
      },
    };
    await updateDraft(props.draftId, fields);
    notificationStore.showNotification('Черновик осмотра обновлён!', 'success');
    closeModal();
  } catch (err) {
    console.error(err);
    notificationStore.showNotification('Не удалось сохранить черновик.', 'error');
  }
};

const submitOnline = async () => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    const user = await getUserData();
    const formattedDate = formatDateToISO(infoForm.value.date);
    await saveInspectionInfo({
      name: `${props.record.id}-${formattedDate}`,
      objLocationClsSection: props.record.objLocationClsSection,
      pvLocationClsSection: parseInt(props.record.pvLocationClsSection),
      objWorkPlan: props.record.id, pvWorkPlan: props.record.pv,
      objUser: user.id, pvUser: user.pv,
      StartKm: infoForm.value.coordinates.coordStartKm,
      FinishKm: infoForm.value.coordinates.coordEndKm,
      StartPicket: infoForm.value.coordinates.coordStartPk,
      FinishPicket: infoForm.value.coordinates.coordEndPk,
      StartLink: infoForm.value.coordinates.coordStartZv,
      FinishLink: infoForm.value.coordinates.coordEndZv,
      FactDateEnd: formattedDate,
      CreatedAt: new Date().toISOString().split('T')[0],
      UpdatedAt: new Date().toISOString().split('T')[0],
      ReasonDeviation: infoForm.value.deviationReason,
    });
    if (props.draftId) await submitParentDraft(props.draftId);
    notificationStore.showNotification('Информация по работе успешно сохранена!', 'success');
    closeModal();
  } catch (err) {
    console.error(err);
    notificationStore.showNotification(err.response?.data?.error?.message || 'Не удалось сохранить.', 'error');
  } finally {
    isSaving.value = false;
  }
};

watch(() => props.record, (rec) => {
  if (!rec) return;
  objectBounds.value = {
    StartKm: rec.StartKm || null, StartPicket: rec.StartPicket || null, StartLink: rec.StartLink || null,
    FinishKm: rec.FinishKm || null, FinishPicket: rec.FinishPicket || null, FinishLink: rec.FinishLink || null,
  };
  Object.assign(infoForm.value.coordinates, {
    coordStartKm: rec.StartKm || null, coordStartPk: rec.StartPicket || null, coordStartZv: rec.StartLink || null,
    coordEndKm: rec.FinishKm || null, coordEndPk: rec.FinishPicket || null, coordEndZv: rec.FinishLink || null,
  });
}, { immediate: true });

onMounted(async () => {
  const f = props.formFields?.info;
  if (f) {
    if (f.coordinates) Object.assign(infoForm.value.coordinates, f.coordinates);
    infoForm.value.date = f.date || null;
    infoForm.value.deviationReason = f.deviationReason || '';
  }
  if (isOnline.value) {
    await loadExistingInspections();
  }
});
</script>

<style scoped>
.draft-inspection-content { padding: 24px; }
.new-info-content { display: flex; flex-direction: column; gap: 16px; }
.section-heading.spaced-heading { margin-bottom: 24px; }
.info-heading { color: #3182ce; }
.coordinates-input-group { display: flex; gap: 24px; width: 100%; }
.coord-start { flex: 1; }
.full-width-input { width: 100%; }
.text-area { height: 100px; }
.form-grid { width: 100%; }
.button-container { display: flex; justify-content: flex-end; margin-top: 24px; }
.main-actions { display: flex; gap: 12px; }
.draft-btn { padding: 10px 20px; background: #fffbeb; color: #b45309; font-size: 16px; border-radius: 8px; border: 1px solid #fcd34d; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.draft-btn:hover { background: #fef3c7; border-color: #f59e0b; }
@media (max-width: 768px) {
  .coordinates-input-group { flex-direction: column; gap: 12px; }
}
</style>
