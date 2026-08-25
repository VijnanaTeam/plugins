---
name: kingdee-k3cloud
description: 通过已授权的金蝶云星空 K3Cloud WebAPI 查询、查看和处理表单数据。用户要求查物料、客户、供应商、采购、销售、库存、财务单据，或保存、提交、审核、反审核、删除、分配、下推等金蝶操作时使用。
---

# 金蝶云星空 K3Cloud

平台已经按当前用户注入连接和权限。不要索要、输出或保存金蝶账号密码，也不要自行调用登录接口。

## 标准流程

1. 不确定 `FormId` 或字段标识时，先调用 `kingdee_get_form_metadata`。
2. 列表检索使用 `kingdee_query`，显式填写 `startRow` 和 `limit`；`limit` 最大 2000。结果为 `{ fieldKeys, rows }`，每行列顺序与 `fieldKeys` 一致。
3. 已知单据内码或编号时使用 `kingdee_view`，`id` 和 `number` 二选一。
4. 用户要求修改数据时使用 `kingdee_write`。控制面会强制检查当前连接是否具有“读写”权限，金蝶服务端还会继续检查账号自身业务权限。

如果要在指定组织下操作，把组织编码放在 `organizationNumber`；平台会在同一次会话中切换组织并立即执行业务请求。

## 写操作

`kingdee_write` 的 `data` 直接传 JSON 对象，不要先转成 JSON 字符串。

- `save`、`batch_save`、`draft`、`submit`、`audit`、`unaudit`、`delete`、`allocate`、`push`、`group_save`、`flex_save`：传 `formId + data`。
- `execute_operation`：另外传 `operationNumber`。
- `send_message`、`workflow_audit`：不传 `formId`，表单或消息信息放在 `data` 中。

完整参数提示见 [V5 WebAPI 参考](references/v5-webapi.md)。

## 错误处理

- “只读权限”：提示用户到「插件中心 → 金蝶云星空」切换为读写权限。
- “未连接/重新授权”：提示用户回插件中心填写服务器、账套 ID、用户名和密码。
- 字段、表单或业务校验失败：原样说明金蝶返回的业务原因，不猜字段、不换接口绕过。
- 写操作只发送一次。若金蝶报告会话丢失，平台会清理会话并明确失败，不会自动重放；请先确认业务结果，再决定是否由用户重试。
- 元数据、查询和查看遇到明确会话丢失时，平台最多重新登录并重试一次。
