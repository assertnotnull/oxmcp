# oxmcp

Read-only MCP tools for local **Oxmgr** **managed process** status. Domain vocabulary: [`GLOSSARY.md`](./GLOSSARY.md).

**Specs and agent-ready work** live as [GitHub issues](https://github.com/assertnotnull/oxmcp/issues) (label `ready-for-agent`). Agent/tooling conventions: [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md).

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To type check:

```bash
bun check
```

Run `bun fmt` to format the code.

This project was created using `bun init` in bun v1.4.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
