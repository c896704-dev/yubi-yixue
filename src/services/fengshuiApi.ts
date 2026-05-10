import api from './api'

export interface AnalyzeLayoutParams {
  image: string
  orientation?: string
  buildingYear?: number
  mode?: string
  apiKey: string
  withBazi?: boolean
  birthData?: { year: number }
}

export interface AnalyzeLocationParams {
  images?: string[]
  description?: string
  orientation?: string
  buildingYear?: number
  mode?: string
  apiKey: string
}

export function analyzeLayout(params: AnalyzeLayoutParams) {
  return api.post('/analyze/layout', params)
}

export function analyzeLocation(params: AnalyzeLocationParams) {
  return api.post('/analyze/location', params)
}

export function generateAiReport(apiKey: string, data: unknown) {
  return api.post('/analyze/ai-report', { apiKey, data })
}

export function getRecords(params?: { type?: string; limit?: number; offset?: number }) {
  return api.get('/records', { params })
}

export function getRecordDetail(id: string) {
  return api.get(`/records/${id}`)
}

export function deleteRecord(id: string) {
  return api.delete(`/records/${id}`)
}

export function clearAllRecords() {
  return api.delete('/records')
}

export function updateDeviceInfo(nickname: string) {
  return api.post('/settings/device', { nickname })
}

export function getDeviceInfo() {
  return api.get('/settings/device')
}
