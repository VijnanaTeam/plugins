#!/usr/bin/env node
import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';

const root = realpathSync(process.cwd());
const ignored = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);
const MAX_FILES = 2000;
const MAX_DEPTH = 6;

function overview() {
  const extensions = new Map();
  const topLevel = [];
  let files = 0;
  let directories = 0;
  let bytes = 0;
  let truncated = false;

  const walk = (directory, depth) => {
    if (depth > MAX_DEPTH || truncated) return;
    const entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)));
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const candidate = resolve(directory, entry.name);
      const stat = lstatSync(candidate);
      if (stat.isSymbolicLink()) continue;
      const actual = realpathSync(candidate);
      if (actual !== root && !actual.startsWith(root + sep)) continue;
      if (depth === 0) topLevel.push({ name: entry.name, type: stat.isDirectory() ? 'directory' : 'file' });
      if (stat.isDirectory()) {
        directories += 1;
        walk(actual, depth + 1);
        continue;
      }
      if (!stat.isFile()) continue;
      files += 1;
      bytes += stat.size;
      const path = relative(root, actual);
      const base = basename(path);
      const dot = base.lastIndexOf('.');
      const extension = dot > 0 ? base.slice(dot).toLowerCase() : '(none)';
      extensions.set(extension, (extensions.get(extension) || 0) + 1);
      if (files >= MAX_FILES) {
        truncated = true;
        return;
      }
    }
  };

  walk(root, 0);
  return {
    root,
    topLevel,
    files,
    directories,
    bytes,
    truncated,
    extensions: Object.fromEntries([...extensions.entries()].sort((left, right) => right[1] - left[1])),
  };
}

const tools = [{
  name: 'workspace_overview',
  description: 'Return a bounded, read-only inventory of the current workspace: top-level entries, counts, bytes, and file extensions. Symlinks and dependency/build directories are excluded.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
}];

const respond = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
const fail = (id, code, message) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
const text = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });

createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', (line) => {
  let request;
  try { request = JSON.parse(line); } catch { return; }
  if (!request || request.jsonrpc !== '2.0' || request.id === undefined) return;
  try {
    if (request.method === 'initialize') {
      respond(request.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'workspace-inspector', version: '1.0.0' },
      });
    } else if (request.method === 'ping') {
      respond(request.id, {});
    } else if (request.method === 'tools/list') {
      respond(request.id, { tools });
    } else if (request.method === 'tools/call' && request.params?.name === 'workspace_overview') {
      respond(request.id, text(overview()));
    } else if (request.method === 'tools/call') {
      respond(request.id, { content: [{ type: 'text', text: 'unknown tool' }], isError: true });
    } else {
      fail(request.id, -32601, 'method not found');
    }
  } catch (error) {
    fail(request.id, -32603, error instanceof Error ? error.message : String(error));
  }
});
