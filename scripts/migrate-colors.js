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

console.log(`Found ${files.length} TSX files to process\n`);

// Color replacement mappings
const replacements = [
  // Background colors - main surfaces
  { from: /bg-white\b/g, to: "bg-card" },
  { from: /bg-slate-50\b/g, to: "bg-background" },
  { from: /bg-slate-100\b/g, to: "bg-muted" },
  { from: /bg-slate-200\b/g, to: "bg-muted" },
  { from: /bg-slate-700\b/g, to: "bg-card" },
  { from: /bg-slate-800\b/g, to: "bg-card" },
  { from: /bg-slate-900\b/g, to: "bg-background" },
  
  // Blue (primary) colors
  { from: /bg-blue-50\b/g, to: "bg-primary/10" },
  { from: /bg-blue-100\b/g, to: "bg-primary/20" },
  { from: /bg-blue-400\b/g, to: "bg-primary" },
  { from: /bg-blue-500\b/g, to: "bg-primary" },
  { from: /bg-blue-600\b/g, to: "bg-primary" },
  { from: /bg-blue-700\b/g, to: "bg-primary" },
  { from: /bg-blue-900\/20\b/g, to: "bg-primary/20" },
  { from: /bg-blue-900\/40\b/g, to: "bg-primary/40" },
  
  // Green (success) colors
  { from: /bg-green-50\b/g, to: "bg-green-500/10" },
  { from: /bg-green-100\b/g, to: "bg-green-500/20" },
  { from: /bg-green-500\b/g, to: "bg-green-600" },
  { from: /bg-green-600\b/g, to: "bg-green-600" },
  { from: /bg-green-700\b/g, to: "bg-green-700" },
  { from: /bg-green-900\/40\b/g, to: "bg-green-600/40" },
  
  // Red (destructive) colors
  { from: /bg-red-50\b/g, to: "bg-destructive/10" },
  { from: /bg-red-100\b/g, to: "bg-destructive/20" },
  { from: /bg-red-900\/20\b/g, to: "bg-destructive/20" },
  { from: /bg-red-900\/30\b/g, to: "bg-destructive/30" },
  { from: /bg-red-900\/40\b/g, to: "bg-destructive/40" },
  
  // Orange/Yellow (warning) colors
  { from: /bg-orange-100\b/g, to: "bg-yellow-500/20" },
  { from: /bg-orange-900\/40\b/g, to: "bg-yellow-500/40" },
  { from: /bg-yellow-100\b/g, to: "bg-yellow-500/20" },
  
  // Border colors
  { from: /border-slate-200\b/g, to: "border-border" },
  { from: /border-slate-600\b/g, to: "border-border" },
  { from: /border-slate-700\b/g, to: "border-border" },
  { from: /border-blue-200\b/g, to: "border-primary" },
  { from: /border-blue-700\b/g, to: "border-primary" },
  { from: /border-green-200\b/g, to: "border-green-600" },
  { from: /border-red-200\b/g, to: "border-destructive" },
  { from: /border-red-700\b/g, to: "border-destructive" },
  
  // Text colors
  { from: /text-slate-400\b/g, to: "text-muted-foreground" },
  { from: /text-slate-600\b/g, to: "text-muted-foreground" },
  { from: /text-slate-700\b/g, to: "text-foreground" },
  { from: /text-slate-900\b/g, to: "text-foreground" },
  { from: /text-white\b/g, to: "text-primary-foreground" },
  { from: /text-blue-700\b/g, to: "text-primary" },
  { from: /text-blue-300\b/g, to: "text-primary" },
  { from: /text-green-700\b/g, to: "text-green-600" },
  { from: /text-green-300\b/g, to: "text-green-500" },
  { from: /text-red-700\b/g, to: "text-destructive" },
  { from: /text-red-300\b/g, to: "text-destructive" },
  { from: /text-orange-700\b/g, to: "text-yellow-600" },
  { from: /text-orange-300\b/g, to: "text-yellow-500" },
  
  // Hover states
  { from: /hover:bg-slate-50\b/g, to: "hover:bg-muted" },
  { from: /hover:bg-slate-100\b/g, to: "hover:bg-muted" },
  { from: /hover:bg-slate-200\b/g, to: "hover:bg-muted/80" },
  { from: /hover:bg-slate-600\b/g, to: "hover:bg-muted" },
  { from: /hover:bg-slate-700\b/g, to: "hover:bg-muted" },
  { from: /hover:bg-blue-700\b/g, to: "hover:bg-primary/90" },
  { from: /hover:bg-green-700\b/g, to: "hover:bg-green-700" },
  
  // Placeholder
  { from: /placeholder-slate-400\b/g, to: "placeholder:text-muted-foreground" },
  
  // Ring/focus
  { from: /ring-blue-500\b/g, to: "ring-primary" },
  { from: /focus:ring-blue-500\b/g, to: "focus:ring-primary" },
];

let totalReplacements = 0;

files.forEach((file) => {
  const fullPath = join(__dirname, "..", file);
  let content = readFileSync(fullPath, "utf-8");
  const originalContent = content;
  let fileReplacements = 0;

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(from, to);
    }
  });

  if (content !== originalContent) {
    writeFileSync(fullPath, content, "utf-8");
    console.log(`✓ ${file.replace("../", "")} - ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  }
});

console.log(`\n✨ Total: ${totalReplacements} color replacements across ${files.length} files`);
