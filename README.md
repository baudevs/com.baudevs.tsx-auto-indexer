# tsx-auto-indexer

**tsx-auto-indexer** is a powerful tool that automatically updates and manages `index.tsx` files for your project. It ensures that your exports are organized, reducing manual work and errors.

## Features

- **Automatic Indexing**: Automatically updates `index.tsx` files to export components and modules.
- **Recursive Directory Handling**: Recursively updates index files for all subdirectories.
- **Watch Mode**: Watches specified folders for file changes and updates the index files accordingly.
- **Run Once Mode**: Run the script just once without watching for changes.
- **Configurable**: Allows configuration of folders to watch through a JSON config file.
- **Batched Logging**: Reduces frequent logging and logs updates in batches.

## Installation

To install the `tsx-auto-indexer` globally, use:

```bash
npm install -g @baudevs/tsx-auto-indexer
```

## Usage

### Create a Config File

Create a file in the root directory of your project with the following structure:

```json
{
  "foldersToWatch": ["app", "styles", "public/img"]
}
```

### Run the Indexer

To start the indexer, run:

```batch
tsx-auto-indexer
```

This will read the config file and start watching the specified folders. It will automatically update files when changes are detected.

### Run the Indexer Once

To run the indexer just once without watching for file changes, run:

```bash
tsx-auto-indexer --once
```

This will read the config file and generate all indexes in a single run without keeping the watcher active.

## Example

### Config File Example

```json
{
  "foldersToWatch": ["src/components", "src/utils"]
}
```

### Directory Structure Example

```bash
project-root/
│
├── config.json       # Configuration file for tsx-auto-indexer
├── src/
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   └── index.tsx  # Auto-generated by tsx-auto-indexer
│   └── utils/
│       ├── calculate.js
│       ├── format.js
│       └── index.tsx  # Auto-generated by tsx-auto-indexer
└── package.json
```

After running tsx-auto-indexer, the files will be updated to export all components and utilities.

## Development

### Prerequisites

- Node.js
- npm (Node Package Manager)
- TypeScript

### Setup

1. Clone the Repository
2. git clone <https://github.com/baudevs/tsx-auto-indexer.git>
3. cd tsx-auto-indexer
4. Install Dependencies
5. npm install

### Build the Project

```bash
npm run build
```

### Run in Development Mode

```bash
npm run dev
```

### Project Structure

```bash
tsx-auto-indexer/
│
├── src/
│   ├── index.ts       # Entry point of the package
│   └── lib/
│       └── indexer.ts # Core logic for indexing and watching
├── dist/              # Compiled JavaScript files
├── config.json        # Example config file
├── package.json       # npm package metadata
├── tsconfig.json      # TypeScript configuration
└── README.md          # Documentation
```

### Scripts

- npm run build: Compiles TypeScript to JavaScript.
- npm run dev: Runs the project in development mode using ts-node.
- npm start: Runs the compiled JavaScript files.


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Steps to Contribute

- Fork the repository.
- Create a new branch: git checkout -b feature/your-feature-name.
- Make your changes and commit them: git commit -m 'Add some feature'.
- Push to the branch: git push origin feature/your-feature-name.
- Open a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For any questions or support, please open an issue in this repository.

Happy coding!

***tsx-auto-indexer - Automatically manage and organize your TypeScript exports.***
