import { describe, expect, it } from "vitest";
import { nestedObj, mergeObj, renderObj, genType } from "./genType.js";
import { Mustache } from "./types.js";

describe("nestedObj", () => {
  it("should return an object with a single key", () => {
    const result = nestedObj(["name"]);
    expect(result).toEqual({ name: ["string"] });
  });

  it("should return an object with a single key and a nested object", () => {
    const result = nestedObj(["user", "name"]);
    expect(result).toEqual({ user: { name: ["string"] } });
  });

  it("should return an object with a single key and a nested array", () => {
    const result = nestedObj(["user", "emails", "address"]);
    expect(result).toEqual({ user: { emails: { address: ["string"] } } });
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
  }
}`);
  });

  it("should render an object with a nested array with multiple entries", () => {
    const obj = { user: { emails: { address: ["string", "number"] } } };
    const result = renderObj(obj);
    expect(result).toBe(`{
  user: {
    emails: {
      address: string | number;
    }
  }
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
    }
  }
}`);
  });
});

describe("genType", () => {
  it("should generate a type for a single variable", () => {
    const parsed: Mustache[] = [
      { type: "variable", triple: false, name: ["name"] },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  name: string;
}`);
  });

  it("should generate a type for a single variable with a nested object", () => {
    const parsed: Mustache[] = [
      { type: "variable", triple: false, name: ["user", "name"] },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string;
  }
}`);
  });

  it("should generate a type for a section", () => {
    const parsed: Mustache[] = [
      {
        type: "section",
        name: ["user"],
        content: [{ type: "variable", triple: false, name: ["name"] }],
      },
    ];
    const result = genType(parsed);
    expect(result).toBe(`{
  user: {
    name: string;
  }
}`);
  });
});
