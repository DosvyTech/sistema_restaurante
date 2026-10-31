import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const policy = JSON.parse(readFileSync(new URL('security/npm-audit-exception.json', root), 'utf8'));

export function validateAuditReport(report, exception, today = new Date().toISOString().slice(0, 10), lockfile) {
  const failures = [];
  if (report?.auditReportVersion !== 2) failures.push('npm audit JSON version is missing or unsupported');
  const vulnerabilities = report?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== 'object' || Array.isArray(vulnerabilities)) {
    return ['npm audit JSON has no vulnerability map'];
  }

  const expected = exception.expected ?? {};
  const actualNames = Object.keys(vulnerabilities).sort();
  const expectedNames = Object.keys(expected).sort();
  if (actualNames.length === 0) {
    const totals = report.metadata?.vulnerabilities;
    const zeroTotals = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
    if (!totals || Object.keys(totals).length !== Object.keys(zeroTotals).length
      || Object.entries(zeroTotals).some(([severity, count]) => totals[severity] !== count)) {
      failures.push('empty vulnerability map conflicts with nonzero or missing audit totals');
    }
    return failures;
  }
  if (!exception.owner || !exception.reason || !/^\d{4}-\d{2}-\d{2}$/.test(exception.expiresOn ?? '')) {
    failures.push('exception must have an owner, reason, and ISO expiry date');
  } else if (exception.expiresOn < today) {
    failures.push(`esbuild exception expired on ${exception.expiresOn}`);
  }
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    failures.push(`vulnerability package set changed (expected ${expectedNames.join(', ')}, got ${actualNames.join(', ')})`);
  }

  for (const name of expectedNames) {
    const actual = vulnerabilities[name];
    if (!actual) continue;
    const fields = ['name', 'severity', 'isDirect', 'via', 'effects', 'range', 'nodes'];
    for (const field of fields) {
      const normalizedActual = field === 'via'
        ? actual[field]?.map((item) => typeof item === 'string'
          ? item
          : Object.fromEntries(['source', 'name', 'dependency', 'title', 'url', 'severity', 'range'].map((key) => [key, item[key]])))
        : actual[field];
      if (JSON.stringify(normalizedActual) !== JSON.stringify(expected[name][field])) {
        failures.push(`${name}.${field} differs from the approved advisory identity or dependency path`);
      }
    }
  }

  if (!Array.isArray(exception.resolvedDependencyPath) || !lockfile?.packages) {
    failures.push('approved resolved dependency path or package-lock data is missing');
  } else {
    for (const item of exception.resolvedDependencyPath) {
      const locked = lockfile.packages[item.lockPath];
      if (!locked || locked.version !== item.version || locked.dev !== true) {
        failures.push(`lockfile path ${item.lockPath} does not resolve to approved ${item.name}@${item.version}`);
      }
    }
    for (let index = 0; index < exception.resolvedDependencyPath.length - 1; index += 1) {
      const current = exception.resolvedDependencyPath[index];
      const next = exception.resolvedDependencyPath[index + 1];
      if (lockfile.packages[current.lockPath]?.dependencies?.[next.name] === undefined) {
        failures.push(`lockfile route does not connect ${current.name} to ${next.name}`);
      }
    }
  }

  const totals = report.metadata?.vulnerabilities;
  if (!totals) {
    failures.push('npm audit JSON has no vulnerability totals');
  } else {
    const expectedTotals = { info: 0, low: 0, moderate: 4, high: 0, critical: 0, total: 4 };
    for (const [severity, count] of Object.entries(expectedTotals)) {
      if (totals[severity] !== count) failures.push(`npm audit ${severity} count changed (expected ${count}, got ${totals[severity]})`);
    }
  }
  return failures;
}

function runAudit() {
  const executable = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd audit --json'] : ['audit', '--json'];
  const result = spawnSync(executable, args, {
    cwd: fileURLToPath(root),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    process.stderr.write(result.stderr || 'npm audit did not return valid JSON\n');
    throw new Error(`npm audit returned non-JSON output (exit ${result.status})`);
  }

  const findings = Object.values(report.vulnerabilities ?? {});
  for (const finding of findings) {
    const paths = finding.nodes?.join(', ') ?? 'path unavailable';
    const advisories = (finding.via ?? []).filter((item) => typeof item === 'object');
    if (advisories.length === 0) {
      console.log(`npm audit finding: ${finding.name} (${finding.severity}); dependency path: ${paths}; via ${finding.via?.join(' -> ') ?? 'unknown'}`);
    } else {
      for (const advisory of advisories) {
        console.log(`npm audit finding: ${finding.name} (${advisory.severity}; ${advisory.url}); dependency path: ${paths}; range ${advisory.range}`);
      }
    }
  }

  const lockfile = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'));
  const failures = validateAuditReport(report, policy, new Date().toISOString().slice(0, 10), lockfile);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`npm audit exception rejected: ${failure}`);
    process.exitCode = 1;
    return;
  }
  if (findings.length === 0) {
    console.log('npm audit: no vulnerabilities; the provisional exception is no longer exercised.');
  } else {
    console.log(`npm audit: ${findings.length} moderate development-chain findings match the explicitly approved, expiring exception owned by ${policy.owner}. Full audit is not clean.`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runAudit();
