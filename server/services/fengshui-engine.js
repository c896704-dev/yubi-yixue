/**
 * 风水规则引擎核心（第三版）
 * 移除玄空飞星/八宅/流年飞星，新增八字匹配
 */
import { analyzeNinePalace } from './nine-palace.js';
import { calculateComprehensiveScore } from './scoring.js';
import { analyzeStrengthsAndWeaknesses } from './strength-weakness.js';
import { analyzeBaziMatch } from './bazi-service.js';
import { attachSolutions, getSolutions } from './fengshui-solutions.js';

/**
 * 户型图风水分析
 */
export function runFengshuiAnalysis({
  rooms,
  orientation = 'south',
  buildingYear,
  features = {},
  environment = null,
  mode = 'simple',
  totalArea = 100,
  withBazi = false,
  birthData = null,
}) {
  const orientationStr = typeof orientation === 'string' ? orientation : degreesToOrientation(orientation);

  // 1. 九宫格分析
  const ninePalace = analyzeNinePalace(rooms, orientationStr, features, totalArea);

  // 2. 优缺点分析
  const sw = analyzeStrengthsAndWeaknesses({
    rooms,
    ninePalace,
    flyingStar: null,
    features,
    orientation: orientationStr,
  });

  // 3. 属相匹配分析
  let baziAnalysis = null;
  if (withBazi && birthData) {
    baziAnalysis = analyzeBaziMatch(
      birthData.year, orientationStr, rooms, ninePalace
    );
  }

  // 4. 综合评分
  const scoring = calculateComprehensiveScore({
    ninePalace,
    environment,
    sw,
    withBazi,
    baziMatchScore: baziAnalysis?.avgScore || null,
  });

  // 5. 摘要
  const strengthSummary = sw.strengths.slice(0, 2).map(s => s.item).join('；');
  const weaknessSummary = sw.weaknesses.slice(0, 2).map(w => w.item).join('；');
  let summary = `综合评分${scoring.overallScore}分，${scoring.level.label}。`;
  if (strengthSummary) summary += `主要优点：${strengthSummary}。`;
  if (weaknessSummary) summary += `主要缺点：${weaknessSummary}。`;
  if (baziAnalysis) {
    summary += `八字匹配度${baziAnalysis.avgScore}分，${baziAnalysis.summary}`;
  }

  return {
    overallScore: scoring.overallScore,
    layoutScore: scoring.layoutScore,
    baziMatchScore: scoring.baziMatchScore || null,
    summary,
    strengths: sw.strengths,
    weaknesses: attachSolutions(sw.weaknesses),
    scoring: mode === 'expert' ? scoring : simplifyScoring(scoring),
    ninePalace,
    baziAnalysis,
    suggestions: sw.weaknesses.map(w => {
      const solutions = getSolutions(w.item) || [];
      return {
        priority: w.impact === '高' ? 'high' : w.impact === '中' ? 'medium' : 'low',
        category: w.type,
        title: w.item,
        description: w.detail,
        principle: '',
        solution: solutions.length > 0
          ? solutions.map(s => `${s.method}：${s.description}`).join('\n')
          : '',
      };
    }),
    environment,
    mode,
  };
}

/**
 * 楼盘位置分析
 */
export function runLocationAnalysis({ environment, orientation, buildingYear, mode = 'simple' }) {
  const sw = { strengths: [], weaknesses: [] };

  if (environment?.fourDeities) {
    const deities = environment.fourDeities;
    const nameMap = { greenDragon: '青龙（左）', whiteTiger: '白虎（右）', redPhoenix: '朱雀（前）', blackTortoise: '玄武（后）' };
    for (const [key, deity] of Object.entries(deities)) {
      const score = deity?.score || 50;
      if (score >= 75) {
        sw.strengths.push({ item: `${nameMap[key]}格局良好（${score}分）`, type: 'environment', impact: '中', detail: deity?.description || '' });
      } else if (score < 50) {
        sw.weaknesses.push({ item: `${nameMap[key]}格局不佳（${score}分）`, type: 'environment', impact: '中', detail: deity?.description || '' });
      }
    }
  }
  if (environment?.shaDetections) {
    for (const sha of environment.shaDetections) {
      sw.weaknesses.push({
        item: `检测到${sha.type}（${sha.severity === 'high' ? '严重' : sha.severity === 'medium' ? '中等' : '轻微'}）`,
        type: 'environment',
        impact: sha.severity === 'high' ? '高' : sha.severity === 'medium' ? '中' : '低',
        detail: sha.description || '',
      });
    }
  }

  const scoring = calculateComprehensiveScore({
    ninePalace: null, environment, sw, withBazi: false,
  });

  return {
    overallScore: scoring.overallScore,
    summary: `综合评分${scoring.overallScore}分，${scoring.level.label}`,
    strengths: sw.strengths,
    weaknesses: attachSolutions(sw.weaknesses),
    scoring: simplifyScoring(scoring),
    environment,
    suggestions: sw.weaknesses.map(w => {
      const solutions = getSolutions(w.item) || [];
      return {
        priority: w.impact === '高' ? 'high' : w.impact === '中' ? 'medium' : 'low',
        category: w.type, title: w.item, description: w.detail, principle: '',
        solution: solutions.length > 0
          ? solutions.map(s => `${s.method}：${s.description}`).join('\n')
          : '',
      };
    }),
    mode,
  };
}

// --- 辅助 ---

function degreesToOrientation(degrees) {
  const d = ((degrees % 360) + 360) % 360;
  if (d >= 337.5 || d < 22.5) return 'north';
  if (d >= 22.5 && d < 67.5) return 'ne';
  if (d >= 67.5 && d < 112.5) return 'east';
  if (d >= 112.5 && d < 157.5) return 'se';
  if (d >= 157.5 && d < 202.5) return 'south';
  if (d >= 202.5 && d < 247.5) return 'sw';
  if (d >= 247.5 && d < 292.5) return 'west';
  return 'nw';
}

function simplifyScoring(scoring) {
  return {
    overallScore: scoring.overallScore,
    layoutScore: scoring.layoutScore,
    baziMatchScore: scoring.baziMatchScore,
    level: scoring.level,
    dimensions: Object.entries(scoring.dimensions).reduce((acc, [key, val]) => {
      acc[key] = { score: val.score, label: val.label, weight: val.weight, strength: val.strength, weakness: val.weakness };
      return acc;
    }, {}),
  };
}

export default { runFengshuiAnalysis, runLocationAnalysis };
