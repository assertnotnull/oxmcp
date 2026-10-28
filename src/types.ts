/** Full managed-process record from `oxmgr list --json`. */
export type OxmgrRecord = {
  id: number;
  name: string;
  status: string;
  health_status: string | null;
  pid: number | null;
  restart_count: number;
  cpu_percent: number | null;
  memory_bytes: number | null;
  last_error: string | null;
  last_health_error: string | null;
  health_failures: number;
  last_started_at: number | null;
  [key: string]: unknown;
};

export type ProcessSummary = {
  id: number;
  name: string;
  status: string;
  health_status: string | null;
  pid: number | null;
  restart_count: number;
  cpu_percent: number | null;
  memory_bytes: number | null;
  last_error: string | null;
  last_health_error: string | null;
  health_failures: number;
  uptime_seconds: number | null;
};

export type ProcessListItem = ProcessSummary & { raw?: OxmgrRecord };

export type ListManagedProcessesResult = {
  processes: ProcessListItem[];
};
