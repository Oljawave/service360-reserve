<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Клиенты"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadClients"
    @row-dblclick="handleRowDoubleClick"
  >
  </TableWrapper>

  <ModalAddClient
    v-if="isAddModalOpen"
    @close="closeAddModal"
    @refresh="refreshTable"
  />

  <ModalEditClient
    v-if="isEditModalOpen"
    :clientData="selectedClient"
    @close="closeEditModal"
    @refresh="refreshTable"
    @deleted="handleClientDeleted"
  />
</template>

<script setup>
import { ref } from 'vue'
import TableWrapper from '@/app/layouts/Table/TableWrapper.vue'
import ModalAddClient from '@/features/clients/components/ModalAddClient.vue'
import ModalEditClient from '@/features/clients/components/ModalEditClient.vue'
import { loadClients } from '@/shared/api/clients/clientService'

const tableWrapperRef = ref(null)
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedClient = ref(null)

const openAddModal = () => {
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const openEditModal = (clientData) => {
  selectedClient.value = clientData
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedClient.value = null
}

const handleRowDoubleClick = (rowData) => {
  openEditModal(rowData)
}

const handleClientDeleted = () => {
  closeEditModal()
  refreshTable()
}

const refreshTable = () => {
  if (tableWrapperRef.value && tableWrapperRef.value.refreshTable) {
    tableWrapperRef.value.refreshTable()
  }
}

const tableActions = [
  {
    label: 'Добавить клиента',
    icon: 'Plus',
    onClick: openAddModal,
  },
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование...'),
  },
];

const limit = 10

const columns = [
  { key: 'index', label: '№' },
  { key: 'bin', label: 'БИН' },
  { key: 'name', label: 'Наименование' },
  { key: 'contactPerson', label: 'Контактное лицо' },
  { key: 'contactDetails', label: 'Контактные данные' },
  { key: 'description', label: 'Описание' },
]
</script>