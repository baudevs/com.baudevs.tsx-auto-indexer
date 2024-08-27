import path from "path";
import fs from "fs";
import process from "process";
import { updateIndexFile, addWatcher } from "./lib/indexer";

interface Config {
  foldersToWatch: string[];
  ignoreFiles: string[];
}

function parseArgs(): { watch: boolean } {
  const args = process.argv.slice(2);
  return {
    watch: !args.includes("--once"),
  };
}

// Read config file and parse
const configPath = path.join(process.cwd(), "config.json");
const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Default folders to watch if none provided, adding default ignored files
const foldersToWatch: string[] = config.foldersToWatch || ["app", "styles"];
const ignoreFiles: string[] = (config.ignoreFiles || ["app/page.tsx"]).map(file => path.join(process.cwd(), file));
const globalExportMap: Record<string, string> = {};

const { watch } = parseArgs();

function runIndexer() {
  foldersToWatch.forEach((folder) => {
    const fullPath = path.join(process.cwd(), folder);
    updateIndexFile(fullPath, foldersToWatch, ignoreFiles, globalExportMap);
  });
}

if (watch) {
  console.log("Starting in watch mode...");
  foldersToWatch.forEach((folder) => {
    const fullPath = path.join(process.cwd(), folder);
    addWatcher(fullPath, foldersToWatch, ignoreFiles, globalExportMap);
  });
} else {
  console.log("Running indexer once...");
  runIndexer();
}