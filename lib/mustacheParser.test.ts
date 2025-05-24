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

describe("Nested blocks", () => {
  it("should parse nested section tags correctly", () => {
    const template = "{{#outer}}{{#inner}}{{value}}{{/inner}}{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["outer"],
        content: [
          {
            type: "section",
            name: ["inner"],
            content: [
              {
                type: "variable",
                name: ["value"],
                scope: "global",
                triple: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should parse deeply nested section tags correctly", () => {
    const template = "{{#level1}}{{#level2}}{{#level3}}{{value}}{{/level3}}{{/level2}}{{/level1}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["level1"],
        content: [
          {
            type: "section",
            name: ["level2"],
            content: [
              {
                type: "section",
                name: ["level3"],
                content: [
                  {
                    type: "variable",
                    name: ["value"],
                    scope: "global",
                    triple: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should parse nested inverted tags correctly", () => {
    const template = "{{^outer}}{{^inner}}{{value}}{{/inner}}{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "inverted",
        name: ["outer"],
        content: [
          {
            type: "inverted",
            name: ["inner"],
            content: [
              {
                type: "variable",
                name: ["value"],
                scope: "global",
                triple: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should parse mixed nested section and inverted tags correctly", () => {
    const template = "{{#section}}{{^inverted}}{{value}}{{/inverted}}{{/section}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["section"],
        content: [
          {
            type: "inverted",
            name: ["inverted"],
            content: [
              {
                type: "variable",
                name: ["value"],
                scope: "global",
                triple: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should parse nested blocks with text content correctly", () => {
    const template = "{{#outer}}Before {{#inner}}{{value}}{{/inner}} After{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["outer"],
        content: [
          { type: "text", content: "Before " },
          {
            type: "section",
            name: ["inner"],
            content: [
              {
                type: "variable",
                name: ["value"],
                scope: "global",
                triple: false,
              },
            ],
          },
          { type: "text", content: " After" },
        ],
      },
    ]);
  });
});
