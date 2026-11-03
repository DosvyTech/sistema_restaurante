export function validateBackupRun(input: { project: string; installationId: string; envFile: string; markerFile: string; failureFlagFile: string; type: string }): true;
export function findEncryptedBackup(output: string): { backupCount: number; cipher: string; stanza: string };
export function writeBackupFailureFlag(path: string): Promise<void>;
export function clearBackupFailureFlag(path: string): Promise<void>;
export function runBackup(environment?: NodeJS.ProcessEnv): Promise<void>;
