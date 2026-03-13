<template>
  <div class="table-wrapper" :class="{ 'mobile-view': isMobile }">
    <div class="header-content">
      <h2 class="title" v-if="!isMobile && hasActiveFilters">{{ title }}</h2>
      <div v-if="isMobile" class="mobile-header-top">
        <h2 class="title">{{ title }}</h2>
        <TableActions :actions="actions" :isMobile="isMobile" />
      </div>

      <div v-if="!isMobile" class="controls-header">
        <h2 class="title" v-if="!hasActiveFilters">{{ title }}</h2>
        <TableActions :actions="actions" :isMobile="isMobile" />
      </div>
    </div>

    <div v-if="!isMobile" class="table-container">
      <table class="styled-table">
        <thead>
          <tr>
            <th :colspan="columns1c.length" class="group-header group-center divider-right">1С:Бухгалтерия</th>
            <th :colspan="columnsS360.length" class="group-header group-center">Service 360</th>
          </tr>
          <tr>
            <th
              v-for="(col, i) in columns1c"
              :key="col.key"
              :class="['header-cell-container', { 'divider-right': i === columns1c.length - 1 }]"
            >
              <div class="header-cell">
                <span>{{ col.label }}</span>
                <button
                  @click.stop="toggleFilter(col.key)"
                  :class="['filter-button', { active: columnFilters[col.key] }]"
                  title="Фильтр"
                >
                  <UiIcon name="Funnel" class="icon-muted" />
                </button>
              </div>
              <ColumnFilter
                v-if="openFilter === col.key"
                :column-key="col.key"
                :column-label="col.label"
                :initial-value="columnFilters[col.key] || ''"
                @filter="applyColumnFilter"
                @close="closeFilter"
              />
            </th>
            <th
              v-for="col in columnsS360"
              :key="col.key"
              class="header-cell-container"
            >
              <div class="header-cell">
                <span>{{ col.label }}</span>
                <button
                  @click.stop="toggleFilter(col.key)"
                  :class="['filter-button', { active: columnFilters[col.key] }]"
                  title="Фильтр"
                >
                  <UiIcon name="Funnel" class="icon-muted" />
                </button>
              </div>
              <ColumnFilter
                v-if="openFilter === col.key"
                :column-key="col.key"
                :column-label="col.label"
                :initial-value="columnFilters[col.key] || ''"
                @filter="applyColumnFilter"
                @close="closeFilter"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns1c.length + columnsS360.length" class="empty">Загрузка...</td>
          </tr>
          <tr v-else-if="!pagedRows.length">
            <td :colspan="columns1c.length + columnsS360.length" class="empty">Нет данных</td>
          </tr>
          <tr
            v-else
            v-for="(row, i) in pagedRows"
            :key="i"
            class="data-row"
            @dblclick="handleRowDoubleClick(row)"
          >
            <td v-for="(col, i) in columns1c" :key="col.key" :class="['cell', { 'divider-right': i === columns1c.length - 1 }]">{{ row[col.key] ?? '' }}</td>
            <td v-for="col in columnsS360" :key="col.key" class="cell">{{ row[col.key] ?? '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer" v-if="!isMobile && filteredRows.length > 0">
      <div class="record-summary">{{ recordSummary }}</div>
      <Pagination
        :total="filteredRows.length"
        :page="page"
        :limit="limit"
        @change-page="setPage"
      />
    </div>

    <slot
      name="modals"
      :selectedRow="selectedRow"
      :showEditModal="showEditModal"
      :closeModals="closeModals"
      :onSave="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TableActions from './TableActions.vue';
import Pagination from './Pagination.vue';
import UiIcon from '@/shared/ui/UiIcon.vue';
import ColumnFilter from './ColumnFilter.vue';

const isMobile = ref(window.innerWidth <= 768);
const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const props = defineProps({
  title: String,
  columns1c: { type: Array, required: true },
  columnsS360: { type: Array, required: true },
  limit: { type: Number, default: 20 },
  actions: { type: Array, default: () => [] },
  loadFn: { type: Function, required: true },
});

const emit = defineEmits(['row-dblclick']);

const rows = ref([]);
const loading = ref(false);
const page = ref(1);
const selectedRow = ref(null);
const showEditModal = ref(false);

const hasActiveFilters = computed(() => false);

const columnFilters = ref({});
const openFilter = ref(null);

const toggleFilter = (key) => {
  openFilter.value = openFilter.value === key ? null : key;
};

const closeFilter = () => {
  openFilter.value = null;
};

const applyColumnFilter = ({ columnKey, value }) => {
  columnFilters.value[columnKey] = value;
  page.value = 1;
};

const handleClickOutside = (e) => {
  if (openFilter.value && !e.target.closest('.header-cell-container')) {
    closeFilter();
  }
};

const filteredRows = computed(() => {
  let result = [...rows.value];
  const allColumns = [...props.columns1c, ...props.columnsS360];
  Object.keys(columnFilters.value).forEach(key => {
    const val = columnFilters.value[key];
    if (val && val.trim()) {
      result = result.filter(row => {
        const cell = row[key];
        if (cell == null) return false;
        return String(cell).toLowerCase().includes(val.toLowerCase().trim());
      });
    }
  });
  return result;
});

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.limit;
  const end = start + props.limit;
  return filteredRows.value.slice(start, end);
});

const recordSummary = computed(() => {
  const start = (page.value - 1) * props.limit + 1;
  const end = Math.min(start + props.limit - 1, filteredRows.value.length);
  const total = filteredRows.value.length;
  if (total === 0) return 'Показано 0 записей';
  return `Показано ${start}–${end} из ${total} записей`;
});

const handleRowDoubleClick = (row) => {
  const plainRow = JSON.parse(JSON.stringify(row));
  selectedRow.value = plainRow;
  showEditModal.value = true;
  emit('row-dblclick', plainRow);
};

const closeModals = () => {
  showEditModal.value = false;
  selectedRow.value = null;
};

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await props.loadFn();
    rows.value = data;
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
  } finally {
    loading.value = false;
  }
};

const setPage = (p) => {
  page.value = p;
};

const handleSave = async () => {
  closeModals();
  await loadData();
};

const refreshTable = () => {
  loadData();
};

defineExpose({ refreshTable });

onMounted(() => {
  loadData();
  window.addEventListener('resize', updateIsMobile);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.table-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin: 24px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: calc(100vh - 100px);
  box-sizing: border-box;
}

.table-wrapper.mobile-view {
  margin: 0;
  padding: 16px;
  box-shadow: none;
  border-radius: 0;
  gap: 12px;
  overflow-y: auto;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.mobile-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-summary {
  font-size: 14px;
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #2d3748;
  min-width: 900px;
}

.group-header {
  position: sticky;
  top: 0;
  z-index: 21;
  font-size: 13px;
  color: #718096;
  font-weight: 500;
  padding: 14px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
  text-align: left;
}

.group-center {
  text-align: center;
}

.divider-right {
  border-right: 2px solid #e2e8f0;
}

.filter-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.filter-button:hover {
  background-color: #edf2f7;
}

.filter-button.active {
  background-color: #3182ce;
}

.filter-button.active .icon-muted {
  color: #fff;
}

.icon-muted {
  color: #a0aec0;
  width: 16px;
  height: 16px;
  transition: color 0.2s;
}

.header-cell-container {
  position: sticky;
  top: 43px;
  background: #f9fafb;
  font-size: 13px;
  color: #718096;
  font-weight: 500;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  text-transform: uppercase;
  z-index: 20;
}

.header-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.data-row {
  transition: background 0.2s;
  cursor: pointer;
}

.data-row:hover {
  background-color: #f9fafb;
}

.cell {
  padding: 8px 16px;
  font-size: 14px;
  color: #1a202c;
  vertical-align: middle;
  border-bottom: 1px solid #edf2f7;
}

.empty {
  text-align: center;
  padding: 20px 0;
  color: #718096;
}
</style>
