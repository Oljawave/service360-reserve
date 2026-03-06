let userDataCache = null;

export async function getUserData() {
  if (userDataCache) return userDataCache;

  try {
   
    const personnalInfoStr = localStorage.getItem('personnalInfo');

    if (!personnalInfoStr) {
      throw new Error('Данные пользователя не найдены. Пожалуйста, войдите в систему заново.');
    }

    const personnalInfo = JSON.parse(personnalInfoStr);

    userDataCache = personnalInfo;
    return personnalInfo;
  } catch (error) {
    console.error('Ошибка при загрузке данных пользователя:', error);
    throw error;
  }
}

export function clearUserCache() {
  userDataCache = null;
}
