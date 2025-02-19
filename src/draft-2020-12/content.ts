import { currentFrame, currentLocation } from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import type { Keyword } from "../keyword.ts";
import { AnnotationKeyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";
import { parseSchemaResource } from "../resource.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Content vocabulary.
 *
 * @see [JSON Schema Validation §8](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8)
 * @category Vocabularies
 */
export interface ContentVocabulary<Schema> {
  /**
   * The binary-to-text encoding of string instance content.
   *
   * @see [JSON Schema Validation §8.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8.3)
   */
  readonly contentEncoding?: string;

  /**
   * The MIME type of string instance content.
   *
   * @see [JSON Schema Validation §8.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8.4)
   */
  readonly contentMediaType?: string;

  /**
   * A schema describing the structure of decoded string instance content.
   *
   * @see [JSON Schema Validation §8.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8.5)
   */
  readonly contentSchema?: Schema | boolean;
}

/**
 * The `contentEncoding` keyword.
 *
 * @see [JSON Schema Validation §8.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8.3)
 * @category Keywords
 */
export const contentEncodingKeyword = {
  ...AnnotationKeyword.prototype,
  key: "contentEncoding",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.3 ¶5: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"contentEncoding" must be a string', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<string>;

/**
 * The `contentMediaType` keyword.
 *
 * @see [JSON Schema Validation §8.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8.4)
 * @category Keywords
 */
export const contentMediaTypeKeyword = {
  ...AnnotationKeyword.prototype,
  key: "contentMediaType",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.4 ¶2: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"contentMediaType" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.4 ¶2: MUST be a media type, as defined by RFC 2046.
  },
} as const satisfies Keyword<string>;

/**
 * The `contentSchema` keyword.
 *
 * @see [JSON Schema Validation §8.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8.5)
 * @category Keywords
 */
export const contentSchemaKeyword = {
  ...AnnotationKeyword.prototype,
  key: "contentSchema",

  parse(context: SchemaContext): void {
    // §8.5 ¶1: MUST be a valid JSON schema.
    parseSchemaResource(context);
  },
} as const satisfies Keyword<unknown>;

/**
 * The JSON Schema Draft 2020-12 Content vocabulary.
 *
 * @see [JSON Schema Validation §8](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-8)
 * @category Vocabularies
 */
export const contentVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/content",

  keywords: {
    contentEncoding: contentEncodingKeyword,
    contentMediaType: contentMediaTypeKeyword,
    contentSchema: contentSchemaKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/content",
    $dynamicAnchor: "meta",
    title: "Content vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      contentEncoding: { type: "string" },
      contentMediaType: { type: "string" },
      contentSchema: { $dynamicRef: "#meta" },
    },
  },
} as const satisfies Vocabulary;
