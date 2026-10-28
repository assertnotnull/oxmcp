# oxmcp

**Oxmcp** is a read-only [MCP](https://modelcontextprotocol.io) server that exposes what your local **Oxmgr** daemon knows about **managed processes**—runtime status, health probes, CPU/RAM, restarts—so coding agents can inspect dev stacks without shelling out. Domain vocabulary: [`GLOSSARY.md`](./GLOSSARY.md).

**Specs and agent-ready work** live as [GitHub issues](https://github.com/assertnotnull/oxmcp/issues) (label `ready-for-agent`). Agent/tooling conventions: [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md).

## Oxmgr

[Oxmgr](https://github.com/Vladimir-Urik/OxMgr) is a lightweight, cross-platform process manager (Rust). It runs a long-lived **daemon** on your machine that starts and stops workloads, applies restart policy, tails logs, collects metrics, and runs **health checks** (`health_cmd` probes with failure limits).

Typical workflows:

```bash
oxmgr start "bun server.ts" --name api --restart always
oxmgr apply ./oxfile.toml          # declarative, idempotent (native oxfile format)
oxmgr list                         # human table
oxmgr list --json                  # machine-readable (what oxmcp uses)
oxmgr logs api -f
oxmgr ui
oxmgr doctor                       # daemon reachability and environment checks
```

Configure processes in an **oxfile** (`oxfile.toml`) or import PM2 ecosystem files; see [Oxmgr docs](https://github.com/Vladimir-Urik/OxMgr/tree/master/docs) and [oxfile reference](https://github.com/Vladimir-Urik/OxMgr/blob/master/docs/OXFILE.md).

### How oxmcp fits

| Layer | Role |
| --- | --- |
| **Oxmgr daemon** | Source of truth for supervised processes on this host |
| **`oxmgr list --json`** | Stable JSON snapshot Oxmgr already exposes for scripting |
| **oxmcp (this repo)** | MCP tool `list_managed_processes`—curated summaries for agents, optional raw Oxmgr records |

Oxmcp does **not** start, stop, or reload processes; it only **reads** local daemon state. The MCP server must run on the **same machine** as Oxmgr.

Install Oxmgr via [npm](https://www.npmjs.com/package/oxmgr), [Homebrew](https://github.com/Vladimir-Urik/OxMgr#install), APT, Scoop, or [from source](https://github.com/Vladimir-Urik/OxMgr#build-from-source). Override the CLI binary with `OXMGR_BIN` (default: `oxmgr` on `PATH`).

**Sanity check** before wiring MCP:

```bash
oxmgr doctor
oxmgr list --json
```

## Install oxmcp

Requires [Bun](https://bun.com) and a working Oxmgr daemon (see above).

```bash
git clone git@github.com:assertnotnull/oxmcp.git
cd oxmcp
bun install
```

## MCP setup

**Oxmcp** speaks MCP over **stdio**. Spawn it from the **repository root** so `bun index.ts` resolves correctly.

### OMP (oh-my-pi)

This repo ships [`.omp/mcp.json`](./.omp/mcp.json). Enable **oxmcp** in your OMP agent config, or merge the `mcpServers.oxmcp` entry into your user/project MCP config. Open the project at the `oxmcp` root (or set `cwd` to that path when spawning).

### Cursor

This repo ships [`.cursor/mcp.json`](./.cursor/mcp.json) with `"cwd": "${workspaceFolder}"`. **Open the clone at the repository root** (the folder that contains `index.ts`), then reload MCP in Cursor.

To add manually elsewhere:

```json
{
  "mcpServers": {
    "oxmcp": {
      "command": "bun",
      "args": ["index.ts"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Verify

```bash
bun run validate
```

You should see `list_managed_processes` in the inspector output. Smoke-test a tool call:

```bash
bunx @modelcontextprotocol/inspector --cli bun index.ts --protocol-era modern --method tools/call --tool-name list_managed_processes
```

## Local fixture stack (optional)

To exercise Oxmgr health checks while developing oxmcp, this repo includes a small **fixture stack**: Hono apps under [`test/service/`](./test/service/) plus [`test/oxfile.toml`](./test/oxfile.toml) (`service-A` / `service-B` on ports 3001 and 3002). Apply with Oxmgr from the repo root:

```bash
oxmgr apply test/oxfile.toml
oxmgr list --json
```

## Development

Run the server in the foreground (stdio; normally the agent spawns it):

```bash
bun run index.ts
```

Type check and test:

```bash
bun check
bun test
```

Format: `bun fmt`.
