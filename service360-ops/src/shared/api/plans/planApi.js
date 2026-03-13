import axios from "axios";
import { getUserData } from "../common/userCache";

const API_BASE_URL = import.meta.env.VITE_PLAN_URL;

export async function loadWorkPlan(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  const response = await axios.post(
    API_BASE_URL,
    {
      method: "data/loadPlan",
      params: [
        {
          date,
          periodType,
          objLocation: parseInt(objLocation),
        }
      ]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

export async function completeThePlanWork(id, cls, date) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/completeThePlanWork",
        params: [
          {
            id: id,
            cls: cls,
            date: date
          }
        ]
      },
      {
        withCredentials: true
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    } else if (response.data && response.data.error) {
      throw new Error(response.data.error);
    } else {
      return response.data;
    }
  } catch (error) {
    console.error('Ошибка завершения работы:', error);
    
    throw error;
  }
}

export async function approveThePlanWork(row, today) {
  try {
    const user = await getUserData();

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/approveThePlanWork",
        params: [
          {
            id: row.id,
            cls: row.rawData.cls,
            idUpdatedAt: row.rawData.idUpdatedAt,
            UpdatedAt: today,
            idUser: row.rawData.idUser,
            pvUser: user.pv,
            objUser: user.id,
            idStatus: row.rawData.idStatus,
            pvStatus: row.rawData.pvStatus,
            fvStatus: row.rawData.fvStatus,
          }
        ]
      },
      { withCredentials: true }
    );

    if (response.data?.result) return response.data.result;
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  } catch (error) {
    console.error('Ошибка утверждения работы:', error);
    throw error;
  }
}

export async function getPeriodInfo(date, periodType) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/getPeriodInfo",
        params: [date, periodType]
      },
      {
        withCredentials: true
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    } else if (response.data && response.data.error) {
      throw new Error(response.data.error);
    } else {
      return response.data;
    }
  } catch (error) {
    console.error('Ошибка получения информации о периоде:', error);
    throw error;
  }
}

export async function copyPlan(idsWorkPlan, dbegCopy, dendCopy, dbegPlan, dendPlan) {
  try {
    const user = await getUserData();
    const today = new Date().toISOString().split('T')[0];

    const payload = {
      idsWorkPlan: idsWorkPlan, 
      dbegCopy: dbegCopy,        
      dendCopy: dendCopy,        
      dbegPlan: dbegPlan,        
      dendPlan: dendPlan,        
      pvUser: user.pv,
      objUser: user.id,
      CreatedAt: today,
      UpdatedAt: today
    };

    console.log('Вызов метода data/copyPlan с данными:', payload);

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/copyPlan",
        params: [payload]
      },
      {
        withCredentials: true
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    } else if (response.data && response.data.error) {
      throw new Error(response.data.error);
    } else {
      return response.data;
    }
  } catch (error) {
    console.error('Ошибка копирования плана работ:', error);
    throw error;
  }
}
