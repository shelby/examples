import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { MonorepoApps, MonorepoItem, PackageInfo } from "./types.js";

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
  } catch {
    // No package.json found - this is expected for directories that contain nested apps
    return null;
  }
}

/**
 * Scan a directory for packages/apps, recursively checking subdirectories
 * when a directory doesn't have a package.json
 */
function scanDirectory(
  dirPath: string,
  type: "app" | "package",
  relativePath: string,
  maxDepth = 2,
): MonorepoItem[] {
  const items: MonorepoItem[] = [];

  if (maxDepth <= 0) {
    return items;
  }

  try {
    const dirs = readdirSync(dirPath);
    for (const dir of dirs) {
      if (dir.startsWith(".")) continue;
      const fullPath = join(dirPath, dir);
      if (statSync(fullPath).isDirectory()) {
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
            path: `${relativePath}/${dir}`,
            type,
            private: pkgInfo.private || false,
            homepage: pkgInfo.homepage,
            repository,
          });
        } else {
          // No package.json found, check subdirectories for nested apps
          const nestedItems = scanDirectory(
            fullPath,
            type,
            `${relativePath}/${dir}`,
            maxDepth - 1,
          );
          items.push(...nestedItems);
        }
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
