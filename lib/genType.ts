import { Mustache, SectionTag, VariableTag } from "./types";

const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr));

const arraysEqual = (a: string[], b: string[]): boolean => {
  const setA = new Set(a);
  const setB = new Set(b);
  return setA.size === setB.size && setA.intersection(setB).size === setA.size;
};

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
    if (this.value.type !== "object") {
      throw new Error("Cannot set path on non-object type");
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
  /* add(key: string, value: GeneratedValue) {
    if (this.store[key]) {
      throw new Error(`Key ${key} already exists in the store`);
    }
    this.store[key] = value;
  }
  private notAKey(key: string): boolean {
    return typeof key !== "string" || parseInt(key) >= 0;
  }; */
}

const setVariable = (generated: Generated, mustache: VariableTag) => {
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
  generated.setPath(mustache.name, value);
};

const setSection = (generated: Generated, mustache: SectionTag) => {
  const nestedVars = mustache.content.filter((c) => c.type === "variable");
  const allGlobals = nestedVars.every((v) => v.scope === "global");
  // no local vars, therefore boolean,
  // also check if optional
  if (nestedVars.length === 0 || allGlobals) {
    generated.setPath(mustache.name, {
      type: "union",
      internalVal: mustache.varType?.name || ["boolean"],
      optional: mustache.varType?.optional || false,
    });
  } else {
    generated.setPath(mustache.name, {
      type: "object",
      internalVal: {},
      optional: mustache.varType?.optional || false,
    });
  }

  nestedVars.forEach((variable: VariableTag) => {
    if (variable.scope === "global") {
      setVariable(generated, variable);
      return;
    } else if (variable.scope === "local") {
      const fullVarName = [...mustache.name, ...variable.name];
      const newVar = { ...variable, name: fullVarName };
      setVariable(generated, newVar);
      return;
    }
  });
};

const defaultGenerated = (): Generated =>
  new Generated({
    type: "object",
    internalVal: {},
    optional: false,
  });
const walk = (
  parsed: Mustache[],
  generated = defaultGenerated()
): Generated => {
  parsed.forEach((mustache: Mustache) => {
    switch (mustache.type) {
      case "variable":
        return setVariable(generated, mustache);
      case "section":
        return setSection(generated, mustache);
      case "inverted":
        generated.setPath(mustache.name, {
          type: "union",
          internalVal: ["boolean"],
          optional: false,
        });
        /*         walk(
          mustache.content,
          generated.value.internalVal[mustache.name[0]] as Generated
        );
 */
        return;
      default:
        break;
    }
  });
  return generated;
};

export const render = (generated: Generated, level: number = 1): string => {
  return generated.render(level);
};

export const genType = (parsed: Mustache[]): string => {
  const generated = walk(parsed);
  return render(generated);
};
