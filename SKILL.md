---
name: handoff
description: Cross-session handoff for long tasks. Write and read HANDOFF.md so context survives across sessions. Use at session boundaries, when starting a new session, after a long pause, when a task is done, or when recording decisions and pitfalls.
---

# Handoff

跨会话交接。长任务跨天/跨会话时，模型会丢失上下文。本 skill 把任务状态固化进项目根目录的 `HANDOFF.md`，新会话读取后即可接着推进。

`HANDOFF.md` 永远只有 4 节、全内联、自包含：**上下文 / 当前进度 / 决策记录 / 踩坑记录**。当前进度含"已完成 / 进行中 / 卡点 / 下一步"。不探测其他框架（OpenSpec / SuperPowers / planning-with-files），不使用指针引用。模板见仓库内 `HANDOFF-template.md`。

## 何时使用

- 新会话开始 → **read**：读取 HANDOFF.md，恢复任务上下文。
- 会话结束 / 任务完成 → **write** 或 **archive**：固化当前状态。
- 长期停滞后重启 → **write**：重新综合项目与会话状态。
- 会话中做了决策或踩了坑 → **update**：及时追加记录。
- 需求变更，参考旧任务 → **archive list** + **archive load**：浏览并加载归档。

## 操作步骤

以下步骤不依赖任何 `/` 命令，任何 agent harness 均可直接执行。

### write — 会话边界，写交接五要素

写给完全没有上下文的新会话看：任务、已完成、卡点、下一步、踩坑。

1. 读取现有 `HANDOFF.md`（若存在）和 `HANDOFF-template.md`。
2. **综合会话上下文**：代码任务可辅助扫描 Git/代码/TODO，日常任务基于会话对话与产出物——两者一致。
3. 首次：只写"任务/为什么"，进度写"待填充"，决策/踩坑留空。
4. 收尾：写全五件事，严格保留 4 节结构。
5. **分节决策**（默认）：
   - 上下文、当前进度 → 覆盖刷新（已完成 / 进行中 / 卡点 / 下一步）。
   - 决策记录、踩坑记录 → **保留原历史**，新记录追加到顶部；不因无法推断原因就删除。
6. **可靠性**：可从文件/工具验证的用验证；无法验证的（意图、卡点叙事）用会话记忆，拿不准时标注"不确定"，不编造。
7. 旧文件若有 `> 派生自：<文件名>` 行，原样保留；首次生成则不添加该行。
8. 更新 `> 最后更新：YYYY-MM-DD HH:MM`。
9. 输出 4 节标题、当前卡点和下一步。

**write full（重新构建）**：先归档旧内容（冻结到 `.handoff/`），再全量重建 HANDOFF.md；用于文档损坏、结构混乱或彻底重来。若自上次归档以来内容无变化，跳过归档只重建。

### read — 会话开始轻量恢复

1. 读取项目根目录 `HANDOFF.md`；不存在则提示先执行 write，然后停止，不要虚构项目状态。
2. 只提取：一句话任务、已完成、进行中事项、卡点、下一步、最近 1–2 条决策、最近 1–2 条踩坑。
3. 若头部有 `> 派生自：<文件名>`，说明当前任务直接派生自该归档。
4. 输出摘要后不阻塞，等用户指示继续；需要细节时可展开指定章节。

### update — 中途定点补丁

可更新的章节（共 4 节）：

| 章节 | 英文 | 含义 | 更新方式 |
|---|---|---|---|
| 上下文 | context | 一句话任务 / 为什么做 / 技术背景 | 替换正文 |
| 当前进度 | progress | 已完成 / 进行中 / 卡点 / 下一步 | 替换正文 |
| 决策记录 | decisions | 为什么选 X 不选 Y（表格） | 顶部追加 |
| 踩坑记录 | pitfalls | 踩过什么坑 + 如何解决（列表） | 顶部追加 |

1. 识别要更新的章节：上下文 / 当前进度 / 决策记录 / 踩坑记录（或 context / progress / decisions / pitfalls）。
2. 按规则更新，其他章节原样保留：
   - 上下文、当前进度 → 替换该节正文（保留节标题）。
   - 决策记录、踩坑记录 → 在顶部追加一条。
3. 决策记录至少包含"决策内容 + 选择原因"；踩坑记录至少包含"问题 + 解决/规避"。缺失关键字段时先询问，或明确标记"未知"，不要编造。
4. 无法明确识别章节或内容时先询问，不写入文件。
5. 更新 `> 最后更新：YYYY-MM-DD HH:MM`，保留 `> 派生自` 行。
6. 默认不删除历史；需要更正时追加一条带"更正"标记的记录。

### archive — 冻结快照 + lineage

- 归档 = 冻结快照，**一经归档永不修改**。
- 默认模式：只存 `> 派生自` 行（如有）+ 决策记录 + 踩坑记录。
- `full` 模式：完整复制当前 HANDOFF.md。
- 存储到 `.handoff/HANDOFF-YYYY-MM-DD-HHMM.md`；同分钟冲突加 `-2`、`-3` 后缀。
- 索引写入 `.handoff/index.md`（只追加，不改历史行），列为：归档时间 / 文件 / 派生自 / 备注。
- **直接父归档模型**：root 归档的"派生自"为 `-`；`load X` 后，当前 HANDOFF.md 的派生自固定为 X；再次 archive 时只记录直接父文件，不递归展开祖先。

### archive load — 恢复归档

1. 校验文件名只指向 `.handoff/` 内的归档；不存在则从索引列出可用文件，不写任何内容。
2. 若项目根已有 `HANDOFF.md`，在任何写入前提示将覆盖并等待确认；取消则不创建/修改任何文件。
3. 复制归档完整内容到 `HANDOFF.md`；原归档保持冻结。
4. 将新 `HANDOFF.md` 的 `> 派生自` 设置为本次加载的 `<文件名>`（替换旧值，不继承祖先标记）。
5. 更新 `> 最后更新`；输出已加载文件和直接父归档。

### archive list — 浏览归档

只读 `.handoff/index.md`；目录或索引不存在时提示暂无归档，不创建目录或文件。

## 填写约束

- 只记录已确认的事实；无法确认时写"未知"或"无"。
- 不用示例、猜测或占位符冒充真实状态。

## 与其他框架的关系

纯 standalone，不与 OpenSpec / SuperPowers / planning-with-files 联动。若项目同时使用这些框架，HANDOFF.md 与它们的工件（如 `task_plan.md`、`openspec/changes/`）并行存在、各记各的，可能重叠。handoff 的不可替代价值是**踩坑记录**。

---

> **Claude Code 用户**：可用更精确的命名空间命令驱动同一工作流：
> `/handoff:write`、`/handoff:read`、`/handoff:update <章节>`、`/handoff:archive [full|list|load <文件>]`、`/handoff:help`。
