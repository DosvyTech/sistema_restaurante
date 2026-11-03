import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { validateArchiveSetup } from "../../scripts/configure-pgbackrest-archive.mjs";
import { clearBackupFailureFlag, findEncryptedBackup, validateBackupRun, writeBackupFailureFlag } from "../../scripts/run-pgbackrest-backup.mjs";

const rootPath = "C:/Users/oscar/Dosvy/sistema_restaurante";

describe("pgBackRest operation guards", () => {
  it("limits archive setup to a matching installation and external env file", () => {
    expect(validateArchiveSetup({ project: "dosvy-restaurant-01", installationId: "restaurant_01", envFile: "C:/ProgramData/Dosvy/restaurant_01/deployment.env" })).toBe(true);
    expect(() => validateArchiveSetup({ project: "other-project", installationId: "restaurant_01", envFile: "C:/ProgramData/Dosvy/env" })).toThrow(/project/i);
    expect(() => validateArchiveSetup({ project: "dosvy-restaurant-01", installationId: "restaurant_01", envFile: `${rootPath}/.env` })).toThrow(/outside/i);
  });

  it("allows only supported backup modes and external marker paths", () => {
    expect(validateBackupRun({ project: "dosvy-restaurant-01", installationId: "restaurant_01", envFile: "C:/ProgramData/Dosvy/deployment.env", markerFile: "C:/ProgramData/Dosvy/backup-success", failureFlagFile: "C:/ProgramData/Dosvy/backup-failed", type: "full" })).toBe(true);
    expect(() => validateBackupRun({ project: "dosvy-restaurant-01", installationId: "restaurant_01", envFile: "C:/ProgramData/Dosvy/deployment.env", markerFile: `${rootPath}/marker`, failureFlagFile: "C:/ProgramData/Dosvy/backup-failed", type: "full" })).toThrow(/outside/i);
    expect(() => validateBackupRun({ project: "dosvy-restaurant-01", installationId: "restaurant_01", envFile: "C:/ProgramData/Dosvy/deployment.env", markerFile: "C:/ProgramData/Dosvy/backup-success", failureFlagFile: `${rootPath}/failed`, type: "full" })).toThrow(/outside/i);
    expect(() => validateBackupRun({ project: "dosvy-restaurant-01", installationId: "restaurant_01", envFile: "C:/ProgramData/Dosvy/deployment.env", markerFile: "C:/ProgramData/Dosvy/backup-success", failureFlagFile: "C:/ProgramData/Dosvy/backup-failed", type: "invalid" })).toThrow(/type/i);
  });

  it("accepts encrypted, successful pgBackRest metadata without exposing configuration", () => {
    const output = JSON.stringify([{ name: "restaurant_01", status: { code: 0 }, cipher: "aes-256-cbc", repo: [{ cipher: "aes-256-cbc", status: { code: 0 } }], backup: [{ label: "20261102-190632F", error: false, type: "full" }] }]);
    expect(findEncryptedBackup(output)).toEqual({ backupCount: 1, cipher: "aes-256-cbc", stanza: "restaurant_01" });
  });

  it("rejects failed, unencrypted, or empty backup metadata", () => {
    expect(() => findEncryptedBackup("[]")).toThrow(/successful backup/i);
    expect(() => findEncryptedBackup(JSON.stringify([{ name: "restaurant_01", status: { code: 0 }, repo: [], backup: [{ error: false }] }]))).toThrow(/encryption/i);
    expect(() => findEncryptedBackup(JSON.stringify([{ name: "restaurant_01", status: { code: 0 }, cipher: "aes-256-cbc", backup: [{ error: true }] }]))).toThrow(/failed backup/i);
  });

  it("writes a generic failure marker and clears it after recovery without touching success state", async () => {
    const directory = await mkdtemp(join(tmpdir(), "dosvy-backup-flag-"));
    const failureFlag = join(directory, "backup-failed");

    try {
      await writeBackupFailureFlag(failureFlag);
      expect(await readFile(failureFlag, "utf8")).toBe("Backup operation failed.\n");
      expect((await stat(failureFlag)).size).toBeLessThan(128);

      await clearBackupFailureFlag(failureFlag);
      await expect(stat(failureFlag)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
