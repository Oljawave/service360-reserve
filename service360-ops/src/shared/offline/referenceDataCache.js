import { db } from './db';

const CACHE_TTL = 4 * 60 * 60 * 1000; 

async function getCachedOrFetch(tableName, fetchFn) {
  const meta = await db.cacheMeta.get(tableName);
  const now = Date.now();

  if (meta && meta.expiresAt > now) {
    const cached = await db[tableName].toArray();
    if (cached.length > 0) return cached;
  }

  if (navigator.onLine) {
    try {
      const data = await fetchFn();

      await db[tableName].clear();
      if (data.length > 0) {
        await db[tableName].bulkPut(data);
      }
      await db.cacheMeta.put({
        key: tableName,
        updatedAt: now,
        expiresAt: now + CACHE_TTL,
      });
      return data;
    } catch (e) {
      console.warn(`Не удалось загрузить ${tableName}, пробуем кэш`, e);
    }
  }

  const stale = await db[tableName].toArray();
  if (stale.length > 0) return stale;

  throw new Error(`Нет данных для ${tableName} (офлайн, кэш пуст)`);
}

export const cachedLoadMaterials = () =>
  getCachedOrFetch('materials', () =>
    import('../api/repairs/repairApi').then(m => m.loadMaterials()));

export const cachedLoadUnits = () =>
  getCachedOrFetch('units', () =>
    import('../api/repairs/repairApi').then(m => m.loadUnits()));

export const cachedLoadTasks = async (objWork) => {
  const fetchFn = () =>
    import('../api/repairs/repairApi').then(m => m.loadTasks(objWork));

  if (navigator.onLine) {
    try {
      const data = await fetchFn();
      await db.tasks.clear();
      if (data.length > 0) {
        await db.tasks.bulkPut(data);
      }
      return data;
    } catch (e) {
      console.warn('Не удалось загрузить tasks, пробуем кэш', e);
    }
  }

  const stale = await db.tasks.toArray();
  if (stale.length > 0) return stale;

  throw new Error('Нет данных для tasks (офлайн, кэш пуст)');
};

export const cachedLoadPositions = () =>
  getCachedOrFetch('positions', () =>
    import('../api/repairs/repairApi').then(m => m.loadPositions()));

export const cachedLoadEquipmentTypes = () =>
  getCachedOrFetch('equipmentTypes', () =>
    import('../api/repairs/repairApi').then(m => m.loadEquipmentTypes()));

export const cachedLoadToolTypes = () =>
  getCachedOrFetch('toolTypes', () =>
    import('../api/repairs/repairApi').then(m => m.loadToolTypes()));

export const cachedLoadExternalServices = () =>
  getCachedOrFetch('externalServices', () =>
    import('../api/repairs/repairApi').then(m => m.loadExternalServices()));

export const cachedLoadWorkPlanInspection = async () => {
  const fetchFn = () =>
    import('../api/inspections/inspectionsApi').then(m => m.loadWorkPlanInspectionUnfinished());

  if (navigator.onLine) {
    try {
      const data = await fetchFn();
      await db.workPlanRecords.clear();
      if (data.length > 0) {
        await db.workPlanRecords.bulkPut(data);
      }
      return data;
    } catch (e) {
      console.warn('Не удалось загрузить workPlanRecords, пробуем кэш', e);
    }
  }

  const stale = await db.workPlanRecords.toArray();
  if (stale.length > 0) return stale;

  throw new Error('Нет данных для workPlanRecords (офлайн, кэш пуст)');
};

export async function prefetchAllReferenceData() {
  const loaders = [
    cachedLoadMaterials(),
    cachedLoadUnits(),
    cachedLoadPositions(),
    cachedLoadEquipmentTypes(),
    cachedLoadToolTypes(),
    cachedLoadExternalServices(),
  ];

  const results = await Promise.allSettled(loaders);
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn('Prefetch failed for loader', i, r.reason);
    }
  });
}
