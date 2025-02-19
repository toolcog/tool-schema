import type { Format } from "../format.ts";
import type { Dialect } from "../dialect.ts";
import * as formats from "../format/mod.ts";
import type { CoreVocabulary } from "./core.ts";
import { coreVocabulary } from "./core.ts";
import type { ApplicatorVocabulary } from "./applicator.ts";
import { applicatorVocabulary } from "./applicator.ts";
import type { UnevaluatedVocabulary } from "./unevaluated.ts";
import { unevaluatedVocabulary } from "./unevaluated.ts";
import type { ValidationVocabulary } from "./validation.ts";
import { validationVocabulary } from "./validation.ts";
import type { FormatAnnotationVocabulary } from "./format-annotation.ts";
import { formatAnnotationVocabulary } from "./format-annotation.ts";
import { formatAssertionVocabulary } from "./format-assertion.ts";
import type { ContentVocabulary } from "./content.ts";
import { contentVocabulary } from "./content.ts";
import type { MetaDataVocabulary } from "./meta-data.ts";
import { metaDataVocabulary } from "./meta-data.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 dialect.
 *
 * @see [JSON Schema Core Draft 2020-12](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01)
 * @see [JSON Schema Validation Draft 2020-12](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation)
 * @category Dialect
 */
export interface Schema
  extends CoreVocabulary<Schema>,
    ApplicatorVocabulary<Schema>,
    UnevaluatedVocabulary<Schema>,
    ValidationVocabulary,
    FormatAnnotationVocabulary,
    ContentVocabulary<Schema>,
    MetaDataVocabulary {}

/**
 * The JSON Schema Draft 2020-12 dialect.
 *
 * @category Dialect
 */
export const dialect = {
  uri: "https://json-schema.org/draft/2020-12/schema",

  formats: formats as { readonly [format: string]: Format },

  keywords: {
    ...coreVocabulary.keywords,
    ...applicatorVocabulary.keywords,
    ...unevaluatedVocabulary.keywords,
    ...validationVocabulary.keywords,
    ...formatAnnotationVocabulary.keywords,
    ...contentVocabulary.keywords,
    ...metaDataVocabulary.keywords,
  },

  vocabularies: {
    [coreVocabulary.uri]: coreVocabulary,
    [applicatorVocabulary.uri]: applicatorVocabulary,
    [unevaluatedVocabulary.uri]: unevaluatedVocabulary,
    [validationVocabulary.uri]: validationVocabulary,
    [formatAnnotationVocabulary.uri]: formatAnnotationVocabulary,
    [formatAssertionVocabulary.uri]: formatAssertionVocabulary,
    [contentVocabulary.uri]: contentVocabulary,
    [metaDataVocabulary.uri]: metaDataVocabulary,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/schema",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/core": true,
      "https://json-schema.org/draft/2020-12/vocab/applicator": true,
      "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
      "https://json-schema.org/draft/2020-12/vocab/validation": true,
      "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
      "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
      "https://json-schema.org/draft/2020-12/vocab/content": true,
    },
    $dynamicAnchor: "meta",
    title: "Core and Validation specifications meta-schema",
    allOf: [
      { $ref: "meta/core" },
      { $ref: "meta/applicator" },
      { $ref: "meta/unevaluated" },
      { $ref: "meta/validation" },
      { $ref: "meta/meta-data" },
      { $ref: "meta/format-annotation" },
      { $ref: "meta/content" },
    ],
    type: ["object", "boolean"],
    $comment:
      "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.",
    properties: {
      definitions: {
        $comment: '"definitions" has been replaced by "$defs".',
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        deprecated: true,
        default: {},
      },
      dependencies: {
        $comment:
          '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
        type: "object",
        additionalProperties: {
          anyOf: [
            { $dynamicRef: "#meta" },
            { $ref: "meta/validation#/$defs/stringArray" },
          ],
        },
        deprecated: true,
        default: {},
      },
      $recursiveAnchor: {
        $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
        $ref: "meta/core#/$defs/anchorString",
        deprecated: true,
      },
      $recursiveRef: {
        $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
        $ref: "meta/core#/$defs/uriReferenceString",
        deprecated: true,
      },
    },
  },
} as const satisfies Dialect;
