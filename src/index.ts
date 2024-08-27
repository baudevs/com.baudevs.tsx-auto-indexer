// src/index.ts
import path from "path";
import { updateIndexFile, addWatcher } from "./lib/indexer";
import * as fs from 'fs';

interface Config {
  foldersToWatch: string[];
}

// Ensure this line is added, it will be included in the compiled JavaScript
console.log("#!/usr/bin/env node");

// Read config file and parse
const configPath = path.join(process.cwd(), 'config.json');
const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Default folders to watch if none provided
const foldersToWatch: string[] = config.foldersToWatch || ["app", "styles", "public/img"];

// Run initial indexing and setup watchers
foldersToWatch.forEach((folder) => {
  const fullPath = path.join(process.cwd(), folder);
  updateIndexFile(fullPath);
  addWatcher(fullPath);
});