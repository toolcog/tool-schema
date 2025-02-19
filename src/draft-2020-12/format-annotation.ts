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
 * A JSON Schema that uses the Draft 2020-12 Format Annotation vocabulary.
 *
 * @see [JSON Schema Validation §7](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7)
 * @category Vocabularies
 */
export interface FormatAnnotationVocabulary {
  /**
   * Semantic validation for formats like "date-time", "email", etc.
   * Implementations may choose to validate or not.
   *
   * @see [JSON Schema Validation §7](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7)
   */
  readonly format?: string;
}

/**
 * The `format` annotation keyword.
 *
 * @see [JSON Schema Validation §7.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.2.1)
 * @category Keywords
 */
export const formatAnnotationKeyword = {
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

    // $7.2.1 ¶1: The value of format MUST be collected as an annotation.
    attachAnnotation(context, node);

    // $7.2.1 ¶2: Implementations MAY still treat "format" as an assertion
    // in addition to an annotation and attempt to validate the value's
    // conformance to the specified semantics. The implementation MUST
    // provide options to enable and disable such evaluation and MUST
    // be disabled by default.
    if (context.validation === undefined || context.validation === false) {
      return;
    }

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

    // $7.2.1 ¶4: SHOULD provide an implementation-specific best effort
    // validation for each format attribute.
    if (format === undefined && context.validation === "strict") {
      attachError(context, "Unknown format: " + JSON.stringify(node));
      return;
    }

    // $7.2.1 ¶5: MAY choose to implement validation of any or all format
    // attributes as a no-op by always producing a validation result of true
    if (format?.validate !== undefined) {
      format.validate(context);
    } else if (format !== undefined) {
      Format.prototype.validate.call(format, context);
    }
  },
} as const satisfies Keyword<string>;

/**
 * The JSON Schema Draft 2020-12 Format Annotation vocabulary.
 *
 * @see [JSON Schema Validation §7.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.2.1)
 * @category Vocabularies
 */
export const formatAnnotationVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/format-annotation",

  formats: formats as { readonly [format: string]: Format },

  keywords: {
    format: formatAnnotationKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/format-annotation",
    $dynamicAnchor: "meta",
    title: "Format vocabulary meta-schema for annotation results",
    type: ["object", "boolean"],
    properties: {
      format: { type: "string" },
    },
  },
} as const satisfies Vocabulary;
