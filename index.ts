import { Mustache, genType, mustacheParser } from "./lib/index.js";

const template = "{{#person[]}}{{this.name}}{{/person}}";
const parsed = mustacheParser(template);
if (parsed.success) {
  console.log(genType(parsed.result));
}
