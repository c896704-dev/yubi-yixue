import { useState, useCallback } from 'react'
import {
  analyzeLayout,
  analyzeLocation,
  getRecords,
  getRecordDetail,
  deleteRecord,
  type AnalyzeLayoutParams,
  type AnalyzeLocationParams,
} from '../services/fengshuiApi'

export function useFengshui() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runLayoutAnalysis = useCallback(async (params: AnalyzeLayoutParams) => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeLayout(params)
      setResult(res)
      return res
    } catch (e: any) {
      setError(e.message || '分析失败')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const runLocationAnalysis = useCallback(async (params: AnalyzeLocationParams) => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeLocation(params)
      setResult(res)
      return res
    } catch (e: any) {
      setError(e.message || '分析失败')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { loading, result, error, runLayoutAnalysis, runLocationAnalysis, reset }
}

export function useFengshuiHistory() {
  const [records, setRecords] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchRecords = useCallback(async (params?: { type?: string; limit?: number; offset?: number }) => {
    setLoading(true)
    try {
      const res: any = await getRecords(params)
      const data = res.data || res
      setRecords(data.records || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    const res: any = await getRecordDetail(id)
    return res.data || res
  }, [])

  const removeRecord = useCallback(async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r: any) => r.id !== id))
  }, [])

  return { records, total, loading, fetchRecords, fetchDetail, removeRecord }
}
