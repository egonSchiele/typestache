#!/usr/bin/env node
import fs from "fs";
import path from "path";
import process from "process";
import { genType, mustacheParser, Mustache } from "../lib/index.js";
import { Command, OptionValues } from "commander";

const FgYellow = "\x1b[33m";
const FgGreen = "\x1b[32m";
const FgRed = "\x1b[31m";
const FgReset = "\x1b[0m";

export function findFilesRecursively(dir: string, pattern: string): string[] {
  var results: string[] = [];
  function walk(dir: string) {
    var files = fs.readdirSync(dir);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
      var file = files_1[_i];
      var filePath = path.join(dir, file);
      var stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith(pattern)) {
        results.push(filePath);
      }
    }
  }
  walk(dir);
  return results;
}

const program = new Command();

program
  .name("typestache")
  .description("Generate TypeScript types from mustache templates")
  .version("0.3.0")
  .argument("<directory>", "directory to process")
  .option("-d, --dry-run", "show what would be done without making changes")
  .option("-v, --verbose", "enable verbose output")
  .parse();

const options = program.opts();
const dirName = program.args[0];

if (!fs.existsSync(dirName)) {
  console.error(`Directory ${dirName} does not exist.`);
  process.exit(1);
} else if (!fs.lstatSync(dirName).isDirectory()) {
  console.error(`${dirName} is not a directory.`);
  process.exit(1);
}
if (options.verbose) {
  console.log("==========================");
  console.log("Directory name:", FgYellow, dirName, FgReset);
  console.log("Absolute path: ", path.resolve(dirName));
  console.log("==========================\n");
}

var templateFiles = findFilesRecursively(dirName, ".mustache");
templateFiles.forEach(function (templateFile) {
  if (options.verbose) {
    console.log(`${FgYellow}PROCESSING`, FgReset, templateFile);
  }
  var contents = fs.readFileSync(templateFile, "utf-8");
  var parsed = mustacheParser(contents);
  if (parsed.success) {
    writeTemplateFile(contents, parsed.result, templateFile, options);
  } else {
    // @ts-ignore
    console.error("couldn't parse", templateFile, parsed.message);
  }
});
function writeTemplateFile(
  contents: string,
  parsed: Mustache[],
  templateFile: string,
  options: OptionValues
) {
  const indexStr = `// THIS FILE WAS AUTO-GENERATED
// Source: ${templateFile}
// Any manual changes will be lost.
import { apply } from "typestache";

export const template = \`${contents.replaceAll("`", "\\`")}\`;

export type TemplateType = ${genType(parsed)};

const render = (args: TemplateType) => {
  return apply(template, args);
}

export default render;
    `;
  var outPath = templateFile.replace(".mustache", ".ts");

  if (options.dryRun) {
    console.log(`[DRY RUN] Would write to: ${outPath}`);
  } else {
    fs.writeFileSync(outPath, indexStr);
    if (options.verbose) {
      console.log(`${FgYellow}WROTE     `, FgGreen, outPath, FgReset);
    }
  }
}
