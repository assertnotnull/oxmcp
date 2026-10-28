import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createOxmgrListPort } from "./src/oxmgr-list-port.ts";
import { createOxmcpServer } from "./src/server.ts";

serveStdio(() => createOxmcpServer({ listPort: createOxmgrListPort() }));
