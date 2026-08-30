import api from './api'
import type { RenshiRecord } from '../utils/db'

export function saveServerRenshiRecord(record: RenshiRecord) {
  return api.post('/renshi/records', record).catch(() => {})
}
export function getServerRenshiRecords() {
  return api.get('/renshi/records').catch(() => ({ records: [] })) as Promise<{ records: RenshiRecord[] }>
}
export function deleteServerRenshiRecord(id: string) {
  return api.delete(`/renshi/records/${id}`).catch(() => {})
}
