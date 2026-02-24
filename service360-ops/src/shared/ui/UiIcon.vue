<template>
  <component :is="iconComponent" :style="iconStyle" class="icon" />
</template>

<script setup>
import * as icons from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  name: String,
  color: String,
})

const iconComponent = computed(() => icons[props.name] || icons['AlertCircle'])

const iconStyle = computed(() => (props.color ? { color: props.color } : {}))
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #4a5568;
}
</style>