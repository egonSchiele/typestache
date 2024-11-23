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

const variableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  capture(between(str("{{"), str("}}"), tagName), "name")
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
  obj: Record<string, string | boolean | number>
): string => {
  return contents
    .map((content) => {
      if (content.type === "text") {
        return content.content;
      }
      if (content.type === "variable") {
        return obj[content.name] as string;
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

export const apply = (
  str: string,
  obj: Record<string, string | boolean | number>
): string => {
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
        return `  ${content.name}: string`;
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
