<template>
  <TableWrapper1C
    title="Материалы 1С"
    :columns1c="columns1c"
    :columnsS360="columnsS360"
    :loadFn="loadFn"
    :actions="tableActions"
    :limit="20"
  />
</template>

<script setup>
import TableWrapper1C from '@/app/layouts/Table/TableWrapper1C.vue'
import { loadMaterials1C } from '@/shared/api/1c/oneCApi'

const columns1c = [
  { key: 'Код', label: 'Код' },
  { key: 'Наименование', label: 'Наименование' },
  { key: 'ЕдиницаИзмерения', label: 'Ед. измерения' },
]

const columnsS360 = [
  { key: 'obj', label: 'Код' },
  { key: 'name', label: 'Наименование' },
  { key: 'namemeasure', label: 'Ед. измерения' },
]

const loadFn = async () => {
  const response = await loadMaterials1C()
  return { data: response?.result ?? [] }
}

const tableActions = []
</script>
