import { isArray, currentFrame, currentLocation } from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import type { Keyword } from "../keyword.ts";
import { AnnotationKeyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Meta-Data vocabulary.
 *
 * @see [JSON Schema Validation §9](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9)
 * @category Vocabularies
 */
export interface MetaDataVocabulary {
  /**
   * A short description for documentation purposes.
   *
   * @see [JSON Schema Validation §9.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.1)
   */
  readonly title?: string;

  /**
   * A detailed description for documentation purposes.
   *
   * @see [JSON Schema Validation §9.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.1)
   */
  readonly description?: string;

  /**
   * A default value to use when an instance is not provided.
   *
   * @see [JSON Schema Validation §9.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.2)
   */
  readonly default?: unknown;

  /**
   * Indicates that the schema is deprecated.
   *
   * @see [JSON Schema Validation §9.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.3)
   */
  readonly deprecated?: boolean;

  /**
   * Indicates that instances should not be modified (read-only).
   *
   * @see [JSON Schema Validation §9.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.4)
   */
  readonly readOnly?: boolean;

  /**
   * Indicates that instances should not be returned (write-only).
   *
   * @see [JSON Schema Validation §9.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.4)
   */
  readonly writeOnly?: boolean;

  /**
   * An array of example instances that conform to this schema.
   *
   * @see [JSON Schema Validation §9.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.5)
   */
  readonly examples?: readonly unknown[];
}

/**
 * The `title` keyword.
 *
 * @see [JSON Schema Validation §9.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.1)
 * @category Keywords
 */
export const titleKeyword = {
  ...AnnotationKeyword.prototype,
  key: "title",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9.1 ¶1: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"title" must be a string', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<string>;

/**
 * The `description` keyword.
 *
 * @see [JSON Schema Validation §9.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.1)
 * @category Keywords
 */
export const descriptionKeyword = {
  ...AnnotationKeyword.prototype,
  key: "description",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9.1 ¶1: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"description" must be a string', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<string>;

/**
 * The `default` keyword.
 *
 * @see [JSON Schema Validation §9.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.2)
 * @category Keywords
 */
export const defaultKeyword = {
  ...AnnotationKeyword.prototype,
  key: "default",
} as const satisfies Keyword<unknown>;

/**
 * The `deprecated` keyword.
 *
 * @see [JSON Schema Validation §9.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.3)
 * @category Keywords
 */
export const deprecatedKeyword = {
  ...AnnotationKeyword.prototype,
  key: "deprecated",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9.3 ¶1: MUST be a boolean.
    if (typeof node !== "boolean") {
      throw new ValidationError('"deprecated" must be a boolean', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<boolean>;

/**
 * The `readOnly` keyword.
 *
 * @see [JSON Schema Validation §9.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.4)
 * @category Keywords
 */
export const readOnlyKeyword = {
  ...AnnotationKeyword.prototype,
  key: "readOnly",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9.4 ¶1: MUST be a boolean.
    if (typeof node !== "boolean") {
      throw new ValidationError('"readOnly" must be a boolean', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<boolean>;

/**
 * The `writeOnly` keyword.
 *
 * @see [JSON Schema Validation §9.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.4)
 * @category Keywords
 */
export const writeOnlyKeyword = {
  ...AnnotationKeyword.prototype,
  key: "writeOnly",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9.4 ¶1: MUST be a boolean.
    if (typeof node !== "boolean") {
      throw new ValidationError('"writeOnly" must be a boolean', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<boolean>;

/**
 * The `examples` keyword.
 *
 * @see [JSON Schema Validation §9.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9.5)
 * @category Keywords
 */
export const examplesKeyword = {
  ...AnnotationKeyword.prototype,
  key: "examples",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9.5 ¶1: MUST be an array.
    if (!isArray(node)) {
      throw new ValidationError('"examples" must be an array', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<readonly unknown[]>;

/**
 * The JSON Schema Draft 2020-12 Meta-Data vocabulary.
 *
 * @see [JSON Schema Validation §9](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-9)
 * @category Vocabularies
 */
export const metaDataVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/meta-data",

  keywords: {
    title: titleKeyword,
    description: descriptionKeyword,
    default: defaultKeyword,
    deprecated: deprecatedKeyword,
    readOnly: readOnlyKeyword,
    writeOnly: writeOnlyKeyword,
    examples: examplesKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/meta-data",
    $dynamicAnchor: "meta",
    title: "Meta-data vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      title: {
        type: "string",
      },
      description: {
        type: "string",
      },
      default: true,
      deprecated: {
        type: "boolean",
        default: false,
      },
      readOnly: {
        type: "boolean",
        default: false,
      },
      writeOnly: {
        type: "boolean",
        default: false,
      },
      examples: {
        type: "array",
        items: true,
      },
    },
  },
} as const satisfies Vocabulary;
