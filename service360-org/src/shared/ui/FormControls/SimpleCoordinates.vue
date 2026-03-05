<template>
  <div class="coordinate-wrapper">
    <label class="coordinate-label">
      Координаты
      <span v-if="required" class="required-asterisk">*</span>
    </label>
    <div class="coordinate-group">
      <AppNumberInput
        :modelValue="currentStartKm"
        label="Начало (км)"
        placeholder="км"
        :disabled="disabled"
        :status="getFieldStatus('coordStartKm')"
        @update:modelValue="handleStartKm"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <AppNumberInput
        :modelValue="currentEndKm"
        label="Конец (км)"
        placeholder="км"
        :disabled="disabled"
        :status="getFieldStatus('coordEndKm')"
        @update:modelValue="handleEndKm"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch, onMounted } from 'vue'
import AppNumberInput from '@/shared/ui/FormControls/AppNumberInput.vue'
import { useNotificationStore } from '@/app/stores/notificationStore'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      coordStartKm: null,
      coordEndKm: null
    })
  },
  objectBounds: {
    type: Object,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'invalidRange', 'out-of-bounds'])

const notificationStore = useNotificationStore()

const isUserTyping = ref(false)
const shouldShowError = ref(false)
const isInitialMount = ref(true)

const currentStartKm = computed(() => props.modelValue.coordStartKm ?? null)
const currentEndKm = computed(() => props.modelValue.coordEndKm ?? null)

const startAbs = computed(() => {
  const km = currentStartKm.value ?? 0
  return km * 1000
})

const endAbs = computed(() => {
  const km = currentEndKm.value ?? 0
  return km * 1000
})

const hasEmptyRequiredFields = computed(() => {
  if (!props.required) return false
  return currentStartKm.value === null || currentStartKm.value === 0 ||
         currentEndKm.value === null || currentEndKm.value === 0
})

const isInvalid = computed(() => {
  if (hasEmptyRequiredFields.value) return false
  return startAbs.value > endAbs.value
})

const isOutOfBounds = computed(() => {
  if (!props.objectBounds) return false

  const objStartAbs = (props.objectBounds.StartKm ?? 0) * 1000
  const objEndAbs = (props.objectBounds.FinishKm ?? 0) * 1000

  return startAbs.value < objStartAbs || endAbs.value > objEndAbs
})

const getFieldStatus = (field) => {
  if (!shouldShowError.value) return null

  if (props.required) {
    const value = props.modelValue[field]
    if (value === null || value === 0 || value === '') {
      return 'error'
    }
  }

  if (fieldErrors.value[field]) return 'error'
  if (isInvalid.value || isOutOfBounds.value) return 'error'
  return null
}

const fieldErrors = ref({
  coordStartKm: null,
  coordEndKm: null
})

const validateField = (field, value, min, max) => {
  if (value == null || value === '') {
    fieldErrors.value[field] = null
    return true
  }

  const num = Number(value)

  if (num < min) {
    fieldErrors.value[field] = `Значение не может быть меньше ${min}`
    return false
  }

  if (num > max) {
    fieldErrors.value[field] = 'Некорректное значение координат'
    return false
  }

  fieldErrors.value[field] = null
  return true
}

const clamp = (value, min, max) => {
  if (value == null || isNaN(value)) return null
  const num = Math.floor(Number(value))
  return Math.max(min, Math.min(max, num))
}

const updateCoords = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleStartKm = (value) => {
  if (value === 0) {
    fieldErrors.value.coordStartKm = 'Значение не может быть меньше 1'
    updateCoords('coordStartKm', value)
    notificationStore.showNotification('Значение не может быть меньше 1', 'error')
    return
  }
  const clamped = clamp(value, 1, 999)
  validateField('coordStartKm', clamped, 1, 999)
  updateCoords('coordStartKm', clamped)
}

const handleEndKm = (value) => {
  if (value === 0) {
    fieldErrors.value.coordEndKm = 'Значение не может быть меньше 1'
    updateCoords('coordEndKm', value)
    notificationStore.showNotification('Значение не может быть меньше 1', 'error')
    return
  }
  const clamped = clamp(value, 1, 999)
  validateField('coordEndKm', clamped, 1, 999)
  updateCoords('coordEndKm', clamped)
}

const performValidation = () => {
  emit('invalidRange', isInvalid.value)

  if (isInitialMount.value) {
    return
  }

  if (hasEmptyRequiredFields.value) {
    notificationStore.showNotification('Необходимо заполнить все координаты', 'error')
    return
  }

  const hasFieldErrors = Object.values(fieldErrors.value).some(err => err !== null)
  if (hasFieldErrors) {
    const firstError = Object.values(fieldErrors.value).find(err => err !== null)
    notificationStore.showNotification(firstError, 'error')
    return
  }

  if (isInvalid.value) {
    notificationStore.showNotification('Начальная координата не может быть больше конечной координаты', 'error')
  }

  if (isOutOfBounds.value) {
    emit('out-of-bounds')
    notificationStore.showNotification('Координаты выходят за пределы допустимого диапазона!', 'error')
  } else {
    emit('out-of-bounds', false)
  }
}

const handleFocus = () => {
  isUserTyping.value = true
  shouldShowError.value = false
  isInitialMount.value = false
}

const handleBlur = () => {
  isUserTyping.value = false
  setTimeout(() => {
    shouldShowError.value = true
    performValidation()
  }, 100)
}

watch([startAbs, endAbs], () => {
  if (!isUserTyping.value) {
    performValidation()
  }
})

watch(() => props.objectBounds, () => {
  if (!isUserTyping.value) {
    shouldShowError.value = true
    performValidation()
  }
})

onMounted(() => {
  setTimeout(() => {
    isInitialMount.value = false
  }, 1500)
})
</script>

<style scoped>
.coordinate-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coordinate-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.required-asterisk {
  color: #e53e3e;
  font-size: 14px;
  margin-left: 2px;
  vertical-align: top;
  line-height: 1.2;
}

.coordinate-group {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  justify-content: space-between;
}

.coordinate-group > * {
  flex: 1;
  min-width: 152px;
}

@media (max-width: 768px) {
  .coordinate-group {
    flex-direction: column;
    gap: 12px;
  }

  .coordinate-group > * {
    width: 100%;
    min-width: auto;
  }
}
</style>
