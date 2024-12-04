import { mustacheParser } from "./mustacheParser";
import { Mustache, TemplateParams } from "./types";

export const applyParsed = (
  contents: Mustache[],
  obj: TemplateParams,
  currentContext: string[] = []
): string => {
  return contents
    .map((content) => {
      if (content.type === "text") {
        return content.content;
      }
      if (content.type === "variable") {
        return renderVariable(
          deepSeek(obj, [...currentContext, ...content.name]),
          !content.triple
        );
      }
      if (content.type === "section") {
        const value = deepSeek(obj, content.name);
        if (!value) {
          return "";
        } else if (Array.isArray(value)) {
          return value
            .map((item) => applyParsed(content.content, item))
            .join("");
        } else {
          return applyParsed(content.content, value);
        }
      }
      if (content.type === "inverted") {
        const value = deepSeek(obj, content.name);
        return value ? "" : applyParsed(content.content, obj);
      }
      if (content.type === "comment") {
        return "";
      }
      if (content.type === "partial") {
        return `{{>${content.name}}}`;
      }
      if (content.type === "implicit-variable") {
        const value = deepSeek(obj, currentContext);
        return renderVariable(value, !content.triple);
      }
      return "";
    })
    .join("");
};

const deepSeek = (obj: TemplateParams, name: string[]): any => {
  if (
    typeof obj === "string" ||
    typeof obj === "boolean" ||
    typeof obj === "number"
  ) {
    return obj;
  }

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

const renderVariable = (variable: any, escape: boolean): string => {
  if (variable === undefined || variable === null) {
    return "";
  }

  let str = variable;
  if (typeof variable === "number") {
    str = variable.toString();
  }

  if (escape) {
    return escapeHTML(str);
  }
  return str;
};

export const apply = (str: string, obj: TemplateParams): string => {
  const parsed = mustacheParser(str);
  if (parsed.success) {
    return applyParsed(parsed.result, obj);
  }
  return "";
};
