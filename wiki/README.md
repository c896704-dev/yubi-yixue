# 御笔易学 · 项目 Wiki

> 本 Wiki 由引擎审查会话产出，记录项目架构、命理引擎技术规范、已修复的专业性漏洞及验证方法。
> 目标读者：后续维护者、算法评审者、功能扩展开发者。

## 目录

1. [项目架构总览](架构总览.md)
2. [命理引擎技术规范](命理引擎规范.md)
3. [已知问题与修复记录](问题修复记录.md)
4. [验证方法与回归测试](验证方法.md)

---

## 快速导航

| 主题 | 位置 |
|------|------|
| 八字排盘核心 | `src/utils/bazi.ts` |
| 四柱/干支（六爻·梅花共用） | `src/utils/ganzhi.ts` |
| 旺衰判定引擎 | `src/utils/wangshuai.ts` |
| 喜用神推算 | `src/utils/yongshen.ts` |
| 神煞计算 | `src/utils/shensha.ts` |
| 刑冲合害 / 命宫 / 胎元 | `src/utils/chonghe.ts` |
| 合盘评分引擎 | `src/utils/compatibility.ts` |
| 六爻纳甲（含六神） | `src/features/divination/utils/liuyao.ts` |
| 梅花易数（含起卦/综错卦） | `src/features/divination/utils/meihua.ts` |
| 真太阳时（含均时差） | `src/utils/solarTime.ts` |
| 万年历页面 | `src/features/almanac/WannianliPage.tsx` |
| 服务器业务逻辑 | `server/services/` |

## 审查结论摘要

本会话对全项目命理引擎做了系统性核查，以 `lunar-typescript`（权威农历/干支库）和《渊海子平》《三命通会》《增删卜易》《梅花易数》等典籍为基准，**确认并修复了 16 个文件中的 20+ 项技术性/专业性错误**，详见 [问题修复记录](问题修复记录.md)。
