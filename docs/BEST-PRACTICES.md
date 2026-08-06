# Handoff Skill 最佳实践

本文档基于 13 轮设计拷问会议的结论，总结 handoff-skill 的实战最佳实践。

## 核心原则

### 1. 严守"互不越界"

**铁律**：
- 会话边界（新会话开始/会话结束）→ 必用 `/handoff:write`
- 会话中途 → 只用 `/handoff:update`
- 中途哪怕想全量刷新，也忍到会话结束

**反例**（会导致数据丢失）：
```
会话开始 → /handoff:write 生成初始文档
会话中 → /handoff:update 追加 3 条决策记录
会话中 → /handoff:write（错！）← 刚追加的 3 条决策丢失
```

**正例**：
```
会话开始 → /handoff:write 生成初始文档
会话中 → /handoff:update 追加决策 A
会话中 → /handoff:update 追加决策 B
会话中 → /handoff:update 追加踩坑 C
会话结束 → /handoff:write 全量刷新（包含 A/B/C 的全局状态）
```

### 2. 及时记录决策和踩坑

**最佳时机**：做决策/踩坑的**当下**立刻 `/handoff:update`。

**为什么**：
- `/handoff:write` 通过扫描代码推导，但无法推导决策理由（"为什么选 X 不选 Y"）
- 踩坑的上下文（报错信息、环境细节）过后容易遗忘
- 拖到会话结束再记，细节已模糊

**示例工作流**：
```
你：帮我选一个状态管理库
AI：推荐 Zustand，相比 Redux 更轻量...
你：/handoff:update decisions
    决策：选用 Zustand 而非 Redux
    原因：项目规模小、不需要中间件、学习曲线平缓
```

### 3. 会话结束前必 write

**规则**：每次会话结束前，必执行 `/handoff:write` 全量刷新。

**为什么**：
- write 重新扫描 git log、未提交变更、代码 TODO，捕获会话中的所有项目变化
- update 只是用户补丁，不会主动探测项目状态
- 下次会话 `/handoff:read` 依赖最新的 write 快照

**忘记的后果**：
- 下次 read 看到的是上次 write 的旧状态
- 本会话中的进度变化（如完成了 3 个子任务、合并了 2 个 PR）丢失

## 典型工作流

### 工作流 A：新任务从零开始

```
Day 1, 会话开始
→ /handoff:write（AI 扫描项目，生成初始 HANDOFF.md）

→ 开始开发...
→ 做了技术选型决策 → /handoff:update decisions
→ 踩了一个坑 → /handoff:update pitfalls
→ 完成部分功能，准备下班
→ /handoff:write（会话结束，全量刷新）

Day 2, 新会话开始
→ /handoff:read（快速恢复：看到 Day 1 的进度/决策/踩坑）
→ AI："昨天完成了 XX，卡在 YY，今天从哪开始？"
→ 继续开发...
→ 又做了 2 个决策 → /handoff:update decisions（各一次）
→ 会话结束 → /handoff:write
```

### 工作流 B：任务完成后归档

```
任务完成
→ /handoff:archive（默认只存决策+踩坑，长期价值部分）
→ 归档到 .handoff/HANDOFF-2026-08-05-1430.md
→ HANDOFF.md 可删除或留着（由你决定）

新任务开始
→ /handoff:write（生成新任务的 HANDOFF.md，覆盖旧的）
```

### 工作流 C：需求变更，参考旧任务

```
需求变更（如 v1 已完成，现在做 v2 新增功能）
→ /handoff:archive list（浏览已有归档）
→ 找到相关归档：HANDOFF-2026-07-20-1500.md（v1 任务）
→ /handoff:archive load HANDOFF-2026-07-20-1500.md
→ 复制到 HANDOFF.md，头部标注"派生自：HANDOFF-2026-07-20-1500.md"
→ 手动编辑 HANDOFF.md，调整"上下文"和"当前进度"适配 v2 需求
→ 保留原有决策/踩坑记录作为参考
→ 开始推进 v2
→ /handoff:update 追加新决策/踩坑
→ v2 完成后 /handoff:archive（生成新归档，继承派生链）
```

## 反模式（常见错误）

### ❌ 反模式 1：会话中途用 write

**错误示例**：
```
会话中 → /handoff:update 追加了 5 条决策
会话中 → 觉得文档乱了，想刷新 → /handoff:write（错！）
结果 → 刚追加的 5 条决策全丢（write 重新生成时无法推导出这些决策）
```

**正确做法**：忍到会话结束再 write，或先 archive 保留当前内容。

### ❌ 反模式 2：会话边界用 update

**错误示例**：
```
Day 2, 新会话开始
→ /handoff:read
→ /handoff:update progress（错！应该用 write）
结果 → 遗漏 Day 1 结束后到 Day 2 开始之间的项目变化（git 提交、文件修改等）
```

**正确做法**：会话开始必用 write，让 AI 重新扫描项目全局状态。


### ❌ 反模式 3：忘记会话结束时 write

**错误示例**：
```
Day 1 → /handoff:write → 开发 → /handoff:update x3 → 下班忘记 write
Day 2 → /handoff:read
结果 → 看到的是 Day 1 开始时的状态，update 的 3 条记录在，但项目整体进度落后
```

**正确做法**：养成习惯，会话结束前最后一条命令必是 `/handoff:write`。

### ❌ 反模式 4：归档前不确认内容

**错误示例**：
```
→ /handoff:archive（直接归档）
→ 归档后发现"决策记录"里少记了 2 条重要决策
→ 想补充，但归档已冻结无法修改
```

**正确做法**：
```
→ /handoff:read（或直接打开 HANDOFF.md 检查）
→ 确认 4 节内容完整
→ /handoff:update 补充遗漏的决策/踩坑
→ /handoff:archive（归档完整内容）
```

### ❌ 反模式 5：load 时不看覆盖提示

**错误示例**：
```
→ 当前 HANDOFF.md 有正在推进的任务
→ /handoff:archive load 旧归档（误操作）
→ 提示"将覆盖"，直接确认
→ 正在推进的任务内容全丢
```

**正确做法**：
```
→ 看到覆盖提示 → 取消
→ /handoff:archive（先归档当前正在推进的任务）
→ /handoff:archive load 旧归档（现在安全了）
```

## 高级技巧

### 技巧 1：用归档做 A/B 尝试

**场景**：想尝试两种技术方案，但不确定哪个更好。

**做法**：
```
→ 方案 A 推进中，HANDOFF.md 记录了决策和踩坑
→ /handoff:archive（归档方案 A 的状态）
→ /handoff:write（清空重来，尝试方案 B）
→ 推进方案 B...
→ 方案 B 遇到重大问题，决定回退
→ /handoff:archive load 方案 A 归档（恢复到方案 A 的状态）
→ 继续推进方案 A
```

### 技巧 2：用 lineage 追溯决策历史

**场景**：v3 任务出问题，想看 v1/v2 时是怎么决策的。

**做法**：
```
→ /handoff:archive list（查看索引）
→ 看到派生链：
   v1 归档（-）
   → v2 归档（派生自 v1）
     → v3 归档（派生自 v2）
→ 逐个打开归档文件，对比"决策记录"节
→ 发现 v1 时选了 X，v2 时改成 Y，v3 问题根源是 Y 的副作用
```

### 技巧 3：多人协作时的交接

**场景**：你接手同事的任务。

**做法**：
```
→ 同事移交前 /handoff:write + /handoff:archive
→ 你接手时 /handoff:read（快速了解任务上下文）
→ 重点看"决策记录"（为什么这么做）和"踩坑记录"（避免重蹈覆辙）
→ 继续推进...
→ 完成后 /handoff:archive（归档你的接手阶段）
```

### 技巧 4：定期归档（项目里程碑）

**场景**：大项目持续几个月，中间有多个里程碑。

**做法**：
```
→ 里程碑 1 完成（如"用户认证模块"）→ /handoff:archive
→ 里程碑 2 完成（如"数据报表模块"）→ /handoff:archive
→ 里程碑 3 完成（如"权限管理模块"）→ /handoff:archive
→ 项目最终完成 → /handoff:archive full（归档完整历史）
```

**收益**：
- 每个里程碑的决策/踩坑独立归档，便于后续查阅
- 若某个里程碑需要重构，可 load 对应归档快速恢复上下文

## 与其他工具配合

### 配合 OpenSpec

**场景**：项目同时用 OpenSpec 管理规格设计。

**分工**：
- OpenSpec：管理 proposal/design/specs/tasks（正式规格文档）
- handoff：管理决策记录/踩坑记录（非正式但有长期价值的工程知识）

**避免重叠**：
- 不在 HANDOFF.md 里写详细 API 设计（应该在 OpenSpec specs）
- 不在 OpenSpec 里写踩坑记录（应该在 HANDOFF.md）


### 配合 planning-with-files

**场景**：项目同时用 planning-with-files 自动恢复会话。

**分工**：
- planning-with-files：用 hook 自动注入 task_plan.md/findings.md（细粒度任务和发现）
- handoff：手动 `/handoff:read` 恢复高层次上下文（任务目标、关键决策、致命踩坑）

**已知重叠**：
- 两者都有"会话恢复"能力，planning-with-files 的 hook 自动恢复优于 handoff 手动 read
- 两者都有"决策记录"能力，findings.md 和 HANDOFF.md 决策记录会重叠
- **接受重叠**：handoff 的价值在"踩坑记录"（planning-with-files 没有），其余重叠是设计取舍

### 配合 Git

**场景**：git commit message 和 HANDOFF.md 都记录变更。

**分工**：
- Git commit：记录"做了什么"（what）
- HANDOFF.md 决策记录：记录"为什么这么做"（why）

**示例**：
```
Git commit: "refactor: 将状态管理从 Redux 迁移到 Zustand"
HANDOFF.md 决策记录: "选用 Zustand 而非 Redux，原因：项目规模小、不需要 Redux 的复杂中间件、减少样板代码"
```

## 常见问题（FAQ）

**Q1: HANDOFF.md 应该提交到 git 吗？**
A: 看团队习惯。
- 提交：团队成员可共享上下文（适合多人协作项目）
- 不提交（加入 .gitignore）：纯个人工作记录（适合个人项目）


**Q2: 归档文件（.handoff/）应该提交到 git 吗？**
A: 一般不提交。归档是快照历史，属于个人知识库，不是项目工件。可加入 .gitignore。

**Q3: 多长时间归档一次？**
A: 没有固定规则，建议时机：
- 任务完成时（必须归档）
- 切换需求时（归档旧需求，开始新需求）
- 项目里程碑时（如完成核心模块）
- 踩了重大踩坑时（立刻归档当前状态，避免后续忘记坑的细节）

**Q4: 归档文件太多怎么办？**
A: 
- `.handoff/index.md` 提供了索引，用 `/handoff:archive list` 浏览
- 可手动删除过期归档（如 3 个月前的、已无参考价值的）
- 归档文件是纯文本，占用空间小，不用过度担心

**Q5: 可以跨项目共享归档吗？**
A: 理论上可以，但不推荐。归档的"上下文"节绑定特定项目，跨项目 load 会产生错位。建议每个项目独立管理归档。

**Q6: lineage 链太长怎么办？**
A: lineage 只记录直接父归档，不会无限增长。示例：
- v1 归档 → v2 归档（派生自 v1）→ v3 归档（派生自 v2）
- v3 的 lineage 只标注"派生自 v2"，不会递归显示 v1
- 若要追溯完整链，手动查看 v2 归档的 lineage 标记

**Q7: 忘记互不越界原则违规了怎么补救？**
A: 数据可能已丢失，无法完全补救。教训：
- 养成肌肉记忆：会话边界用 write，会话中途用 update
- 可在编辑器里给 HANDOFF.md 加注释提醒："会话中途禁止 write"

## 总结

handoff-skill 的核心价值：
1. **跨会话交接**：避免上下文丢失
2. **决策记录**：为什么这么做（补充 git commit 的 what）
3. **踩坑记录**（独占价值）：避免重蹈覆辙

三大原则：
1. **严守互不越界**：write=边界，update=中途
2. **及时记录**：做决策/踩坑的当下立刻 update
3. **会话结束必 write**：全量刷新项目状态

做到这三点，handoff-skill 就能发挥最大价值。
