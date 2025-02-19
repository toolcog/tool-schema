import {
  isObject,
  currentFrame,
  currentLocation,
  getResource,
} from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import { attachError, attachAnnotation } from "../output.ts";
import { Format } from "../format.ts";
import { Keyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";
import { isSchemaResource } from "../resource.ts";
import * as formats from "../format/mod.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Format Assertion vocabulary.
 *
 * @see [JSON Schema Validation §7](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7)
 * @category Vocabularies
 */
export interface FormatAssertionVocabulary {
  /**
   * Semantic validation for formats like "date-time", "email", etc.
   * Implementations may choose to validate or not.
   *
   * @see [JSON Schema Validation §7](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7)
   */
  readonly format?: string;
}

/**
 * The `format` assertion keyword.
 *
 * @see [JSON Schema Validation §7.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.2.2)
 * @category Keywords
 */
export const formatAssertionKeyword = {
  ...Keyword.prototype,
  key: "format",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §7.1 ¶2: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"format" must be a string', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as string;

    // $7.2.2 ¶3: MUST still collect "format" as an annotation.
    attachAnnotation(context, node);

    // Get the stack frame associated with the keyword's parent schema.
    const schemaFrame = frame.parent;
    if (!isObject(schemaFrame?.node)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    const resource = getResource(context, schemaFrame.node);
    if (!isSchemaResource(resource)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    const format =
      context.formats?.get(node) ?? resource.dialect?.formats?.[node];

    // $7.2.3 ¶1: When the Format-Assertion vocabulary is specified,
    // implementations MUST fail upon encountering unknown formats.
    if (format === undefined) {
      attachError(context, "Unknown format: " + JSON.stringify(node));
      return;
    }

    // $7.2.2 ¶3: MUST evaluate "format" as an assertion.
    if (format.validate !== undefined) {
      format.validate(context);
    } else {
      Format.prototype.validate.call(format, context);
    }
  },
} as const satisfies Keyword<string>;

/**
 * The JSON Schema Draft 2020-12 Format Assertion vocabulary.
 *
 * @see [JSON Schema Validation §7.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.2.2)
 * @category Vocabularies
 */
export const formatAssertionVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/format-assertion",

  formats: formats as { readonly [format: string]: Format },

  keywords: {
    format: formatAssertionKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/format-assertion",
    $dynamicAnchor: "meta",
    title: "Format vocabulary meta-schema for assertion results",
    type: ["object", "boolean"],
    properties: {
      format: { type: "string" },
    },
  },
} as const satisfies Vocabulary;
