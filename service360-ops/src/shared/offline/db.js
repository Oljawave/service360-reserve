import Dexie from 'dexie';

export const db = new Dexie('service360-offline');

db.version(1).stores({
  // Очередь синхронизации мутаций
  syncQueue: '++id, url, rpcMethod, status, createdAt, syncedAt',

  // Кэш справочников
  materials: 'value, label',
  units: 'value, label',
  tasks: 'value, label',
  positions: 'value, label',
  equipmentTypes: 'value, label',
  toolTypes: 'value, label',
  externalServices: 'value, label',
  events: 'value, label',
  criticalityLevels: 'value, label',

  // Метаданные свежести кэша
  cacheMeta: 'key, updatedAt, expiresAt',
});

db.version(2).stores({
  // Черновики офлайн-форм
  drafts: '++id, formType, createdAt',

  // Кэш данных плана работ (для офлайн-доступа к таблице)
  workPlanRecords: '++_rowId, id',
});

db.version(3).stores({
  // Добавляем индекс parentDraftId для иерархических черновиков
  drafts: '++id, formType, createdAt, parentDraftId',
});
