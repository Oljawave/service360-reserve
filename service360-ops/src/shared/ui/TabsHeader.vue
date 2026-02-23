<template>
  <div class="tabs-header">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="tab"
      :class="{ 'active': tab.name === modelValue }"
      @click="selectTab(tab.name)"
    >
      <UiIcon :name="tab.icon" />
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import UiIcon from './UiIcon.vue';

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const selectTab = (tabName) => {
  emit('update:modelValue', tabName);
};
</script>

<style scoped>
.tabs-header {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  border-bottom: 1px solid #e0e6ed;
  margin-bottom: 16px;
}

.tab {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  justify-content: center;
  white-space: nowrap;
}

.tab:hover {
  color: #2d3748;
}

.tab.active {
  color: #3182ce;
  border-bottom-color: #3182ce;
}

.tab .icon {
  margin-right: 8px;
}

.tab-label {
  display: inline;
}

@media (max-width: 768px) {
  .tabs-header {
    gap: 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .tabs-header::-webkit-scrollbar {
    display: none;
  }

  .tab {
    padding: 10px 12px;
    font-size: 13px;
    gap: 6px;
    flex-shrink: 1;
    min-width: 0;
  }

  .tab-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .tab {
    padding: 8px 10px;
    font-size: 12px;
    gap: 4px;
  }
}
</style>