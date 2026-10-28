import { type } from "arktype";
import { matchesProcessFilter, toProcessSummary } from "./summary.ts";
import type { ListManagedProcessesResult } from "./types.ts";
import type { OxmgrListPort } from "./oxmgr-list-port.ts";

export const listManagedProcessesInput = type({
  "name?": "string",
  "id?": "number",
  "include_raw?": "boolean",
});

export type ListManagedProcessesInput =
  typeof listManagedProcessesInput.infer;

export type ListManagedProcessesDeps = {
  listPort: OxmgrListPort;
  nowEpochSec?: number;
};

export async function listManagedProcesses(
  input: ListManagedProcessesInput,
  deps: ListManagedProcessesDeps,
): Promise<ListManagedProcessesResult> {
  const nowEpochSec = deps.nowEpochSec ?? Math.floor(Date.now() / 1000);
  const includeRaw = input.include_raw ?? false;
  const records = await deps.listPort();

  const filtered = records.filter((record) =>
    matchesProcessFilter(record, {
      name: input.name,
      id: input.id,
    }),
  );

  const processes = filtered.map((record) => {
    const summary = toProcessSummary(record, nowEpochSec);
    if (includeRaw) {
      return { ...summary, raw: record };
    }
    return summary;
  });

  return { processes };
}
