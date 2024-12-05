import {
  Parser,
  between,
  capture,
  char,
  failure,
  many1,
  many1Till,
  map,
  optional,
  or,
  regexParser,
  sepBy,
  seq,
  seqC,
  set,
  spaces,
  str,
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

const varType: Parser<string[]> = seq(
  [
    optional(spaces),
    str(":"),
    optional(spaces),
    capture(
      sepBy(or(str(" | "), char("|")), regexParser("([a-zA-Z0-9_]+)")),
      "varType"
    ),
  ],
  (r: any, c: any) => c.varType
);

const captureWithScope = (captures: VariableTag): VariableTag => {
  if (captures.name[0] === "this") {
    return {
      ...captures,
      scope: "local",
      name: captures.name.slice(1),
    };
  } else if (captures.name[0] === "global") {
    return {
      ...captures,
      scope: "global",
      name: captures.name.slice(1),
    };
  }
  return {
    ...captures,
    scope: "global",
  };
};

const doubleVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  set("scope", "global"),
  str("{{"),
  optional(spaces),
  capture(tagName, "name"),
  optional(capture(varType, "varType")),
  optional(spaces),
  str("}}"),
  set("triple", false)
);

const tripleVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  set("scope", "global"),
  str("{{{"),
  optional(spaces),
  capture(tagName, "name"),
  optional(capture(varType, "varType")),
  optional(spaces),
  str("}}}"),
  set("triple", true)
);

const ampersandVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  set("scope", "global"),
  str("{{"),
  optional(spaces),
  char("&"),
  optional(spaces),
  capture(tagName, "name"),
  optional(capture(varType, "varType")),
  optional(spaces),
  str("}}"),
  set("triple", true)
);

const variableTag: Parser<VariableTag> = map(
  or(tripleVariableTag, ampersandVariableTag, doubleVariableTag),
  captureWithScope
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

const ampersandImplicitVariableTag: Parser<ImplicitVariableTag> = seqC(
  set("type", "implicit-variable"),
  str("{{"),
  optional(spaces),
  char("&"),
  optional(spaces),
  char("."),
  optional(spaces),
  str("}}"),
  set("triple", true)
);

const implicitVariableTag: Parser<ImplicitVariableTag> = or(
  tripleImplicitVariableTag,
  ampersandImplicitVariableTag,
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
