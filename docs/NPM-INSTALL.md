# npx 安装

## 安装到 Claude Code

```bash
npx --yes github:simba1949/handoff-skill
```

默认安装到：

```text
~/.claude/skills/handoff/
```

安装完成后重启 Claude Code，使用：

```text
/handoff:write
/handoff:read
/handoff:update
/handoff:archive
/handoff:help
```

## 跨 harness 安装

handoff 同时符合 [Agent Skills Specification](https://agentskills.io)。根级 `SKILL.md`（frontmatter `name` + `description`）可被 `npx skills`（[vercel-labs/skills](https://github.com/vercel-labs/skills)）发现，一次安装到多个 agent harness：

```bash
npx skills add simba1949/handoff-skill -g -a claude-code codex opencode zed kiro-cli reasonix pi grok gemini-cli
```

- `-g`：安装到用户级 skills 目录。
- `-a`：指定目标 agent（详见 `npx skills add --help`；支持 70+ agents）。

`npx skills add` 会复制 SKILL.md 所在整个目录（含 `.claude-plugin/`、`commands/`）到各 harness 的 skills 目录，因此：

- Claude Code：加载插件命令 `/handoff:*`。
- 其他 harness（codex / opencode / zed / kiro / reasonix / pi / grok / gemini-cli 等）：读取根级 SKILL.md，用自然语言工作流驱动（write / read / update / archive）。

## 选项（本仓库安装器）

```bash
npx --yes github:simba1949/handoff-skill -- --help
npx --yes github:simba1949/handoff-skill -- --force
npx --yes github:simba1949/handoff-skill -- --target ./tmp/handoff
npx --yes github:simba1949/handoff-skill -- --dry-run
```

- `--force`：替换已存在的插件安装目录；默认不会覆盖。
- `--target <dir>`：安装到自定义目录，适合测试；不会自动让该目录成为 Claude Code 的全局插件。
- `--dry-run`：显示将复制的文件，不写入磁盘。
- `--help`：显示帮助。

安装器只复制插件发布文件（含 SKILL.md），不复制 `.git/`、`.claude/`、`HANDOFF.md`、`.handoff/`、`node_modules/` 或 npm lock 文件。

## 验证

在仓库根目录检查 npm 包内容：

```bash
npm pack --dry-run
```

检查安装目录：

```bash
claude plugin validate "$HOME/.claude/skills/handoff"
claude plugin list
```

应看到：

```text
handoff@skills-dir
Status: ✔ loaded
```

`--target` 适合验证包结构和插件 manifest；正式使用应省略它，让安装器写入默认的 `~/.claude/skills/handoff/`。
