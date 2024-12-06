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
