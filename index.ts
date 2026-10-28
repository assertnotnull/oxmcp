import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { runCli } from "./src/cli.ts";
import { createOxmgrListPort } from "./src/oxmgr-list-port.ts";
import { createOxmcpServer } from "./src/server.ts";

const cli = runCli(process.argv.slice(2));
if (cli.kind === "exit") {
  process.exit(cli.code);
}

serveStdio(() => createOxmcpServer({ listPort: createOxmgrListPort() }));
