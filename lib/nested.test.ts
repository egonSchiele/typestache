import { describe, expect, it } from "vitest";
import { mustacheParser } from "./mustacheParser.js";

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
        scope: "global",
        content: [
          {
            type: "section",
            name: ["inner"],
            scope: "global",
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

  it("should parse nested local section tags correctly", () => {
    const template =
      "{{#outer}}{{#this.inner}}{{value}}{{/this.inner}}{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["outer"],
        scope: "global",
        content: [
          {
            type: "section",
            name: ["inner"],
            scope: "local",
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
    const template =
      "{{#level1}}{{#level2}}{{#level3}}{{value}}{{/level3}}{{/level2}}{{/level1}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["level1"],
        scope: "global",
        content: [
          {
            type: "section",
            name: ["level2"],
            scope: "global",
            content: [
              {
                type: "section",
                name: ["level3"],
                scope: "global",
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
        scope: "global",
        content: [
          {
            type: "inverted",
            name: ["inner"],
            scope: "global",
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
    const template =
      "{{#section}}{{^inverted}}{{value}}{{/inverted}}{{/section}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["section"],
        scope: "global",
        content: [
          {
            type: "inverted",
            name: ["inverted"],
            scope: "global",
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

  it("should parse mixed nested section and local scope inverted tags correctly", () => {
    const template =
      "{{#section}}{{^this.inverted}}{{value}}{{/this.inverted}}{{/section}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["section"],
        scope: "global",
        content: [
          {
            type: "inverted",
            name: ["inverted"],
            scope: "local",
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
    const template =
      "{{#outer}}Before {{#inner}}{{value}}{{/inner}} After{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["outer"],
        scope: "global",
        content: [
          { type: "text", content: "Before " },
          {
            type: "section",
            name: ["inner"],
            scope: "global",
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

  it("should parse nested section tags with local content correctly", () => {
    const template = "{{#outer}}{{#inner}}{{this.value}}{{/inner}}{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["outer"],
        scope: "global",
        content: [
          {
            type: "section",
            name: ["inner"],
            scope: "global",
            content: [
              {
                type: "variable",
                name: ["value"],
                scope: "local",
                triple: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should parse nested local section tags with local content correctly", () => {
    const template =
      "{{#outer}}{{#this.inner}}{{this.value}}{{/this.inner}}{{/outer}}";
    const result = mustacheParser(template);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.result).toMatchObject([
      {
        type: "section",
        name: ["outer"],
        scope: "global",
        content: [
          {
            type: "section",
            name: ["inner"],
            scope: "local",
            content: [
              {
                type: "variable",
                name: ["value"],
                scope: "local",
                triple: false,
              },
            ],
          },
        ],
      },
    ]);
  });
});
