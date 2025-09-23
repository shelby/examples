import { resolve } from "node:path";
import { generateTable } from "./generator.js";
import { updateReadme } from "./readme-updater.js";
import { getMonorepoApps } from "./scanner.js";
import type { TableGeneratorOptions } from "./types.js";

/**
 * Main function to update the apps table in README.md
 */
export function updateAppsTable(options: TableGeneratorOptions = {}) {
  const {
    rootDir = process.cwd(),
    readmePath = resolve(rootDir, "README.md"),
    checkOnly = false,
    verbose = false,
  } = options;

  if (verbose) {
    console.log("🔍 Scanning monorepo for apps...");
  }

  // Scan for apps only
  const { apps } = getMonorepoApps(rootDir);

  if (verbose) {
    console.log(`Found ${apps.length} apps`);
  }

  // Generate apps table only
  const appsTable = generateTable(apps, "Applications");

  // Update README
  const result = updateReadme(readmePath, appsTable, "");

  if (result.error) {
    throw new Error(result.error);
  }

  if (checkOnly) {
    if (result.wasUpdated) {
      throw new Error("README.md table is out of sync");
    }
    if (verbose) console.log("✅ README.md table is up to date");
    return false;
  }

  if (result.wasUpdated) {
    if (verbose) console.log("✅ Updated README.md with latest apps table");
    return true;
  }
  if (verbose) console.log("✅ Table is already up to date");
  return false;
}

export { generateTable } from "./generator.js";
export { updateReadme } from "./readme-updater.js";
export { getMonorepoApps } from "./scanner.js";
// Re-export types and functions for library usage
export type {
  MonorepoApps,
  MonorepoItem,
  TableGeneratorOptions,
} from "./types.js";
