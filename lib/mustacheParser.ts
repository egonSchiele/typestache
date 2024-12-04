import {
  between,
  capture,
  many1,
  manyTillStr,
  many1Till,
  or,
  seqC,
  regexParser,
  set,
  str,
  Parser,
  char,
  spaces,
  optional,
} from "tarsec";

import {
  CommentTag,
  InvertedTag,
  Mustache,
  PartialTag,
  SectionTag,
  SimpleText,
  VariableTag,
} from "./types.js";

const tagName: Parser<string> = regexParser("([a-zA-Z0-9_]+)");

const doubleVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  capture(between(str("{{"), str("}}"), tagName), "name"),
  set("triple", false)
);

const tripleVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  capture(between(str("{{{"), str("}}}"), tagName), "name"),
  set("triple", true)
);

const ampersandVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  str("{{&"),
  optional(spaces),
  capture(many1Till(str("}}")), "name"),
  str("}}"),
  set("triple", true)
);

const variableTag: Parser<VariableTag> = or(
  tripleVariableTag,
  ampersandVariableTag,
  doubleVariableTag
);

const textParser: Parser<SimpleText> = seqC(
  set("type", "text"),
  capture(many1Till(str("{{")), "content")
);

const commentTag: Parser<CommentTag> = seqC(
  set("type", "comment"),
  str("{{!"),
  capture(many1Till(str("}}")), "content"),
  str("}}")
);

const partialTag: Parser<PartialTag> = seqC(
  set("type", "partial"),
  capture(between(str("{{>"), str("}}"), tagName), "name")
);

const contentParser: Parser<Mustache[]> = many1(
  or(variableTag, commentTag, partialTag, textParser)
);

const sectionTag: Parser<SectionTag> = seqC(
  set("type", "section"),
  capture(between(str("{{#"), str("}}"), tagName), "name"),
  capture(contentParser, "content"),
  str("{{/"),
  tagName,
  str("}}")
);

const invertedTag: Parser<InvertedTag> = seqC(
  set("type", "inverted"),
  capture(between(str("{{^"), str("}}"), tagName), "name"),
  capture(contentParser, "content"),
  str("{{/"),
  tagName,
  str("}}")
);

export const mustacheParser: Parser<Mustache[]> = many1(
  or(variableTag, sectionTag, invertedTag, commentTag, partialTag, textParser)
);

export const applyParsed = (
  contents: Mustache[],
  obj: Record<string, any>
): string => {
  return contents
    .map((content) => {
      if (content.type === "text") {
        return content.content;
      }
      if (content.type === "variable") {
        return applyVariable(content, obj[content.name]);
      }
      if (content.type === "section") {
        return obj[content.name] ? applyParsed(content.content, obj) : "";
      }
      if (content.type === "inverted") {
        return obj[content.name] ? "" : applyParsed(content.content, obj);
      }
      if (content.type === "comment") {
        return "";
      }
      if (content.type === "partial") {
        return `{{>${content.name}}}`;
      }
      return "";
    })
    .join("");
};

const escapedCharacters: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const applyVariable = (content: VariableTag, variable: any): string => {
  if (variable === undefined || variable === null) {
    return "";
  }

  let str = variable;
  if (typeof variable === "number") {
    str = variable.toString();
  }

  if (!content.triple) {
    for (const [key, value] of Object.entries(escapedCharacters)) {
      str = str.replaceAll(key, value);
    }
  }
  return str;
};

export const apply = (str: string, obj: Record<string, any>): string => {
  const parsed = mustacheParser(str);
  if (parsed.success) {
    return applyParsed(parsed.result, obj);
  }
  return "";
};

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
