import { McpServer } from "@modelcontextprotocol/server";
import {
  listManagedProcesses,
  listManagedProcessesInput,
} from "./list-managed-processes.ts";
import type { OxmgrListPort } from "./oxmgr-list-port.ts";
import { OxmgrListError } from "./oxmgr-list-port.ts";

export type OxmcpServerDeps = {
  listPort: OxmgrListPort;
};

export function createOxmcpServer(deps: OxmcpServerDeps): McpServer {
  const server = new McpServer(
    { name: "oxmcp", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "list_managed_services",
    {
      title: "List managed services",
      description:
        "List Oxmgr managed developer services on the local daemon with runtime status, health status, and metrics.",
      inputSchema: listManagedProcessesInput,
    },
    async (input) => {
      try {
        const output = await listManagedProcesses(input, {
          listPort: deps.listPort,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error) {
        const message =
          error instanceof OxmgrListError
            ? [error.message, error.stderr].filter(Boolean).join("\n")
            : error instanceof Error
              ? error.message
              : String(error);
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }
    },
  );

  return server;
}
