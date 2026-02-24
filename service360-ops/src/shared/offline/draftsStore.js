import { ref } from 'vue';
import { db } from './db';

export const draftsCount = ref(0);

export async function refreshDraftsCount() {
  draftsCount.value = await db.drafts.count();
}

export async function saveDraft(formType, recordData, formFields, parentDraftId = null) {
  const id = await db.drafts.add({
    formType,
    recordData,
    formFields,
    parentDraftId: parentDraftId || null,
    createdAt: Date.now(),
  });
  await refreshDraftsCount();
  return id;
}

export async function updateDraft(id, formFields) {
  await db.drafts.update(id, { formFields });
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

export async function deleteDraftWithChildren(id) {
  const children = await db.drafts.where('parentDraftId').equals(id).toArray();
  for (const child of children) {
    await db.drafts.delete(child.id);
  }
  await db.drafts.delete(id);
  await refreshDraftsCount();
}

export async function submitParentDraft(id) {
  const children = await db.drafts.where('parentDraftId').equals(id).toArray();
  if (children.length > 0) {
    await db.drafts.update(id, { submitted: true });
  } else {
    await db.drafts.delete(id);
  }
  await refreshDraftsCount();
}

export async function clearAllDrafts() {
  await db.drafts.clear();
  await refreshDraftsCount();
}

// Инициализация счётчика при импорте
refreshDraftsCount();
