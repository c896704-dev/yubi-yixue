import api from './api'
import type { DivinationRecord } from '../utils/db'

export function saveServerDivinationRecord(record: DivinationRecord) {
  return api.post('/divination/records', record).catch(() => {})
}
export function getServerDivinationRecords() {
  return api.get('/divination/records').catch(() => ({ records: [] })) as Promise<{ records: DivinationRecord[] }>
}
export function deleteServerDivinationRecord(id: string) {
  return api.delete(`/divination/records/${id}`).catch(() => {})
}
