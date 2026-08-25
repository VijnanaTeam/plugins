#!/usr/bin/env node
import { createInterface } from 'node:readline';

const apiUrl = process.env.VIJNANA_API_URL;
const credential = process.env.VIJNANA_GATEWAY_CREDENTIAL;
if (!apiUrl) throw new Error('VIJNANA_API_URL 未注入，金蝶插件拒绝启动');
if (!credential) throw new Error('VIJNANA_GATEWAY_CREDENTIAL 未注入，金蝶插件拒绝启动');

const endpoint = `${apiUrl.replace(/\/+$/, '')}/api/internal/connectors/kingdee-k3cloud/call`;
const WRITE_OPERATIONS = [
  'save',
  'batch_save',
  'draft',
  'submit',
  'audit',
  'unaudit',
  'delete',
  'allocate',
  'push',
  'group_save',
  'flex_save',
  'send_message',
  'execute_operation',
  'workflow_audit',
];

const organizationProperty = {
  organizationNumber: {
    type: 'string',
    minLength: 1,
    description: '可选。先在同一会话中切换到该组织编码，再执行本次业务操作。',
  },
};

const tools = [
  {
    name: 'kingdee_get_form_metadata',
    description: '读取金蝶表单的业务元数据和字段定义。使用未知表单或字段前先调用。',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'string', minLength: 1, description: '金蝶业务对象 FormId，例如 BD_MATERIAL。' },
        ...organizationProperty,
      },
      required: ['formId'],
      additionalProperties: false,
    },
    annotations: {
      title: '读取金蝶表单元数据',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'kingdee_query',
    description: '通过 ExecuteBillQuery 分页查询金蝶表单字段，返回字段列表和对应行。limit 必须为 1-2000。',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'string', minLength: 1 },
        fieldKeys: {
          type: 'array',
          minItems: 1,
          maxItems: 256,
          items: { type: 'string', minLength: 1 },
          description: '要返回的字段标识，顺序与结果每一行的列顺序一致。',
        },
        filterString: { type: 'string', description: '可选的金蝶 FilterString。' },
        orderString: { type: 'string', description: '可选的金蝶 OrderString。' },
        startRow: { type: 'integer', minimum: 0 },
        limit: { type: 'integer', minimum: 1, maximum: 2000 },
        ...organizationProperty,
      },
      required: ['formId', 'fieldKeys', 'startRow', 'limit'],
      additionalProperties: false,
    },
    annotations: {
      title: '查询金蝶表单数据',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'kingdee_view',
    description: '按表单内码或单据编号查看一条金蝶单据/基础资料的完整数据。id 与 number 必须二选一。',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'string', minLength: 1 },
        id: {
          anyOf: [
            { type: 'integer', minimum: 0 },
            { type: 'string', minLength: 1 },
          ],
        },
        number: { type: 'string', minLength: 1 },
        createOrgId: { type: 'integer', minimum: 0 },
        ...organizationProperty,
      },
      required: ['formId'],
      oneOf: [
        { required: ['id'], not: { required: ['number'] } },
        { required: ['number'], not: { required: ['id'] } },
      ],
      additionalProperties: false,
    },
    annotations: {
      title: '查看金蝶单据',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'kingdee_write',
    description: '执行固定白名单内的金蝶 V5 写操作。唯识连接必须授权为“读写”，同时仍受金蝶账号自身权限限制。',
    inputSchema: {
      type: 'object',
      properties: {
        writeOperation: { type: 'string', enum: WRITE_OPERATIONS },
        formId: {
          type: 'string',
          minLength: 1,
          description: '除 send_message、workflow_audit 外必填。',
        },
        operationNumber: {
          type: 'string',
          minLength: 1,
          description: '仅 execute_operation 必填，例如 Cancel、Forbid。',
        },
        data: {
          type: 'object',
          description: '对应 V5 接口的 data JSON 对象；不要再手工 JSON.stringify。',
        },
        ...organizationProperty,
      },
      required: ['writeOperation', 'data'],
      additionalProperties: false,
    },
    annotations: {
      title: '执行金蝶写操作',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
];

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  return value;
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${label} 必须是非空字符串`);
  return value.trim();
}

function integer(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || (max !== undefined && value > max)) {
    throw new Error(`${label} 必须是 ${min}-${max === undefined ? '∞' : max} 的整数`);
  }
  return value;
}

function organization(args) {
  return args.organizationNumber === undefined
    ? {}
    : { organizationNumber: requiredString(args.organizationNumber, 'organizationNumber') };
}

function normalizeCall(name, raw) {
  const args = object(raw, 'arguments');
  if (name === 'kingdee_get_form_metadata') {
    return {
      operation: 'get_form_metadata',
      formId: requiredString(args.formId, 'formId'),
      ...organization(args),
    };
  }
  if (name === 'kingdee_query') {
    if (!Array.isArray(args.fieldKeys) || args.fieldKeys.length === 0 || args.fieldKeys.length > 256) {
      throw new Error('fieldKeys 必须包含 1-256 个字段');
    }
    return {
      operation: 'query',
      formId: requiredString(args.formId, 'formId'),
      fieldKeys: args.fieldKeys.map((field) => requiredString(field, 'fieldKeys[]')),
      startRow: integer(args.startRow, 'startRow', 0),
      limit: integer(args.limit, 'limit', 1, 2000),
      ...(args.filterString === undefined
        ? {}
        : { filterString: requiredString(args.filterString, 'filterString') }),
      ...(args.orderString === undefined
        ? {}
        : { orderString: requiredString(args.orderString, 'orderString') }),
      ...organization(args),
    };
  }
  if (name === 'kingdee_view') {
    const hasId = args.id !== undefined;
    const hasNumber = args.number !== undefined;
    if (hasId === hasNumber) throw new Error('id 和 number 必须二选一');
    if (hasId && !(typeof args.id === 'string' || Number.isInteger(args.id))) {
      throw new Error('id 必须是字符串或整数');
    }
    return {
      operation: 'view',
      formId: requiredString(args.formId, 'formId'),
      ...(hasId ? { id: args.id } : { number: requiredString(args.number, 'number') }),
      ...(args.createOrgId === undefined ? {} : { createOrgId: integer(args.createOrgId, 'createOrgId', 0) }),
      ...organization(args),
    };
  }
  if (name === 'kingdee_write') {
    const writeOperation = requiredString(args.writeOperation, 'writeOperation');
    if (!WRITE_OPERATIONS.includes(writeOperation)) throw new Error(`不支持的写操作:${writeOperation}`);
    const withoutForm = writeOperation === 'send_message' || writeOperation === 'workflow_audit';
    return {
      operation: 'write',
      writeOperation,
      ...(!withoutForm ? { formId: requiredString(args.formId, 'formId') } : {}),
      ...(writeOperation === 'execute_operation'
        ? { operationNumber: requiredString(args.operationNumber, 'operationNumber') }
        : {}),
      data: object(args.data, 'data'),
      ...organization(args),
    };
  }
  throw new Error(`未知工具:${name}`);
}

function errorMessage(body, status) {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const message = body.message;
    if (typeof message === 'string' && message.length > 0) return message;
    if (Array.isArray(message)) return message.map(String).join('; ');
  }
  return `唯识金蝶代理返回 HTTP ${status}`;
}

async function callControlPlane(payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ credential, ...payload }),
    signal: AbortSignal.timeout(30_000),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('唯识金蝶代理返回了非 JSON 响应');
  }
  if (!response.ok) throw new Error(errorMessage(body, response.status));
  const value = object(body, '唯识金蝶代理响应');
  if (!Object.prototype.hasOwnProperty.call(value, 'result')) throw new Error('唯识金蝶代理响应缺少 result');
  return value.result;
}

const respond = (id, result) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
const fail = (id, code, message) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
const toolResult = (value) => ({
  content: [{ type: 'text', text: JSON.stringify(value) }],
  structuredContent: { result: value },
});
const toolError = (error) => ({
  content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
  isError: true,
});

createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', async (line) => {
  let request;
  try {
    request = JSON.parse(line);
  } catch {
    return;
  }
  if (!request || request.jsonrpc !== '2.0' || request.id === undefined) return;
  try {
    if (request.method === 'initialize') {
      respond(request.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'vijnana-kingdee-k3cloud', version: '1.0.0' },
        instructions: '先用元数据、查询和查看工具确认目标；写操作需要连接页授予读写权限。',
      });
    } else if (request.method === 'ping') {
      respond(request.id, {});
    } else if (request.method === 'tools/list') {
      respond(request.id, { tools });
    } else if (request.method === 'tools/call') {
      const name = request.params?.name;
      if (typeof name !== 'string') {
        respond(request.id, toolError(new Error('tools/call 缺少工具名')));
        return;
      }
      try {
        const result = await callControlPlane(normalizeCall(name, request.params?.arguments));
        respond(request.id, toolResult(result));
      } catch (error) {
        respond(request.id, toolError(error));
      }
    } else {
      fail(request.id, -32601, 'method not found');
    }
  } catch (error) {
    fail(request.id, -32603, error instanceof Error ? error.message : String(error));
  }
});
