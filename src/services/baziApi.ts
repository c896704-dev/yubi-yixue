import api from './api'
import type { PersonInfo, AnalysisResult } from '../types'

export function saveBaziRecord(id: string, person: PersonInfo, result?: AnalysisResult | null, label?: string) {
  return api.post('/bazi/records', { id, personData: person, resultData: result, label }).catch(() => {})
}
export function getServerBaziRecords() {
  return api.get('/bazi/records').catch(() => ({ records: [] })) as Promise<{ records: any[] }>
}
export function deleteServerBaziRecord(id: string) {
  return api.delete(`/bazi/records/${id}`).catch(() => {})
}
