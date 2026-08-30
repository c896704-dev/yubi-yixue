/**
 * 识人报告 Word 导出（docx 库）
 * 结构：标题 → 命主信息 → 八信息表 → 四象 → 尊卑 → 三垣 → 胎息 → 四象对三垣 → AI 解读
 */

import {
  AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph,
  ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx'
import type { PersonInfo } from '../types'
import type { SixiangResult } from './sixiang'

const DAI_QING = '004D4D'
const HU_PO = '8C7326'
const ZHU_SHA = '9C3D54'
const INK = '2B2B2B'
const PAPER = 'FBFAF5'

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: DAI_QING, size: 28, font: 'Noto Serif SC' })],
  })
}

function body(text: string, opts: { bold?: boolean; color?: string; size?: number; indent?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 100, line: 320 },
    indent: opts.indent ? { firstLine: 480 } : undefined,
    children: [new TextRun({ text, bold: opts.bold, color: opts.color ?? INK, size: opts.size ?? 21, font: 'Noto Serif SC' })],
  })
}

/** 简易 markdown → docx 段落（标题/列表/粗体/正文/分隔线） */
function mdToParagraphs(md: string): Paragraph[] {
  const out: Paragraph[] = []
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) { out.push(new Paragraph({ spacing: { after: 60 }, children: [] })); continue }
    if (/^[-—–]{3,}$/.test(line.trim())) {
      // 分隔线：以居中短线呈现，避免导出为"------"文字
      out.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
        children: [],
      }))
      continue
    }
    const h = line.match(/^#{1,4}\s+(.*)$/)
    if (h) {
      out.push(new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: h[1]!, bold: true, color: DAI_QING, size: 24, font: 'Noto Serif SC' })],
      }))
      continue
    }
    const runs: TextRun[] = []
    const li = line.match(/^[-*]\s+(.*)$/)
    const content = li ? li[1]! : line
    // **粗体** 拆分
    for (const part of content.split(/(\*\*[^*]+\*\*)/)) {
      if (!part) continue
      const b = part.match(/^\*\*([^*]+)\*\*$/)
      runs.push(new TextRun({
        text: b ? b[1]! : part, bold: Boolean(b),
        color: b ? DAI_QING : INK, size: 21, font: 'Noto Serif SC',
      }))
    }
    if (li) runs.unshift(new TextRun({ text: '· ', bold: true, color: HU_PO, size: 21, font: 'Noto Serif SC' }))
    out.push(new Paragraph({ spacing: { after: 80, line: 320 }, children: runs }))
  }
  return out
}

function nayinCell(label: string, ganzhi: string, nayin: string): TableCell {
  return new TableCell({
    width: { size: 20, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: PAPER },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: { bottom: { style: BorderStyle.SINGLE, size: 2, color: HU_PO } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: label, size: 16, color: '888888', font: 'Noto Serif SC' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: ganzhi, bold: true, size: 22, color: DAI_QING, font: 'Noto Serif SC' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nayin, bold: true, size: 22, color: HU_PO, font: 'Noto Serif SC' })] }),
    ],
  })
}

export async function exportRenshiDocx(r: SixiangResult, aiText: string, person: PersonInfo): Promise<void> {
  const children: (Paragraph | Table)[] = []
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: '四象三垣胎息 · 识人报告', bold: true, size: 40, color: DAI_QING, font: 'Noto Serif SC' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 240 },
    children: [new TextRun({ text: `御笔易学 · 以古籍为骨 以数据为墨`, size: 18, color: HU_PO, font: 'Noto Serif SC' })],
  }))

  children.push(body(`命主：${person.name || '未命名'}（${person.gender}）　出生：${person.birthYear}-${person.birthMonth}-${person.birthDay} ${person.birthHour}:${String(person.birthMinute).padStart(2, '0')}　出生地经度：${person.longitude}°E`, { color: '666666', size: 18 }))

  // 口径披露（晚子时）
  if (r.altChart) {
    children.push(heading('〇、换日口径披露 · 晚子时出生'))
    children.push(body(`本命出生于晚子时（23:00–24:00 真太阳时段）。本报告采用「子初换日」口径（23:00 起日柱进位次日）。另一主流「夜子时派」口径（日柱取当天）下：日柱 ${r.altChart.dayGZ}（${r.altChart.dayNaYin}）、胎息 ${r.altChart.taiXiGZ}（${r.altChart.taiXiNaYin}）、尊卑链 ${r.altChart.zunBei.map(z => `${z.from}${z.to}${z.kind}`).join('、')}${r.altChart.hasFanShang ? '，该口径下出现卑克尊' : ''}。两口径关键结论${r.altChart.flipped ? '存在实质翻转，请对照取舍' : '一致'}。`, { indent: true }))
  }
  if (r.boundaryNote) children.push(body(r.boundaryNote, { color: ZHU_SHA }))

  // 八信息表
  children.push(heading('一、八项信息总览'))
  const row1 = new TableRow({ children: r.stages.map(s => nayinCell(s.label, s.ganzhi, s.naYin)) })
  const row2 = new TableRow({ children: [
    nayinCell('三垣·胎元', r.sanyuan.taiYuan.ganzhi, r.sanyuan.taiYuan.naYin),
    nayinCell('三垣·命宫', r.sanyuan.mingGong.ganzhi, r.sanyuan.mingGong.naYin),
    nayinCell('三垣·身宫', r.sanyuan.shenGong.ganzhi, r.sanyuan.shenGong.naYin),
    nayinCell('胎息·元神', r.taiXi.ganzhi, r.taiXi.naYin),
  ] })
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [row1, row2],
  }))

  // 四象
  children.push(heading('二、四象 · 人生四段'))
  r.stages.forEach((s) => {
    children.push(body(`${s.label}（${s.ganzhi}）${s.naYin} —— ${s.stageName}`, { bold: true, color: DAI_QING }))
    if (s.continuation) children.push(body(s.continuation, { indent: true, size: 19, color: HU_PO }))
    children.push(body(`取象：${s.xiang.source}。${s.xiang.image}。`, { indent: true }))
    children.push(body(`性格：${s.xiang.traits.join('、')}`, { indent: true, size: 19, color: '666666' }))
    children.push(body(`暗面：${s.shadow.join('、')}`, { indent: true, size: 19, color: ZHU_SHA }))
  })

  // 尊卑
  children.push(heading('三、尊卑生克链'))
  for (const z of r.zunBei) {
    children.push(body(`${z.from} → ${z.to}：${z.kind}`, { bold: true, color: z.kind === '卑克尊' ? ZHU_SHA : HU_PO }))
    children.push(body(z.desc, { indent: true, size: 19 }))
  }
  children.push(body(r.overall, { bold: true, color: r.hasFanShang ? ZHU_SHA : DAI_QING }))

  // 干支事实层
  children.push(heading('四、干支事实层 · 刑冲空亡与五行'))
  children.push(body(`刑冲害：${r.ganZhi.xingchong.length > 0 ? r.ganZhi.xingchong.join('；') : '无'}`, { indent: true }))
  if (r.ganZhi.heJu.length > 0) children.push(body(`合会缓和：${r.ganZhi.heJu.join('；')}`, { indent: true }))
  children.push(body(`旬空：${r.ganZhi.kongWang.branches.join('、')}${r.ganZhi.kongWang.fallingInto.length > 0 ? `——${r.ganZhi.kongWang.fallingInto.join('、')}落空` : '——四柱与胎元未落空'}`, { indent: true, color: r.ganZhi.kongWang.fallingInto.length > 0 ? ZHU_SHA : INK }))
  children.push(body(`明干支五行：${Object.entries(r.ganZhi.wuxing).map(([k, v]) => `${k}${v}`).join(' ')}${r.ganZhi.missing.length > 0 ? `——明缺${r.ganZhi.missing.join('、')}` : ''}`, { indent: true }))

  // 三垣
  children.push(heading(`五、三垣（${r.sanyuan.lianZhu}）`))
  children.push(body(r.sanyuan.desc))
  for (const p of r.sanyuan.pairs) children.push(body(p.desc, { indent: true, size: 19 }))
  for (const y of [r.sanyuan.taiYuan, r.sanyuan.mingGong, r.sanyuan.shenGong]) {
    children.push(body(`${y.name}（${y.ganzhi}）${y.naYin} —— ${y.role}`, { bold: true, color: DAI_QING }))
    children.push(body(`${y.xiang.source}。${y.xiang.image}。`, { indent: true }))
  }

  // 胎息
  children.push(heading('六、胎息 · 元神画像'))
  children.push(body('「受胎之日那一念先天神识」为本体系对经典胎息（日柱干合支合之柱，《三命通会》）的再创作引申，非古籍原义。', { size: 19, color: '666666' }))
  children.push(body(`胎息（${r.taiXi.ganzhi}）${r.taiXi.naYin}：${r.taiXi.xiang.yuanshen}`, { indent: true }))
  children.push(body(`对标时柱${r.stages[3]!.naYin}：${r.taiXi.duibiao.kind}（${r.taiXi.duibiao.label}）。${r.taiXi.duibiao.desc}${r.taiXi.sameNaYinAsHour ? '（另注：胎息与时柱同纳音，为日柱与时柱干支结构的恒象，非个性化推断。）' : ''}`))

  // 四象对三垣
  children.push(heading('七、四象对三垣 · 禀赋兼容'))
  for (const c of r.cross) {
    children.push(body(`${c.name}：${c.kind}`, { bold: true, color: c.kind === '相克' ? ZHU_SHA : DAI_QING }))
    children.push(body(c.desc, { indent: true, size: 19 }))
  }

  // 运程参照
  children.push(heading('八、运程参照 · 大运与流年'))
  children.push(body(`起运虚岁：${r.dayun.qiYunAge ?? '待定'}；大运序列：${r.dayun.list.map(f => `${f.ganzhi}（${f.startAge}–${f.endAge}岁${f.current ? '，现行' : ''}）`).join(' → ')}`, { indent: true }))
  children.push(body(`当前流年 ${r.dayun.liunian.year}（${r.dayun.liunian.ganzhi}）：${r.dayun.liunian.note}`, { indent: true }))

  // AI 解读
  if (aiText) {
    children.push(heading('九、御笔判官 · 识人解读'))
    children.push(...mdToParagraphs(aiText))
  }

  // 方法论与声明
  children.push(heading('十、方法论说明'))
  for (const d of r.disclosure) children.push(body(`· ${d}`, { size: 19, color: '666666' }))
  children.push(body(`本报告基于传统命理文化的取象类比，属文化视角的人格倾向参考，非科学测评；所有描述均为倾向性推断而非确定性结论。${r.minor ? '命主尚未成年，全部内容仅为倾向参考，建议由监护人陪同理解。' : ''}`, { bold: true, color: ZHU_SHA }))

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 300 },
    children: [new TextRun({ text: `御笔易学 yubiyixue.xyz · 生成于 ${new Date().toLocaleString('zh-CN')}`, size: 16, color: '999999', font: 'Noto Serif SC' })],
  }))

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Noto Serif SC' } } } },
    sections: [{
      properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `四象三垣胎息识人_${person.name || '未命名'}_${person.birthYear}${String(person.birthMonth).padStart(2, '0')}${String(person.birthDay).padStart(2, '0')}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
