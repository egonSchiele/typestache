import { Mustache } from "./types";

const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr));

export const genType = (parsed: Mustache[]): string => {
  const inner = uniq(
    parsed.map((content) => {
      if (content.type === "text") {
        return null;
      }
      if (content.type === "variable") {
        return `  ${content.name}: string | number | boolean`;
      }
      if (content.type === "section") {
        return `  ${content.name}: boolean`;
      }
      if (content.type === "inverted") {
        return `  ${content.name}: boolean`;
      }
      if (content.type === "comment") {
        return null;
      }
      if (content.type === "partial") {
        return null;
      }
      return null;
    })
  )
    .filter((x) => x !== null)
    .join(",\n");
  return `{\n${inner}\n}`;
};
