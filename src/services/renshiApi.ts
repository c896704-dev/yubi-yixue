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
/** 按字段写 AI 解读：field = 'aiInsight' | 'trajectoryInsight'（服务端白名单列，两条并发互不覆盖） */
export function patchServerRenshiAi(id: string, field: 'aiInsight' | 'trajectoryInsight', text: string) {
  return api.patch(`/renshi/records/${id}/ai`, { field, text }).catch(() => {})
}
