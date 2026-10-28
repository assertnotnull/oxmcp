# Oxmcp

MCP tools that expose what the local Oxmgr daemon knows about supervised workloads, so coding agents can reason about dev/runtime health without shelling out themselves.

## Language

**Oxmgr**:
The local process manager (daemon) that registers, supervises, and health-checks workloads on one machine.
_Avoid_: PM2 (when referring to this project's integration target), process manager (generic)

**Managed process**:
A named workload Oxmgr supervises (command, env, restart policy, health probe, runtime metrics).
_Avoid_: Service (overloaded with HTTP/MCP microservices), app (oxfile section name only)

**Runtime status**:
Oxmgr's high-level lifecycle state for a managed process (for example `running`, `stopped`).
_Avoid_: Status alone (ambiguous with health)

**Health status**:
The outcome of the configured `health_cmd` probe (`healthy`, unhealthy states, failure counts).
_Avoid_: Health alone when you mean the probe result field

**Oxfile**:
Declarative manifest Oxmgr imports or applies to register managed processes.
_Avoid_: Config file, ecosystem file

**Fixture stack**:
The Hono apps under `test/service/` plus `test/oxfile.toml`, used only to exercise Oxmgr health checks—not part of the MCP product surface.
_Avoid_: Example project, demo services

**Process summary**:
The curated, agent-facing view of a managed process (subset of Oxmgr's JSON), with optional full raw payload on request.
_Avoid_: DTO, status object

**Process filter**:
Optional exact `name` and/or numeric `id` when listing managed processes; filters combine with **AND** when both are set. No match yields an empty list, not an error.
_Avoid_: Query, search, fuzzy match

**Oxmcp**:
The read-only MCP server that queries the local Oxmgr daemon on behalf of coding agents (same machine only in v1).
_Avoid_: MCP service, status server
