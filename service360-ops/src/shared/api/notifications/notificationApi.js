import axios from 'axios';
import { getUserData } from '../common/userCache';

const API_PERSONNEL_URL = import.meta.env.VITE_PERSONAL_URL;

export async function loadNotificationUser() {
  try {
    const user = await getUserData();

    const response = await axios.post(
      API_PERSONNEL_URL,
      {
        method: 'data/loadNotificationUser',
        params: [user.id, 0]
      },
      {
        withCredentials: true
      }
    );

    const records = response.data?.result?.records || response.data?.result || [];
    return records;
  } catch (error) {
    console.error('Ошибка при загрузке уведомлений:', error);
    return [];
  }
}
