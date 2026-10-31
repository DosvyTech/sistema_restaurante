import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAuditReport } from '../../scripts/verify-npm-audit-exception.mjs';

const root = new URL('../../', import.meta.url);
const policy = JSON.parse(readFileSync(new URL('security/npm-audit-exception.json', root), 'utf8'));
const report = {
  auditReportVersion: 2,
  vulnerabilities: structuredClone(policy.expected),
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 4, high: 0, critical: 0, total: 4 },
  },
};
const lockfile = {
  packages: {
    'node_modules/drizzle-kit': { version: '0.31.11', dev: true, dependencies: { '@esbuild-kit/esm-loader': '^2.6.5' } },
    'node_modules/@esbuild-kit/esm-loader': { version: '2.6.5', dev: true, dependencies: { '@esbuild-kit/core-utils': '^3.3.2' } },
    'node_modules/@esbuild-kit/core-utils': { version: '3.3.2', dev: true, dependencies: { esbuild: '0.18.20' } },
    'node_modules/@esbuild-kit/core-utils/node_modules/esbuild': { version: '0.18.20', dev: true },
  },
};

test('accepts only the documented esbuild development dependency path', () => {
  assert.deepEqual(validateAuditReport(report, policy, '2026-10-31', lockfile), []);
});

test('accepts a clean audit after the exception has been remediated', () => {
  assert.deepEqual(validateAuditReport({ auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } } }, policy, '2026-10-31'), []);
});

test('rejects an additional vulnerability even at low severity', () => {
  const changed = structuredClone(report);
  changed.vulnerabilities.other = { name: 'other', severity: 'low' };
  changed.metadata.vulnerabilities.low = 1;
  changed.metadata.vulnerabilities.total = 5;
  assert.ok(validateAuditReport(changed, policy, '2026-10-31', lockfile).some((failure) => failure.includes('package set changed')));
});

test('rejects a changed severity or advisory identity', () => {
  const changed = structuredClone(report);
  changed.vulnerabilities.esbuild.severity = 'high';
  changed.vulnerabilities.esbuild.via[0].url = 'https://github.com/advisories/GHSA-unknown';
  assert.ok(validateAuditReport(changed, policy, '2026-10-31', lockfile).some((failure) => failure.includes('esbuild.severity')));
  assert.ok(validateAuditReport(changed, policy, '2026-10-31', lockfile).some((failure) => failure.includes('esbuild.via')));
});

test('rejects an altered or expired dependency route', () => {
  const changed = structuredClone(report);
  changed.vulnerabilities.esbuild.nodes = ['node_modules/esbuild'];
  assert.ok(validateAuditReport(changed, policy, '2026-10-31', lockfile).some((failure) => failure.includes('esbuild.nodes')));
  assert.ok(validateAuditReport(report, policy, '2027-02-01', lockfile).some((failure) => failure.includes('expired')));
});

test('rejects a changed resolved version or a broken lockfile route', () => {
  const changed = structuredClone(lockfile);
  changed.packages['node_modules/@esbuild-kit/core-utils/node_modules/esbuild'].version = '0.24.3';
  assert.ok(validateAuditReport(report, policy, '2026-10-31', changed).some((failure) => failure.includes('does not resolve')));
  const disconnected = structuredClone(lockfile);
  disconnected.packages['node_modules/drizzle-kit'].dependencies = {};
  assert.ok(validateAuditReport(report, policy, '2026-10-31', disconnected).some((failure) => failure.includes('does not connect')));
  const productionPath = structuredClone(lockfile);
  productionPath.packages['node_modules/@esbuild-kit/core-utils/node_modules/esbuild'].dev = false;
  assert.ok(validateAuditReport(report, policy, '2026-10-31', productionPath).some((failure) => failure.includes('does not resolve')));
});
