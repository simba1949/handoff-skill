# Handoff Skill 故障排查

本文档整理 handoff-skill 使用过程中的常见问题和解决方案。

## 数据丢失问题

### 问题 1: update 追加的内容在 write 后消失

**现象**：
```
会话中 → /handoff:update 追加了 3 条决策
会话中 → /handoff:write
结果 → 3 条决策全部消失
```

**原因**：违背"互不越界原则"。write 是全量重新生成，会覆盖所有内容。AI 通过扫描项目推导内容，但无法推导出"为什么选 X 不选 Y"的决策理由。

**解决**：
1. 数据已丢失，无法恢复（除非之前有归档）
2. 教训：会话中途禁止 write，忍到会话结束再用

**预防**：
- 养成肌肉记忆：边界用 write，中途用 update
- 可在 HANDOFF.md 顶部加注释提醒

### 问题 2: load 归档时覆盖了正在推进的任务

**现象**：
```
当前 HANDOFF.md 有正在推进的 v2 任务
→ /handoff:archive load v1归档（误操作）
→ 直接确认覆盖
结果 → v2 任务内容全丢
```

**原因**：load 操作会提示覆盖，但用户未注意就确认了。

**解决**：
1. 若 v2 任务未归档，数据已丢失
2. 若之前有 git 提交，可从 git 历史恢复 HANDOFF.md

**预防**：
- load 前先检查当前 HANDOFF.md 是否有未归档内容
- 看到覆盖提示时，仔细确认是否要覆盖
- 养成习惯：推进中的任务先 archive，再 load 旧归档

### 问题 3: 会话结束忘记 write，下次 read 看到旧状态

**现象**：
```
Day 1 → /handoff:write → 开发 → 下班忘记 write
Day 2 → /handoff:read
结果 → 看到的是 Day 1 开始时的状态，进度严重落后
```

**原因**：read 依赖最新的 write 快照。若会话结束未 write，下次 read 看到的是上次 write 时的旧状态。

**解决**：
1. 立刻执行 `/handoff:write` 刷新到最新状态
2. 若 Day 1 的变更已忘记，可查看 git log 补充

**预防**：
- 养成习惯：会话结束前最后一条命令必是 `/handoff:write`
- 可设置编辑器提醒（如离开时弹出提示）

## 归档问题

### 问题 4: 归档后发现内容遗漏

**现象**：
```
→ /handoff:archive
→ 归档后发现"决策记录"少了 2 条重要决策
→ 想补充，但归档已冻结
```

**原因**：归档前未检查内容完整性。

**解决**：
1. 归档文件已冻结，无法修改
2. 补救方案 A：load 归档到 HANDOFF.md → update 补充遗漏内容 → 重新 archive（生成新归档）
3. 补救方案 B：手动编辑归档文件补充（违背"冻结原则"，不推荐）

**预防**：
- 归档前先 `/handoff:read` 或打开 HANDOFF.md 检查 4 节内容
- 确认完整后再 archive

### 问题 5: 归档文件命名冲突

**现象**：
```
同一分钟内归档两次
→ /handoff:archive → 生成 HANDOFF-2026-08-05-1430.md
→ /handoff:archive → 尝试生成 HANDOFF-2026-08-05-1430.md（冲突）
```

**原因**：时间戳精度到分钟，同一分钟内多次归档会冲突。

**解决**：
- 规范行为自动处理：追加后缀如 `-2`、`-3`（已在 archive 命令规范中定义）
- 生成 `HANDOFF-2026-08-05-1430-2.md` 这样的带后缀文件名，避免覆盖同分钟前的归档

**预防**：
- 归档前确认本次归档的必要性
- 避免重复归档（如测试时连续执行多次 archive）

## 理解问题

### 问题 6: 不理解"互不越界"的原因

**困惑**：为什么不能在会话中途用 write？write 也能刷新文档啊。

**解释**：
- write 是**全量重新生成**，会丢失本会话中 update 追加的决策/踩坑
- 示例：
  ```
  会话中 → /handoff:update "决策：选 React Query，原因：XX"
  会话中 → /handoff:write
  结果 → "选 React Query" 决策消失（AI 扫描代码看到用了 React Query，但推导不出"为什么选它"的理由）
  ```


### 问题 7: 不理解"默认归档"和"full 归档"的区别

**困惑**：什么时候用默认，什么时候用 full？

**解释**：

| 模式 | 归档内容 | 适用场景 |
|---|---|---|
| 默认 | 仅"决策记录"+"踩坑记录" | 日常归档，保留长期价值内容 |
| full | 全部 4 节 | 重大里程碑、项目完成、需要完整快照 |

**推荐**：
- 95% 场景用默认（节省空间，聚焦价值内容）
- 只有项目完成/重大变更时用 full

**示例**：
```
日常里程碑（完成用户认证模块）→ /handoff:archive
日常里程碑（完成报表模块）→ /handoff:archive
项目最终完成 → /handoff:archive full（保留完整历史）
```

## 工具冲突问题

### 问题 8: 同时用 planning-with-files，信息重复记录很烦

**现象**：
- planning-with-files 的 findings.md 要记决策
- handoff 的 HANDOFF.md 决策记录也要记决策
- 感觉在做重复劳动

**解释**：
- 这是设计取舍（拷问 11-12 的结论）：handoff 选择 standalone，故意不与其他框架集成
- **不可替代价值**：handoff 的"踩坑记录"是 planning-with-files 没有的
- 其余能力（决策记录、任务进度）确实重叠

**应对策略**：
- 策略 A：只用一个框架（要么 planning-with-files，要么 handoff）
- 策略 B：分工记录：
  - findings.md：细粒度技术发现（如"发现 API X 有性能问题"）
  - HANDOFF.md 决策记录：高层次决策（如"选用 X 技术栈而非 Y"）
  - HANDOFF.md 踩坑记录：工程踩坑（planning-with-files 不覆盖）


### 问题 9: lineage 链看不懂

**困惑**：归档的"派生自"列显示文件名，但不知道派生关系怎么形成的。

**解释**：

Lineage 形成过程：
```
1. 任务 v1 完成 → /handoff:archive
   → 生成 v1-archive.md（派生自：-）← root 归档

2. 需求变更，做 v2
   → /handoff:archive load v1-archive.md
   → HANDOFF.md 头部自动标注"派生自：v1-archive.md"
   → 推进 v2...
   → /handoff:archive
   → 生成 v2-archive.md（派生自：v1-archive.md）

3. 继续做 v3
   → /handoff:archive load v2-archive.md
   → HANDOFF.md 头部自动标注"派生自：v2-archive.md"
   → 推进 v3...
   → /handoff:archive
   → 生成 v3-archive.md（派生自：v2-archive.md）
```

**结果**：
- v1 → v2 → v3 的派生链在 `.handoff/index.md` 可视化
- 每个归档只记录直接父归档，不会递归显示完整链

## 命令误用问题

### 问题 10: 执行 update 时不指定章节

**现象**：
```
/handoff:update 我想记录一个决策
结果 → AI 不知道要更新哪个章节
```

**原因**：update 命令需要明确章节，或用自然语言让 AI 解析。

**解决**：
- 方式 1（明确章节）：`/handoff:update decisions <内容>`
- 方式 2（自然语言）：`/handoff:update 我想追加一条决策：选用 X 而非 Y，原因...`（AI 会解析出目标章节）

### 问题 11: 想删除某条决策/踩坑记录

**困惑**：update 只能追加，怎么删除错误的记录？

**解决**：
- update 设计上不支持删除（避免历史被篡改）
- 若确需删除：
  1. 手动编辑 HANDOFF.md 删除对应行
  2. 或者在该记录后追加一条："【更正】上述决策 X 已废弃，改用 Y"


## 性能问题

### 问题 12: write 扫描项目很慢

**现象**：
```
/handoff:write
→ 执行很久（30 秒 - 1 分钟）
```

**原因**：write 会扫描 git log、git status、代码文件（寻找 TODO/FIXME）、测试结果等，大项目会慢。

**优化**：
- 确保 .gitignore 排除了 node_modules、dist 等大目录
- 若项目 git 历史很长，write 可能扫描大量 commit，这是正常代价
- 考虑在 SSD 上运行项目（相比 HDD 快很多）

**权衡**：
- write 慢但全面，这是设计取舍
- update 快但不扫描，这是边界分工

## 集成问题

### 问题 13: 命令不生效（harness 不识别）

**现象**：
```
输入 /handoff:write
→ 提示"未知命令"
```

**可能原因**：
1. 插件未安装到 Claude Code skills 目录
2. 命令文件 frontmatter 无法解析
3. harness 未重启或插件尚未重新加载
4. 当前 harness 不支持插件命名空间

**排查步骤**：
1. 确认插件目录为 `~/.claude/skills/handoff/`，并包含 `.claude-plugin/plugin.json` 与根级 `commands/`
2. 运行 `claude plugin validate <插件目录>`，修复 manifest/frontmatter 错误
3. 运行 `claude plugin list`，确认 `handoff@skills-dir` 状态为 `loaded`
4. 重启 harness（Claude Code / Kiro IDE）
5. 确认当前项目根没有复制本插件的 `.claude/commands/`；否则会出现额外的无命名空间命令

### 问题 14: AI 执行 write 但生成内容很简陋

**现象**：
```
/handoff:write
→ 生成的 HANDOFF.md 只有几行，"决策记录"和"踩坑记录"都是空的
```

**原因**：
- 项目太新（git 历史很少，代码量很小），AI 推导不出足够信息
- 或者项目缺少注释、TODO，AI 无法推断进度和卡点

**解决**：
- 这是正常现象：write 第一次生成的内容本就是骨架，靠后续 update 逐步丰富
- 会话中做决策/踩坑时，立刻 `/handoff:update` 追加记录
- 会话结束 `/handoff:write` 刷新全局状态

**教训**：
- write 不是万能的，它只能从代码推导，无法读心
- "决策记录"和"踩坑记录"需要人工 update 追加（AI 无法推导决策理由和踩坑细节）

## 总结

handoff-skill 的大部分问题根源于**误用互不越界原则**。记住：
1. **边界用 write，中途用 update**（铁律）
2. **归档前检查内容完整性**
3. **load 前先保护当前任务**（先 archive）
4. **会话结束必 write**（刷新全局状态）

做到这四点，90% 的问题可以避免。
