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
          <button v-if="groupedDrafts.length > 0" class="clear-all-btn" @click="handleClearAll">
            Очистить все
          </button>
        </div>

        <div class="drafts-panel-list">
          <div v-if="groupedDrafts.length === 0" class="drafts-panel-empty">
            <UiIcon name="FileText" class="drafts-panel-empty-icon" />
            <span>Нет черновиков</span>
          </div>

          <div
            v-for="group in groupedDrafts"
            :key="group.draft.id"
            class="drafts-group"
          >
            <!-- Родительский черновик -->
            <div
              class="drafts-panel-item"
              @click="openDraft(group.draft)"
            >
              <div class="drafts-panel-item-content">
                <div class="drafts-panel-item-top">
                  <span class="drafts-panel-item-name">{{ getFormLabel(group.draft.formType) }}</span>
                  <span class="drafts-panel-item-time">{{ formatTime(group.draft.createdAt) }}</span>
                </div>
                <p class="drafts-panel-item-desc">{{ getDraftPreview(group.draft) }}</p>
              </div>
              <button class="drafts-delete-btn" @click.stop="handleDeleteParent(group.draft.id)">
                <UiIcon name="Trash2" :size="14" />
              </button>
            </div>

            <!-- Дочерние черновики (Неисправности / Параметры) -->
            <div
              v-for="child in group.children"
              :key="child.id"
              class="drafts-child-item"
              :class="{ 'drafts-child-item--disabled': !isChildAvailable(child) }"
              @click="openChildDraft(child)"
            >
              <div class="drafts-child-connector"></div>
              <UiIcon :name="getChildIcon(child)" :size="13" class="drafts-child-icon" />
              <div class="drafts-child-content">
                <span class="drafts-child-label">{{ getChildLabel(child) }}</span>
                <span class="drafts-child-desc">{{ getChildPreview(child) }}</span>
              </div>
              <button class="drafts-delete-btn drafts-delete-btn--small" @click.stop="handleDelete(child.id)">
                <UiIcon name="Trash2" :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import UiIcon from '@/shared/ui/UiIcon.vue';
import { draftsCount, getDrafts, deleteDraft, deleteDraftWithChildren, clearAllDrafts } from '@/shared/offline/draftsStore';
import { setActiveDraft } from '@/shared/offline/activeDraft';
import { useNotificationStore } from '@/app/stores/notificationStore';

const router = useRouter();
const notificationStore = useNotificationStore();

const panelOpen = ref(false);
const wrapperRef = ref(null);
const drafts = ref([]);

const FORM_LABELS = {
  resourcePlanning: 'Планирование ресурсов',
  workCard: 'Карточка осмотра',
};

const getFormLabel = (formType) => FORM_LABELS[formType] || formType;

// Группируем черновики: родительские + их дети
const groupedDrafts = computed(() => {
  const allDrafts = drafts.value;
  // Родительские черновики (без parentDraftId)
  const parents = allDrafts.filter(d => !d.parentDraftId);
  // Дочерние черновики (с parentDraftId)
  const children = allDrafts.filter(d => !!d.parentDraftId);

  return parents
    .map(parent => ({
      draft: parent,
      children: children.filter(c => c.parentDraftId === parent.id),
    }))
    .sort((a, b) => b.draft.createdAt - a.draft.createdAt);
});

const getChildIcon = (child) => {
  const tab = child.formFields?.tab;
  if (tab === 'defects') return 'AlertTriangle';
  if (tab === 'parameters') return 'SlidersHorizontal';
  return 'FileText';
};

const getChildLabel = (child) => {
  const tab = child.formFields?.tab;
  if (tab === 'defects') return 'Неисправность';
  if (tab === 'parameters') return 'Параметр';
  return 'Запись';
};

const getChildPreview = (child) => {
  const tab = child.formFields?.tab;
  if (tab === 'defects') {
    const d = child.formFields?.defect;
    if (!d) return '';
    const parts = [];
    if (d.componentText) parts.push(d.componentText);
    if (d.defectText) parts.push(d.defectText);
    return parts.join(' · ') || 'Без описания';
  }
  if (tab === 'parameters') {
    const p = child.formFields?.parameter;
    if (!p) return '';
    const parts = [];
    if (p.componentText) parts.push(p.componentText);
    if (p.parameterText) parts.push(p.parameterText);
    return parts.join(' · ') || 'Без описания';
  }
  return '';
};

const isChildAvailable = (child) => {
  if (!child.parentDraftId) return true;
  // Доступен только если родительский черновик (Карточка осмотра) существует
  const parent = drafts.value.find(d => d.id === child.parentDraftId);
  return !!parent && parent.formType === 'workCard';
};

const getDraftPreview = (draft) => {
  const fields = draft.formFields;
  if (!fields) return '';
  const parts = [];

  // Название работы из recordData
  if (draft.recordData?.name) {
    parts.push(draft.recordData.name);
  }

  if (draft.formType === 'workCard') {
    if (fields.info?.deviationReason) parts.push(fields.info.deviationReason);
    // Совместимость со старым форматом
    if (fields.defect?.componentText) parts.push(fields.defect.componentText);
    if (fields.defect?.defectText) parts.push(fields.defect.defectText);
    if (fields.info?.deviationReason === undefined && fields.deviationReason) parts.push(fields.deviationReason);
  } else {
    if (fields.taskText) parts.push(fields.taskText);
    if (fields.plannedVolume) parts.push(`Объем: ${fields.plannedVolume}`);
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

const navigateAndOpen = async (draft) => {
  panelOpen.value = false;

  const currentRoute = router.currentRoute.value;

  let targetRouteName = null;
  if (draft.formType === 'resourcePlanning') {
    targetRouteName = 'ResourcePlanningRecord';
  } else if (draft.formType === 'workCard') {
    targetRouteName = 'InspectionRecord';
  }

  if (targetRouteName && currentRoute.name !== targetRouteName) {
    await router.push({ name: targetRouteName });
  }

  setActiveDraft(draft);
};

// Открыть родительский (info) черновик
const openDraft = async (draft) => {
  await navigateAndOpen(draft);
};

// Открыть дочерний черновик (дефект или параметр) — передаём parentDraftId
const openChildDraft = async (child) => {
  if (!isChildAvailable(child)) {
    notificationStore.showNotification('Сначала необходимо сохранить информацию по работе!', 'error');
    return;
  }
  await navigateAndOpen(child);
};

const handleDelete = async (id) => {
  await deleteDraft(id);
  drafts.value = drafts.value.filter(d => d.id !== id);
};

const handleDeleteParent = async (id) => {
  await deleteDraftWithChildren(id);
  drafts.value = drafts.value.filter(d => d.id !== id && d.parentDraftId !== id);
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
  max-height: 520px;
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

/* Группа: родитель + дети */
.drafts-group {
  border-bottom: 1px solid #f1f5f9;
}

.drafts-group:last-child {
  border-bottom: none;
}

/* Родительский элемент */
.drafts-panel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  transition: background 0.15s;
  cursor: pointer;
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

/* Дочерний элемент */
.drafts-child-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px 7px 28px;
  cursor: pointer;
  background: #fafbfc;
  transition: background 0.15s;
  position: relative;
}

.drafts-child-item:hover {
  background: #f1f5f9;
}

.drafts-child-item--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drafts-child-item--disabled:hover {
  background: #fafbfc;
}

.drafts-child-connector {
  position: absolute;
  left: 22px;
  top: 0;
  bottom: 50%;
  width: 1px;
  background: #e2e8f0;
}

.drafts-child-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.drafts-child-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.drafts-child-label {
  font-size: 12px;
  font-weight: 500;
  color: #4a5568;
  white-space: nowrap;
  flex-shrink: 0;
}

.drafts-child-desc {
  font-size: 11px;
  color: #94a3b8;
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

.drafts-delete-btn--small {
  padding: 2px;
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
