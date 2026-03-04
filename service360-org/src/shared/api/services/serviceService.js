import axios from 'axios'
import { formatDateForBackend } from '../common/formatters'
import { getUserData } from '../common/userCache'

const API_CLIENT_URL = import.meta.env.VITE_CLIENT_URL;

export async function loadServices() {
  const response = await axios.post(API_CLIENT_URL, {
    method: 'data/loadService',
    params: [0]
  })

  const records = response.data.result?.records || []

  return {
    data: records.map((item, i) => ({
      rawData: item,
      id: item.id,
      cls: item.cls,
      name: item.name || '',
      nameMeasure: item.nameMeasure || '',
      price: item.Price ?? '',
      description: item.Description || item.description || '',
      idPrice: item.idPrice,
      idMeasure: item.idMeasure,
      pvMeasure: item.pvMeasure,
      meaMeasure: item.meaMeasure,
      idCreatedAt: item.idCreatedAt,
      CreatedAt: item.CreatedAt,
      idUpdatedAt: item.idUpdatedAt,
      UpdatedAt: item.UpdatedAt,
      idUser: item.idUser,
      pvUser: item.pvUser,
      objUser: item.objUser,
      fullNameUser: item.fullNameUser || '',

      _originalIndex: i + 1,
    })),
    total: records.length
  }
}

export async function saveService(serviceData) {
  const user = await getUserData()
  const today = formatDateForBackend(new Date())

  const payload = {
    name: serviceData.name,
    Price: serviceData.price ?? 0,
    meaMeasure: serviceData.measure.value,
    pvMeasure: serviceData.measure.pv,
    CreatedAt: today,
    UpdatedAt: today,
    objUser: user.id,
    pvUser: user.pv,
    Description: serviceData.description || ''
  }

  const response = await axios.post(API_CLIENT_URL, {
    method: 'data/saveService',
    params: ['ins', payload]
  })

  return response.data
}

export async function updateService(serviceData) {
  const user = await getUserData()
  const today = formatDateForBackend(new Date())

  const payload = {
    id: serviceData.rawData.id,
    cls: serviceData.rawData.cls,
    name: serviceData.name,
    idPrice: serviceData.rawData.idPrice,
    Price: serviceData.price ?? 0,
    idMeasure: serviceData.rawData.idMeasure,
    meaMeasure: serviceData.measure.value,
    pvMeasure: serviceData.measure.pv,
    nameMeasure: serviceData.measure.label,
    idCreatedAt: serviceData.rawData.idCreatedAt,
    CreatedAt: serviceData.rawData.CreatedAt,
    idUpdatedAt: serviceData.rawData.idUpdatedAt,
    UpdatedAt: today,
    idUser: serviceData.rawData.idUser,
    pvUser: user.pv,
    objUser: user.id,
    idDescription: serviceData.rawData.idDescription,
    Description: serviceData.description || ''
  }

  const response = await axios.post(API_CLIENT_URL, {
    method: 'data/saveService',
    params: ['upd', payload]
  })

  return response.data
}

export async function deleteService(id) {
  const response = await axios.post(API_CLIENT_URL, {
    method: 'data/deleteObjWithProperties',
    params: [id]
  })

  return response.data
}
