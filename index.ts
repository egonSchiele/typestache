import { Mustache, genType } from "./lib/index.js";

const parsed: Mustache[] = [
  {
    type: "variable",
    triple: false,
    name: ["name"],
    scope: "global",
  },
  {
    type: "variable",
    triple: false,
    name: ["name"],
    varType: ["string"],
    scope: "global",
  },
  {
    type: "variable",
    triple: false,
    name: ["name"],
    varType: ["string"],
    scope: "global",
  },
];
const result = genType(parsed);
console.log(result);
