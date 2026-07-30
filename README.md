# Vijnana Agent Plugins

Vijnana 官方 Agent Plugins 1.0 仓库。插件面向普通用户，可组合 Agent Skill 与
远程或本地 MCP；平台按固定 Git commit 发布不可变快照。

## 结构

```text
.vijnana/marketplace.json
plugins/<plugin-name>/
  plugin.json
  ai.vijna/icon.png
  skills/<skill-name>/SKILL.md
  mcp.json
```

`plugin.json`、`skills/` 和 `mcp.json` 遵循 Agent Plugins 1.0 的固定根结构。
`.vijnana/marketplace.json` 只承载 Vijnana 的展示顺序、运行目标和发布状态，不重复
插件能力或图标定义。每个包通过 `plugin.json` 的 `extensions["ai.vijna"]` 声明
Vijnana 界面图标，文件固定为 256×256 PNG `./ai.vijna/icon.png`。

## 当前目录

- 可用：Word、PDF、Excel、PowerPoint。
- 计划接入：Notion（OAuth + 远程 MCP）、Figma、Canva、Google Drive。
- 隐藏兼容：旧版本已绑定的插件保留运行能力，但不会出现在新选择目录中。

## 发布约束

- 禁止提交密钥、OAuth token、符号链接、Git 子模块和 Git LFS 指针。
- 远程 MCP URL 必须经过平台精确白名单审核；插件清单不能携带认证 header。
- Skill 必须具备有效的 `name` 与触发说明，并对能力缺失明确报错。
- 每个插件必须包含符合 Vijnana 扩展规范的 256×256 PNG 图标。
- 更新经评审合并后，Vijnana 服务每五分钟检测一次；只有 commit 变化才发布新快照。
