# handoff-skill

跨会话交接 skill：把长任务状态写进 `HANDOFF.md`，新会话读取后接着推进，避免上下文丢失。

## 命令

| Command | 解释 |
|---|---|
| `/handoff:write` | 会话边界，写交接五要素（任务/已完成/卡点/下一步/踩坑）；保留已有决策/踩坑记录 |
| `/handoff:write full` | 先归档旧内容，再全量重建 HANDOFF.md |
| `/handoff:read` | 会话开始，轻型摘要 + 是否继续 |
| `/handoff:update [context\|progress\|decisions\|pitfalls]` | 会话中途定点补丁——上下文/进度=替换，决策/踩坑=追加 |
| `/handoff:archive [full\|list\|load]` | 归档决策+踩坑（默认）；`full`=整篇，`list`=索引，`load <file>`=加载归档 |
| `/handoff:help` | 命令列表 + 工作流 |

命令文件按 Claude Code 插件规范置于根级 `commands/{write,read,update,archive,help}.md`（文件名=命令名，含 `description` frontmatter），由 `.claude-plugin/plugin.json` 的 `commands` 映射注册为 `/handoff:` 命名空间。

## 快速开始

```bash
# 会话结束
/handoff:write

# 新会话开始
/handoff:read
```

**完整工作流示例**：
```bash
# Day 1: 新任务启动
/handoff:write                    # 首次，只写任务/为什么骨架
# ... 开发中 ...
/handoff:update decisions         # 记录技术选型
/handoff:update pitfalls          # 记录遇到的坑
/handoff:write                    # 会话结束前补全五要素

# Day 2: 新会话开始
/handoff:read                     # 快速恢复上下文
# ... 继续开发 ...
/handoff:update progress          # 更新进度
/handoff:write                    # 会话结束

# 任务完成
/handoff:archive                  # 归档决策+踩坑
```

**详细最佳实践**：见 [docs/BEST-PRACTICES.md](docs/BEST-PRACTICES.md)

## 设计

- **4 节模板（永远全内联，自包含）**：
  - 上下文（一句话任务 + 为什么做 + 技术背景）
  - 当前进度（进行中 / 卡点 / 下一步待办）
  - 决策记录（为什么选 X 不选 Y，表格形式，时间倒序）
  - 踩坑记录（踩过什么坑 + 如何解决，列表形式，时间倒序）
  
- **归档冻结 + lineage**：
  - 归档后永不修改；需求变更时 load 旧归档、推进、再 archive，形成 lineage 分叉链
  - 从归档 load 而来的 HANDOFF.md 头部标注 `> 派生自：<文件>`，再次归档继承此标记
  - `.handoff/index.md` 显示派生列，形成可追溯分叉树
  
- **永远 standalone，拒绝集成**：
  - 不探测 OpenSpec / SuperPowers / planning-with-files 等其他框架工件
  - 不使用指针引用（如 `见 SPEC.md`），所有内容直接内联到 HANDOFF.md
  - 不寄生到其他框架的归档目录，始终用独立的 `.handoff/` 目录

## 与其他框架的关系

本 skill **不与** OpenSpec / SuperPowers / planning-with-files 联动（纯 standalone 设计）。若项目同时使用这些框架，HANDOFF.md 会与它们的工件并行存在、各记各的，存在重叠：

| 能力 | 其他框架 | handoff |
|---|---|---|
| 规格设计 | OpenSpec proposal/design、SuperPowers brainstorming | ✅ 上下文（重叠） |
| 任务进度 | OpenSpec tasks、planning-with-files task_plan | ✅ 当前进度（重叠） |
| 决策记录 | planning-with-files findings | ✅ 决策记录（重叠） |
| 跨会话恢复 | planning-with-files（hook 自动） | `/read`（手动，重叠且劣于 hook） |
| **踩坑记录** | **无** | ✅ **独占**（唯一不可替代价值） |
| 归档 | OpenSpec `/opsx:archive` | `/handoff:archive`（重叠） |

本 skill 的**不可替代价值**在于**踩坑记录**这一其他框架不拥有的工件；其余能力为重叠存在，由用户自行取舍。

**已知代价，主动接受：**
- 四份工件可能漂移不一致（HANDOFF.md / task_plan.md / findings.md / openspec/changes/）
- 手动 `/read` 恢复劣于 planning-with-files 的 hook 自动恢复
- 与 OpenSpec `/opsx:archive` 存在归档重叠

这是**设计取舍**，非缺陷。本 skill 选择"自包含的 HANDOFF.md"而非框架集成，用户为此接受重叠成本。

**配合建议**：见 [docs/BEST-PRACTICES.md](docs/BEST-PRACTICES.md#与其他工具配合)

## 安装

### 使用 npx（推荐）

从 GitHub 安装到 Claude Code 的用户级 skills 目录：

```bash
npx --yes github:simba1949/handoff-skill
```

安装器默认写入：

```text
~/.claude/skills/handoff/
```

可选参数：

```bash
# 覆盖已有安装
npx --yes github:simba1949/handoff-skill -- --force

# 安装到临时目录或自定义目录
npx --yes github:simba1949/handoff-skill -- --target ./tmp/handoff

# 只查看将复制的文件，不写入磁盘
npx --yes github:simba1949/handoff-skill -- --dry-run
```

注意：`--` 用于分隔 npx 参数和安装器参数。安装器只复制插件发布文件（含 SKILL.md），不复制 `.git/`、`.claude/`、`HANDOFF.md`、`.handoff/` 或 `node_modules/`。

安装完成后重启 Claude Code。插件由 `.claude-plugin/plugin.json` 注册：其 `name: handoff` + 根级 `commands/` 目录把命令注册为 `/handoff:write` 等冒号命名空间命令。

### 跨 harness 安装（npx skills）

handoff 符合 [Agent Skills Specification](https://agentskills.io)。根级 `SKILL.md`（frontmatter `name` + `description`）可被 `npx skills`（[vercel-labs/skills](https://github.com/vercel-labs/skills)）发现，一次安装到多个 agent harness：

```bash
npx skills add simba1949/handoff-skill -g -a claude-code codex opencode zed kiro-cli reasonix pi grok gemini-cli
```

- `-g`：安装到用户级 skills 目录。
- `-a`：指定目标 agent（支持 70+ agents，详见 `npx skills add --help`）。

`npx skills add` 会复制 SKILL.md 所在整个目录（含 `.claude-plugin/`、`commands/`）到各 harness 的 skills 目录，因此：

- **Claude Code**：加载插件命令 `/handoff:*`，用命令驱动工作流。
- **其他 harness**（codex / opencode / zed / kiro / reasonix / pi / grok / gemini-cli 等）：读取根级 `SKILL.md`，用自然语言工作流驱动（write / read / update / archive），不依赖任何 `/` 命令。

### 手动安装

也可以将仓库内容复制到 `~/.claude/skills/handoff/`，然后运行：

```bash
claude plugin validate ~/.claude/skills/handoff
```

不要把插件命令放在项目根 `.claude/commands/`：该目录会额外注册出无命名空间的 `/write`、`/read` 等项目级命令。

## 文档

- **[BEST-PRACTICES.md](docs/BEST-PRACTICES.md)**：最佳实践、典型工作流、高级技巧、反模式
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**：常见问题排查和解决方案
- **[NPM-INSTALL.md](docs/NPM-INSTALL.md)**：npx 安装、选项和验证
- **[OPTIMIZATION-SUMMARY.md](docs/OPTIMIZATION-SUMMARY.md)**：本次优化总结（基于 13 轮设计拷问）

## License

MIT
