import { InvertedTag, Mustache, SectionTag, VariableTag } from "./types";
const FgYellow = "\x1b[33m";
const FgGreen = "\x1b[32m";
const FgRed = "\x1b[31m";
const FgReset = "\x1b[0m";

const DEBUG = !!process.env.TYPESTACHE_DEBUG;
if (DEBUG) {
  console.log(FgGreen, "TYPESTACHE DEBUG MODE ON", FgReset);
}
const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr));

const arraysEqual = (a: string[], b: string[]): boolean => {
  const setA = new Set(a);
  const setB = new Set(b);
  return setA.size === setB.size && setA.intersection(setB).size === setA.size;
};

const debug = (...args: any[]): void => {
  if (DEBUG) {
    const rest = args.slice(1);
    const json = rest.map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg, null, 2);
      }
      return arg;
    });
    console.log(FgYellow, args[0], FgReset, ...json);
  }
};

function hasScope(
  mustache: Mustache
): mustache is SectionTag | InvertedTag | VariableTag {
  return (
    mustache.type === "section" ||
    mustache.type === "inverted" ||
    mustache.type === "variable"
  );
}

type BaseValue = {
  optional: boolean;
};

type DefaultValue = {
  type: "default";
} & BaseValue;

type UnionValue = {
  type: "union";
  internalVal: string[];
} & BaseValue;

type ObjectValue = {
  type: "object";
  internalVal: Record<string, Generated>;
} & BaseValue;

type GeneratedValue = UnionValue | ObjectValue | DefaultValue;

class Generated {
  value: GeneratedValue;
  constructor(value: GeneratedValue) {
    this.value = value;
  }

  setValue(value: GeneratedValue) {
    this.value = value;
  }

  equals(value: GeneratedValue): boolean {
    if (this.value.type !== value.type) {
      return false;
    }
    if (this.value.type === "default") {
      return this.value.optional === value.optional;
    }
    if (this.value.type === "object") {
      const keys = Object.keys(this.value.internalVal);
      // @ts-ignore
      const otherKeys = Object.keys(value.internalVal);
      if (!arraysEqual(keys, otherKeys)) {
        return false;
      }
      for (const key of keys) {
        // @ts-ignore
        if (!this.value.internalVal[key].equals(value.internalVal[key].value)) {
          return false;
        }
      }
    } else if (this.value.type === "union") {
      return arraysEqual(
        this.value.internalVal,
        // @ts-ignore
        value.internalVal
      );
    }
    return true;
  }

  merge(value: GeneratedValue) {
    debug("MERGE", "this.value:", this.value, { value });
    if (value.type === "default") {
      return;
    }
    if (this.value.type === "default") {
      this.value = value;
    } else if (this.value.type === "object" && value.type === "object") {
      this.value.internalVal = {
        ...this.value.internalVal,
        ...value.internalVal,
      };
    } else if (this.equals(value)) {
      // same type and same value, do nothing
    } else {
      throw new Error(
        `Cannot merge ${this.value.type} with ${
          value.type
        }: Tried to merge ${JSON.stringify(
          this.value,
          null,
          2
        )} with ${JSON.stringify(value, null, 2)}`
      );
    }
  }

  buildNestedObject(path: string[], value: GeneratedValue): GeneratedValue {
    if (path.length === 0) {
      return value;
    }
    const key = path[0];
    const nestedValue = this.buildNestedObject(path.slice(1), value);
    return {
      type: "object",
      internalVal: {
        [key]: new Generated(nestedValue),
      },
      optional: false,
    };
  }

  setPath(path: string[], value: GeneratedValue) {
    debug("SET PATH", { path, value });
    if (this.value.type !== "object") {
      throw new Error(
        `Cannot set path on non-object type. path: ${JSON.stringify(
          path
        )}, value: ${JSON.stringify(
          value,
          null,
          2
        )}, this.value: ${JSON.stringify(this.value, null, 2)}`
      );
    }
    if (path.length === 0) {
      return;
    } else if (path.length === 1) {
      const key = path[0];
      if (this.value.internalVal[key]) {
        this.value.internalVal[key].merge(value);
      } else {
        this.value.internalVal[key] = new Generated(value);
      }
    } else {
      const key = path[0];
      if (this.value.internalVal[key]) {
        this.value.internalVal[key].setPath(path.slice(1), value);
      } else {
        const nestedValue = this.buildNestedObject(path.slice(1), value);
        this.value.internalVal[key] = new Generated(nestedValue);
      }
    }
  }

  isOptional(): boolean {
    if (this.value.type === "object") {
      return this.value.optional;
    } else if (this.value.type === "union") {
      return this.value.optional;
    } else if (this.value.type === "default") {
      return this.value.optional;
    }
    throw new Error(`Cannot check optional on ${this.value}`);
  }

  walk(parsed: Mustache[], scopeNames: string[] = []): Generated {
    debug("WALK", { scopeNames });
    parsed.forEach((mustache: Mustache) => {
      // @ts-ignore
      debug("\t->", mustache.type, mustache.name || "");
      switch (mustache.type) {
        case "variable":
          return this.setVariable(mustache, scopeNames);
        case "section":
          return this.setSection(mustache, scopeNames);
        case "inverted":
          return this.setInverted(mustache, scopeNames);
          return;
        default:
          break;
      }
    });
    return this;
  }

  private setVariable(mustache: VariableTag, scopeNames: string[] = []) {
    debug("SET VARIABLE", { mustache, scopeNames });
    const hasExplicitType =
      mustache.varType?.name && mustache.varType.name.length > 0;
    let value: GeneratedValue;

    if (hasExplicitType) {
      value = {
        type: "union",
        internalVal: mustache.varType!.name || [],
        optional: mustache.varType!.optional,
      };
    } else {
      value = {
        type: "default",
        optional: mustache.varType?.optional || false,
      };
    }
    let fullName = mustache.name;
    if (mustache.scope === "local") {
      fullName = [...scopeNames, ...mustache.name];
    }
    this.setPath(fullName, value);
  }

  private setSection(mustache: SectionTag, scopeNames: string[] = []) {
    debug("SET SECTION", { name: mustache.name, scopeNames });
    let fullName = mustache.name;
    if (mustache.scope === "local") {
      fullName = [...scopeNames, ...mustache.name];
    }

    const localVars = mustache.content.filter(
      (c) => hasScope(c) && c.scope === "local"
    );
    // no local vars, therefore boolean
    if (localVars.length === 0) {
      this.setPath(fullName, {
        type: "union",
        internalVal: mustache.varType?.name || ["boolean"],
        optional: mustache.varType?.optional || false,
      });
    } else {
      this.setPath(fullName, {
        type: "object",
        internalVal: {},
        optional: mustache.varType?.optional || false,
      });
    }

    // NOTE: since we don't support going up the full scope chain,
    // we assume that all variables in the section that are local,
    // are local to this section.
    //
    // Which is why we don't do it this way:
    //this.walk(mustache.content, [...scopeNames, ...mustache.name]);
    if (mustache.scope === "local") {
      this.walk(mustache.content, [...scopeNames, ...mustache.name]);
    } else {
      this.walk(mustache.content, mustache.name);
    }
  }

  private setInverted(mustache: InvertedTag, scopeNames: string[] = []) {
    debug("SET INVERTED", { name: mustache.name, scopeNames });
    let fullName = mustache.name;
    if (mustache.scope === "local") {
      fullName = [...scopeNames, ...mustache.name];
    }

    this.setPath(fullName, {
      type: "union",
      internalVal: ["boolean"],
      optional: false,
    });
    this.walk(mustache.content, scopeNames);
  }

  private renderValue = (value: string[]): string => {
    return uniq(value).join(" | ");
  };

  render(level: number = 1): string {
    if (this.value.type === "object") {
      const lines = Object.entries(this.value.internalVal).map(
        ([key, value]) => {
          let _key = key;
          let arrayStr = "";
          const optStr = value.isOptional() ? "?" : "";
          if (key.endsWith("[]")) {
            _key = key.replace("[]", "");
            arrayStr = "[]";
          }
          return `${"  ".repeat(level)}${key}${optStr}: ${value.render(
            level + 1
          )}${arrayStr};\n`;
        }
      );
      return `{\n${lines.join("")}${"  ".repeat(level - 1)}}`;
    } else if (this.value.type === "union") {
      return this.renderValue(this.value.internalVal);
    } else if (this.value.type === "default") {
      return this.renderValue(["string", "boolean", "number"]);
    }
    throw new Error(`Cannot render ${JSON.stringify(this.value, null, 2)}`);
  }
}

export const render = (generated: Generated, level: number = 1): string => {
  return generated.render(level);
};

export const genType = (parsed: Mustache[]): string => {
  const generated = new Generated({
    type: "object",
    internalVal: {},
    optional: false,
  });

  generated.walk(parsed);
  return render(generated);
};
