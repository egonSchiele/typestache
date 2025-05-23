// THIS FILE WAS AUTO-GENERATED
// Source: examples/terraform/template.mustache
// Any manual changes will be lost.
import { apply } from "typestache";

export const template = `resource "aws_s3_bucket" "{{bucketName}}" {
  bucket = "{{bucketName}}"
}`;

export type TemplateType = {
  bucketName: string | boolean | number;
};

export const render = (args: TemplateType) => {
  return apply(template, args);
}
    