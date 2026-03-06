import axios from 'axios';
import { isMutation } from './rpcClassifier';
import { enqueueRequest } from './syncQueue';
import { logout } from '@/shared/api/auth/auth';
import router from '@/app/router/index';

const API_URLS = [
  import.meta.env.VITE_REPAIR_URL,
  import.meta.env.VITE_OBJECT_URL,
  import.meta.env.VITE_NSI_URL,
  import.meta.env.VITE_INSPECTIONS_URL,
  import.meta.env.VITE_PLAN_URL,
  import.meta.env.VITE_INCIDENTS_URL,
  import.meta.env.VITE_RESOURCE_URL,
  import.meta.env.VITE_PERSONAL_URL,
  import.meta.env.VITE_LOCATION_URL,
].filter(Boolean);

function isApiUrl(url) {
  return API_URLS.some(base => url?.startsWith(base) || url === base);
}

export function setupOfflineInterceptor() {
  axios.interceptors.request.use(async (config) => {
    
    if (config.method !== 'post' || !isApiUrl(config.url)) {
      return config;
    }

    if (config.headers?.['X-Offline-Sync'] === 'true') {
      return config;
    }

    const rpcMethod = config.data?.method;
    if (!rpcMethod) return config;

    if (!navigator.onLine && isMutation(rpcMethod)) {
      const queueId = await enqueueRequest(
        config.url,
        rpcMethod,
        config.data.params
      );

      return Promise.reject({
        __offlineQueued: true,
        queueId,
        config,
      });
    }

    return config;
  });

  axios.interceptors.response.use(
    response => response,
    error => {
      if (error?.__offlineQueued) {
        
        return {
          data: {
            result: {
              __offline: true,
              queueId: error.queueId,
              message: 'Запрос сохранен для отправки при восстановлении связи',
            },
          },
          status: 200,
          statusText: 'Queued Offline',
        };
      }
      
      if (error?.response?.status === 401) {
        logout();
        router.push('/login');
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
}
