import type { Format } from "../format.ts";
import type { Dialect } from "../dialect.ts";
import * as formats from "../format/mod.ts";
import type { CoreVocabulary } from "../draft-2020-12/core.ts";
import { coreVocabulary } from "../draft-2020-12/core.ts";
import type { ApplicatorVocabulary } from "../draft-2020-12/applicator.ts";
import { applicatorVocabulary } from "../draft-2020-12/applicator.ts";
import type { UnevaluatedVocabulary } from "../draft-2020-12/unevaluated.ts";
import { unevaluatedVocabulary } from "../draft-2020-12/unevaluated.ts";
import type { ValidationVocabulary } from "../draft-2020-12/validation.ts";
import { validationVocabulary } from "../draft-2020-12/validation.ts";
import type { FormatAnnotationVocabulary } from "../draft-2020-12/format-annotation.ts";
import { formatAnnotationVocabulary } from "../draft-2020-12/format-annotation.ts";
import { formatAssertionVocabulary } from "../draft-2020-12/format-assertion.ts";
import type { ContentVocabulary } from "../draft-2020-12/content.ts";
import { contentVocabulary } from "../draft-2020-12/content.ts";
import type { MetaDataVocabulary } from "../draft-2020-12/meta-data.ts";
import { metaDataVocabulary } from "../draft-2020-12/meta-data.ts";
import type { BaseVocabulary } from "./base.ts";
import { baseVocabulary } from "./base.ts";

/**
 * A JSON Schema that uses the OpenAPI v3.1 dialect.
 *
 * @see [JSON Schema Core Draft 2020-12](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01)
 * @see [JSON Schema Validation Draft 2020-12](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation)
 * @see [OpenAPI Specification v3.1.1 §4.8.24](https://spec.openapis.org/oas/v3.1.1.html#schema-object)
 * @category Dialect
 */
export interface Schema
  extends CoreVocabulary<Schema>,
    ApplicatorVocabulary<Schema>,
    UnevaluatedVocabulary<Schema>,
    ValidationVocabulary,
    FormatAnnotationVocabulary,
    ContentVocabulary<Schema>,
    MetaDataVocabulary,
    BaseVocabulary {}

/**
 * The OpenAPI v3.1 JSON Schema dialect.
 *
 * @see [OpenAPI Specification §4.8.24](https://spec.openapis.org/oas/v3.1.1.html#schema-object)
 * @category Dialect
 */
export const dialect = {
  uri: "https://spec.openapis.org/oas/3.1/dialect/base",

  formats: formats as { readonly [format: string]: Format },

  keywords: {
    ...coreVocabulary.keywords,
    ...applicatorVocabulary.keywords,
    ...unevaluatedVocabulary.keywords,
    ...validationVocabulary.keywords,
    ...formatAnnotationVocabulary.keywords,
    ...contentVocabulary.keywords,
    ...metaDataVocabulary.keywords,
    ...baseVocabulary.keywords,
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
    [baseVocabulary.uri]: baseVocabulary,
  },

  node: {
    $id: "https://spec.openapis.org/oas/3.1/dialect/base",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "OpenAPI 3.1 Schema Object Dialect",
    description:
      "A JSON Schema dialect describing schemas found in OpenAPI documents",
    $vocabulary: {
      "https://json-schema.org/draft/2020-12/vocab/core": true,
      "https://json-schema.org/draft/2020-12/vocab/applicator": true,
      "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
      "https://json-schema.org/draft/2020-12/vocab/validation": true,
      "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
      "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
      "https://json-schema.org/draft/2020-12/vocab/content": true,
      "https://spec.openapis.org/oas/3.1/vocab/base": false,
    },
    $dynamicAnchor: "meta",
    allOf: [
      { $ref: "https://json-schema.org/draft/2020-12/schema" },
      { $ref: "https://spec.openapis.org/oas/3.1/meta/base" },
    ],
  },
} as const satisfies Dialect;
