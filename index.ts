import { Mustache, genType, mustacheParser } from "./lib/index.js";

const template = "Hello {{name?}}!";
const parsed = mustacheParser(template);
console.log(JSON.stringify(parsed, null, 2));
if (!parsed.success) throw new Error("Failed to parse template");
console.log(genType(parsed.result!));
