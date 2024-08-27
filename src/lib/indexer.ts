import fs from "fs";
import path from "path";
import chokidar from "chokidar";

let logQueue: string[] = [];

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
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
  originalName?: string;
}

function extractExportNames(filePath: string): ExportDetail[] {
  const content = fs.readFileSync(filePath, "utf8");
  const exportDetails: ExportDetail[] = [];

  // Named and async named export regex
  const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum|async function)\s+(\w+)/g;
  let namedMatch;
  while ((namedMatch = namedExportRegex.exec(content)) !== null) {
    exportDetails.push({ name: namedMatch[1], type: "named" });
  }

  // Default and async default export regex
  const defaultExportRegex = /export\s+default\s+(?:async\s+)?(\w+)/;
  const defaultMatch = content.match(defaultExportRegex);
  if (defaultMatch && defaultMatch[1]) {
    exportDetails.push({ name: defaultMatch[1], type: "default" });
  }

  return exportDetails;
}

function shouldSkipIndexFileCreation(folderPath: string, watchedFolders: string[]): boolean {
  return watchedFolders.includes(folderPath);
}

function generateExportStatements(files: string[], folderPath: string, watchedFolders: string[], ignoreFiles: string[], globalExportMap: Record<string, string>): string[] {
  const exportLines: string[] = [];

  files.forEach((file) => {
    const fullPath = path.join(folderPath, file);
    const isDirectory = fs.lstatSync(fullPath).isDirectory();
    const isFileJsxTsx = file.endsWith(".jsx") || file.endsWith(".tsx");

    if (isDirectory) {
      updateIndexFile(fullPath, watchedFolders, ignoreFiles, globalExportMap); // Recursively update index.tsx in subdirectories
      if (!shouldSkipIndexFileCreation(folderPath, watchedFolders)) {
        exportLines.push(`export * from "./${file}";`);
      }
    } else if (isFileJsxTsx && file !== "index.tsx" && !ignoreFiles.includes(fullPath)) {
      const exportDetails = extractExportNames(fullPath);
      const renamedDetails = exportDetails.map(detail => {
        if (globalExportMap[detail.name]) {
          detail.originalName = detail.name;
          detail.name = `${detail.originalName}As${path.basename(file, path.extname(file))}`;
        }
        globalExportMap[detail.name] = fullPath;
        return detail;
      });

      if (exportDetails.length === 1 && exportDetails[0].type === "default") {
        exportLines.push(`export * from "./${path.basename(file, path.extname(file))}";`);
      } else {
        const defaultExport = renamedDetails.find(({ type }) => type === "default");
        const namedExports = renamedDetails.filter(({ type }) => type === "named").map(({ name, originalName }) => (originalName ? `${originalName} as ${name}` : name));

        if (defaultExport) {
          exportLines.push(
            `export { default as ${defaultExport.name}${namedExports.length ? `, ${namedExports.join(", ")}` : ""} } from "./${path.basename(file, path.extname(file))}";`
          );
        } else if (namedExports.length > 0) {
          exportLines.push(`export { ${namedExports.join(", ")} } from "./${path.basename(file, path.extname(file))}";`);
        }
      }
    }
  });

  return exportLines;
}

export function updateIndexFile(folderPath: string, watchedFolders: string[], ignoreFiles: string[], globalExportMap: Record<string, string>): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  if (shouldSkipIndexFileCreation(folderPath, watchedFolders)) {
    return;
  }

  const exportLines = generateExportStatements(files, folderPath, watchedFolders, ignoreFiles, globalExportMap);
  const indexFilePath = path.join(folderPath, "index.tsx");

  fs.writeFileSync(indexFilePath, exportLines.join("\n"), { encoding: "utf8" });
  logQueue.push(`Updated ${indexFilePath}`);
  debouncedLog();
}

export function addWatcher(folderPath: string, watchedFolders: string[], ignoreFiles: string[], globalExportMap: Record<string, string>): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const watcher = chokidar.watch(folderPath, { persistent: true });

  watcher.on("add", (filePath) => {
    updateIndexFile(folderPath, watchedFolders, ignoreFiles, globalExportMap);
    logQueue.push(`File added: ${filePath}`);
    debouncedLog();
  });

  watcher.on("unlink", (filePath) => {
    updateIndexFile(folderPath, watchedFolders, ignoreFiles, globalExportMap);
    logQueue.push(`File removed: ${filePath}`);
    debouncedLog();
  });

  watcher.on("addDir", (dirPath) => {
    addWatcher(dirPath, watchedFolders, ignoreFiles, globalExportMap);
    updateIndexFile(folderPath, watchedFolders, ignoreFiles, globalExportMap);
    logQueue.push(`Directory added: ${dirPath}`);
    debouncedLog();
  });

  watcher.on("unlinkDir", (dirPath) => {
    updateIndexFile(folderPath, watchedFolders, ignoreFiles, globalExportMap);
    logQueue.push(`Directory removed: ${dirPath}`);
    debouncedLog();
  });
}