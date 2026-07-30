---
name: adversarial-code-review
description: Review a proposed code change for correctness, security, concurrency, compatibility, and missing tests before it ships.
---

# Adversarial Code Review

Use this workflow when a change is believed to be complete and needs an independent release gate.

1. Read the complete diff and every directly affected call site.
2. Reconstruct the data, authorization, concurrency, and failure boundaries.
3. Look for silent fallback behavior, stale snapshots, partial writes, path traversal, secret exposure,
   name collisions, and incompatible migrations.
4. Verify that tests cover the failure cases, not only the happy path.
5. Report findings by severity with file and line evidence. Do not manufacture findings.
6. If no blocking finding remains, state the residual risks and the exact checks performed.
