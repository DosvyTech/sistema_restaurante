export interface ComposeServiceStatus {
  service: string;
  state: string;
  health: string;
}

export interface OperationalIssue {
  key: string;
  kind: "service" | "backup" | "wal";
  service?: string;
  state?: string;
  health?: string;
  reason?: "missing" | "stale" | "invalid" | "failed";
}

export interface AlertEvent {
  transition: "triggered" | "recovered";
  issue: OperationalIssue;
}

export function normalizeComposeServices(output: string): ComposeServiceStatus[];
export function createWalArchiveStatusCommand(): string;
export function collectOperationalIssues(
  services: ComposeServiceStatus[],
  options?: {
    requiredServices?: string[];
    backupLastSuccessAt?: string | number | Date | null;
    backupFailed?: boolean;
    backupMaxAgeMs?: number;
    walLastArchivedAt?: string | number | Date | null;
    walMaxAgeMs?: number;
    now?: number;
  },
): OperationalIssue[];
export function diffOperationalIssues(
  previousIssues: OperationalIssue[],
  currentIssues: OperationalIssue[],
): AlertEvent[];
export function sendAlertEvents(input: {
  webhookUrl: string;
  installationId: string;
  generatedAt: string;
  events: AlertEvent[];
  allowInsecureLoopback?: boolean;
  fetchImplementation?: typeof fetch;
}): Promise<true>;
export function runMonitor(environment?: NodeJS.ProcessEnv): Promise<void>;
