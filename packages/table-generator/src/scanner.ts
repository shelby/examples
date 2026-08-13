import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { MonorepoApps, MonorepoItem, PackageInfo } from "./types.js";

const IGNORED_DIRS = new Set(["node_modules"]);

/**
 * Get package.json content for a given path
 */
function getPackageInfo(packagePath: string): PackageInfo | null {
  try {
    const pkgJsonPath = join(packagePath, "package.json");
    const pkgJson = JSON.parse(
      readFileSync(pkgJsonPath, "utf-8"),
    ) as PackageInfo;
    return pkgJson;
  } catch (error) {
    console.warn(
      `Could not read package.json for ${packagePath}:`,
      (error as Error).message,
    );
    return null;
  }
}

/**
 * Scan a directory for packages/apps
 *
 * Workspaces may be nested one or more levels deep (for example
 * `apps/solana/file-upload`, declared in pnpm-workspace.yaml as
 * `apps/solana/*`), so directories without a package.json of their own are
 * treated as grouping directories and recursed into.
 */
function scanDirectory(
  dirPath: string,
  type: "app" | "package",
  relativePath: string,
): MonorepoItem[] {
  const items: MonorepoItem[] = [];

  try {
    // Sorted so the generated table is stable across filesystems
    const dirs = readdirSync(dirPath).sort();
    for (const dir of dirs) {
      if (dir.startsWith(".") || IGNORED_DIRS.has(dir)) {
        continue;
      }

      const fullPath = join(dirPath, dir);
      if (!statSync(fullPath).isDirectory()) {
        continue;
      }

      const itemPath = `${relativePath}/${dir}`;

      // Grouping directory: no package.json of its own, so look inside it
      if (!existsSync(join(fullPath, "package.json"))) {
        items.push(...scanDirectory(fullPath, type, itemPath));
        continue;
      }

      const pkgInfo = getPackageInfo(fullPath);
      if (pkgInfo) {
        let repository: string | undefined;
        if (typeof pkgInfo.repository === "string") {
          repository = pkgInfo.repository;
        } else if (
          typeof pkgInfo.repository === "object" &&
          pkgInfo.repository?.url
        ) {
          repository = pkgInfo.repository.url;
        }

        if (repository) {
          // Clean up git URLs
          repository = repository.replace(/^git\+/, "").replace(/\.git$/, "");
        }

        items.push({
          name: pkgInfo.name,
          description: pkgInfo.description || "No description provided",
          path: itemPath,
          type,
          private: pkgInfo.private || false,
          homepage: pkgInfo.homepage,
          repository,
        });
      }
    }
  } catch (error) {
    console.warn(
      `Could not scan ${relativePath} directory:`,
      (error as Error).message,
    );
  }

  return items;
}

/**
 * Get all apps and packages from the monorepo
 */
export function getMonorepoApps(rootDir: string): MonorepoApps {
  const appsDir = join(rootDir, "apps");
  const packagesDir = join(rootDir, "packages");

  const apps = scanDirectory(appsDir, "app", "apps");
  const packages = scanDirectory(packagesDir, "package", "packages")
    // Filter out the table-generator package itself
    .filter((pkg) => !pkg.name.includes("table-generator"));

  return { apps, packages };
}
