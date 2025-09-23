export interface PackageInfo {
  name: string;
  description?: string;
  homepage?: string;
  repository?: string | { url: string };
  private?: boolean;
  [key: string]: unknown;
}

export interface MonorepoItem {
  name: string;
  description: string;
  path: string;
  type: "app" | "package";
  private: boolean;
  homepage?: string;
  repository?: string;
}

export interface MonorepoApps {
  apps: MonorepoItem[];
  packages: MonorepoItem[];
}

export interface TableGeneratorOptions {
  rootDir?: string;
  readmePath?: string;
  checkOnly?: boolean;
  verbose?: boolean;
}
