import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
const readmePath = path.join(root, 'README.md');

const START = '<!-- coverage-badge:start -->';
const END = '<!-- coverage-badge:end -->';
const WORKFLOW_URL =
  'https://github.com/sergushkincom/knowledge-atlas/actions/workflows/ci.yml';

function colorFor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellowgreen';
  if (pct >= 60) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
}

function formatPct(pct) {
  if (typeof pct !== 'number' || Number.isNaN(pct)) {
    throw new Error(`Coverage summary has no numeric percentage (got ${String(pct)}).`);
  }
  const text = pct.toFixed(1);
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}

function badgeMarkdown(pct) {
  const label = formatPct(pct);
  const color = colorFor(Number(label));
  const message = encodeURIComponent(`${label}%`);
  const src = `https://img.shields.io/badge/coverage-${message}-${color}?style=flat`;
  return `[![Coverage](${src})](${WORKFLOW_URL})`;
}

function readSummary() {
  let raw;
  try {
    raw = readFileSync(summaryPath, 'utf8');
  } catch {
    throw new Error(`Missing ${summaryPath}. Run pnpm test:coverage first.`);
  }
  const data = JSON.parse(raw);
  if (!data.total?.lines || !data.total.statements || !data.total.functions || !data.total.branches) {
    throw new Error('coverage-summary.json is missing total coverage metrics.');
  }
  return data.total;
}

function expectedBlock(pct) {
  return `${START}\n${badgeMarkdown(pct)}\n${END}`;
}

function replaceBlock(readme, block) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('README.md is missing the coverage-badge markers.');
  }
  const current = readme.slice(start, end + END.length);
  const next = readme.slice(0, start) + block + readme.slice(end + END.length);
  return { current, next };
}

function summaryMarkdown(total) {
  const row = (name, metric) =>
    `| ${name} | ${formatPct(metric.pct)}% | ${metric.covered} | ${metric.total} |`;
  return [
    '### Coverage',
    '',
    'Line coverage of `lib/**/*.ts`. The README badge uses the lines figure. The HTML, lcov, and JSON reports are in the `coverage-report` artifact.',
    '',
    '| Metric | Coverage | Covered | Total |',
    '| --- | ---: | ---: | ---: |',
    row('Lines', total.lines),
    row('Statements', total.statements),
    row('Functions', total.functions),
    row('Branches', total.branches),
    '',
  ].join('\n');
}

try {
  const args = new Set(process.argv.slice(2));
  const check = args.has('--check');
  const summary = args.has('--summary');
  const write = !check && !summary;
  const total = readSummary();
  const block = expectedBlock(total.lines.pct);
  const readme = readFileSync(readmePath, 'utf8');
  const { current, next } = replaceBlock(readme, block);

  if (check && current !== block) {
    console.error('Coverage badge in README.md does not match coverage/coverage-summary.json.');
    console.error('Run: pnpm test:coverage && pnpm coverage:badge');
    console.error('');
    console.error('Expected:');
    console.error(block);
    process.exit(1);
  }

  if (write && current !== block) {
    writeFileSync(readmePath, next);
  }

  if (check) {
    console.log(`Coverage badge matches the report (${formatPct(total.lines.pct)}% lines).`);
  } else if (write) {
    console.log(`Coverage badge set to ${formatPct(total.lines.pct)}% lines (${colorFor(Number(formatPct(total.lines.pct)))}).`);
  }

  if (summary) {
    process.stdout.write(summaryMarkdown(total));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
