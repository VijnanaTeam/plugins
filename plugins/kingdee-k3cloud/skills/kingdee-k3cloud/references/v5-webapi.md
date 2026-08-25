# 金蝶云星空 WebAPI V5 参数参考

## 查询与查看

查询 `BD_MATERIAL` 的示例：

```json
{
  "formId": "BD_MATERIAL",
  "fieldKeys": ["FMaterialId", "FNumber", "FName"],
  "filterString": "FDocumentStatus='C'",
  "orderString": "FMaterialId ASC",
  "startRow": 0,
  "limit": 100
}
```

查看时传 `formId`，再在 `id` 或 `number` 中选择一个。创建组织上下文需要时传 `createOrgId`。

## 常用写操作 data

- `submit` / `audit` / `unaudit` / `delete`

```json
{ "CreateOrgId": 0, "Numbers": ["PRE002", "PRE006"] }
```

- `allocate`

```json
{ "PkIds": "1001,1002", "TOrgIds": "2001,2002", "IsAutoSubmitAndAudit": false }
```

- `push`

```json
{
  "Ids": "1001,1002",
  "EntryIds": "",
  "RuleId": "",
  "TargetBillTypeId": "",
  "TargetOrgId": 0,
  "TargetFormId": "",
  "IsEnableDefaultRule": false,
  "CustomParams": {}
}
```

- `execute_operation`

传 `formId`、`operationNumber` 以及包含 `Parameters`、`Numbers`、`Ids` 或 `Model` 的 `data`。

- `workflow_audit`

```json
{
  "FormId": "PUR_PurchaseOrder",
  "Numbers": ["PRE002"],
  "UserId": 135880,
  "ApprovalType": 1,
  "PostId": 12680
}
```

审批类型：`1` 通过、`2` 驳回、`3` 终止。具体表单必填字段和操作编码由金蝶业务配置决定，应先读元数据或让用户提供，不要猜测。
