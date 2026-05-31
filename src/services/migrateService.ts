/**
 * 浏览器 IndexedDB → SQLite 数据迁移
 * 将所有本地记录迁移到服务端，归属管理员账号
 */
import api from './api'
import { getAllRecords, getAllDivinationRecords, getAllCompatRecords } from '../utils/db'

export interface MigrateResult {
  bazi: number
  divination: number
  compat: number
  skipped: number
}

/**
 * 读取所有 IndexedDB 记录并推送到服务端迁移接口
 * 需要管理员 JWT 登录
 */
export async function migrateAllRecords(): Promise<MigrateResult> {
  // 1. 从 IndexedDB 读取所有记录
  const [baziRecords, divinationRecords, compatRecords] = await Promise.all([
    getAllRecords(),
    getAllDivinationRecords(),
    getAllCompatRecords(),
  ])

  // 2. 批量发送到迁移端点
  const result: any = await api.post('/migrate/import', {
    baziRecords,
    divinationRecords,
    compatRecords,
  })

  return result.imported as MigrateResult
}
