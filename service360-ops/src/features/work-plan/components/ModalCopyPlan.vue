<template>
  <ModalWrapper title="Копировать план работ" @close="closeModal" @save="saveData" :loading="isSaving">
    <div class="form-section">
      <AppDatePicker
        id="copyDateStart"
        label="Начало (Копируемый период)"
        placeholder="Выберите дату начала"
        v-model="form.copyDateStart"
        :is-date-disabled="isCopyDateStartDisabled"
        :required="true"
      />

      <AppDatePicker
        id="planDateStart"
        label="Начало (Планируемый период)"
        placeholder="Выберите дату начала"
        v-model="form.planDateStart"
        :is-date-disabled="isPlanDateStartDisabled"
        :required="true"
      />

      <AppDatePicker
        id="copyDateEnd"
        label="Конец (Копируемый период)"
        placeholder="Выберите дату окончания"
        v-model="form.copyDateEnd"
        :is-date-disabled="isCopyDateEndDisabled"
        :required="true"
      />

      <AppDatePicker
        id="planDateEnd"
        label="Конец (Планируемый период)"
        placeholder="Выберите дату окончания"
        v-model="form.planDateEnd"
        :is-date-disabled="isPlanDateEndDisabled"
        :required="true"
        :disabled="true"
      />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import ModalWrapper from '@/app/layouts/Modal/ModalWrapper.vue'
import AppDatePicker from '@/shared/ui/FormControls/AppDatePicker.vue'
import { useNotificationStore } from '@/app/stores/notificationStore'
import { getPeriodInfo, copyPlan } from '@/shared/api/plans/planApi'

const props = defineProps({
  selectedRows: {
    type: Array,
    required: true
  },
  currentDate: {
    type: Date,
    required: true
  },
  currentPeriodType: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'update-table'])
const notificationStore = useNotificationStore()

const form = ref({
  copyDateStart: null,
  copyDateEnd: null,
  planDateStart: null,
  planDateEnd: null
})

const periodBounds = ref({
  dbeg: null,
  dend: null
})

const isCopyDateStartDisabled = (timestamp) => {
  if (!periodBounds.value.dbeg || !periodBounds.value.dend) {
    return false;
  }

  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  const minDate = new Date(periodBounds.value.dbeg);
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date(periodBounds.value.dend);
  maxDate.setHours(0, 0, 0, 0);

  return date < minDate || date > maxDate;
};

const isCopyDateEndDisabled = (timestamp) => {
  if (!periodBounds.value.dbeg || !periodBounds.value.dend) {
    return false;
  }

  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  const minDate = new Date(periodBounds.value.dbeg);
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date(periodBounds.value.dend);
  maxDate.setHours(0, 0, 0, 0);

  if (form.value.copyDateStart) {
    const copyStart = new Date(form.value.copyDateStart);
    copyStart.setHours(0, 0, 0, 0);

    if (date < copyStart) {
      return true;
    }
  }

  return date < minDate || date > maxDate;
};

const copyDuration = computed(() => {
  if (!form.value.copyDateStart || !form.value.copyDateEnd) return 0;
  
  return Math.floor((form.value.copyDateEnd - form.value.copyDateStart) / (1000 * 60 * 60 * 24)) + 1;
});

watch(() => form.value.planDateStart, (newPlanStart) => {
  if (newPlanStart && copyDuration.value > 0) {
    
    const endDate = new Date(newPlanStart);
    endDate.setDate(endDate.getDate() + copyDuration.value - 1);
    form.value.planDateEnd = endDate;
  }
});

watch([() => form.value.copyDateStart, () => form.value.copyDateEnd], () => {
  
  if (form.value.planDateStart && copyDuration.value > 0) {
    const endDate = new Date(form.value.planDateStart);
    endDate.setDate(endDate.getDate() + copyDuration.value - 1);
    form.value.planDateEnd = endDate;
  }
});

const isPlanDateStartDisabled = (timestamp) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return timestamp < today.getTime();
};

const isPlanDateEndDisabled = (timestamp) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (timestamp < today.getTime()) return true;

  if (!form.value.planDateStart) return true;

  if (copyDuration.value === 0) return false;

  const correctEndDate = new Date(form.value.planDateStart);
  correctEndDate.setDate(correctEndDate.getDate() + copyDuration.value - 1);
  correctEndDate.setHours(0, 0, 0, 0);

  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);

  return date.getTime() !== correctEndDate.getTime();
};

const closeModal = () => {
  emit('close')
}

const isSaving = ref(false)
const isLoading = ref(false)

const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

onMounted(async () => {
  isLoading.value = true;
  try {
    const dateStr = formatDateToString(props.currentDate);
    const periodTypeId = props.currentPeriodType?.value;

    if (!dateStr || !periodTypeId) {
      notificationStore.showNotification('Не выбраны дата или тип периода', 'error');
      return;
    }

    const periodInfo = await getPeriodInfo(dateStr, periodTypeId);

    if (periodInfo && periodInfo.dbeg && periodInfo.dend) {
      periodBounds.value.dbeg = periodInfo.dbeg;
      periodBounds.value.dend = periodInfo.dend;
      form.value.copyDateStart = parseDateString(periodInfo.dbeg);
      form.value.copyDateEnd = parseDateString(periodInfo.dend);
    }
  } catch (error) {
    console.error('Ошибка при загрузке информации о периоде:', error);
    notificationStore.showNotification('Не удалось загрузить информацию о периоде', 'error');
  } finally {
    isLoading.value = false;
  }
});

const validateForm = () => {
  if (!form.value.copyDateStart) {
    notificationStore.showNotification('Не выбрана дата начала копируемого периода', 'error')
    return false
  }

  if (!form.value.copyDateEnd) {
    notificationStore.showNotification('Не выбрана дата окончания копируемого периода', 'error')
    return false
  }

  if (!form.value.planDateStart) {
    notificationStore.showNotification('Не выбрана дата начала планируемого периода', 'error')
    return false
  }

  if (!form.value.planDateEnd) {
    notificationStore.showNotification('Не выбрана дата окончания планируемого периода', 'error')
    return false
  }

  if (form.value.copyDateEnd < form.value.copyDateStart) {
    notificationStore.showNotification('Дата окончания копируемого периода не может быть меньше даты начала', 'error')
    return false
  }

  if (form.value.planDateEnd < form.value.planDateStart) {
    notificationStore.showNotification('Дата окончания планируемого периода не может быть меньше даты начала', 'error')
    return false
  }

  const copyDuration = Math.floor((form.value.copyDateEnd - form.value.copyDateStart) / (1000 * 60 * 60 * 24))
  const planDuration = Math.floor((form.value.planDateEnd - form.value.planDateStart) / (1000 * 60 * 60 * 24))

  if (copyDuration !== planDuration) {
    notificationStore.showNotification(
      `Длительность планируемого периода (${planDuration} дн.) должна быть равна длительности копируемого периода (${copyDuration} дн.)`,
      'error'
    )
    return false
  }

  return true
}

const saveData = async () => {
  if (isSaving.value) return

  if (!validateForm()) {
    return
  }

  isSaving.value = true
  try {
    
    const idsWorkPlan = props.selectedRows;

    const dbegCopy = formatDateToString(form.value.copyDateStart);
    const dendCopy = formatDateToString(form.value.copyDateEnd);
    const dbegPlan = formatDateToString(form.value.planDateStart);
    const dendPlan = formatDateToString(form.value.planDateEnd);

    await copyPlan(idsWorkPlan, dbegCopy, dendCopy, dbegPlan, dendPlan);

    notificationStore.showNotification(`Скопировано ${props.selectedRows.length} работ(ы)`, 'success')

    emit('update-table')
    closeModal()
  } catch (e) {
    console.error('Ошибка при копировании:', e)
    let errorMessage = 'Ошибка при копировании';

    if (e.response?.data?.error?.message) {
      errorMessage = e.response.data.error.message;
    } else if (e.response?.status === 500) {
      errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
    } else if (e.message) {
      errorMessage = e.message;
    }

    notificationStore.showNotification(errorMessage, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.form-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 0 32px 32px;
  background-color: #f9fafb;
}

/* Tablet and Mobile styles */
@media (max-width: 1024px) {
  .form-section {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    padding: 0 16px 16px !important;
  }
}
</style>
