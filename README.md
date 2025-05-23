# Typestache: static typing for mustache

> Get your templates to "if it compiles, it probably works!"

Typestache is still a work in progress. Use with caution.

## Quickstart
Install Typestache:

```bash
npm install typestache
```

Typestache consists of a CLI tool and a library. To use it, point the CLI tool towards your template directory:

```bash
typestache src/templates
```

Typestache will find your mustache files, and create a corresponding TypeScript file:

```bash
src/templates
  - myTemplate.mustache
  - myTemplate.ts
```

Now simply import this TypeScript file and render it.

```typescript
import myTemplate from './myTemplate';

const data = {
  name: 'Adit',
  value: 10000,
  in_ca: true
};

const result = myTemplate(data);
```

Easy as that! Behind the scenes, Typestache has converted your mustache template into a typed template for you, so if you have a type error, TypeScript will tell you. Example:

```typescript
const data = {
  name: 'Adit',
  value: 10000,
  in_ca: "true" // Oops, this should be a boolean
};

const result = myTemplate(data); // Error: Type 'string' is not assignable to type 'boolean'.
```

[See examples here](https://github.com/egonSchiele/typestache/tree/main/examples).

Typestache also extends mustache syntax to add type hints. Here's a short example:

```mustache
I am {{age:number}} years old.
```

Now `age` will be a `number` in the generated TypeScript file.

**Heads up, typestache is *not* a drop-in replacement for mustache.** Read more below.

## Deriving types

Typestache will automatically derive types for you. For example, given this template

```mustache
{{#person}}
  Hello, {{name}}!
{{/person}}
```

Typestache will derive this type:

```typescript
type TemplateType = {
  person: boolean;
  name: string | boolean | number;
};
```

## Specifying types
If you know what type something will be, you can tell typestache. For example, in the above example, we know `name` is a `string`. Here's how we can tell typestache:

```mustache
{{#person}}
  Hello, {{name:string}}!
{{/person}}
```

and here's the derived type:

```typescript
type TemplateType = {
  person: boolean;
  name: string;
};
```

Here is another example. `amount` can be a `string` or a `number`, so we have used a union here.

```mustache
{{#person}}
  Hello, {{name:string}}! You have {{amount:string|number}} in your account.
{{/person}}
```

and here's the derived type:

```typescript
type TemplateType = {
  person: boolean;
  name: string;
  amount: string | number; 
};
```

### Sections and scoping

In all these examples, you'll notice `name` is never a key. `person` is always a `boolean`, it's never an object with a key `name`. Mustache has very loose scoping rules. Deriving a type for this template 

```mustache
{{#person}}
  Hello, {{name}}!
{{/person}}
```

in mustache might look something like this:

```typescript
type TemplateType = {
  person: boolean;
  name: string | boolean | number;
} | {
  person: {
    name: string | boolean | number;
  }
} | {
  person: {
    name: string | boolean | number;
  }
}[]
```

Even that's not enough, since technically, `person` could be any truthy value, and `person` and `name` could both be `undefined`.

A type like this is harder to read, and reduces type safety. Things look even worse as you have more sections, and more variables. So typestache chooses to interpret every variable as if it's in the global context. If you want `name` to be a key on `person`, use the new `this` keyword:

```mustache
{{#person}}
  Hello, {{this.name}}!
{{/person}}
```

Generates this type:

```typescript
type TemplateType = {
  person: {
    name: string | boolean | number;
  }
}
```

You'll also notice `person` is an object. If you want it to be an array of objects, use `[]` after the name in the opening tag:

```mustache
{{#person[]}}
  Hello, {{this.name}}!
{{/person}}
```


Generates this type:

```typescript
type TemplateType = {
  person: {
    name: string | boolean | number;
  }[];
}
```

### Optionals

Finally, typestache makes all variables required by default. You can make something optional by adding a question mark at the end of the name, like this:

```mustache
  Hello, {{name?:string}}!
```

Generates this type:

```typescript
type TemplateType = {
  name?: string;
}
```

## Typestache doesn't implement the entire mustache spec.

There are several parts of the mustache spec that Typestache does not implement. The most important one to know about is that Typestache handles scope differently. Mustache is very loose with its scoping, which makes it hard to write a useful type for it.

Here are some other things not currently supported:

Eventual support:

- Nested sections
- Lambdas (no support for dynamic templates)
- partials

No support planned:

- Dynamic names
- blocks
- parents
- custom delimiter tags.

For the ones where there is no support planned, mostly it's because the feature would be very hard or impossible to type correctly. The nature of dynamic partials, for example, means we don't know what will be generated until runtime, which makes it impossible to type.
