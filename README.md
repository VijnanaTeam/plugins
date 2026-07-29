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
- MCP 必须把入口文件随插件提交。`command` 只允许 `node`/`python` 加
  `${PLUGIN_ROOT}` 内入口，或直接执行 `${PLUGIN_ROOT}` 内的可执行文件；
  包管理器、Shell 内联命令和解释器内联代码不属于 V1 契约。
- App、Hook、Agent、Command 可以进入清单，但 V1 会明确显示为不可选择，
  不会静默忽略。
- 禁止符号链接、Git LFS 指针、子模块和凭据占位符。
- 已开始的工作流固定 Git commit 与 package hash；更新插件必须提升版本并提交新 commit。

## 信任与安全边界

插件是经过本仓评审的受信任可执行代码，不是安全沙箱。Skill 与 MCP 运行时拥有其宿主
助理或工作流已有的文件和网络权限；需要访问第三方 API 的 MCP 可以联网。`packageHash`
只证明本地插件包的文件、内容和执行位与固定 Git commit 一致，不覆盖第三方 API 响应，
也不能证明插件代码不会联网。

因此，任何下载并执行远端代码、动态安装依赖或把远端内容当作程序加载的改动都必须在
评审中拒绝；普通 API 数据访问必须在插件说明中披露。不要把未经信任的 fork 接入生产
插件源。

## 发布流程

1. 在 `plugins/<plugin-id>` 修改或新增插件。
2. 同步更新 `.agents/plugins/marketplace.json`。
3. 校验 JSON、Skill frontmatter、stdio MCP 与文件权限。
4. 通过评审后合并到 `main`。服务端每五分钟检查一次，有更新才发布新快照。

仓库内的三个初始插件同时作为最小参考实现：纯 Skill、另一个纯 Skill，以及
Skill + 无依赖 stdio MCP。
