#!/usr/bin/env tsx

import { resolve } from "node:path";
import { updateAppsTable } from "./index.js";

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    check: args.includes("--check"),
    verbose: args.includes("--verbose") || args.includes("-v"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
@shelby-protocol/table-generator

Automatically generates and maintains the apps table in README.md

USAGE:
  tsx src/cli.ts [options]
  pnpm update-table [options]
  pnpm check-table

OPTIONS:
  --check         Check if table is up to date (exits with code 1 if not)
  --verbose, -v   Show verbose output
  --help, -h      Show this help message

EXAMPLES:
  tsx src/cli.ts                    # Update the table
  tsx src/cli.ts --check            # Check if table is up to date
  tsx src/cli.ts --verbose          # Update with verbose output
  pnpm update-table                 # Update using npm script
  pnpm check-table                  # Check using npm script
`);
}

/**
 * Main CLI function
 */
function main() {
  const { check, help } = parseArgs();

  if (help) {
    showHelp();
    return;
  }

  try {
    // Find the monorepo root (2 levels up from this package)
    const rootDir = resolve(import.meta.dirname, "../../../");

    const wasUpdated = updateAppsTable({
      rootDir,
      checkOnly: check,
      verbose: true, // Always verbose in CLI
    });

    if (check) {
      console.log("✅ README.md table is up to date");
      process.exit(0);
    } else if (wasUpdated) {
      console.log("📝 README.md has been updated");
      process.exit(0);
    } else {
      console.log("✅ No changes needed");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);

    if (check && (error as Error).message.includes("out of sync")) {
      console.error("\n💡 Run 'pnpm update-table' to fix this");
    }

    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}
