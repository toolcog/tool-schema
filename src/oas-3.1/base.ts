import { isObject, currentFrame, currentLocation } from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import type { Keyword } from "../keyword.ts";
import { AnnotationKeyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";

/**
 * A JSON Schema that uses the OpenAPI v3.1 Base vocabulary.
 *
 * @see [OpenAPI Specification §4.8.24.1](https://spec.openapis.org/oas/v3.1.1.html#json-schema-keywords)
 * @category Vocabularies
 */
export interface BaseVocabulary {
  /**
   * Determines which of a set of schemas a payload is expected to satisfy.
   *
   * @see [OpenAPI Specification §4.8.25](https://spec.openapis.org/oas/v3.1.1.html#discriminator-object)
   */
  readonly discriminator?: DiscriminatorKeyword;

  /**
   * Adds additional metadata to describe the XML representation
   * of this property.
   *
   * @see [OpenAPI Specification §4.8.26](https://spec.openapis.org/oas/v3.1.1.html#xml-object)
   */
  readonly xml?: XmlKeyword;

  /**
   * Additional external documentation for this schema.
   *
   * @see [OpenAPI Specification §4.8.11](https://spec.openapis.org/oas/v3.1.1.html#external-documentation-object)
   */
  readonly externalDocs?: ExternalDocsKeyword;

  /**
   * A free-form field to include an example of an instance for this schema.
   * To represent examples that cannot be naturally represented in JSON
   * or YAML, a string value can be used to contain the example with escaping
   * where necessary.
   *
   * @deprecated The `example` field has been deprecated in favor of
   * the JSON Schema `examples` keyword. Use of `example` is discouraged,
   * and later versions of this specification may remove it.
   */
  readonly example?: unknown;
}

/**
 * Which of a set of schemas a payload is expected to satisfy.
 *
 * @see [OpenAPI Specification §4.8.25](https://spec.openapis.org/oas/v3.1.1.html#discriminator-object)
 * @category Vocabularies
 */
export interface DiscriminatorKeyword {
  /**
   * The name of the property in the payload that will hold the
   * discriminating value
   */
  readonly propertyName: string;

  /**
   * An object to hold mappings between payload values and schema names
   * or URI references.
   */
  readonly mapping?: { readonly [discriminant: string]: string };
}

/**
 * Additional metadata to describe the XML representation of a property.
 *
 * @see [OpenAPI Specification §4.8.26](https://spec.openapis.org/oas/v3.1.1.html#xml-object)
 * @category Vocabularies
 */
export interface XmlKeyword {
  /**
   * Replaces the name of the element/attribute used for the described schema
   * property. When defined within `items`, it will affect the name of the
   * individual XML elements within the list. When defined alongside `type`
   * being `"array"` (outside the `items`), it will affect the wrapping
   * element if and only if `wrapped` is `true`. If `wrapped` is `false`,
   * it will be ignored.
   */
  readonly name?: string;

  /**
   * The URI of the namespace definition. Value _MUST_ be in the form
   * of a non-relative URI.
   */
  readonly namespace?: string;

  /**
   * The prefix to be used for the `name`.
   */
  readonly prefix?: string;

  /**
   * Declares whether the property definition translates to an attribute
   * instead of an element. Default value is `false`.
   */
  readonly attribute?: boolean;

  /**
   * _MAY_ be used only for an array definition. Signifies whether the array
   * is wrapped (for example,
   * `&lt;books&gt;&lt;book/&gt;&lt;book/&gt;&lt;/books&gt;`) or unwrapped
   * (`&lt;book/&gt;&lt;book/&gt;`). Default value is `false`. The definition
   * takes effect only when defined alongside `type` being `"array"`
   * (outside the `items`).
   */
  readonly wrapped?: boolean;
}

/**
 * Additional external documentation for a schema.
 *
 * @see [OpenAPI Specification §4.8.11](https://spec.openapis.org/oas/v3.1.1.html#external-documentation-object)
 * @category Vocabularies
 */
export interface ExternalDocsKeyword {
  /**
   * A description of the target documentation. [CommonMark](
   * https://spec.commonmark.org/) syntax _MAY_ be used for rich text
   * representation.
   */
  readonly description?: string;

  /**
   * The URI for the target documentation. This _MUST_ be in the form
   * of a URI.
   */
  readonly url: string;
}

/**
 * The `discriminator` keyword.
 *
 * @see [OpenAPI Specification §4.8.25](https://spec.openapis.org/oas/v3.1.1.html#discriminator-object)
 * @category Keywords
 */
export const discriminatorKeyword = {
  ...AnnotationKeyword.prototype,
  key: "discriminator",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    if (!isObject(node)) {
      throw new ValidationError('"discriminator" must be an object', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<DiscriminatorKeyword>;

/**
 * The `xml` keyword.
 *
 * @see [OpenAPI Specification §4.8.26](https://spec.openapis.org/oas/v3.1.1.html#xml-object)
 * @category Keywords
 */
export const xmlKeyword = {
  ...AnnotationKeyword.prototype,
  key: "xml",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    if (!isObject(node)) {
      throw new ValidationError('"xml" must be an object', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<XmlKeyword>;

/**
 * The `externalDocs` keyword.
 *
 * @see [OpenAPI Specification §4.8.11](https://spec.openapis.org/oas/v3.1.1.html#external-documentation-object)
 * @category Keywords
 */
export const externalDocsKeyword = {
  ...AnnotationKeyword.prototype,
  key: "externalDocs",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    if (!isObject(node)) {
      throw new ValidationError('"externalDocs" must be an object', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<ExternalDocsKeyword>;

/**
 * The `example` keyword.
 *
 * @see [OpenAPI Specification §4.8.24.2](https://spec.openapis.org/oas/v3.1.1.html#fixed-fields-20)
 * @category Keywords
 */
export const exampleKeyword = {
  ...AnnotationKeyword.prototype,
  key: "example",
} as const satisfies Keyword<unknown>;

/**
 * The OpenAPI v3.1 Base JSON Schema vocabulary.
 *
 * @see [OpenAPI Specification §4.8.24.1](https://spec.openapis.org/oas/v3.1.1.html#json-schema-keywords)
 * @category Vocabularies
 */
export const baseVocabulary = {
  uri: "https://spec.openapis.org/oas/3.1/vocab/base",

  keywords: {
    discriminator: discriminatorKeyword,
    xml: xmlKeyword,
    externalDocs: externalDocsKeyword,
    example: exampleKeyword,
  },

  node: {
    $id: "https://spec.openapis.org/oas/3.1/meta/base",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "OAS Base vocabulary",
    description: "A JSON Schema Vocabulary used in the OpenAPI Schema Dialect",
    $vocabulary: {
      "https://spec.openapis.org/oas/3.1/vocab/base": true,
    },
    $dynamicAnchor: "meta",
    type: ["object", "boolean"],
    properties: {
      example: true,
      discriminator: { $ref: "#/$defs/discriminator" },
      externalDocs: { $ref: "#/$defs/external-docs" },
      xml: { $ref: "#/$defs/xml" },
    },
    $defs: {
      extensible: {
        patternProperties: {
          "^x-": true,
        },
      },
      discriminator: {
        $ref: "#/$defs/extensible",
        type: "object",
        properties: {
          propertyName: {
            type: "string",
          },
          mapping: {
            type: "object",
            additionalProperties: {
              type: "string",
            },
          },
        },
        required: ["propertyName"],
        unevaluatedProperties: false,
      },
      "external-docs": {
        $ref: "#/$defs/extensible",
        type: "object",
        properties: {
          url: {
            type: "string",
            format: "uri-reference",
          },
          description: {
            type: "string",
          },
        },
        required: ["url"],
        unevaluatedProperties: false,
      },
      xml: {
        $ref: "#/$defs/extensible",
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          namespace: {
            type: "string",
            format: "uri",
          },
          prefix: {
            type: "string",
          },
          attribute: {
            type: "boolean",
          },
          wrapped: {
            type: "boolean",
          },
        },
        unevaluatedProperties: false,
      },
    },
  },
} as const satisfies Vocabulary;
