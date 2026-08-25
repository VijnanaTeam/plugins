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

## 写操作 data 外层结构

以下是 V5 协议外层，`Model` 内的业务字段必须按目标表单元数据和金蝶业务配置填写。

- `save` / `draft`：单张表单数据。

```json
{
  "NeedUpDateFields": [],
  "Model": { "FID": "0", "FNumber": "..." }
}
```

更新已有单据时按需填写 `NeedUpDateFields`，表体更新还必须带明细主键。`Creator`、`IsDeleteEntry`、`NeedReturnFields`、`IsVerifyBaseDataField`、`IsEntryBatchFill`、`InterationFlags`、`IgnoreInterationFlag`、`IsAutoSubmitAndAudit` 都是可选控制参数，不确定时不要猜值。

- `batch_save`：`Model` 是多张表单数据；`BatchCount` 可选，用于分批执行。

```json
{
  "NeedUpDateFields": [],
  "BatchCount": "2",
  "Model": [
    { "FID": "0", "FNumber": "..." },
    { "FID": "0", "FNumber": "..." }
  ]
}
```

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

- `group_save`

```json
{
  "GroupFieldKey": "",
  "FParentId": 0,
  "FNumber": "GROUP001",
  "FName": "分组名称",
  "FDescription": ""
}
```

- `flex_save`：`Model` 是弹性域维度数据集合，`FF...` 字段由目标表单决定。

```json
{
  "Model": [
    { "FF100001": { "FNumber": "A" }, "FF100002": 22 }
  ]
}
```

- `send_message`：不传 `formId`。

```json
{
  "Model": [
    {
      "FTitle": "消息标题",
      "FContent": "消息内容",
      "FReceivers": "110",
      "FType": "0"
    }
  ]
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
