<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Услуги"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadServices"
    @row-dblclick="onRowDoubleClick"
  />

  <ModalAddService
    v-if="isAddModalOpen"
    @close="isAddModalOpen = false"
    @refresh="refreshTable"
  />

  <ModalEditService
    v-if="isEditModalOpen"
    :serviceData="selectedService"
    @close="isEditModalOpen = false"
    @refresh="refreshTable"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import TableWrapper from '@/app/layouts/Table/TableWrapper.vue'
import ModalAddService from '@/features/services/components/ModalAddService.vue'
import ModalEditService from '@/features/services/components/ModalEditService.vue'
import { loadServices } from '@/shared/api/services/serviceService'
import { usePermissions } from '@/shared/api/auth/usePermissions'

const tableWrapperRef = ref(null)
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedService = ref(null)

const { hasPermission } = usePermissions()
const canInsert = computed(() => hasPermission('serv:ins'))
const canUpdate = computed(() => hasPermission('serv:upd'))

const limit = 10

const refreshTable = () => {
  if (tableWrapperRef.value?.refreshTable) {
    tableWrapperRef.value.refreshTable()
  }
}

const onRowDoubleClick = (row) => {
  if (!canUpdate.value) return
  selectedService.value = row
  isEditModalOpen.value = true
}

const tableActions = computed(() => [
  {
    label: 'Добавить запись',
    icon: 'Plus',
    onClick: () => { isAddModalOpen.value = true },
    show: canInsert.value,
  },
])

const columns = [
  { key: 'index', label: '№' },
  { key: 'name', label: 'Наименование' },
  { key: 'nameMeasure', label: 'Ед. измерения' },
  { key: 'quantity', label: 'Количество' },
  { key: 'price', label: 'Цена за единицу (₸)' },
  { key: 'cost', label: 'Сумма (₸)' },
  { key: 'description', label: 'Описание' },
]
</script>
