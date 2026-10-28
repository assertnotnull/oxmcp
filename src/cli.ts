import { OXMCP_VERSION } from "./version.ts";

export type CliOutcome = { kind: "exit"; code: number } | { kind: "serve" };

export function resolveOxmcpCommandPath(): string {
  const execPath = process.execPath;
  const execBase = execPath.split(/[/\\]/).pop() ?? execPath;
  if (execBase === "oxmcp" || execBase === "oxmcp.exe") {
    return execPath;
  }

  const argv0 = process.argv[0] ?? "oxmcp";
  const base = argv0.split(/[/\\]/).pop() ?? argv0;
  if ((base === "oxmcp" || base === "oxmcp.exe") && argv0.includes("/")) {
    return argv0;
  }
  if (base === "bun" || base === "bun.exe") {
    return "oxmcp";
  }
  return "oxmcp";
}

export function printMcpConfig(commandPath = resolveOxmcpCommandPath()): string {
  return JSON.stringify(
    {
      mcpServers: {
        oxmcp: {
          command: commandPath,
          args: [] as string[],
        },
      },
    },
    null,
    2,
  );
}

export function runCli(args: string[]): CliOutcome {
  if (args.length === 0) {
    return { kind: "serve" };
  }

  const [first, ...rest] = args;

  if (first === "--version" || first === "-V") {
    console.log(OXMCP_VERSION);
    return { kind: "exit", code: 0 };
  }

  if (first === "version") {
    if (rest.length > 0) {
      console.error(`unexpected arguments: ${rest.join(" ")}`);
      return { kind: "exit", code: 1 };
    }
    console.log(OXMCP_VERSION);
    return { kind: "exit", code: 0 };
  }

  if (first === "print-mcp-config") {
    if (rest.length > 0) {
      console.error(`unexpected arguments: ${rest.join(" ")}`);
      return { kind: "exit", code: 1 };
    }
    console.log(printMcpConfig());
    return { kind: "exit", code: 0 };
  }

  if (first === "--help" || first === "-h") {
    console.log(`oxmcp ${OXMCP_VERSION}

Usage:
  oxmcp                      Run the MCP server on stdio
  oxmcp --version            Print version
  oxmcp print-mcp-config     Print MCP client JSON snippet

Environment:
  OXMGR_BIN                  Oxmgr CLI binary (default: oxmgr on PATH)
`);
    return { kind: "exit", code: 0 };
  }

  console.error(`unknown command: ${first}`);
  console.error("Try: oxmcp --help");
  return { kind: "exit", code: 1 };
}
