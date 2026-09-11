import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const semver = require("semver");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function declaredFloor(range) {
  const min = semver.minVersion(range);
  if (min === null) {
    throw new Error(`engines.node cannot be read: ${range}`);
  }
  return min.version;
}

function installedEngines(name) {
  try {
    return readJson(require.resolve(`${name}/package.json`)).engines ?? null;
  } catch {
    return null;
  }
}

function main() {
  const manifest = readJson("package.json");
  const range = manifest.engines?.node;
  if (typeof range !== "string") {
    process.stdout.write("package.json declares no engines.node, nothing to check against\n");
    process.exit(1);
  }

  const floor = declaredFloor(range);
  const direct = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ].sort();

  const violations = [];
  for (const name of direct) {
    const engines = installedEngines(name);
    const required = engines?.node;
    if (typeof required !== "string") {
      continue;
    }
    if (!semver.satisfies(floor, required, { includePrerelease: true })) {
      violations.push({ name, required });
    }
  }

  process.stdout.write(`engines.node is ${range}, checked against Node ${floor}\n`);
  process.stdout.write(`${String(direct.length)} direct dependencies checked\n`);

  if (violations.length === 0) {
    process.stdout.write("No direct dependency excludes the declared floor.\n");
    return;
  }

  for (const violation of violations) {
    process.stdout.write(`  ${violation.name} requires node ${violation.required}\n`);
  }
  process.stdout.write(
    "A direct dependency excludes the Node version this project declares support for. " +
      "Choose a matching version of the dependency, or change engines.node deliberately.\n"
  );
  process.exit(1);
}

main();
