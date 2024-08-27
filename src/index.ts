import path from "path";
import fs from "fs";
import { updateIndexFile, addWatcher } from "./lib/indexer";

interface Config {
  foldersToWatch: string[];
  ignoreFiles: string[];
}

// Read config file and parse
const configPath = path.join(process.cwd(), "config.json");
const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Default folders to watch if none provided, adding default ignored files
const foldersToWatch: string[] = config.foldersToWatch || ["app", "styles"];
const ignoreFiles: string[] = (config.ignoreFiles || ["app/page.tsx"]).map(file => path.join(process.cwd(), file));
const globalExportMap: Record<string, string> = {};

// Run initial indexing and setup watchers
foldersToWatch.forEach((folder) => {
  const fullPath = path.join(process.cwd(), folder);
  updateIndexFile(fullPath, foldersToWatch, ignoreFiles, globalExportMap);
  addWatcher(fullPath, foldersToWatch, ignoreFiles, globalExportMap);
});