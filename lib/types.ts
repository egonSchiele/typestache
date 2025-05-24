export type MustacheTag =
  | VariableTag
  | ImplicitVariableTag
  | SectionTag
  | InvertedTag
  | CommentTag
  | PartialTag;

export type VarType = {
  name?: string[]; // e.g. ["string", "number"]
  optional: boolean;
};

export type VariableTag = {
  type: "variable";
  name: string[];
  triple: boolean;
  scope: "local" | "global";
  varType?: VarType;
};

export type ImplicitVariableTag = {
  type: "implicit-variable";
  triple: boolean;
};

export type SectionTag = {
  type: "section";
  name: string[];
  content: Mustache[];
  varType?: VarType;
};

export type InvertedTag = {
  type: "inverted";
  name: string[];
  content: Mustache[];
};

export type CommentTag = {
  type: "comment";
  content: string;
};

export type PartialTag = {
  type: "partial";
  name: string[];
};

export type Mustache = MustacheTag | SimpleText;

export type SimpleText = {
  type: "text";
  content: string;
};

export type TemplateParams = Record<string, any> | string | number | boolean;
