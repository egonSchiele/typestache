import { describe, it, expect } from "vitest";
import { apply } from "./apply.js";
import { mustacheParser } from "./mustacheParser.js";

describe("Mustache Parser", () => {
  it("should parse variable tags correctly", () => {
    const template = "Hello {{name}}!";
    const context = { name: "World" };
    const result = apply(template, context);
    expect(result).toBe("Hello World!");
  });

  it("should parse text correctly", () => {
    const template = "This is just plain text.";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("This is just plain text.");
  });

  it("should handle comment tags correctly", () => {
    const template = "This is a {{! comment }} and not parsed.";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("This is a  and not parsed.");
  });

  it("should handle section tags correctly when the condition is true", () => {
    const template = "{{#condition}}Section content{{/condition}}";
    const context = { condition: true };
    const result = apply(template, context);
    expect(result).toBe("Section content");
  });

  it("should skip section tags when the condition is false", () => {
    const template = "{{#condition}}Section content{{/condition}}";
    const context = { condition: false };
    const result = apply(template, context);
    expect(result).toBe("");
  });

  it("should handle variables nested within sections", () => {
    const template = "{{#user}}{{this.name}}{{/user}}";
    const context = { user: { name: "Adit" } };
    const result = apply(template, context);
    expect(result).toBe("Adit");
  });

  it("should handle top level variables nested within sections", () => {
    const template = "{{#user}}{{greeting}}{{/user}}";
    const context = { user: { name: "Adit" }, greeting: "Hello" };
    const result = apply(template, context);
    expect(result).toBe("Hello");
  });

  it("should handle inverted tags correctly when the condition is false", () => {
    const template = "{{^condition}}Inverted content{{/condition}}";
    const context = { condition: false };
    const result = apply(template, context);
    expect(result).toBe("Inverted content");
  });

  it("should skip inverted tags when the condition is true", () => {
    const template = "{{^condition}}Inverted content{{/condition}}";
    const context = { condition: true };
    const result = apply(template, context);
    expect(result).toBe("");
  });

  it("should handle partial tags", () => {
    const template = "Main content {{>partialName}}";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("Main content {{>partialName}}");
  });

  it("should return empty string for invalid input", () => {
    const template = "{{#unmatchedTag}}Content";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("");
  });

  it("should handle local vars", () => {
    const template = "{{#person}}{{this.name}}{{/person}}";
    const context = {
      person: {
        name: "Adit",
      },
      name: "Not Adit",
    };
    const result = apply(template, context);
    expect(result).toBe("Adit");
  });

  it("should handle global vars", () => {
    const template = "{{#person}}{{global.name}}{{/person}}";
    const context = {
      person: {
        name: "Adit",
      },
      name: "Not Adit",
    };
    const result = apply(template, context);
    expect(result).toBe("Not Adit");
  });
});

describe("array iteration", () => {
  it("should iterate over an array of objects", () => {
    const template = "{{#people}}{{this.name}} {{/people}}";
    const context = {
      people: [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }],
    };
    const result = apply(template, context);
    expect(result).toBe("Alice Bob Charlie ");
  });

  it("should render nothing for an empty array", () => {
    const template = "{{#items}}{{this.name}}{{/items}}";
    const context = { items: [] };
    const result = apply(template, context);
    expect(result).toBe("");
  });

  it("should iterate over an array with multiple local vars", () => {
    const template =
      "{{#people}}{{this.name}} is {{this.age}}. {{/people}}";
    const context = {
      people: [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ],
    };
    const result = apply(template, context);
    expect(result).toBe("Alice is 30. Bob is 25. ");
  });

  it("should access global vars inside an array iteration", () => {
    const template = "{{#people}}{{global.greeting}} {{this.name}}! {{/people}}";
    const context = {
      greeting: "Hello",
      people: [{ name: "Alice" }, { name: "Bob" }],
    };
    const result = apply(template, context);
    expect(result).toBe("Hello Alice! Hello Bob! ");
  });

  it("should iterate over nested arrays", () => {
    const template =
      "{{#city}}{{this.name}}: {{#this.people}}{{this.name}} is {{this.age}}. {{/this.people}}{{/city}}";
    const context = {
      city: [
        {
          name: "Springfield",
          people: [
            { name: "Alice", age: 30 },
            { name: "Bob", age: 25 },
          ],
        },
        {
          name: "Shelbyville",
          people: [{ name: "Charlie", age: 40 }],
        },
      ],
    };
    const result = apply(template, context);
    expect(result).toBe(
      "Springfield: Alice is 30. Bob is 25. Shelbyville: Charlie is 40. "
    );
  });
});

describe("HTML escaping", () => {
  it("should escape HTML in double-brace variables", () => {
    const template = "{{content}}";
    const context = { content: '<script>alert("xss")</script>' };
    const result = apply(template, context);
    expect(result).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("should escape ampersands", () => {
    const template = "{{content}}";
    const context = { content: "a & b" };
    const result = apply(template, context);
    expect(result).toBe("a &amp; b");
  });

  it("should escape single quotes", () => {
    const template = "{{content}}";
    const context = { content: "it's" };
    const result = apply(template, context);
    expect(result).toBe("it&apos;s");
  });

  it("should not escape HTML in triple-brace variables", () => {
    const template = "{{{content}}}";
    const context = { content: "<b>bold</b>" };
    const result = apply(template, context);
    expect(result).toBe("<b>bold</b>");
  });

  it("should not escape HTML in ampersand variables", () => {
    const template = "{{&content}}";
    const context = { content: "<b>bold</b>" };
    const result = apply(template, context);
    expect(result).toBe("<b>bold</b>");
  });
});

describe("number and boolean rendering", () => {
  it("should render numbers as strings", () => {
    const template = "Count: {{count}}";
    const context = { count: 42 };
    const result = apply(template, context);
    expect(result).toBe("Count: 42");
  });

  it("should render zero", () => {
    const template = "Count: {{count}}";
    const context = { count: 0 };
    const result = apply(template, context);
    expect(result).toBe("Count: 0");
  });

  it("should render true as 'true'", () => {
    const template = "Value: {{flag}}";
    const context = { flag: true };
    const result = apply(template, context);
    expect(result).toBe("Value: true");
  });

  it("should render false as 'false'", () => {
    const template = "Value: {{flag}}";
    const context = { flag: false };
    const result = apply(template, context);
    expect(result).toBe("Value: false");
  });
});

describe("falsy and missing values", () => {
  it("should render empty string for undefined variable", () => {
    const template = "Hello {{name}}!";
    const context = {};
    const result = apply(template, context);
    expect(result).toBe("Hello !");
  });

  it("should render empty string for missing nested variable", () => {
    const template = "{{user.name}}";
    const context = { user: {} };
    const result = apply(template, context);
    expect(result).toBe("");
  });
});

describe("implicit variable", () => {
  it("should render implicit variable with {{.}}", () => {
    const template = "{{#items}}{{.}} {{/items}}";
    const context = { items: ["a", "b", "c"] };
    const result = apply(template, context);
    expect(result).toBe("a b c ");
  });
});
