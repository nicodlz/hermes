#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find all .tsx files
const files = execSync(
  'find apps/web/src -name "*.tsx"',
  { cwd: join(__dirname, ".."), encoding: "utf-8" }
)
  .trim()
  .split("\n")
  .filter(Boolean);

console.log(`Found ${files.length} TSX files to clean\n`);

// Patterns to clean up (when light and dark classes are identical)
const cleanupPatterns = [
  // Same class for both light and dark
  { from: /bg-card dark:bg-card/g, to: "bg-card" },
  { from: /bg-background dark:bg-background/g, to: "bg-background" },
  { from: /bg-muted dark:bg-muted/g, to: "bg-muted" },
  { from: /bg-primary dark:bg-primary/g, to: "bg-primary" },
  { from: /border-border dark:border-border/g, to: "border-border" },
  { from: /text-foreground dark:text-foreground/g, to: "text-foreground" },
  { from: /text-primary-foreground dark:text-primary-foreground/g, to: "text-primary-foreground" },
  { from: /text-muted-foreground dark:text-muted-foreground/g, to: "text-muted-foreground" },
  { from: /hover:bg-muted dark:hover:bg-muted/g, to: "hover:bg-muted" },
  { from: /ring-primary dark:ring-primary/g, to: "ring-primary" },
  { from: /focus:ring-primary dark:focus:ring-primary/g, to: "focus:ring-primary" },
];

let totalCleanups = 0;

files.forEach((file) => {
  const fullPath = join(__dirname, "..", file);
  let content = readFileSync(fullPath, "utf-8");
  const originalContent = content;
  let fileCleanups = 0;

  cleanupPatterns.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      fileCleanups += matches.length;
      content = content.replace(from, to);
    }
  });

  if (content !== originalContent) {
    writeFileSync(fullPath, content, "utf-8");
    console.log(`✓ ${file.replace("../", "")} - ${fileCleanups} cleanups`);
    totalCleanups += fileCleanups;
  }
});

console.log(`\n✨ Total: ${totalCleanups} duplicate classes removed across ${files.length} files`);
