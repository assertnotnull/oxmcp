import { describe, expect, test } from "bun:test";
import { printMcpConfig, runCli } from "./cli.ts";
import { OXMCP_VERSION } from "./version.ts";

describe("runCli", () => {
  test("empty args starts MCP server", () => {
    expect(runCli([])).toEqual({ kind: "serve" });
  });

  test("--version prints semver", () => {
    const outcome = runCli(["--version"]);
    expect(outcome).toEqual({ kind: "exit", code: 0 });
  });

  test("print-mcp-config emits MCP JSON", () => {
    const text = printMcpConfig("/home/user/.local/bin/oxmcp");
    const parsed = JSON.parse(text) as {
      mcpServers: { oxmcp: { command: string; args: string[] } };
    };
    expect(parsed.mcpServers.oxmcp.command).toBe(
      "/home/user/.local/bin/oxmcp",
    );
    expect(parsed.mcpServers.oxmcp.args).toEqual([]);
  });

  test("unknown command exits non-zero", () => {
    expect(runCli(["nope"])).toEqual({ kind: "exit", code: 1 });
  });

  test("version matches package constant", () => {
    expect(OXMCP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
