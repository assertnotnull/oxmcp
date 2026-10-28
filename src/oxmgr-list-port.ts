import type { OxmgrRecord } from "./types.ts";

export type OxmgrListPort = () => Promise<OxmgrRecord[]>;

export class OxmgrListError extends Error {
  readonly stderr?: string;

  constructor(message: string, stderr?: string) {
    super(message);
    this.name = "OxmgrListError";
    this.stderr = stderr;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

async function readPipe(
  stream: ReadableStream<Uint8Array> | number | undefined,
): Promise<string> {
  if (stream == null || typeof stream === "number") {
    return "";
  }
  return await new Response(stream).text();
}

export function resolveOxmgrBin(): string {
  return process.env.OXMGR_BIN?.trim() || "oxmgr";
}

export function createOxmgrListPort(options?: {
  bin?: string;
  timeoutMs?: number;
}): OxmgrListPort {
  const bin = options?.bin ?? resolveOxmgrBin();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async () => {
    let proc: ReturnType<typeof Bun.spawn> | undefined;
    try {
      proc = Bun.spawn([bin, "list", "--json"], {
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdoutPromise = readPipe(proc.stdout);
      const stderrPromise = readPipe(proc.stderr);

      const exit = await Promise.race([
        proc.exited,
        Bun.sleep(timeoutMs).then(() => "timeout" as const),
      ]);

      const stderr = await stderrPromise;
      const stdout = await stdoutPromise;

      if (exit === "timeout") {
        proc.kill();
        throw new OxmgrListError(
          `Timed out after ${timeoutMs}ms while running ${bin} list --json. Check that the Oxmgr daemon is running (try \`oxmgr doctor\`).`,
          stderr.trim() || undefined,
        );
      }

      if (exit !== 0) {
        throw new OxmgrListError(
          `${bin} list --json exited with code ${exit}. Check the Oxmgr daemon (try \`oxmgr doctor\`).`,
          stderr.trim() || undefined,
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        throw new OxmgrListError(
          `${bin} list --json returned invalid JSON. Check the Oxmgr daemon (try \`oxmgr doctor\`).`,
          stderr.trim() || undefined,
        );
      }

      if (!Array.isArray(parsed)) {
        throw new OxmgrListError(
          `${bin} list --json returned unexpected data. Check the Oxmgr daemon (try \`oxmgr doctor\`).`,
          stderr.trim() || undefined,
        );
      }

      return parsed as OxmgrRecord[];
    } catch (error) {
      if (error instanceof OxmgrListError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : String(error);
      throw new OxmgrListError(
        `Failed to run ${bin} list --json: ${message}. Ensure Oxmgr is installed and the daemon is reachable (try \`oxmgr doctor\`).`,
      );
    }
  };
}
