import axios from 'axios'
import MATERIALS_PARAMS from './Material.json'
import SERVICES_PARAMS from './TpService.json'

const API_RESOURCE_URL = import.meta.env.VITE_RESOURCE_URL


export async function loadServices1C() {
  const response = await axios.post(
    API_RESOURCE_URL,
    {
      method: 'import/loadMeta1C',
      params: [SERVICES_PARAMS, 'Cls_TpService']
    },
    { withCredentials: true }
  )
  return response.data
}

export async function loadMaterials1C() {
  const response = await axios.post(
    API_RESOURCE_URL,
    {
      method: 'import/loadMeta1C',
      params: [MATERIALS_PARAMS, 'Cls_Material']
    },
    { withCredentials: true }
  )
  return response.data
}
