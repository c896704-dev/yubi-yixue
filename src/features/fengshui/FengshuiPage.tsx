import { useState } from 'react'
import { Tabs } from '../../components/ui/Tabs'
import { ToolHeader } from '../../components/layout/ToolHeader'
import { LayoutAnalysis } from './LayoutAnalysis'
import { LocationAnalysis } from './LocationAnalysis'
import { FengshuiHistory } from './FengshuiHistory'
import { ReportDetail } from './ReportDetail'
import { FengshuiSettings } from './Settings'

type FengshuiTab = 'layout' | 'location' | 'history' | 'settings'

export default function FengshuiPage() {
  const [tab, setTab] = useState<FengshuiTab>('layout')
  const [detailId, setDetailId] = useState<string | null>(null)

  if (detailId) {
    return <ReportDetail recordId={detailId} onBack={() => setDetailId(null)} />
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolHeader
        eyebrow="FENG SHUI"
        title="风水分析"
        desc="户型图、楼盘位置 · 环境吉凶分析。"
      />
      <Tabs
        tabs={[
          { key: 'layout', label: '户型图分析' },
          { key: 'location', label: '楼盘位置' },
          { key: 'history', label: '历史记录' },
          { key: 'settings', label: '设置' },
        ]}
        activeKey={tab}
        onChange={(k) => setTab(k as FengshuiTab)}
      />
      <div className="fade-in">
        {tab === 'layout' && <LayoutAnalysis />}
        {tab === 'location' && <LocationAnalysis />}
        {tab === 'history' && <FengshuiHistory onViewDetail={setDetailId} />}
        {tab === 'settings' && <FengshuiSettings />}
      </div>
    </div>
  )
}
