import { Mustache, genType, mustacheParser } from "./lib/index.js";

const parsed: Mustache[] = [
  {
    type: "section",
    scope: "global",
    name: ["person"],
    varType: {
      optional: true,
    },
    content: [
      {
        type: "variable",
        scope: "local",
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
        triple: false,
      },
    ],
  },
];
const result = genType(parsed);
console.log(result);
