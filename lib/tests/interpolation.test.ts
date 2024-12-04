import { describe, expect, test } from "vitest";
import data from "./interpolation.json";
import { apply } from "../mustacheParser.js";

type Test = {
  name: string;
  desc: string;
  data?: Record<string, any>;
  template: string;
  expected: string;
};

const tests: Test[] = data.tests;
tests.forEach(({ name, desc, data, template, expected }) => {
  describe(name, () => {
    test(desc, () => {
      const actual = apply(template, data || {});
      expect(actual).toBe(expected);
    });
  });
});
