# oxmcp

Read-only MCP tools for local **Oxmgr** **managed process** status. Domain vocabulary: [`GLOSSARY.md`](./GLOSSARY.md).

**Specs and agent-ready work** live as [GitHub issues](https://github.com/assertnotnull/oxmcp/issues) (label `ready-for-agent`). Agent/tooling conventions: [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md).

## Install

**Oxmgr** must be installed and its daemon running on the **same machine** as the MCP server (`oxmgr list` should work in a terminal).

```bash
git clone git@github.com:assertnotnull/oxmcp.git
cd oxmcp
bun install
```

Optional: override the Oxmgr CLI binary with `OXMGR_BIN` (default: `oxmgr` on `PATH`).

## MCP setup

**oxmcp** speaks MCP over **stdio**. Spawn it from the **repository root** so `bun index.ts` resolves correctly.

### OMP (oh-my-pi)

This repo ships [`.omp/mcp.json`](./.omp/mcp.json). Enable **oxmcp** in your OMP agent config, or merge the `mcpServers.oxmcp` entry into your user/project MCP config. Open the project at the `oxmcp` root (or set `cwd` to that path when spawning).

### Cursor

Add a server under `.cursor/mcp.json` in this repo (or your user MCP settings). Example:

```json
{
  "mcpServers": {
    "oxmcp": {
      "command": "bun",
      "args": ["index.ts"],
      "cwd": "/absolute/path/to/oxmcp"
    }
  }
}
```

Replace `cwd` with your clone path. Reload MCP in Cursor after saving.

### Verify

```bash
bun run validate
```

You should see `list_managed_processes` in the inspector output. Smoke-test a tool call:

```bash
bunx @modelcontextprotocol/inspector --cli bun index.ts --protocol-era modern --method tools/call --tool-name list_managed_processes
```

## Development

To run the server in the foreground (stdio; normally the agent spawns it):

```bash
bun run index.ts
```

To type check:

```bash
bun check
```

To test:

```bash
bun test
```

Run `bun fmt` to format the code.

This project was created using `bun init` in bun v1.4.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
