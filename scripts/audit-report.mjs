import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const TOOLCHAIN_ROOTS = new Set(["pcf-scripts", "pcf-start"]);

function readAudit() {
  try {
    return JSON.parse(execFileSync("npm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    if (typeof error.stdout === "string" && error.stdout.length > 0) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

function buildDependents(vulnerabilities) {
  const dependents = new Map();
  const add = (dependency, dependent) => {
    if (dependency === dependent) {
      return;
    }
    if (!dependents.has(dependency)) {
      dependents.set(dependency, new Set());
    }
    dependents.get(dependency).add(dependent);
  };
  for (const [name, entry] of Object.entries(vulnerabilities)) {
    for (const effect of entry.effects ?? []) {
      add(name, effect);
    }
    for (const via of entry.via ?? []) {
      if (typeof via === "string") {
        add(via, name);
      }
    }
  }
  return dependents;
}

function rootsOf(name, vulnerabilities, dependents, path) {
  if (path.has(name)) {
    return new Set();
  }
  const entry = vulnerabilities[name];
  if (entry === undefined || entry.isDirect === true) {
    return new Set([name]);
  }
  path.add(name);
  const roots = new Set();
  for (const dependent of dependents.get(name) ?? []) {
    for (const root of rootsOf(dependent, vulnerabilities, dependents, path)) {
      roots.add(root);
    }
  }
  path.delete(name);
  return roots.size === 0 ? new Set([name]) : roots;
}

function advisoryTitles(entry) {
  return (entry.via ?? [])
    .filter((via) => typeof via === "object" && via !== null)
    .map((via) => via.title)
    .filter((title) => typeof title === "string");
}

function classify(report) {
  const vulnerabilities = report.vulnerabilities ?? {};
  const dependents = buildDependents(vulnerabilities);
  const toolchain = [];
  const own = [];
  const unattributed = [];
  for (const [name, entry] of Object.entries(vulnerabilities)) {
    const roots = [...rootsOf(name, vulnerabilities, dependents, new Set())];
    const finding = {
      name,
      severity: entry.severity,
      roots,
      titles: advisoryTitles(entry),
    };
    const direct = roots.filter((root) => vulnerabilities[root]?.isDirect === true || TOOLCHAIN_ROOTS.has(root));
    if (direct.length === 0) {
      unattributed.push(finding);
    } else if (direct.every((root) => TOOLCHAIN_ROOTS.has(root))) {
      toolchain.push(finding);
    } else {
      own.push(finding);
    }
  }
  return { toolchain, own, unattributed };
}

function renderGroup(heading, note, findings) {
  const lines = [`### ${heading}`, "", note, ""];
  if (findings.length === 0) {
    lines.push("Keine Funde.", "");
    return lines;
  }
  lines.push("| Paket | Schweregrad | Eingezogen über | Advisory |", "| --- | --- | --- | --- |");
  for (const finding of findings) {
    const titles = finding.titles.length === 0 ? "-" : finding.titles.join("; ");
    lines.push(`| \`${finding.name}\` | ${finding.severity} | ${finding.roots.join(", ")} | ${titles} |`);
  }
  lines.push("");
  return lines;
}

function main() {
  const report = readAudit();
  const { toolchain, own, unattributed } = classify(report);
  const total = report.metadata?.vulnerabilities?.total ?? toolchain.length + own.length + unattributed.length;

  const lines = [
    "## npm audit",
    "",
    `Funde gesamt: ${total}. Dieser Job blockiert nicht.`,
    "",
    ...renderGroup(
      `Aus der übernommenen Werkzeugkette (${toolchain.length})`,
      "Transitiv über `pcf-scripts` oder `pcf-start` eingezogen. Nicht unmittelbar zu verantworten, wird beim Anheben von `pcf-scripts` erneut geprüft.",
      toolchain
    ),
    ...renderGroup(
      `Aus selbst gewählten Abhängigkeiten (${own.length})`,
      "Über Abhängigkeiten eingezogen, die dieses Repository selbst gewählt hat. Diese Gruppe ist zu verantworten.",
      own
    ),
    ...renderGroup(
      `Nicht zuordenbar (${unattributed.length})`,
      "Der Audit-Report nennt für diese Funde keinen Pfad zu einer direkten Abhängigkeit. Von Hand nachzusehen.",
      unattributed
    ),
  ];

  const text = lines.join("\n");
  process.stdout.write(`${text}\n`);
  if (typeof process.env.GITHUB_STEP_SUMMARY === "string" && process.env.GITHUB_STEP_SUMMARY.length > 0) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
  }
}

main();
