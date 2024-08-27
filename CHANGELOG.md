# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2023-10-04

### Fixed

- Corrected the creation of `index.tsx` files to avoid generating them in root and directly watched folders.
- Enhanced `updateIndexFile` function to handle files with multiple named exports and default exports.
- Ensured correct handling of export statements for both named and default exports.

## [1.0.2] - 2023-10-04

### Fixed

- Corrected export handling for multiple named and default exports in generated `index.tsx` files.
- Named functions are now correctly exported using `export { functionName }`.
- Default functions are now correctly exported using `export functionName from './file'`.
- Improved `extractExportNames` function to accurately identify and parse all exports.
- Enhanced type annotations and ensured consistent module imports.

## [1.0.1] - 2023-10-04

### Fixed

- Added shebang line (`#!/usr/bin/env node`) to the entry point for correct script execution.
- Updated `package.json` to properly compile TypeScript and set the correct bin path.
- Fixed TypeScript type issues and ensured proper module imports.
- Ensured proper handling of the shebang in the compiled JavaScript.

## [1.0.0] - 2023-10-04

### Added

- Initial release of `tsx-auto-indexer` package.
- Automatically updates and manages `index.tsx` files for your project.
- Recursive directory indexing to ensure all exports are handled.
- Watch mode for specified directories, updating `index.tsx` files on changes.
- Basic configuration through `config.json`.
- Batched logging to reduce frequent logging and log updates in batches.