// THIS FILE WAS AUTO-GENERATED
// Source: examples/hello.mustache
// Any manual changes will be lost.
import { apply } from "typestache";

export const template = `Hello {{name}}
You have just won {{value:number}} dollars!
{{#in_ca}}
Well, {{taxed_value}} dollars, after taxes.
{{/in_ca}}
`;

export type TemplateType = {
  name: string | boolean | number;
  value: number;
  in_ca: boolean;
  taxed_value: string | boolean | number;
};

const render = (args: TemplateType) => {
  return apply(template, args);
}

export default render;
    