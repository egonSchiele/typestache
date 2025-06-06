import { describe, it, expect } from "vitest";
import { apply } from "./apply.js";
import { mustacheParser } from "./mustacheParser.js";

describe("Mustache Parser", () => {
  it("should parse variable tags correctly", () => {
    const template = "Hello {{name}}!";
    const context = { name: "World" };
    const result = apply(template, context);
    expect(result).toBe("Hello World!");
  });

  it("should parse text correctly", () => {
    const template = "This is just plain text.";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("This is just plain text.");
  });

  it("should handle comment tags correctly", () => {
    const template = "This is a {{! comment }} and not parsed.";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("This is a  and not parsed.");
  });

  it("should handle section tags correctly when the condition is true", () => {
    const template = "{{#condition}}Section content{{/condition}}";
    const context = { condition: true };
    const result = apply(template, context);
    expect(result).toBe("Section content");
  });

  it("should skip section tags when the condition is false", () => {
    const template = "{{#condition}}Section content{{/condition}}";
    const context = { condition: false };
    const result = apply(template, context);
    expect(result).toBe("");
  });

  it("should handle variables nested within sections", () => {
    const template = "{{#user}}{{this.name}}{{/user}}";
    const context = { user: { name: "Adit" } };
    const result = apply(template, context);
    expect(result).toBe("Adit");
  });

  it("should handle top level variables nested within sections", () => {
    const template = "{{#user}}{{greeting}}{{/user}}";
    const context = { user: { name: "Adit" }, greeting: "Hello" };
    const result = apply(template, context);
    expect(result).toBe("Hello");
  });

  it("should handle inverted tags correctly when the condition is false", () => {
    const template = "{{^condition}}Inverted content{{/condition}}";
    const context = { condition: false };
    const result = apply(template, context);
    expect(result).toBe("Inverted content");
  });

  it("should skip inverted tags when the condition is true", () => {
    const template = "{{^condition}}Inverted content{{/condition}}";
    const context = { condition: true };
    const result = apply(template, context);
    expect(result).toBe("");
  });

  // Not supported yet
  /*   it("should handle nested sections correctly", () => {
    const template = "{{#outer}}Outer {{#inner}}Inner{{/inner}}{{/outer}}";
    const context = { outer: true, inner: true };
    const result = apply(template, context);
    expect(result).toBe("Outer Inner");
  });
 */
  it("should handle partial tags", () => {
    const template = "Main content {{>partialName}}";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("Main content {{>partialName}}");
  });

  it("should return empty string for invalid input", () => {
    const template = "{{#unmatchedTag}}Content";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("");
  });

  it("should handle local vars", () => {
    const template = "{{#person}}{{this.name}}{{/person}}";
    const context = {
      person: {
        name: "Adit",
      },
      name: "Not Adit",
    };
    const result = apply(template, context);
    expect(result).toBe("Adit");
  });

  it("should handle global vars", () => {
    const template = "{{#person}}{{global.name}}{{/person}}";
    const context = {
      person: {
        name: "Adit",
      },
      name: "Not Adit",
    };
    const result = apply(template, context);
    expect(result).toBe("Not Adit");
  });
});
