# Tarstache

### I mustache you a question. Why do mustache parsers have such big dependency trees?

Tarstache just has one dependency, [tarsec](https://github.com/egonSchiele/tarsec).

Example:

A typical Mustache template:

```
Hello {{name}}
You have just won {{value}} dollars!
{{#in_ca}}
Well, {{taxed_value}} dollars, after taxes.
{{/in_ca}}
```

Given the following hash:

```
{
  "name": "Chris",
  "value": 10000,
  "taxed_value": 10000 - (10000 * 0.4),
  "in_ca": true
}
```

Will produce the following:

```
Hello Chris
You have just won 10000 dollars!
Well, 6000.0 dollars, after taxes.
```

run the example like so:

```
npm install
npm run build && npm run start
```

### Support

Supports all basic mustache constructs. No support yet for partials or for nesting sections within sections. You can however nest a variable within a section just fine.