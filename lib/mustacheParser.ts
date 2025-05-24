import {
  CaptureParser,
  Parser,
  PlainObject,
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
  trace,
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
  VarType,
} from "./types.js";

const _tagName: Parser<string[]> = sepBy(
  char("."),
  regexParser("([\\[\\]a-zA-Z0-9_]+)")
);

const tagName: Parser<string[]> = (input: string) => {
  const result = _tagName(input);
  if (result.success && result.result.length > 0) {
    return result;
  } else {
    return failure("must have at least one tag name", input);
  }
};

const optionalType: Parser<VarType> = seq(
  [optional(spaces), optional(capture(str("?"), "optional"))],
  (r: any, c: any) => {
    return {
      optional: !!c.optional,
    };
  }
);

const _varType: Parser<VarType> = seq(
  [
    optional(spaces),
    optional(capture(str("?"), "optional")),
    optional(spaces),
    str(":"),
    optional(spaces),
    capture(
      sepBy(or(str(" | "), char("|")), regexParser("([a-zA-Z0-9_]+)")),
      "name"
    ),
  ],
  (r: any, c: any) => {
    return {
      name: c.name,
      optional: !!c.optional,
    };
  }
);

const varType: Parser<VarType> = or(_varType, optionalType);

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

const captureSectionWithScope = (captures: any): any => {
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

const openingTag = (open: string, close: string) =>
  seqC(
    str(open),
    optional(spaces),
    capture(tagName, "name"),
    optional(capture(varType, "varType")),
    optional(spaces),
    str(close)
  );

export function captureCaptures<T extends PlainObject>(
  parser: Parser<T>
): CaptureParser<T, T> {
  return trace(`captureCaptures()`, (input: string) => {
    let result = parser(input);
    if (result.success) {
      return {
        ...result,
        captures: result.result,
      };
    }
    return result;
  });
}

const doubleVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  set("scope", "global"),
  captureCaptures(openingTag("{{", "}}")),
  set("triple", false)
);

const tripleVariableTag: Parser<VariableTag> = seqC(
  set("type", "variable"),
  set("scope", "global"),
  captureCaptures(openingTag("{{{", "}}}")),
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

const createMustacheParser = (): Parser<Mustache[]> =>
  many1(
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

const sectionTag: Parser<SectionTag> = map(
  seqC(
    set("type", "section"),
    captureCaptures(openingTag("{{#", "}}")),
    capture((input: string) => createMustacheParser()(input), "content"),
    str("{{/"),
    tagName,
    str("}}")
  ),
  captureSectionWithScope
);

const invertedTag: Parser<InvertedTag> = seqC(
  set("type", "inverted"),
  capture(between(str("{{^"), str("}}"), tagName), "name"),
  capture((input: string) => createMustacheParser()(input), "content"),
  str("{{/"),
  tagName,
  str("}}")
);

export const mustacheParser: Parser<Mustache[]> = createMustacheParser();
