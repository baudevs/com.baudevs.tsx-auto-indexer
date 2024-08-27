import path from "path";
import fs from "fs";
import { updateIndexFile, addWatcher } from "./lib/indexer";

interface Config {
  foldersToWatch: string[];
}

// Ensure this line is added, it will be included in the compiled JavaScript
console.log("#!/usr/bin/env node");

// Read config file and parse
const configPath = path.join(process.cwd(), "config.json");
const config: Config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Default folders to watch if none provided
const foldersToWatch: string[] = config.foldersToWatch || ["app", "styles"];

// Run initial indexing and setup watchers
foldersToWatch.forEach((folder) => {
  const fullPath = path.join(process.cwd(), folder);
  updateIndexFile(fullPath, foldersToWatch);
  addWatcher(fullPath, foldersToWatch);
});