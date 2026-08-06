---
description: 'Lightweight summary of HANDOFF.md — task, progress, blockers, recent decisions/pitfalls, then ask "continue?". Use at session start.'
---

# /handoff:read

在会话开始时读取 `HANDOFF.md`，输出可直接继续工作的轻量摘要。

## 执行步骤

1. 读取项目根目录 `HANDOFF.md`。
   - 不存在时提示：`未找到 HANDOFF.md，请先执行 /handoff:write 创建`，然后停止；不要虚构项目状态。
2. 只提取以下信息，不倾倒全文：
   - 一句话任务
   - 当前进行中事项
   - 卡点
   - 下一步
   - 最近 1–2 条决策
   - 最近 1–2 条踩坑
3. 如果存在 `> 派生自：<文件名>`，说明当前任务直接派生自该归档。
4. 最后给出非阻塞提示：`可以从“下一步”继续；需要细节时可展开指定章节。`

## 约束

- read 是只读操作，不修改 `HANDOFF.md`，不扫描项目，不执行 write/update。
- 不强制等待用户回答“是否继续”；摘要输出后，当前会话可以直接继续工作。
- 需要完整历史时，用户可以直接请求展开某一节。