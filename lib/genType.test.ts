import { describe, expect, it } from "vitest";
import { genType } from "./genType.js";
import { Mustache } from "./types.js";
const DEFAULT_TYPE = "__DEFAULT_TYPE__";

describe("genType", () => {
  it("should generate a type for a single variable", () => {
    const parsed: Mustache[] = [
      { type: "variable", triple: false, name: ["name"], scope: "global" },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string | boolean | number;
}`);
  });

  it("should generate a type for a single variable with a nested object", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["user", "name"],
        scope: "global",
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string | boolean | number;
  };
}`);
  });

  it("should generate a type for a section", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: boolean;
}`);
  });

  it("should generate a type for a section with nested vars", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          { type: "variable", scope: "global", triple: false, name: ["name"] },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: boolean;
  name: string | boolean | number;
}`);
  });

  it("If a variable is marked local to a context, render the correct type", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          { type: "variable", triple: false, name: ["name"], scope: "local" },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string | boolean | number;
  };
}`);
  });

  it("If a variable is marked local to a context, render the correct type, including a var with the same name in global scope", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          { type: "variable", triple: false, name: ["name"], scope: "local" },
        ],
      },
      {
        type: "variable",
        name: ["name"],
        triple: false,
        scope: "global",
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string | boolean | number;
  };
  name: string | boolean | number;
}`);
  });

  it("If a variable is marked global inside a context, render the correct type", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          { type: "variable", triple: false, name: ["name"], scope: "global" },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: boolean;
  name: string | boolean | number;
}`);
  });

  it("If a variable has a type hint, use that type", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
        scope: "global",
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string;
}`);
  });

  it("If a variable has a type hint, use that type (global scope)", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            scope: "global",
            varType: {
              name: ["string"],
              optional: false,
            },
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: boolean;
  name: string;
}`);
  });

  it("If a variable has a type hint, use that type (local scope)", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            scope: "local",
            varType: {
              name: ["string"],
              optional: false,
            },
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string;
  };
}`);
  });

  it("If a variable has a type hint, but scope is unclear, use that type (larger example)", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            varType: {
              name: ["string"],
              optional: false,
            },
            scope: "global",
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: boolean;
  name: string;
}`);
  });

  it("A variable's type hint needs to only be set to once", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
        scope: "global",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
        scope: "global",
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string;
}`);
  });

  it("A variable's type hint can be set more than once if its the same", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        scope: "global",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
        scope: "global",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
        scope: "global",
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string;
}`);
  });

  it("Conflicting type hints should raise an error", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
        scope: "global",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: {
          name: ["boolean"],
          optional: false,
        },
        scope: "global",
      },
    ];
    expect(() => genType(parsed)).toThrowError();
  });

  it("type hint + scope is unclear + same name var untyped", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        scope: "global",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
      },
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          {
            type: "variable",
            scope: "global",
            triple: false,
            name: ["name"],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string;
  user: boolean;
}`);
  });

  it("Type hints for local and global variables with the same name with the global variable outside the section", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        scope: "global",
        triple: false,
        name: ["name"],
        varType: {
          name: ["string"],
          optional: false,
        },
      },
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          {
            type: "variable",
            scope: "local",
            triple: false,
            name: ["name"],
            varType: {
              name: ["number"],
              optional: false,
            },
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string;
  user: {
    name: number;
  };
}`);
  });

  it("Within a section, type hints for both local and global variables with the same name.", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            varType: {
              name: ["string"],
              optional: false,
            },
            scope: "local",
          },
          {
            type: "variable",
            triple: false,
            name: ["name"],
            varType: {
              name: ["number"],
              optional: false,
            },
            scope: "global",
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string;
  };
  name: number;
}`);
  });

  it("Same variable used twice with no type definition", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        scope: "global",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
        scope: "global",
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string | boolean | number;
}`);
  });

  it("optional type", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        scope: "global",
        varType: {
          name: ["string"],
          optional: true,
        },
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name?: string;
}`);
  });

  it("optional type, no hint", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        scope: "global",
        varType: {
          optional: true,
        },
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name?: string | boolean | number;
}`);
  });

  it("optional section with hint", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
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
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  person?: string | number;
  name: string | boolean | number;
}`);
  });

  it("optional section, no hint", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        scope: "global",
        name: ["person"],
        varType: {
          optional: true,
        },
        content: [
          {
            type: "variable",
            scope: "local",
            name: ["name"],
            varType: {
              name: ["string"],
              optional: false,
            },
            triple: false,
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  person?: {
    name: string;
  };
}`);
  });
});
