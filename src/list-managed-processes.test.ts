import { describe, expect, test } from "bun:test";
import type { OxmgrListPort } from "./oxmgr-list-port.ts";
import { OxmgrListError } from "./oxmgr-list-port.ts";
import { listManagedProcesses } from "./list-managed-processes.ts";
import type { OxmgrRecord } from "./types.ts";

const fixtureA: OxmgrRecord = {
  id: 23,
  name: "service-A",
  status: "running",
  health_status: "healthy",
  pid: 448790,
  restart_count: 0,
  cpu_percent: 0,
  memory_bytes: 30498816,
  last_error: null,
  last_health_error: null,
  health_failures: 0,
  last_started_at: 1_793_202_163,
};

const fixtureB: OxmgrRecord = {
  id: 24,
  name: "service-B",
  status: "stopped",
  health_status: null,
  pid: null,
  restart_count: 2,
  cpu_percent: null,
  memory_bytes: null,
  last_error: "exit 1",
  last_health_error: null,
  health_failures: 0,
  last_started_at: null,
};

function stubPort(records: OxmgrRecord[]): OxmgrListPort {
  return async () => records;
}

describe("listManagedProcesses", () => {
  test("returns process summaries for all managed processes", async () => {
    const nowEpochSec = 1_793_202_500;
    const result = await listManagedProcesses(
      {},
      { listPort: stubPort([fixtureA, fixtureB]), nowEpochSec },
    );

    expect(result.processes).toHaveLength(2);
    expect(result.processes[0]).toMatchObject({
      id: 23,
      name: "service-A",
      status: "running",
      health_status: "healthy",
      restart_count: 0,
      health_failures: 0,
      uptime_seconds: nowEpochSec - fixtureA.last_started_at!,
    });
    expect(result.processes[1]?.uptime_seconds).toBeNull();
  });

  test("filters by exact name", async () => {
    const result = await listManagedProcesses(
      { name: "service-B" },
      { listPort: stubPort([fixtureA, fixtureB]), nowEpochSec: 0 },
    );
    expect(result.processes.map((p) => p.name)).toEqual(["service-B"]);
  });

  test("filters by id", async () => {
    const result = await listManagedProcesses(
      { id: 23 },
      { listPort: stubPort([fixtureA, fixtureB]), nowEpochSec: 0 },
    );
    expect(result.processes).toHaveLength(1);
    expect(result.processes[0]?.id).toBe(23);
  });

  test("applies AND when name and id are both set", async () => {
    const result = await listManagedProcesses(
      { name: "service-A", id: 23 },
      { listPort: stubPort([fixtureA, fixtureB]), nowEpochSec: 0 },
    );
    expect(result.processes).toHaveLength(1);
    expect(result.processes[0]?.name).toBe("service-A");
  });

  test("returns empty processes when filters match nothing", async () => {
    const result = await listManagedProcesses(
      { name: "service-A", id: 99 },
      { listPort: stubPort([fixtureA]), nowEpochSec: 0 },
    );
    expect(result.processes).toEqual([]);
  });

  test("includes raw Oxmgr record when include_raw is true", async () => {
    const result = await listManagedProcesses(
      { include_raw: true },
      { listPort: stubPort([fixtureA]), nowEpochSec: 0 },
    );
    expect(result.processes[0]?.raw).toEqual(fixtureA);
  });

  test("propagates Oxmgr list failures", async () => {
    const failing: OxmgrListPort = async () => {
      throw new OxmgrListError("oxmgr failed", "daemon down");
    };
    await expect(
      listManagedProcesses({}, { listPort: failing, nowEpochSec: 0 }),
    ).rejects.toThrow(OxmgrListError);
  });
});
