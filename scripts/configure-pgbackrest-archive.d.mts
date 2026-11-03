export function validateArchiveSetup(input: { project: string; installationId: string; envFile: string }): true;
export function configureArchive(environment?: NodeJS.ProcessEnv): Promise<void>;
