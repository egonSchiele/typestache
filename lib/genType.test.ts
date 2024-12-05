import { describe, expect, it } from "vitest";
import { nestedObj, mergeObj, renderObj, genType } from "./genType.js";
import { Mustache } from "./types.js";
const DEFAULT_TYPE = "__DEFAULT_TYPE__";
describe("nestedObj", () => {
  it("should return an object with a single key", () => {
    const result = nestedObj(["name"]);
    expect(result).toEqual({ name: [DEFAULT_TYPE] });
  });

  it("should return an object with a single key and a nested object", () => {
    const result = nestedObj(["user", "name"]);
    expect(result).toEqual({ user: { name: [DEFAULT_TYPE] } });
  });

  it("should return an object with a single key and a nested array", () => {
    const result = nestedObj(["user", "emails", "address"]);
    expect(result).toEqual({
      user: { emails: { address: [DEFAULT_TYPE] } },
    });
  });
});

describe("mergeObj", () => {
  it("should merge two objects with a single key", () => {
    const obj1 = { name: ["string"] };
    const obj2 = { age: ["number"] };
    const result = mergeObj(obj1, obj2);
    expect(result).toEqual({ name: ["string"], age: ["number"] });
  });

  it("should merge two objects with a single key and a nested object", () => {
    const obj1 = { user: { name: ["string"] } };
    const obj2 = { user: { age: ["number"] } };
    const result = mergeObj(obj1, obj2);
    expect(result).toEqual({ user: { name: ["string"], age: ["number"] } });
  });

  it("should merge two objects with a single key and a nested array", () => {
    const obj1 = { user: { emails: { address: ["string"] } } };
    const obj2 = { user: { emails: { verified: ["boolean"] } } };
    const result = mergeObj(obj1, obj2);
    expect(result).toEqual({
      user: { emails: { address: ["string"], verified: ["boolean"] } },
    });
  });
});

describe("renderObj", () => {
  it("should render an object with a single key", () => {
    const obj = { name: ["string"] };
    const result = renderObj(obj);
    expect(result).toBe(`{
  name: string;
}`);
  });

  it("should render an object with a single key and a nested object", () => {
    const obj = { user: { name: ["string"] } };
    const result = renderObj(obj);
    expect(result).toBe(`{
  user: {
    name: string;
  };
}`);
  });

  it("should render an object with a nested array with multiple entries", () => {
    const obj = { user: { emails: { address: ["string", "number"] } } };
    const result = renderObj(obj);
    expect(result).toBe(`{
  user: {
    emails: {
      address: string | number;
    };
  };
}`);
  });

  it("should render an object with a nested array with multiple entries, including an object", () => {
    const obj = {
      user: { emails: { address: ["string", { zip: ["number"] }] } },
    };
    const result = renderObj(obj);
    expect(result).toBe(`{
  user: {
    emails: {
      address: string | {
        zip: number;
      };
    };
  };
}`);
  });
});

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
        varType: ["string"],
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
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            scope: "global",
            varType: ["string"],
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
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            scope: "local",
            varType: ["string"],
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
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            varType: ["string"],
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
        varType: ["string"],
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

  it("Conflicting type hints should raise an error", () => {
    const parsed: Mustache[] = [
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: ["string"],
        scope: "global",
      },
      {
        type: "variable",
        triple: false,
        name: ["name"],
        varType: ["boolean"],
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
        varType: ["string"],
      },
      {
        type: "section",
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
        varType: ["string"],
      },
      {
        type: "section",
        name: ["user"],
        content: [
          {
            type: "variable",
            scope: "local",
            triple: false,
            name: ["name"],
            varType: ["number"],
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
        name: ["user"],
        content: [
          {
            type: "variable",
            triple: false,
            name: ["name"],
            varType: ["string"],
            scope: "local",
          },
          {
            type: "variable",
            triple: false,
            name: ["name"],
            varType: ["number"],
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
});
