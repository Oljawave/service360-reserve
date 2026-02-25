<template>
  <div v-if="actions.length > 0" class="actions" ref="actionsRef">
    <!-- Small desktop: collapse into dropdown (only when 2+ actions) -->
    <template v-if="isSmallScreen && !isMobile && actions.length > 1">
      <button class="action-btn dropdown-toggle" @click.stop="toggleDropdown">
        <UiIcon name="MoreHorizontal" />
        <span>Действия</span>
        <UiIcon :name="dropdownOpen ? 'ChevronUp' : 'ChevronDown'" class="chevron" />
      </button>
      <div v-if="dropdownOpen" class="dropdown-menu">
        <button
          v-for="(action, index) in actions"
          :key="index"
          class="dropdown-item"
          :disabled="action.disabled"
          @click="handleDropdownClick(action)"
        >
          <UiIcon :name="action.icon" />
          <span>{{ action.label }}</span>
        </button>
      </div>
    </template>

    <!-- Normal desktop / mobile / single action: original behavior -->
    <template v-else>
      <template v-for="(action, index) in actions" :key="index">
        <span v-if="action.extraText && !isMobile" class="extra-text">{{ action.extraText }}</span>
        <button
          class="action-btn"
          :class="{
            'mobile-icon-only': isMobile,
            'primary': action.variant === 'primary' && !isMobile
          }"
          :disabled="action.disabled"
          @click="action.onClick"
        >
          <UiIcon :name="action.icon" />
          <span v-if="!isMobile">{{ action.label }}</span>
        </button>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import UiIcon from '@/shared/ui/UiIcon.vue'

const props = defineProps({
  actions: {
    type: Array,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isSmallScreen: {
    type: Boolean,
    default: false
  }
})

const dropdownOpen = ref(false)
const actionsRef = ref(null)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const handleDropdownClick = (action) => {
  dropdownOpen.value = false
  action.onClick()
}

const handleClickOutside = (e) => {
  if (actionsRef.value && !actionsRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
  position: relative;
}

.extra-text {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  color: #1a202c;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #edf2f7;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-btn.primary {
  background: #3182ce;
  border-color: #3182ce;
  color: #fff;
}

.action-btn.primary:hover {
  background: #2c5aa0;
  border-color: #2c5aa0;
}

.action-btn.primary :deep(.icon) {
  color: #fff;
}

/* Mobile styles */
.action-btn.mobile-icon-only {
  background: #3182ce;
  border: none;
  color: #fff;
  border-radius: 50%;
  padding: 12px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.action-btn.mobile-icon-only:nth-child(2) {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #1a202c;
}

.action-btn.mobile-icon-only:first-child :deep(.icon) {
  color: #fff;
}

.action-btn.mobile-icon-only :deep(.icon) {
  width: 24px;
  height: 24px;
}

/* Small desktop dropdown */
.dropdown-toggle {
  white-space: nowrap;
}

.dropdown-toggle .chevron {
  width: 16px;
  height: 16px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
  z-index: 100;
  min-width: 220px;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: #1a202c;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: #f7fafc;
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
