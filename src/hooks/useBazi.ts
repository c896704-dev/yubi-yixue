import { useState, useCallback, useRef } from 'react'
import type { PersonInfo, AnalysisResult, CompatibilityResult } from '../types'
import { analyzePerson } from '../utils/analysis'
import { computeCompatibility } from '../utils/compatibility'
import { saveRecord, getAllRecords, deleteRecord, type SavedRecord } from '../utils/db'
import { generateBaziInsight, generateCompatibilityInsight } from '../utils/ai'

export function useBazi() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [records, setRecords] = useState<SavedRecord[]>([])
  const analysisResultRef = useRef<AnalysisResult | null>(null)

  const analyze = useCallback(async (person: PersonInfo) => {
    setLoading(true)
    setAiInsight(null)
    setAiError(null)
    try {
      const res = analyzePerson(person)
      setResult(res)
      analysisResultRef.current = res
      await saveRecord(person)
      return res
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAiInsight = useCallback(async (report: string, person: PersonInfo) => {
    setAiLoading(true)
    setAiError(null)
    try {
      const insight = await generateBaziInsight(report, `${person.name}，${person.gender}，生于${person.birthYear}年`)
      setAiInsight(insight)
      // Persist AI insight to both IndexedDB and server
      saveRecord(person, analysisResultRef.current || undefined, insight).catch(() => {})
    } catch (e: any) {
      setAiError(e.message || 'AI 分析失败')
    } finally {
      setAiLoading(false)
    }
  }, [])

  const loadRecords = useCallback(async () => {
    const recs = await getAllRecords()
    setRecords(recs)
  }, [])

  const removeRecord = useCallback(async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setAiInsight(null)
    setAiError(null)
  }, [])

  const restoreAiInsight = useCallback((insight: string | null) => {
    setAiInsight(insight)
  }, [])

  return { loading, result, aiInsight, aiLoading, aiError, records, analyze, fetchAiInsight, loadRecords, removeRecord, reset, restoreAiInsight }
}

export function useCompat() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const analyze = useCallback(async (male: AnalysisResult, female: AnalysisResult) => {
    setLoading(true)
    setAiInsight(null)
    setAiError(null)
    try {
      const res = computeCompatibility(male, female)
      setResult(res)
      return res
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAiInsight = useCallback(async (male: AnalysisResult, female: AnalysisResult) => {
    setAiLoading(true)
    setAiError(null)
    try {
      const maleData = `${male.person.name} ${male.person.gender} ${male.summary}`
      const femaleData = `${female.person.name} ${female.person.gender} ${female.summary}`
      const insight = await generateCompatibilityInsight(maleData, femaleData, '')
      setAiInsight(insight)
    } catch (e: any) {
      setAiError(e.message || 'AI 分析失败')
    } finally {
      setAiLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setAiInsight(null)
    setAiError(null)
  }, [])

  const restoreAiInsight = useCallback((insight: string | null) => {
    setAiInsight(insight)
  }, [])

  return { loading, result, aiInsight, aiLoading, aiError, analyze, fetchAiInsight, reset, restoreAiInsight }
}
