# Typestache

Typestache converts Mustache templates into typed TypeScript files, enabling compile-time type safety for template rendering. It parses `.mustache` files and generates `.ts` files with typed render functions.

## Commands

- `npm run test` — run tests (vitest)
- `npm run build` — compile to `dist/`
- `npm run coverage` — test coverage report
- `npm run gen -- -v examples` — generate TS from example templates
- `make publish` — build and publish to npm

## Project Structure

- `lib/` — core library: parser, type generator, renderer
  - `types.ts` — AST node types
  - `mustacheParser.ts` — tarsec-based parser
  - `genType.ts` — type generation (`Generated` class)
  - `apply.ts` — template rendering
  - `*.test.ts` — tests (vitest with globals enabled, no imports needed for `describe`/`it`/`expect`)
- `scripts/typestache.ts` — CLI entry point
- `examples/` — example `.mustache` templates and generated `.ts` output
- `index.ts` — package root export

Tarsec is a TypeScript package that enables you to build parsers using parser combinators. For more information on Tarsec, visit https://egonschiele.github.io/tarsec/

## Testing

- Tests use vitest with globals — no need to import `describe`, `it`, `expect`
- Test files live alongside source in `lib/` (pattern: `*.test.ts`)

## Debugging
For debugging the code generation code, set the `TYPESTACHE_DEBUG` environment variable.

## Template Syntax

- `{{variable}}` — escaped output (default type: `string | boolean | number`)
- `{{{variable}}}` / `{{&variable}}` — unescaped output
- `{{variable:type}}` — type hint (e.g., `{{age:number}}`, `{{val:string|number}}`)
- `{{variable?}}` — optional variable
- `{{#section}}...{{/section}}` — conditional/iteration block
- `{{^section}}...{{/section}}` — inverted section
- `{{#items[]}}...{{/items}}` — array iteration
- `{{this.prop}}` — local scope within section
- `{{global.prop}}` — explicit global scope
- `{{! comment }}` — comment
- Variables default to global scope; use `this.` for local scope in sections

## Bin script
This package also ships with a bin script. The source for the script is at scripts/typestache.ts. Users of the package can use the script, giving it the path to a directory, and the script will compile all mustache files in that directory into TypeScript, looking for files recursively. The new TypeScript files are placed alongside the mustache files.

## Code guidelines
- wherever possible, use types.
- Use a narrow type where possible: don't type everything as `any`
- Prefer types over interfaces.
- If there is duplicated code, extract the code into a reusable function
- Keep the scope of functions small, ideally a function would only do one thing
- If a function ends up needing more than two arguments, use named arguments instead by passing in an object