import { mustacheParser } from "./mustacheParser.js";
import { Mustache, TemplateParams } from "./types.js";

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

/*
When we reference a variable, there are cases we need to handle.

The simplest one is when the variable name is a key in the object:

```ts
{
  user: "Adit"
}

{{user}}
```

However, Mustache also allows you to access variables that are nested within objects:

```ts
{
  user: {
    name: "Adit"
  }
}

{{user.name}}

```

When you use a section, that creates a context, and we need to look up the variable name within that context:

```ts
{
  user: {
    name: "Adit"
  }
}

{{#user}}{{name}}{{/user}}

``

Finally, even in the context, you can reference a top level variable:

```ts
{
  user: {
    name: "Adit"
  },
  greeting: "Hello"
}

{{#user}}{{greeting}}{{/user}}
```
*/
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
  } else if (typeof variable === "boolean") {
    str = variable ? "true" : "false";
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
