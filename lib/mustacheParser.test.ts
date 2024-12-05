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
});
