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
| **oxmcp (this repo)** | MCP tool `list_managed_services`—curated summaries for agents, optional raw Oxmgr records |

Oxmcp does **not** start, stop, or reload processes; it only **reads** local daemon state. The MCP server must run on the **same machine** as Oxmgr.

Install Oxmgr via [npm](https://www.npmjs.com/package/oxmgr), [Homebrew](https://github.com/Vladimir-Urik/OxMgr#install), APT, Scoop, or [from source](https://github.com/Vladimir-Urik/OxMgr#build-from-source). Override the CLI binary with `OXMGR_BIN` (default: `oxmgr` on `PATH`).

**Sanity check** before wiring MCP:

```bash
oxmgr doctor
oxmgr list --json
```

## Install oxmcp

Requires a working **Oxmgr** daemon on the same machine (see above). Pick the path that fits how you work:

| Path | Best for | You get |
| --- | --- | --- |
| **Binary install** | Agents and daily MCP use without a clone | `oxmcp` on `PATH` (~110 MB standalone executable; no Bun at runtime) |
| **Git clone + Bun** | Contributors, fixture stack, hacking on oxmcp | Repo checkout; run via `bun index.ts` |

### Binary install (recommended for MCP users)

Installs a prebuilt release to `~/.local/bin/oxmcp` (override with `OXMCP_INSTALL_DIR`). Verifies **SHA256SUMS** from the GitHub release. Re-run the same command to upgrade.

```bash
curl -fsSL https://raw.githubusercontent.com/assertnotnull/oxmcp/master/scripts/install.sh | bash
```

Pin a version: `OXMCP_VERSION=v0.1.0 curl -fsSL … | bash` (or `OXMCP_VERSION=0.1.0`).

After install, paste MCP config from:

```bash
oxmcp print-mcp-config
```

Example snippet (no `cwd` required):

```json
{
  "mcpServers": {
    "oxmcp": {
      "command": "/home/user/.local/bin/oxmcp",
      "args": []
    }
  }
}
```

**Platforms:** Linux x64, macOS arm64, macOS x64. Windows is not packaged yet.

Binaries are published on [GitHub Releases](https://github.com/assertnotnull/oxmcp/releases) when a maintainer pushes a matching `v*.*.*` tag (semver aligned with `oxmcp --version`).

### Git clone (contributors)

Requires [Bun](https://bun.com).

```bash
git clone git@github.com:assertnotnull/oxmcp.git
cd oxmcp
bun install
```

## MCP setup

**Oxmcp** speaks MCP over **stdio**.

- **Binary install:** point your MCP client at `oxmcp` (or the full path from `oxmcp print-mcp-config`). No repository `cwd` is required.
- **Git clone:** spawn from the **repository root** so `bun index.ts` resolves correctly.

### OMP (oh-my-pi)

This repo ships [`.omp/mcp.json`](./.omp/mcp.json). Enable **oxmcp** in your OMP agent config, or merge the `mcpServers.oxmcp` entry into your user/project MCP config. For a global binary, use `oxmcp print-mcp-config`. For a clone, open the project at the `oxmcp` root (or set `cwd` to that path when spawning).

### Cursor

**With a binary on `PATH`**, add to user MCP settings:

```json
{
  "mcpServers": {
    "oxmcp": {
      "command": "oxmcp",
      "args": []
    }
  }
}
```

**From a git clone**, this repo ships [`.cursor/mcp.json`](./.cursor/mcp.json) with `"cwd": "${workspaceFolder}"`. **Open the clone at the repository root** (the folder that contains `index.ts`), then reload MCP in Cursor.

To add manually from a clone elsewhere:

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

From a clone:

```bash
bun run validate
```

With a installed binary (stdio smoke test):

```bash
oxmcp --version
bunx @modelcontextprotocol/inspector --cli oxmcp --protocol-era modern --method tools/list
```

You should see `list_managed_services` in the inspector output. Smoke-test a tool call:

```bash
bunx @modelcontextprotocol/inspector --cli oxmcp --protocol-era modern --method tools/call --tool-name list_managed_services
```

For clone-based dev, replace `oxmcp` with `bun index.ts` in the inspector commands above.

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

Type check, test, and build a local standalone binary:

```bash
bun check
bun test
bun run build:bin   # writes dist/oxmcp
```

Format: `bun fmt`.
