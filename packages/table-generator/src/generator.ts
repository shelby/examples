import type { MonorepoItem } from "./types.js";

/**
 * Generate markdown table for apps and packages
 */
export function generateTable(items: MonorepoItem[], title: string): string {
  if (items.length === 0) {
    return `### ${title}\n\nNo ${title.toLowerCase()} found.\n`;
  }

  const headers = ["Name", "Description", "Path & Links"];
  const separator = headers.map(() => "---").join(" | ");

  let table = `### ${title}\n\n| ${headers.join(" | ")} |\n| ${separator} |\n`;

  for (const item of items) {
    const links: string[] = [];

    // Add source link with path
    links.push(`[\`${item.path}\`](./${item.path})`);

    // Add homepage link if available
    if (item.homepage) {
      links.push(`[Live Demo](${item.homepage})`);
    }

    // Add repository link if different from homepage
    if (item.repository && item.repository !== item.homepage) {
      links.push(`[Repository](${item.repository})`);
    }

    const pathAndLinks = links.join(" • ");
    const escapedDescription = item.description.replace(/\|/g, "\\|");

    table += `| \`${item.name}\` | ${escapedDescription} | ${pathAndLinks} |\n`;
  }

  return `${table}\n`;
}
