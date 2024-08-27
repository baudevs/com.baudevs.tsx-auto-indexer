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

interface ExportDetail {
  name: string;
  type: 'named' | 'default';
}

function extractExportNames(filePath: string): ExportDetail[] {
  const content = fs.readFileSync(filePath, "utf8");
  const exportDetails: ExportDetail[] = [];

  // Named export regex
  const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
  let namedMatch;
  while ((namedMatch = namedExportRegex.exec(content)) !== null) {
    exportDetails.push({ name: namedMatch[1], type: 'named' });
  }

  // Default export regex
  const defaultExportRegex = /export\s+default\s+(\w+)/;
  const defaultMatch = content.match(defaultExportRegex);
  if (defaultMatch && defaultMatch[1]) {
    exportDetails.push({ name: defaultMatch[1], type: 'default' });
  }

  return exportDetails;
}

export function updateIndexFile(folderPath: string, watchedFolders: string[]): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  const isRootFolder = watchedFolders.includes(folderPath);

  const exportLines: string[] = [];

  files.forEach(file => {
    const fullPath = path.join(folderPath, file);
    const isDirectory = fs.lstatSync(fullPath).isDirectory();
    const isFileJs = file.endsWith(".jsx") || file.endsWith(".tsx");

    if (isDirectory) {
      updateIndexFile(fullPath, watchedFolders); // Recursively update index.tsx in subdirectories
      if (!isRootFolder) {
        exportLines.push(`export * from "./${file}";`);
      }
    } else if (isFileJs && file !== "index.tsx") {
      const exportDetails = extractExportNames(fullPath);
      exportDetails.forEach(({ name, type }) => {
        if (type === 'default') {
          exportLines.push(`export ${name} from "./${path.basename(file, path.extname(file))}";`);
        } else {
          exportLines.push(`export { ${name} } from "./${path.basename(file, path.extname(file))}";`);
        }
      });

    }
  });

  if (!isRootFolder) {
    const indexFilePath = path.join(folderPath, "index.tsx");
    fs.writeFileSync(indexFilePath, exportLines.join("\n"), { encoding: "utf8" });
    logQueue.push(`Updated ${indexFilePath}`);
  }

  debouncedLog();
}

export function addWatcher(folderPath: string, watchedFolders: string[]): void {
  if (!fs.existsSync(folderPath)) {
    console.warn(`Directory not found: ${folderPath}`);
    return;
  }

  const watcher = chokidar.watch(folderPath, { persistent: true });

  watcher.on("add", (filePath) => {
    updateIndexFile(folderPath, watchedFolders);
    logQueue.push(`File added: ${filePath}`);
    debouncedLog();
  });

  watcher.on("unlink", (filePath) => {
    updateIndexFile(folderPath, watchedFolders);
    logQueue.push(`File removed: ${filePath}`);
    debouncedLog();
  });

  watcher.on("addDir", (dirPath) => {
    addWatcher(dirPath, watchedFolders);
    updateIndexFile(folderPath, watchedFolders);
    logQueue.push(`Directory added: ${dirPath}`);
    debouncedLog();
  });

  watcher.on("unlinkDir", (dirPath) => {
    updateIndexFile(folderPath, watchedFolders);
    logQueue.push(`Directory removed: ${dirPath}`);
    debouncedLog();
  });
}