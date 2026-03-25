import { describe, expect, it } from "vitest";
import { mustacheParser } from "./mustacheParser.js";

describe("Variable tags", () => {
  it("should parse simple variable tags correctly", () => {
    const template = "Hello {{name}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      { type: "variable", name: ["name"] },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse variable tags with a type correctly", () => {
    const template = "Hello {{name:string}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      {
        type: "variable",
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
      },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse variable tags with a type union correctly", () => {
    const template = "Hello {{name:string | number}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      {
        type: "variable",
        name: ["name"],
        varType: {
          name: ["string", "number"],
          optional: false,
        },
      },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse variable tags with a type union and no spaces correctly", () => {
    const template = "Hello {{name:string|number}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      {
        type: "variable",
        name: ["name"],
        varType: {
          name: ["string", "number"],
          optional: false,
        },
      },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse an optional type correctly", () => {
    const template = "Hello {{name?:string}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      {
        type: "variable",
        name: ["name"],
        varType: {
          name: ["string"],
          optional: true,
        },
      },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse an multiple types correctly", () => {
    const template = "Hello {{name?:string|number}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      {
        type: "variable",
        name: ["name"],
        varType: {
          name: ["string", "number"],
          optional: true,
        },
      },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse a variable as optional even if no type hint was given", () => {
    const template = "Hello {{name?}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      {
        type: "variable",
        name: ["name"],
        varType: {
          optional: true,
        },
      },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse section tags with a type union correctly", () => {
    const template = "{{#person:string | number}}{{name}}{{/person}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["person"],
        scope: "global",
        varType: {
          name: ["string", "number"],
          optional: false,
        },
        content: [
          {
            type: "variable",
            scope: "global",
            name: ["name"],
            varType: {
              optional: false,
            },
            triple: false,
          },
        ],
      },
    ]);
  });

  it("should parse section tags with an optional type correctly", () => {
    const template = "{{#person?}}{{name}}{{/person}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["person"],
        scope: "global",
        varType: {
          optional: true,
        },
        content: [
          {
            type: "variable",
            scope: "global",
            name: ["name"],
            varType: {
              optional: false,
            },
            triple: false,
          },
        ],
      },
    ]);
  });

  it("should parse section tags with an optional type + type union correctly", () => {
    const template = "{{#person?:string|number}}{{name}}{{/person}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["person"],
        scope: "global",
        varType: {
          name: ["string", "number"],
          optional: true,
        },
        content: [
          {
            type: "variable",
            scope: "global",
            name: ["name"],
            varType: {
              optional: false,
            },
            triple: false,
          },
        ],
      },
    ]);
  });
});

describe("Triple-brace variables", () => {
  it("should parse triple-brace variables", () => {
    const template = "Hello {{{name}}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      { type: "variable", name: ["name"], triple: true },
      { type: "text", content: "!" },
    ]);
  });

  it("should parse triple-brace variables with type hints", () => {
    const template = "{{{content:string}}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "variable",
        name: ["content"],
        triple: true,
        varType: { name: ["string"], optional: false },
      },
    ]);
  });
});

describe("Ampersand variables", () => {
  it("should parse ampersand variables", () => {
    const template = "Hello {{&name}}!";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      { type: "variable", name: ["name"], triple: true },
      { type: "text", content: "!" },
    ]);
  });
});

describe("Comment tags", () => {
  it("should parse comment tags", () => {
    const template = "Hello {{! this is a comment }}world";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "text", content: "Hello " },
      { type: "comment", content: " this is a comment " },
      { type: "text", content: "world" },
    ]);
  });
});

describe("Implicit variable", () => {
  it("should parse implicit variable {{.}}", () => {
    const template = "{{.}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "implicit-variable", triple: false },
    ]);
  });

  it("should parse triple-brace implicit variable {{{.}}}", () => {
    const template = "{{{.}}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "implicit-variable", triple: true },
    ]);
  });

  it("should parse ampersand implicit variable {{&.}}", () => {
    const template = "{{&.}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "implicit-variable", triple: true },
    ]);
  });
});

describe("Scope parsing", () => {
  it("should parse this. prefix as local scope", () => {
    const template = "{{this.name}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "variable", name: ["name"], scope: "local" },
    ]);
  });

  it("should parse global. prefix as global scope", () => {
    const template = "{{global.name}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "variable", name: ["name"], scope: "global" },
    ]);
  });

  it("should default to global scope without prefix", () => {
    const template = "{{name}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      { type: "variable", name: ["name"], scope: "global" },
    ]);
  });
});
