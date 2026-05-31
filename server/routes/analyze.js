import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { runFengshuiAnalysis, runLocationAnalysis } from '../services/fengshui-engine.js';
import {
  callQwenVision,
  callQwenText,
  getLayoutRecognitionPrompt,
  getFengshuiReportPrompt,
  getZodiacAnalysisPrompt,
  getZodiacComprehensivePrompt,
  getEnvironmentAnalysisPrompt,
} from '../services/ai-service.js';

const router = Router();
router.use(optionalAuth);

// 提取base64数据
function extractBase64(image) {
  return image.replace(/^data:image\/\w+;base64,/, '');
}

// 解析AI返回的JSON
function parseAIJson(content) {
  try {
    return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch {
    return null;
  }
}

// 保存分析结果到数据库
function saveAnalysis(analysisId, deviceId, userId, type, inputData, engineResult, aiReport) {
  db.prepare(`
    INSERT INTO analyses (id, device_id, user_id, type, input_data, overall_score, summary, detail_data, ai_report, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `).run(
    analysisId, deviceId, userId || null, type, JSON.stringify(inputData),
    engineResult.overallScore, engineResult.summary,
    JSON.stringify(engineResult), aiReport
  );

  const insertSuggestion = db.prepare(`
    INSERT INTO suggestions (id, analysis_id, priority, category, title, description, principle, solution)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of (engineResult.suggestions || [])) {
    insertSuggestion.run(uuidv4(), analysisId, s.priority, s.category, s.title, s.description, s.principle, s.solution);
  }

  db.prepare('UPDATE devices SET analysis_count = analysis_count + 1 WHERE id = ?').run(deviceId);
}

/**
 * 户型图分析（核心）
 */
router.post('/layout', async (req, res) => {
  try {
    const {
      image, orientation = 'south', buildingYear = new Date().getFullYear(),
      mode = 'simple', apiKey,
      withBazi = false, birthData = null,
    } = req.body;

    if (!image) return res.status(400).json({ success: false, error: '请上传户型图' });
    const effectiveApiKey = apiKey || process.env.DASHSCOPE_API_KEY;
    if (!effectiveApiKey) return res.status(400).json({ success: false, error: '请配置 API Key' });

    // 校验属相输入
    if (withBazi && birthData) {
      const year = birthData.year;
      if (!year || year < 1900 || year > new Date().getFullYear()) {
        return res.status(400).json({ success: false, error: '请输入1900-' + new Date().getFullYear() + '之间的出生年份' });
      }
    }

    const analysisId = uuidv4();

    // Step 1: AI 识别户型图
    const base64Data = extractBase64(image);
    const aiResult = await callQwenVision(base64Data, getLayoutRecognitionPrompt(), effectiveApiKey);
    if (!aiResult.success) {
      return res.status(500).json({ success: false, error: `AI 识别失败：${aiResult.error}` });
    }

    const layoutData = parseAIJson(aiResult.content);
    if (!layoutData) {
      return res.status(500).json({ success: false, error: 'AI 返回数据解析失败，请重试' });
    }

    const { rooms, features, layoutAnalysis } = layoutData;
    const orientationStr = layoutData.orientation || orientation;

    // Step 2: 风水规则引擎
    const engineResult = runFengshuiAnalysis({
      rooms,
      orientation: orientationStr,
      buildingYear,
      features: { ...features, ...layoutAnalysis },
      mode,
      withBazi,
      birthData,
    });

    // Step 3: AI 分析
    let aiReport;
    let zodiacData = null;

    if (withBazi && birthData) {
      // 属相分析
      const zodiacPrompt = getZodiacAnalysisPrompt(birthData.year);
      const zResult = await callQwenText(zodiacPrompt, effectiveApiKey);
      if (zResult.success) {
        zodiacData = parseAIJson(zResult.content) || { raw: zResult.content };
      }

      // 综合报告
      const compPrompt = getZodiacComprehensivePrompt({
        orientation: orientationStr,
        strengths: engineResult.strengths,
        weaknesses: engineResult.weaknesses,
        ninePalaceData: engineResult.ninePalace,
        zodiacData,
        matchData: engineResult.baziAnalysis,
      });
      const compResult = await callQwenText(compPrompt, effectiveApiKey);
      aiReport = compResult.success ? compResult.content : 'AI 报告生成失败';
    } else {
      // 纯户型报告
      const reportPrompt = getFengshuiReportPrompt({
        orientation: orientationStr,
        year: buildingYear,
        strengths: engineResult.strengths,
        weaknesses: engineResult.weaknesses,
        ninePalaceData: engineResult.ninePalace,
      });
      const reportResult = await callQwenText(reportPrompt, effectiveApiKey);
      aiReport = reportResult.success ? reportResult.content : 'AI 报告生成失败';
    }

    // Step 4: 保存
    saveAnalysis(analysisId, req.deviceId, req.userId, 'layout', { orientation, buildingYear, mode, withBazi, birthData }, engineResult, aiReport);

    res.json({
      success: true,
      analysisId,
      data: {
        overallScore: engineResult.overallScore,
        layoutScore: engineResult.layoutScore,
        baziMatchScore: engineResult.baziMatchScore,
        summary: engineResult.summary,
        strengths: engineResult.strengths,
        weaknesses: engineResult.weaknesses,
        ninePalace: engineResult.ninePalace,
        scoring: engineResult.scoring,
        baziAnalysis: zodiacData ? {
          ...zodiacData,
          matchAnalysis: engineResult.baziAnalysis,
        } : undefined,
        suggestions: engineResult.suggestions,
        aiReport,
        layoutData: mode === 'expert' ? layoutData : undefined,
      },
    });
  } catch (error) {
    console.error('Layout analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 楼盘位置分析
 */
router.post('/location', async (req, res) => {
  try {
    const {
      images, description,
      orientation = 'south', buildingYear = new Date().getFullYear(),
      mode = 'simple', apiKey,
    } = req.body;

    const effectiveApiKey = apiKey || process.env.DASHSCOPE_API_KEY;
    if (!effectiveApiKey) return res.status(400).json({ success: false, error: '请配置 API Key' });

    const analysisId = uuidv4();
    let environment;

    if (description) {
      const envResult = await callQwenText(getEnvironmentAnalysisPrompt(description), effectiveApiKey);
      if (envResult.success) {
        environment = parseAIJson(envResult.content) || { overallEnvironment: envResult.content };
      }
    } else if (images?.length > 0) {
      const base64Data = extractBase64(images[0]);
      const envResult = await callQwenVision(base64Data, getEnvironmentAnalysisPrompt('请根据这张环境照片分析风水格局'), effectiveApiKey);
      if (envResult.success) {
        environment = parseAIJson(envResult.content) || { overallEnvironment: envResult.content };
      }
    } else {
      return res.status(400).json({ success: false, error: '请提供环境照片或文字描述' });
    }

    const engineResult = runLocationAnalysis({ environment, orientation, buildingYear, mode });
    saveAnalysis(analysisId, req.deviceId, req.userId, 'location', { description, orientation, buildingYear, mode }, engineResult, null);

    res.json({
      success: true,
      analysisId,
      data: {
        overallScore: engineResult.overallScore,
        summary: engineResult.summary,
        strengths: engineResult.strengths,
        weaknesses: engineResult.weaknesses,
        environment: engineResult.environment,
        scoring: engineResult.scoring,
        suggestions: engineResult.suggestions,
      },
    });
  } catch (error) {
    console.error('Location analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * AI 报告单独生成
 */
router.post('/ai-report', async (req, res) => {
  try {
    const { apiKey, data } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: '请提供 API Key' });

    const prompt = getFengshuiReportPrompt(data);
    const result = await callQwenText(prompt, apiKey);

    if (result.success) {
      res.json({ success: true, report: result.content });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
