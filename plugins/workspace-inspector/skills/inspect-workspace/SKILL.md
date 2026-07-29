---
name: inspect-workspace
description: Orient in an unfamiliar code workspace by inventorying its structure, entry points, conventions, and verification commands before editing.
---

# Inspect Workspace

Before changing code:

1. Read the repository instructions and memory/index files.
2. Use `workspace_overview` for a bounded, read-only inventory when the repository shape is unclear.
3. Identify package boundaries, runtime entry points, data models, and the closest existing pattern.
4. Read all directly related implementations and tests.
5. State the proposed change, failure behavior, and verification plan before editing.

The overview is evidence for navigation, not a substitute for reading the relevant source.
