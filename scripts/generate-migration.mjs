import { spawn } from "node:child_process";

const [, , rawName, ...extraArgs] = process.argv;

if (!rawName || rawName.startsWith("-")) {
  console.error("Usage: npm run migration:generate -- MigrationName");
  console.error("Example: npm run migration:generate -- AddBanners");
  process.exit(1);
}

const migrationName = rawName
  .trim()
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
  .replace(/^[^a-zA-Z]+/, "")
  .replace(/^./, (char) => char.toUpperCase());

if (!migrationName) {
  console.error("Migration name must contain at least one letter.");
  process.exit(1);
}

const command =
  process.platform === "win32" ? "typeorm-ts-node-esm.cmd" : "typeorm-ts-node-esm";

const args = [
  "migration:generate",
  `src/database/migrations/${migrationName}`,
  "-d",
  "src/database/data-source.ts",
  ...extraArgs,
];

const child = spawn(command, args, { stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
