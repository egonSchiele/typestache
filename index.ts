import { Mustache, genType, mustacheParser } from "./lib/index.js";

const template = "Hello {{name:string?}}!";
const parsed = mustacheParser(template);
console.log(JSON.stringify(parsed, null, 2));
