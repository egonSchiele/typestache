export type MustacheTag =
  | VariableTag
  | SectionTag
  | InvertedTag
  | CommentTag
  | PartialTag;

export type VariableTag = {
  type: "variable";
  name: string;
};

export type SectionTag = {
  type: "section";
  name: string;
  content: Mustache[];
};

export type InvertedTag = {
  type: "inverted";
  name: string;
  content: Mustache[];
};

export type CommentTag = {
  type: "comment";
  content: string;
};

export type PartialTag = {
  type: "partial";
  name: string;
};

export type Mustache = MustacheTag | SimpleText;

export type SimpleText = {
  type: "text";
  content: string;
};
