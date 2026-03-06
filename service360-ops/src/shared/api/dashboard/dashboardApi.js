import axios from "axios";

const API_URL = import.meta.env.VITE_LOCATION_URL;
const API_PLAN_URL = import.meta.env.VITE_PLAN_URL;
const API_INCIDENTS_URL = import.meta.env.VITE_INCIDENTS_URL;
const API_INSPECTIONS_URL = import.meta.env.VITE_INSPECTIONS_URL;

export const loadDepartments = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: "data/loadDepartmentForSelect",
        params: []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.result?.records || [];
  } catch (error) {
    console.error('Ошибка при загрузке списка хозяйств:', error);
    throw error;
  }
};

export const loadWorkPlanForKpi = async (date, periodType = null, objLocation = null) => {
  const params = {
    date,
    codCls: "Cls_WorkPlanCorrectional"
  };

  if (periodType !== null) {
    params.periodType = periodType;
  }

  if (objLocation !== null) {
    params.objLocation = objLocation;
  }

  const response = await axios.post(
    API_PLAN_URL,
    {
      method: "data/loadPlan",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
};

export const loadIncidentsForKpi = async (date, periodType, objLocation = null, status = null, event = null) => {
  const params = {
    date,
    periodType
  };

  if (objLocation !== null) {
    params.objLocation = objLocation;
  }

  if (status !== null) {
    params.status = status;
  }

  if (event !== null) {
    params.event = event;
  }

  const response = await axios.post(
    API_INCIDENTS_URL,
    {
      method: "data/loadIncident",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
};

export const loadRailwayStatus = async (customDate = null, relobj = 2525) => {
  let dateStr;

  if (customDate) {
    
    dateStr = customDate;
  } else {
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }

  const params = {
    date: dateStr,
    relobj: relobj
  };

  const response = await axios.post(
    API_INSPECTIONS_URL,
    {
      method: "data/loadParameterLogByComponentParameter",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
};

export const loadRailwaySkewData = async (customDate = null) => {
  let dateStr;

  if (customDate) {
    dateStr = customDate;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }

  const [levelData, skewData, subsidence, planDeviation] = await Promise.all([
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1701 }]
      },
      { withCredentials: true }
    ),
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1703 }]
      },
      { withCredentials: true }
    ),
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1694 }]
      },
      { withCredentials: true }
    ),
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1704 }]
      },
      { withCredentials: true }
    )
  ]);

  const allData = [
    ...(levelData.data.result?.records || []).map(item => ({ ...item, skewType: 'level' })),
    ...(skewData.data.result?.records || []).map(item => ({ ...item, skewType: 'skew' })),
    ...(subsidence.data.result?.records || []).map(item => ({ ...item, skewType: 'subsidence' })),
    ...(planDeviation.data.result?.records || []).map(item => ({ ...item, skewType: 'planDeviation' }))
  ];

  return allData;
};

export const loadSizeIncidentOfMonth = async (objLocation = null, event = null, open = null) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const params = {
    date: dateStr
  };

  if (objLocation !== null) {
    params.objLocation = objLocation;
  }

  if (event !== null) {
    params.event = event;
  }

  if (open !== null) {
    params.open = open;
  }

  const response = await axios.post(
    API_INCIDENTS_URL,
    {
      method: "data/loadSizeIncidentOfMonth",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result || 0;
};