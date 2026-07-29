# Vijnana Plugins

Vijnana 官方插件仓。插件是可版本化、可审查的能力包，可组合 Skill、stdio MCP，
并为未来的 App、Hook、Agent 与 Command 保留同一包边界。

## 仓库结构

```text
.agents/plugins/marketplace.json
plugins/<plugin-id>/
  .codex-plugin/plugin.json
  skills/<skill-id>/SKILL.md
  .mcp.json
  scripts/
```

`marketplace.json` 是有序目录；每个插件的 `source.path` 必须指向
`./plugins/<plugin-id>`。插件 ID 使用小写 kebab-case，版本使用严格 SemVer。

## 当前运行策略

- V1 可执行能力：Skill、无需凭据的本地 stdio MCP。
- MCP 必须把运行文件随插件提交；禁止 `npx`、`uvx`、`bunx`、`pnpm dlx`
  等运行期下载。
- App、Hook、Agent、Command 可以进入清单，但 V1 会明确显示为不可选择，
  不会静默忽略。
- 禁止符号链接、Git LFS 指针、子模块、远程下载器和凭据占位符。
- 已开始的工作流固定 Git commit 与 package hash；更新插件必须提升版本并提交新 commit。

## 发布流程

1. 在 `plugins/<plugin-id>` 修改或新增插件。
2. 同步更新 `.agents/plugins/marketplace.json`。
3. 校验 JSON、Skill frontmatter、stdio MCP 与文件权限。
4. 通过评审后合并到 `main`。服务端每五分钟检查一次，有更新才发布新快照。

仓库内的三个初始插件同时作为最小参考实现：纯 Skill、另一个纯 Skill，以及
Skill + 无依赖 stdio MCP。
