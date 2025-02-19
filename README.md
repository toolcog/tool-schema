# Tool Schema

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/tool-schema)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

A TypeScript implementation of JSON Schema with support for annotations, custom keywords, vocabularies, and dialects, and schema reference tree-shaking.

## Features

- **Multi-Version Support**: Full support for JSON Schema Draft 2020-12, Draft 07, and Draft 05
- **Format Validation**: Implements all standard format validators
- **Annotation Processing**: Spec-compliant annotation generation
- **Schema Transformation**: Support for transforming and tree-shaking schema reference graphs
- **TypeScript-First**: Built from the ground up with TypeScript for strong type inference
- **Extensible**: Modular vocabulary system for custom keywords and dialects
- **Lightweight**: Only 10 kB minified and compressed

## Installation

To install the package, run:

```bash
npm install tool-schema
```

## Usage

### Structural Validation

Parse a schema and validate data against it:

```typescript
import { parseSchema } from "tool-schema";

const schema = await parseSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name"]
});

const result = schema.validate({
  name: "Alice",
  age: 30
});

result.valid; // true
```

### Format Validation

Format validation is opt-in and compliant with JSON Schema Draft 2020-12 specifications. The library supports all standard formats including `date-time`, `email`, `hostname`, `ipv4`, `ipv6`, `uri`, `uuid`, and more.

```typescript
import { parseSchema } from "tool-schema";

// Enable format validation (validate known formats, ignore unknown)
const schema = await parseSchema(
  {
    type: "string",
    format: "email"
  },
  { validation: true }
);

// Enable strict format validation (fail on unknown formats)
const strictSchema = await parseSchema(
  {
    type: "string",
    format: "email"
  },
  { validation: "strict" }
);

// Format validation is disabled by default
schema.validate("invalid-email").valid; // true
schema.validate("user@example.com").valid; // true

// With validation enabled, format constraints are enforced
const formatSchema = await parseSchema(
  {
    type: "string",
    format: "email"
  },
  { validation: true }
);
formatSchema.validate("invalid-email").valid; // false
```

Format validation can be configured in one of three modes:

- `validation: false`: do not perform format validation (default)
- `validation: true`: validate known formats, ignoring unknown formats
- `validation: "strict"`: validate all formats, failing on unknown formats

The library also supports both annotation and assertion vocabularies for format validation, as specified in the JSON Schema Draft 2020-12 specification. The assertion vocabulary can be used when strict format validation is required.

### Dialect Configuration

Schema contexts can be configured to use different JSON Schema dialects, and to provide additional format validators. This is useful when working with multiple schema versions, or when you need to add support for custom formats.

```typescript
import type { Format } from "tool-schema";
import {
  parseSchema,
  createSchemaContext,
  dialect202012,
  dialect07
} from "tool-schema";

// Define a custom format validator.
const phoneFormat = {
  name: "phone",
  parse(input: string): string {
    if (!/^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/.test(input)) {
      throw new Error("Invalid phone number. Expected: +1-555-123-4567");
    }
    return input;
  }
} as const satisfies Format;

// Create a shared context that uses JSON Schema Draft 07 as the default,
// while supporting both Draft 07 and Draft 2020-12 (but not Draft 05).
// Also includes a custom phone number format validator.
const context = createSchemaContext({
  dialect: dialect07, // Make Draft 07 the default
  dialects: [dialect07, dialect202012], // Support both Draft 07 and 2020-12
  formats: [phoneFormat], // Add custom format validator
  validation: true // Enable format validation
});

// Parse a schema using the default Draft 07 dialect.
const userSchema = await parseSchema(
  {
    type: "object",
    properties: {
      name: { type: "string" },
      phone: { type: "string", format: "phone" }
    }
  },
  context
);

// Parse a schema that explicitly uses Draft 2020-12.
const addressSchema = await parseSchema(
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://example.com/schemas/address",
    type: "object",
    properties: {
      street: { type: "string" },
      phone: { type: "string", format: "phone" }
    }
  },
  context
);

// Schemas can reference each other when parsed in the same context.
const contactSchema = await parseSchema(
  {
    type: "object",
    properties: {
      user: { $ref: "https://example.com/schemas/address" }
    }
  },
  context
);
```

The context configuration options include:

- `dialect`: The default dialect to use (defaults to Draft 2020-12)
- `dialects`: Set of supported dialects (defaults to Draft 2020-12, Draft 07, and Draft 05)
- `formats`: Additional format validators to register
- `validation`: Format validation mode (`false`, `true`, or `"strict"`)

Schemas parsed in the same context share:

- Default and supported JSON Schema dialects
- Canonical JSON Schema resources (as determined by the `$id` keyword of any parsed schema)
- Custom format validators and validation settings

This is particularly useful when working with a set of related schemas that reference each other, when you need consistent format validation across multiple schemas, or when you need to support multiple JSON Schema versions in the same application.

### Custom Dialects

Extend the Draft 2020-12 dialect with custom keywords and formats:

```typescript
import { currentFrame } from "tool-json";
import type { SchemaContext, SchemaFrame } from "tool-schema";
import type { Keyword, Format, Dialect } from "tool-schema";
import { ValidationError, attachError, dialect202012 } from "tool-schema";

// Define a custom keyword.
const containsStringKeyword = {
  key: "containsString",
  dependencies: [],
  dependents: [],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    if (typeof frame.node !== "string") {
      throw new ValidationError('"containsString" must be a string');
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const needle = frame.node as string;
    const haystack = frame.instance;

    if (typeof haystack !== "string" || !haystack.includes(needle)) {
      attachError(context, `String must contain "${needle}"`);
    }
  }
} as const satisfies Keyword;

// Create a custom dialect extending draft 2020-12.
const customDialect = {
  uri: "https://example.com/schema",
  formats: dialect202012.formats,
  keywords: {
    ...dialect202012.keywords,
    containsString: containsStringKeyword
  },
  vocabularies: dialect202012.vocabularies
} as const satisfies Dialect;

// Use the custom dialect.
const schema = await parseSchema(
  {
    type: "string",
    containsString: "hello",
    format: "uuid"
  },
  { dialect: customDialect }
);

schema.validate("hello 123e4567-e89b-12d3-a456-426614174000").valid; // true
schema.validate("goodbye 123e4567-e89b-12d3-a456-426614174000").valid; // false
schema.validate("hello invalid-uuid").valid; // false
```

### Schema Transformation

Extract a subset of schema definitions while preserving reference integrity:

```typescript
import { treeShakeReferences } from "tool-json";
import { parseSchema } from "tool-schema";

// Full blog schema with posts, comments, users, etc.
const schema = await parseSchema({
  $ref: "#/$defs/blog",
  $defs: {
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        role: {
          type: "string",
          enum: ["admin", "author", "commenter"]
        }
      },
      required: ["id", "name", "email"]
    },
    comment: {
      type: "object",
      properties: {
        id: { type: "string" },
        content: { type: "string" },
        author: { $ref: "#/$defs/user" },
        created: { type: "string", format: "date-time" }
      },
      required: ["content", "author"]
    },
    post: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        author: { $ref: "#/$defs/user" },
        published: { type: "string", format: "date-time" },
        tags: {
          type: "array",
          items: { type: "string" }
        },
        comments: {
          type: "array",
          items: { $ref: "#/$defs/comment" }
        }
      },
      required: ["title", "content", "author"]
    },
    blog: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        posts: {
          type: "array",
          items: { $ref: "#/$defs/post" }
        },
        authors: {
          type: "array",
          items: { $ref: "#/$defs/user" }
        }
      },
      required: ["title"]
    }
  }
});

// Extract just the commenting system
const { roots, defs } = treeShakeReferences(schema.context, {
  roots: [schema.node.$defs.comment],
  defsUri: "#/$defs"
});

const commentSchema = {
  ...roots[0],
  $defs: defs
};
```

`commentSchema` is a self-contained schema that can be used on its own:

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "content": { "type": "string" },
    "author": { "$ref": "#/definitions/user" },
    "created": { "type": "string", "format": "date-time" }
  },
  "required": ["content", "author"],
  "$defs": {
    "user": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string" },
        "role": {
          "type": "string",
          "enum": ["admin", "author", "commenter"]
        }
      },
      "required": ["id", "name", "email"]
    }
  }
}
```

## License

MIT © Tool Cognition Inc.
