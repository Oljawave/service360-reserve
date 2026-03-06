import Dexie from 'dexie';

export const db = new Dexie('service360-offline');

db.version(1).stores({
  
  syncQueue: '++id, url, rpcMethod, status, createdAt, syncedAt',

  materials: 'value, label',
  units: 'value, label',
  tasks: 'value, label',
  positions: 'value, label',
  equipmentTypes: 'value, label',
  toolTypes: 'value, label',
  externalServices: 'value, label',
  events: 'value, label',
  criticalityLevels: 'value, label',

  cacheMeta: 'key, updatedAt, expiresAt',
});

db.version(2).stores({
  
  drafts: '++id, formType, createdAt',

  workPlanRecords: '++_rowId, id',
});

db.version(3).stores({
  
  drafts: '++id, formType, createdAt, parentDraftId',
});
