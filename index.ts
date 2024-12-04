import fs from "fs";
import { mustacheParser } from "./lib/mustacheParser.js";
import { apply } from "./lib/apply.js";
import { genType } from "./lib/genType.js";
import { Mustache } from "./lib/types.js";

const parsed: Mustache[] = [
  {
    type: "variable",
    triple: false,
    name: ["name"],
    varType: ["string"],
  },
  {
    type: "section",
    name: ["user"],
    content: [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: ["number"],
        scope: "local",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
      },
    ],
  },
];
const result = genType(parsed);
console.log(result);
