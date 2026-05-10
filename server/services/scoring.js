/**
 * 综合评分算法（新版）
 *
 * 无八字：户型格局 40% + 环境格局 35% + 流年时运 25%
 * 有八字：户型格局 35% + 环境格局 30% + 八字匹配 35%
 */
export function calculateComprehensiveScore({
  ninePalace,
  environment,
  sw,
  withBazi = false,
  baziMatchScore = null,
}) {
  const layoutScore = calculateLayoutScore(ninePalace, sw);
  const environmentScore = calculateEnvironmentScore(environment, sw);

  let overallScore;
  let dimensions;

  if (withBazi && baziMatchScore !== null) {
    // 有八字版本：户型35 + 环境30 + 八字匹配35
    overallScore = Math.round(
      layoutScore * 0.35 + environmentScore * 0.30 + baziMatchScore * 0.35
    );

    dimensions = {
      layout: {
        score: layoutScore, weight: 35, label: '户型格局',
        strength: getLayoutStrength(sw), weakness: getLayoutWeakness(sw),
      },
      environment: {
        score: environmentScore, weight: 30, label: '环境格局',
        strength: getEnvStrength(sw), weakness: getEnvWeakness(sw),
      },
      bazi: {
        score: baziMatchScore, weight: 35, label: '八字匹配',
        strength: '五行匹配良好', weakness: '部分方位五行需调和',
      },
    };
  } else {
    // 无八字版本：户型40 + 环境35 + 流年时运25
    const timelyScore = 60; // 默认中值
    overallScore = Math.round(
      layoutScore * 0.40 + environmentScore * 0.35 + timelyScore * 0.25
    );

    dimensions = {
      layout: {
        score: layoutScore, weight: 40, label: '户型格局',
        strength: getLayoutStrength(sw), weakness: getLayoutWeakness(sw),
      },
      environment: {
        score: environmentScore, weight: 35, label: '环境格局',
        strength: getEnvStrength(sw), weakness: getEnvWeakness(sw),
      },
      timely: {
        score: timelyScore, weight: 25, label: '流年时运',
        strength: '流年时运平稳', weakness: '无特殊流年问题',
      },
    };
  }

  return {
    overallScore,
    layoutScore,
    baziMatchScore,
    level: getScoreLevel(overallScore),
    dimensions,
  };
}

function calculateLayoutScore(ninePalace, sw) {
  let score = 75;

  if (ninePalace?.missingCorners) {
    for (const mc of ninePalace.missingCorners) {
      const penalty = { '轻': 8, '中': 15, '重': 25 };
      score -= penalty[mc.severity] || 10;
    }
  }

  const highW = (sw?.weaknesses || []).filter(w => w.type === 'layout' && w.impact === '高');
  const midW = (sw?.weaknesses || []).filter(w => w.type === 'layout' && w.impact === '中');
  const highS = (sw?.strengths || []).filter(w => w.type === 'layout' && w.impact === '高');

  score -= highW.length * 12;
  score -= midW.length * 5;
  score += highS.length * 8;

  return Math.max(10, Math.min(100, Math.round(score)));
}

function calculateEnvironmentScore(environment, sw) {
  let score = 70;

  if (environment?.fourDeities) {
    const d = environment.fourDeities;
    const avg = ((d.greenDragon?.score || 50) + (d.whiteTiger?.score || 50) +
                 (d.redPhoenix?.score || 50) + (d.blackTortoise?.score || 50)) / 4;
    score = Math.round((score + avg) / 2);
  }

  if (environment?.shaDetections) {
    for (const sha of environment.shaDetections) {
      score -= sha.severity === 'high' ? 20 : sha.severity === 'medium' ? 10 : 4;
    }
  }

  return Math.max(10, Math.min(100, Math.round(score)));
}

function getLayoutStrength(sw) {
  const items = (sw?.strengths || []).filter(s => s.type === 'layout');
  return items.slice(0, 2).map(s => s.item).join('；') || '格局基本方正';
}

function getLayoutWeakness(sw) {
  const items = (sw?.weaknesses || []).filter(w => w.type === 'layout');
  return items.slice(0, 2).map(w => w.item).join('；') || '无特殊问题';
}

function getEnvStrength(sw) {
  const items = (sw?.strengths || []).filter(s => s.type === 'environment');
  return items.slice(0, 1).map(s => s.item).join('；') || '环境格局尚可';
}

function getEnvWeakness(sw) {
  const items = (sw?.weaknesses || []).filter(w => w.type === 'environment');
  return items.slice(0, 1).map(w => w.item).join('；') || '无特殊问题';
}

export function getScoreLevel(score) {
  if (score >= 80) return { level: 'good', color: '#52C41A', label: '风水格局良好' };
  if (score >= 60) return { level: 'medium', color: '#FAAD14', label: '风水格局中等' };
  return { level: 'poor', color: '#FF4D4F', label: '风水格局有待改善' };
}

export default { calculateComprehensiveScore, getScoreLevel };
