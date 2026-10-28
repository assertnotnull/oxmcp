import type { OxmgrRecord, ProcessSummary } from "./types.ts";

export function toProcessSummary(
  record: OxmgrRecord,
  nowEpochSec: number,
): ProcessSummary {
  const uptime_seconds =
    record.status === "running" && record.last_started_at != null
      ? Math.max(0, nowEpochSec - record.last_started_at)
      : null;

  return {
    id: record.id,
    name: record.name,
    status: record.status,
    health_status: record.health_status,
    pid: record.pid,
    restart_count: record.restart_count,
    cpu_percent: record.cpu_percent,
    memory_bytes: record.memory_bytes,
    last_error: record.last_error,
    last_health_error: record.last_health_error,
    health_failures: record.health_failures,
    uptime_seconds,
  };
}

export function matchesProcessFilter(
  record: OxmgrRecord,
  filter: { name?: string; id?: number },
): boolean {
  if (filter.name !== undefined && record.name !== filter.name) {
    return false;
  }
  if (filter.id !== undefined && record.id !== filter.id) {
    return false;
  }
  return true;
}
