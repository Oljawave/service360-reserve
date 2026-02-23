<template>
  <div class="drafts-wrapper" ref="wrapperRef">
    <button class="drafts-btn" @click="togglePanel">
      <UiIcon name="FileText" class="icon" />
      <span v-if="draftsCount > 0" class="drafts-badge">{{ draftsCount > 99 ? '99+' : draftsCount }}</span>
    </button>

    <Transition name="panel">
      <div v-if="panelOpen" class="drafts-panel">
        <div class="drafts-panel-arrow"></div>

        <div class="drafts-panel-header">
          <div class="drafts-panel-header-left">
            <span class="drafts-panel-title">Черновики</span>
            <span v-if="draftsCount > 0" class="drafts-panel-badge">{{ draftsCount }}</span>
          </div>
          <button v-if="drafts.length > 0" class="clear-all-btn" @click="handleClearAll">
            Очистить все
          </button>
        </div>

        <div class="drafts-panel-list">
          <div v-if="drafts.length === 0" class="drafts-panel-empty">
            <UiIcon name="FileText" class="drafts-panel-empty-icon" />
            <span>Нет черновиков</span>
          </div>

          <div
            v-for="draft in drafts"
            :key="draft.id"
            class="drafts-panel-item"
            @click="openDraft(draft)"
          >
            <div class="drafts-panel-item-content">
              <div class="drafts-panel-item-top">
                <span class="drafts-panel-item-name">{{ getFormLabel(draft.formType) }}</span>
                <span class="drafts-panel-item-time">{{ formatTime(draft.createdAt) }}</span>
              </div>
              <p class="drafts-panel-item-desc">{{ getDraftPreview(draft) }}</p>
            </div>
            <button class="drafts-delete-btn" @click.stop="handleDelete(draft.id)">
              <UiIcon name="Trash2" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import UiIcon from '@/shared/ui/UiIcon.vue';
import { draftsCount, getDrafts, deleteDraft, clearAllDrafts } from '@/shared/offline/draftsStore';
import { setActiveDraft } from '@/shared/offline/activeDraft';

const router = useRouter();

const panelOpen = ref(false);
const wrapperRef = ref(null);
const drafts = ref([]);

const FORM_LABELS = {
  resourcePlanning: 'Планирование ресурсов',
  workCard: 'Карточка осмотра',
};

const getFormLabel = (formType) => FORM_LABELS[formType] || formType;

const getDraftPreview = (draft) => {
  const fields = draft.formFields;
  if (!fields) return '';
  const parts = [];

  if (draft.formType === 'workCard') {
    if (fields.defect?.componentText) parts.push(fields.defect.componentText);
    if (fields.defect?.defectText) parts.push(fields.defect.defectText);
    if (fields.info?.deviationReason) parts.push(fields.info.deviationReason);
  } else {
    if (fields.taskText) parts.push(fields.taskText);
    if (fields.plannedVolume) parts.push(`Объем: ${fields.plannedVolume}`);
  }

  // Добавляем название работы из recordData
  if (draft.recordData?.name) {
    parts.unshift(draft.recordData.name);
  }

  return parts.join(' · ') || 'Без описания';
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `Сегодня, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Вчера, ${time}`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}, ${time}`;
};

const fetchDrafts = async () => {
  drafts.value = await getDrafts();
};

const togglePanel = () => {
  panelOpen.value = !panelOpen.value;
  if (panelOpen.value) {
    fetchDrafts();
  }
};

const openDraft = async (draft) => {
  panelOpen.value = false;

  // Сначала навигируем, потом устанавливаем activeDraft.
  // Это гарантирует, что целевой компонент будет смонтирован
  // до того, как сработает watcher на activeDraft.
  if (draft.formType === 'resourcePlanning') {
    await router.push({ name: 'ResourcePlanningRecord' });
  } else if (draft.formType === 'workCard') {
    await router.push({ name: 'InspectionRecord' });
  }

  setActiveDraft(draft);
};

const handleDelete = async (id) => {
  await deleteDraft(id);
  drafts.value = drafts.value.filter(d => d.id !== id);
};

const handleClearAll = async () => {
  await clearAllDrafts();
  drafts.value = [];
};

const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    panelOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.drafts-wrapper {
  position: relative;
}

.drafts-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: background 0.15s;
}

.drafts-btn:hover {
  background: #f1f5f9;
}

.drafts-btn .icon {
  width: 20px;
  height: 20px;
  color: #4a5568;
  transition: color 0.2s;
}

.drafts-btn:hover .icon {
  color: #2b6cb0;
}

.drafts-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.drafts-panel {
  position: absolute;
  top: calc(100% + 14px);
  right: -8px;
  width: 380px;
  max-height: 480px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drafts-panel-arrow {
  position: absolute;
  top: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-left: 1px solid #e8ecf1;
  border-top: 1px solid #e8ecf1;
  transform: rotate(45deg);
  z-index: 1;
}

.drafts-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.drafts-panel-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drafts-panel-title {
  font-weight: 600;
  font-size: 15px;
  color: #1a202c;
}

.drafts-panel-badge {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #f59e0b;
  border-radius: 10px;
  padding: 1px 7px;
  line-height: 1.4;
}

.clear-all-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-all-btn:hover {
  color: #ef4444;
}

.drafts-panel-list {
  overflow-y: auto;
  flex: 1;
}

.drafts-panel-list::-webkit-scrollbar {
  width: 4px;
}

.drafts-panel-list::-webkit-scrollbar-track {
  background: transparent;
}

.drafts-panel-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.drafts-panel-empty {
  padding: 40px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #a0aec0;
  font-size: 13px;
}

.drafts-panel-empty-icon {
  width: 32px;
  height: 32px;
  color: #cbd5e1;
}

.drafts-panel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-bottom: 1px solid #f7fafc;
  transition: background 0.15s;
  cursor: pointer;
}

.drafts-panel-item:last-child {
  border-bottom: none;
}

.drafts-panel-item:hover {
  background: #f8fafc;
}

.drafts-panel-item-content {
  flex: 1;
  min-width: 0;
}

.drafts-panel-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.drafts-panel-item-name {
  font-weight: 600;
  font-size: 13px;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drafts-panel-item-time {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

.drafts-panel-item-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drafts-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #cbd5e1;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.drafts-delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* Анимация панели */
.panel-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .drafts-panel {
    position: fixed;
    top: 60px;
    right: 8px;
    left: 8px;
    width: auto;
  }

  .drafts-panel-arrow {
    display: none;
  }
}
</style>
