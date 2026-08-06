---
description: 'Snapshot HANDOFF.md into .handoff/ (default=decisions+pitfalls, "full"=entire doc, "list"=index, "load <file>"=restore with lineage + overwrite guard). Use at task end.'
---

# /handoff:archive

归档 HANDOFF.md 到 `.handoff/`。任务结束时使用。

## 子参数

- `/handoff:archive`：默认，只提取"决策记录"+"踩坑记录"两节归档。
- `/handoff:archive full`：归档整篇 HANDOFF.md。
- `/handoff:archive list`：浏览 `.handoff/index.md` 归档索引。
- `/handoff:archive load <文件名>`：把 `.handoff/<文件名>` 内容复制进 HANDOFF.md。

## archive（默认 / full）行为

1. 读取 `HANDOFF.md`。
   - 不存在则提示：`未找到 HANDOFF.md，无内容可归档`，不创建 `.handoff/`。
2. 生成不冲突的文件名 `HANDOFF-YYYY-MM-DD-HHMM.md`；同一分钟已有同名文件时依次使用 `-2`、`-3`… 后缀。
3. 创建 `.handoff/`（仅在确认有内容需要归档后）。
4. 写入冻结快照：
   - 默认模式：`> 派生自` 行（如有）+ `## 决策记录` + `## 踩坑记录`。
   - `full` 模式：完整复制当前 `HANDOFF.md`。
5. 更新 `.handoff/index.md`：只在末尾追加一行，包含归档时间、文件、直接父归档、备注；不修改历史行。
   - 当前 HANDOFF 没有派生标记时，父归档为 `-`。
   - 当前 HANDOFF 有 `> 派生自：X` 时，父归档为 `X`；只记录直接父文件，不递归展开祖先。
6. 不删除、不修改当前 `HANDOFF.md`，也不修改任何既有归档。
7. 输出归档路径、模式和直接父归档。

## archive list 行为

1. 只读 `.handoff/index.md`。
2. 目录、索引不存在或索引没有记录时，提示：`暂无归档，请先执行 /handoff:archive 创建`；不要创建目录或文件。
3. 展示全部索引记录，并提示可用 `/handoff:archive load <文件名>` 加载。

## archive load <文件名> 行为

1. 校验文件名只指向 `.handoff/` 内的归档文件；不要读取目录外路径。
2. 检查 `.handoff/<文件名>` 是否存在。
   - 不存在时提示错误，并从现有 index 列出可用文件；不写入任何内容。
3. 如果项目根已有 `HANDOFF.md`，在任何写入前提示将覆盖并等待确认。
   - 取消时不创建/修改任何文件。
4. 用户确认或 `HANDOFF.md` 不存在时，复制归档完整内容到项目根 `HANDOFF.md`；原归档保持冻结。
5. 在新 `HANDOFF.md` 中将直接父标记设置为本次加载的 `<文件名>`，替换旧的 `> 派生自` 行；不要继承祖先标记。
6. 更新 `> 最后更新：YYYY-MM-DD HH:MM`。
7. 输出已加载文件和直接父归档；后续可修改后用 `/handoff:archive` 创建新快照。

## 快照原则

归档是冻结快照，永不修改。lineage 只记录直接父归档：

`root-archive → load root-archive → 修改 → archive child-archive`

child 的索引“派生自”列为 root-archive；如需追溯更早祖先，读取父归档的索引记录。