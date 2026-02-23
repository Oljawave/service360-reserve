import { ref } from 'vue';

// Реактивное состояние активного черновика для открытия из DraftsPanel
export const activeDraft = ref(null);

export function setActiveDraft(draft) {
  activeDraft.value = draft;
}

export function clearActiveDraft() {
  activeDraft.value = null;
}
