import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PREFIX = "+";
const CONFIG_DIR = "data";
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export async function getPrefix() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    const config = JSON.parse(raw);

    if (typeof config.prefix === "string" && config.prefix.length > 0) {
      return config.prefix;
    }
  } catch {
    // Fall back to the default prefix.
  }

  return DEFAULT_PREFIX;
}

export async function setPrefix(prefix) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(
    CONFIG_FILE,
    JSON.stringify({ prefix }, null, 2) + "\n",
    "utf8",
  );
}
