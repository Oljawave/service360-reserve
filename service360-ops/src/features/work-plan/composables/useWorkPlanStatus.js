import { parseLocalDate, getTodayStart, getDaysDifference } from '@/shared/utils/dateHelpers';

export function useWorkPlanStatus() {
  
  const getIsOverdue = (event) => {
    if (event.FactDateEnd && event.FactDateEnd !== '0000-01-01') return false;
    if (!event.PlanDateEnd) return false;

    const endDate = parseLocalDate(event.PlanDateEnd);
    const today = getTodayStart();

    return endDate.getTime() < today.getTime();
  };

  const getStatusText = (event) => {
    if (event.FactDateEnd && event.FactDateEnd !== '0000-01-01') {
      return 'Завершено';
    }

    if (!event.PlanDateEnd) return 'Срок не указан';

    const endDate = parseLocalDate(event.PlanDateEnd);
    const today = getTodayStart();

    const diffDays = getDaysDifference(endDate, today);

    if (diffDays < 0) {
      return `Просрочено на ${Math.abs(diffDays)} дн.`;
    } else if (diffDays === 0) {
      return 'Сегодня';
    } else {
      if (diffDays === 1) {
        return `Остался 1 день`;
      }
      return `Осталось ${diffDays} дн.`;
    }
  };

  const getStatusClass = (event) => {
    if (event.FactDateEnd && event.FactDateEnd !== '0000-01-01') {
      return 'completed';
    }

    if (!event.PlanDateEnd) return 'draft';

    if (getIsOverdue(event)) {
      return 'overdue';
    }

    return 'open';
  };

  return {
    getIsOverdue,
    getStatusText,
    getStatusClass,
  };
}
