import { ref } from 'vue';
import { db } from './db';

export const draftsCount = ref(0);

export async function refreshDraftsCount() {
  draftsCount.value = await db.drafts.count();
}

export async function saveDraft(formType, recordData, formFields) {
  const id = await db.drafts.add({
    formType,
    recordData,
    formFields,
    createdAt: Date.now(),
  });
  await refreshDraftsCount();
  return id;
}

export async function getDrafts() {
  return db.drafts.orderBy('createdAt').reverse().toArray();
}

export async function getDraft(id) {
  return db.drafts.get(id);
}

export async function deleteDraft(id) {
  await db.drafts.delete(id);
  await refreshDraftsCount();
}

export async function clearAllDrafts() {
  await db.drafts.clear();
  await refreshDraftsCount();
}

// Инициализация счётчика при импорте
refreshDraftsCount();
