import fs from "fs";
import path from "path";
import chokidar from "chokidar";

let logQueue: string[] = [];

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const debouncedLog = debounce(logChanges, 500);

function logChanges() {
  if (logQueue.length > 0) {
    console.log(logQueue.join("\n"));
    logQueue = [];
  }
}

interface ExportDetail {
  name: string;
  type: "named" | "default";
}

function extractExportNames(filePath: string): ExportDetail[] {
  const content = fs.readFileSync(filePath, "utf8");
  const exportDetails: ExportDetail[] = [];

  // Named export regex
  const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
  let namedMatch;
  while ((namedMatch = namedExportRegex.exec(content)) !== null) {
    exportDetails.push({ name: namedMatch[1], type: "named" });
  }

  // Default export regex
  const defaultExportRegex = /export\s+default\s+(\w+)/;
  const defaultMatch = content.match(defaultExportRegex);
  if (defaultMatch && defaultMatch[1]) {
    exportDetails.push({ name: defaultMatch[1], type: "default" });
  }

  return exportDetails;
}

function shouldSkipIndexFileCreation(folderPath: string, watchedFolders: string[]): boolean {
  return watchedFolders.includes(folderPath);
}

function generateExportStatements(files: string[], folderPath: string, watchedFolders: string[], ignoreFiles: string[]): string[] {
  const exportLines: string[] = [];

  files.forEach((file) => {
    const fullPath = path.join(folderPath, file);
    const isDirectory = fs.lstatSync(fullPath).isDirectory();
    const isFileJsxTsx = file.endsWith(".jsx") || file.endsWith(".tsx");

    if (isDirectory) {
      updateIndexFile(fullPath, watchedFolders, ignoreFiles); // Recursively update index.tsx in subdirectories
      if (!shouldSkipIndexFileCreation(folderPath, watchedFolders)) {
        exportLines.push(`export * from "./${file}";`);
      }
    } else if (isFileJsxTsx && file !== "index.tsx" && !ignoreFiles.includes(fullPath)) {
      const exportDetails = extractExportNames(fullPath);

      if (exportDetails.length === 1 && exportDetails[0].type === "default") {
        exportLines.push(`export * from "./${path.basename(file, path.extname(file))}";`);
      } else if (exportDetails.find(({ type }) => type === "default")) {
        const defaultExport = exportDetails.find(({ type }) => type === "default")!;
        const namedExports = exportDetails.filter(({ type }) => type === "named").map(({ name }) => name).join(", ");
        if (namedExports) {
          exportLines.push(`export { default as ${defaultExport.name}, ${namedExports} } from "./${path.basename(file, path.extname(file))}";`);
        } else {
          exportLines.push(`export { default as ${defaultExport.name} } from "./${path.basename(file, path.extname(file))}";`);
        }
      } else if (exportDetails.length > 0) {
        const namedExports = exportDetails.map(({ name }) => name).join(", ");
        exportLines.push(`export { ${namedExports} } from "./${path.basename(file, path.extname(file))}";`);
      }
    }
  });

  return exportLines;
}

export function updateIndexFile(folderPath: string, watchedFolders: string[], ignoreFiles: string[]): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  if (shouldSkipIndexFileCreation(folderPath, watchedFolders)) {
    return;
  }

  const exportLines = generateExportStatements(files, folderPath, watchedFolders, ignoreFiles);
  const indexFilePath = path.join(folderPath, "index.tsx");

  fs.writeFileSync(indexFilePath, exportLines.join("\n"), { encoding: "utf8" });
  logQueue.push(`Updated ${indexFilePath}`);
  debouncedLog();
}

export function addWatcher(folderPath: string, watchedFolders: string[], ignoreFiles: string[]): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const watcher = chokidar.watch(folderPath, { persistent: true });

  watcher.on("add", (filePath) => {
    updateIndexFile(folderPath, watchedFolders, ignoreFiles);
    logQueue.push(`File added: ${filePath}`);
    debouncedLog();
  });

  watcher.on("unlink", (filePath) => {
    updateIndexFile(folderPath, watchedFolders, ignoreFiles);
    logQueue.push(`File removed: ${filePath}`);
    debouncedLog();
  });

  watcher.on("addDir", (dirPath) => {
    addWatcher(dirPath, watchedFolders, ignoreFiles);
    updateIndexFile(folderPath, watchedFolders, ignoreFiles);
    logQueue.push(`Directory added: ${dirPath}`);
    debouncedLog();
  });

  watcher.on("unlinkDir", (dirPath) => {
    updateIndexFile(folderPath, watchedFolders, ignoreFiles);
    logQueue.push(`Directory removed: ${dirPath}`);
    debouncedLog();
  });
}