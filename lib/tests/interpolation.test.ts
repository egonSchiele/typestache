import { describe, expect, test } from "vitest";
import data from "./interpolation.json";
import { apply } from "../apply.js";

type Test = {
  name: string;
  desc: string;
  data?: Record<string, any> | string | number;
  template: string;
  expected: string;
  skip?: boolean;
};

const tests: Test[] = data.tests;
tests.forEach(({ name, desc, data, template, expected, skip }) => {
  if (skip) {
    return;
  }
  describe(name, () => {
    test(desc, () => {
      const actual = apply(template, data || {});
      expect(actual).toBe(expected);
    });
  });
});
