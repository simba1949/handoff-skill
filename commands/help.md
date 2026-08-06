---
description: 'List all /handoff: commands and the recommended workflow (write/read/update/archive/help + archive sub-modes).'
---

# /handoff:help

列出全部 handoff 命令。

## 输出

| 命令 | 作用 |
|---|---|
| `/handoff:write` | 会话边界，AI 全量重综合 HANDOFF.md |
| `/handoff:read` | 会话开始，轻型摘要 + 是否继续 |
| `/handoff:update <章节>` | 会话中途，定点补丁（上下文/进度=替换，决策/踩坑=追加） |
| `/handoff:archive` | 提取决策+踩坑归档到 `.handoff/`（默认模式） |
| `/handoff:archive full` | 归档整篇 HANDOFF.md |
| `/handoff:archive list` | 浏览归档索引 `.handoff/index.md` |
| `/handoff:archive load <文件>` | 加载归档到 HANDOFF.md（有覆盖提示） |
| `/handoff:help` | 本表 |

## 推荐工作流

**典型场景 A（新任务）：**
1. 任务开始 → `/handoff:write`（AI 扫描生成初始 HANDOFF.md）
2. 下次会话开始 → `/handoff:read`（轻型摘要快速恢复）
3. 会话中途微调 → `/handoff:update <章节>`（定点补丁，不重新扫描）
4. 任务完成 → `/handoff:archive`（默认只存决策+踩坑，或 `full` 存整篇）

**典型场景 B（需求变更，参考旧任务）：**
1. `/handoff:archive list`（浏览已有归档）
2. `/handoff:archive load <文件>`（把旧归档复制到 HANDOFF.md，建立派生关系）
3. 修改 HANDOFF.md 适配新需求
4. 继续用 `/handoff:read` / `/handoff:update` 推进
5. 新任务完成后 `/handoff:archive`（生成新归档，继承派生链）

## write 与 update 互不越界原则

- **write**：**仅在会话边界使用**（新任务启动、长期停滞后重启、需要全量重新扫描项目状态时）
- **update**：**仅在会话中途使用**（微调已有章节、追加决策记录或踩坑记录）
- **严格互斥**：会话中途哪怕想全量刷新，也必须忍到会话结束再用 write。违背此原则会混淆"AI 全量推导"与"用户增量修正"的边界，导致 HANDOFF.md 状态不一致。
