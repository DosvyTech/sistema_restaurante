import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const image = 'ghcr.io/trufflesecurity/trufflehog:3.99.7';
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'dosvy-secret-scan-'));
const fixturePath = join(temporaryDirectory, 'synthetic-credential.txt');
const configPath = join(temporaryDirectory, 'fixture-detector.yml');
const reportPath = join(temporaryDirectory, 'scanner-output.jsonl');
const fakeCredential = '0123456789ABCDEF0123456789ABCDEF';

try {
  writeFileSync(fixturePath, `dosvy_test_token=${fakeCredential}\n`, { mode: 0o600 });
  writeFileSync(configPath, [
    'detectors:',
    '  - name: dosvy-synthetic-fixture',
    '    keywords: [dosvy_test_token]',
    '    regex:',
    '      dosvy-synthetic-fixture: "dosvy_test_token=([A-Z0-9]{32})"',
    '',
  ].join('\n'), { mode: 0o600 });
  const result = spawnSync('docker', [
    'run', '--rm', '--network', 'none',
    '--mount', `type=bind,src=${temporaryDirectory},dst=/scan,readonly`,
    image,
    'filesystem', '/scan', '--config=/scan/fixture-detector.yml', '--json', '--no-verification', '--no-update', '--fail',
  ], { encoding: 'utf8', windowsHide: true, maxBuffer: 5 * 1024 * 1024 });

  if (result.error) throw result.error;
  writeFileSync(reportPath, result.stdout ?? '', { mode: 0o600 });
  const output = readFileSync(reportPath, 'utf8').trim();
  const foundSyntheticFixture = output.split(/\r?\n/u).filter(Boolean).some((line) => {
    try {
      const finding = JSON.parse(line);
      return JSON.stringify(finding.SourceMetadata ?? {}).includes('synthetic-credential.txt');
    } catch {
      return false;
    }
  });

  if (result.status !== 183 || !foundSyntheticFixture) {
    process.stderr.write(`TruffleHog synthetic-fixture smoke test failed (exit ${result.status ?? 'unavailable'}; ${output.split(/\r?\n/u).filter(Boolean).length} output records).\n`);
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    if (result.stderr) process.stderr.write(result.stderr.replaceAll(fakeCredential, '[synthetic value redacted]'));
    process.exitCode = 1;
  } else {
    console.log(`TruffleHog ${image} detected the synthetic fixture (scanner output withheld).`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
