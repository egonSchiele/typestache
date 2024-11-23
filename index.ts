import fs from "fs";
import { apply, genType, mustacheParser } from "./lib/mustacheParser.js";

const contents = fs.readFileSync("../sample.md", "utf8");
const result = mustacheParser(contents);
console.log(JSON.stringify(result, null, 2));

/* const contents2 = fs.readFileSync("../samples/terraform.md", "utf8");
const result2 = mustacheParser(contents2);

if (result2.success) {
  console.log(genType(result2.result));
}
 */
console.log(
  apply(contents, {
    name: "Chris",
    value: 10000,
    taxed_value: 10000 - 10000 * 0.4,
    in_ca: true,
  })
);
