import { ref } from 'vue';

export const activeDraft = ref(null);

export function setActiveDraft(draft) {
  activeDraft.value = draft;
}

export function clearActiveDraft() {
  activeDraft.value = null;
}
