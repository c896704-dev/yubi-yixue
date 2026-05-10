import api from './api'
import type { CompatibilityResult, PersonInfo } from '../types'

export interface ServerCompatRecord {
  id: string
  maleData: PersonInfo
  femaleData: PersonInfo
  resultData: unknown
  aiInsight: string | null
  label: string
  createdAt: string
}

export function getServerCompatRecords() {
  return api.get('/compat/records') as Promise<{ records: ServerCompatRecord[] }>
}

export function saveServerCompatRecord(record: {
  id: string
  maleData: PersonInfo
  femaleData: PersonInfo
  resultData: CompatibilityResult
  aiInsight: string | null
  label: string
}) {
  return api.post('/compat/records', record)
}

export function deleteServerCompatRecord(id: string) {
  return api.delete(`/compat/records/${id}`)
}
