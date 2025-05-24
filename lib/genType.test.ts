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

describe("Nested block type generation", () => {
  it("should generate types for nested sections with local variables", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        name: ["in_ca"],
        content: [
          {
            type: "section",
            name: ["person"],
            content: [
              {
                type: "variable",
                scope: "local",
                triple: false,
                name: ["name"],
              },
            ],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  in_ca: {
    person: {
      name: string | boolean | number;
    };
  };
}`);
  });

  it("should generate types for nested sections with this.attrs pattern", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        name: ["person"],
        content: [
          {
            type: "section",
            name: ["this", "attrs"],
            content: [
              {
                type: "variable",
                scope: "local",
                triple: false,
                name: ["name"],
              },
            ],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  person: {
    attrs: {
      name: string | boolean | number;
    };
  };
}`);
  });

  it("should generate types for nested sections with array notation", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        name: ["person"],
        content: [
          {
            type: "section",
            name: ["this", "connections[]"],
            content: [
              {
                type: "variable",
                scope: "local",
                triple: false,
                name: ["name"],
              },
            ],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  person: {
    connections: {
      name: string | boolean | number;
    }[];
  };
}`);
  });

  it("should generate types for deeply nested sections", () => {
    const parsed: Mustache[] = [
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
                    scope: "local",
                    triple: false,
                    name: ["value"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  level1: {
    level2: {
      level3: {
        value: string | boolean | number;
      };
    };
  };
}`);
  });

  it("should generate types for nested inverted sections", () => {
    const parsed: Mustache[] = [
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
                scope: "local",
                triple: false,
                name: ["value"],
              },
            ],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  outer: string | boolean | number;
  inner: string | boolean | number;
}`);
  });

  it("should generate types for mixed nested sections and inverted sections", () => {
    const parsed: Mustache[] = [
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
                scope: "local",
                triple: false,
                name: ["value"],
              },
            ],
          },
        ],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  section: {
    inverted: string | boolean | number;
  };
}`);
  });
});
