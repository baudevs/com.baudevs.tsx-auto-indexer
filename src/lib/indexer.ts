import fs from "fs";
import path from "path";
import chokidar from "chokidar";

let logQueue: string[] = [];

const debouncedLog = debounce(logChanges, 500);

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function logChanges() {
  if (logQueue.length > 0) {
    console.log(logQueue.join("\n"));
    logQueue = [];
  }
}

function extractExportName(filePath: string): string | null {
  const content = fs.readFileSync(filePath, "utf8");
  const exportRegex = /export\s+{\s*(\w+)\s*}\s+from\s+["'`].\/(\w+)["'`];/;
  const match = content.match(exportRegex);

  if (match && match[1]) {
    return match[1];
  }

  const defaultExportRegex = /export\s+default\s+(\w+)/;
  const defaultMatch = content.match(defaultExportRegex);

  if (defaultMatch && defaultMatch[1]) {
    return defaultMatch[1];
  }

  return null;
}

export function updateIndexFile(folderPath: string): void {
  if (!fs.existsSync(folderPath)) { 
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  const exportLines: string[] = [];

  files.forEach(file => {
    const fullPath = path.join(folderPath, file);
    const isDirectory = fs.lstatSync(fullPath).isDirectory();
    const isFileJs = file.endsWith(".jsx") || file.endsWith(".tsx");

    if (isDirectory) {
      updateIndexFile(fullPath); // Recursively update index.tsx in subdirectories
      exportLines.push(`export * from "./${file}";`);
    } 
    else if (isFileJs && file !== "index.tsx") {
      const exportName = extractExportName(fullPath) || path.basename(file, path.extname(file));
      exportLines.push(`export { ${exportName} } from "./${path.basename(file, path.extname(file))}";`);
    }
  });

  const indexFilePath = path.join(folderPath, "index.tsx");
  fs.writeFileSync(indexFilePath, exportLines.join("\n"), { encoding: "utf8" });
  logQueue.push(`Updated ${indexFilePath}`);
  debouncedLog();
}

export function addWatcher(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const watcher = chokidar.watch(folderPath, { persistent: true });

  watcher.on("add", (filePath) => {
    updateIndexFile(folderPath);
    logQueue.push(`File added: ${filePath}`);
    debouncedLog();
  });

  watcher.on("unlink", (filePath) => {
    updateIndexFile(folderPath);
    logQueue.push(`File removed: ${filePath}`);
    debouncedLog();
  });

  watcher.on("addDir", (dirPath) => {
    addWatcher(dirPath);
    updateIndexFile(folderPath);
    logQueue.push(`Directory added: ${dirPath}`);
    debouncedLog();
  });

  watcher.on("unlinkDir", (dirPath) => {
    updateIndexFile(folderPath);
    logQueue.push(`Directory removed: ${dirPath}`);
    debouncedLog();
  });
}