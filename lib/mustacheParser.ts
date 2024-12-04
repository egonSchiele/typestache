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
  sepBy,
  failure,
} from "tarsec";

import {
  CommentTag,
  ImplicitVariableTag,
  InvertedTag,
  Mustache,
  PartialTag,
  SectionTag,
  SimpleText,
  VariableTag,
} from "./types.js";

const _tagName: Parser<string[]> = sepBy(
  char("."),
  regexParser("([a-zA-Z0-9_]+)")
);

const tagName: Parser<string[]> = (input: string) => {
  const result = _tagName(input);
  if (result.success && result.result.length > 0) {
    return result;
  } else {
    return failure("must have at least one tag name", input);
  }
};

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

/* const ampersandVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  str("{{&"),
  optional(spaces),
  capture(many1Till(str("}}")), "name"),
  str("}}"),
  set("triple", true)
);
 */
const variableTag: Parser<VariableTag> = or(
  tripleVariableTag,
  /*   ampersandVariableTag, */
  doubleVariableTag
);

const doubleImplicitVariableTag: Parser<ImplicitVariableTag> = seqC(
  set("type", "implicit-variable"),
  str("{{"),
  optional(spaces),
  char("."),
  optional(spaces),
  str("}}"),
  set("triple", false)
);

const tripleImplicitVariableTag: Parser<ImplicitVariableTag> = seqC(
  set("type", "implicit-variable"),
  str("{{{"),
  optional(spaces),
  char("."),
  optional(spaces),
  str("}}}"),
  set("triple", true)
);

const implicitVariableTag: Parser<ImplicitVariableTag> = or(
  tripleImplicitVariableTag,
  doubleImplicitVariableTag
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
  or(
    variableTag,
    sectionTag,
    invertedTag,
    commentTag,
    partialTag,
    implicitVariableTag,
    textParser
  )
);

export const applyParsed = (
  contents: Mustache[],
  obj: Record<string, any>,
  currentContext: string[] = []
): string => {
  return contents
    .map((content) => {
      if (content.type === "text") {
        return content.content;
      }
      if (content.type === "variable") {
        return applyVariable(
          content,
          resolveDottedVariable(obj, [...currentContext, ...content.name])
        );
      }
      if (content.type === "section") {
        const variable = resolveDottedVariable(obj, content.name);
        return variable ? applyParsed(content.content, obj, content.name) : "";
      }
      if (content.type === "inverted") {
        const variable = resolveDottedVariable(obj, content.name);
        return variable ? "" : applyParsed(content.content, obj);
      }
      if (content.type === "comment") {
        return "";
      }
      if (content.type === "partial") {
        return `{{>${content.name}}}`;
      }
      if (content.type === "implicit-variable") {
        const variable = resolveDottedVariable(obj, currentContext);
        const str = variable ? variable.toString() : "";
        if (content.triple) {
          return str;
        }
        return escapeHTML(str);
      }
      return "";
    })
    .join("");
};

const resolveDottedVariable = (
  obj: Record<string, any>,
  name: string[]
): any => {
  let current = obj;
  for (const key of name) {
    if (current[key] === undefined) {
      return "";
    }
    current = current[key];
  }
  return current;
};

const escapedCharacters: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeHTML = (_str: string): string => {
  let str = _str;
  for (const [key, value] of Object.entries(escapedCharacters)) {
    str = str.replaceAll(key, value);
  }
  return str;
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
    return escapeHTML(str);
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
