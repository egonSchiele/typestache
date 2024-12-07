# Typestache: static typing for mustache

> Get your templates to "if it compiles, it probably works!"

Typestache is still a work in progress. Use with caution.

## Quickstart
Install Typestache:

```
npm install typestache
```

Run Typestache and point it towards your template directory:

```
typestache src/templates
```

Typestache will find your mustache files, and create a corresponding TypeScript file:

```
src/templates
  - my_template.mustache
  - my_template.ts
```

Each of these TypeScript files exports a render function. Import this function and pass it your data:

```
import { render } from './my_template';

const data = {
  name: 'Adit',
  value: 10000,
  in_ca: true
};

const result = render(data);
```

This function is typed using your mustache template. If you pass incorrect data, TypeScript will tell you.

- Heads up, typestache is *not* a drop-in replacement for mustache. Read more below.
- Or, learn how to add type hints to your mustache file. If you don't add types, typestache will derive them for you.

## Introduction
There's a big hole in your static typing: mustache. It's only at runtime that you'll find out you're sending the wrong data to your mustache template, or you have forgotten to include a variable or something. Typestache adds static type checking to mustache templates.

## Is typestache is right for you? 

### Pros
- Statically typed. If the code compiles, it probably works.
- Very fast rendering. Typestache pre-compiles your mustache files, so there's nothing to parse at runtime.
- Single dependency. Typestache just depends on [one package](https://github.com/egonSchiele/tarsec), which itself has zero dependencies.

### Cons
- Typestashe generates TypeScript types, so to use typestashe you must be using TypeScript.
- Typestache doesn't fully support the mustache spec, read more about that below.
- You need to introduce an additional step in your build process to compile your mustache files.

## Deriving types

Typestashe will automatically derive types for you. For example, given this template

```mustache
{{#person}}
  Hello, {{name}}!
{{/person}}
```

Typestashe will derive this type:

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
