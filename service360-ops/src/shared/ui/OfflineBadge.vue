<template>
  <transition name="fade">
    <div v-if="!isOnline" class="offline-badge">
      <UiIcon name="WifiOff" :size="14" />
    </div>
  </transition>
</template>

<script setup>
import UiIcon from '@/shared/ui/UiIcon.vue';
import { useNetworkStatus } from '@/shared/offline/useNetworkStatus';

const { isOnline } = useNetworkStatus();
</script>

<style scoped>
.offline-badge {
  display: flex;
  align-items: center;
  color: #DC2626;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
