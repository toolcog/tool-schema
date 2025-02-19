import { isArray, isObject, nestFrame, currentFrame } from "tool-json";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import type { OutputUnit } from "../output.ts";
import { emitOutput, attachAnnotation, getAnnotations } from "../output.ts";
import { Keyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";
import { parseSchemaResource, validateSchemaResource } from "../resource.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Unevaluated Applicator vocabulary.
 *
 * @see [JSON Schema Core §11](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11)
 * @category Vocabularies
 */
export interface UnevaluatedVocabulary<Schema> {
  /**
   * A schema to validate items not evaluated by `items` or `prefixItems`.
   *
   * @see [JSON Schema Core §11.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11.2)
   */
  readonly unevaluatedItems?: Schema | boolean;

  /**
   * A schema to validate properties not evaluated by `properties`,
   * `patternProperties`, or `additionalProperties`.
   *
   * @see [JSON Schema Core §11.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11.3)
   */
  readonly unevaluatedProperties?: Schema | boolean;
}

/**
 * The `unevaluatedItems` keyword.
 *
 * @see [JSON Schema Core §11.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11.2)
 * @category Keywords
 */
export const unevaluatedItemsKeyword = {
  ...Keyword.prototype,
  key: "unevaluatedItems",

  // §11.2 ¶4: "prefixItems", "items", "contains", and all in-place applicators
  // MUST be evaluated before this keyword can be evaluated.
  dependencies: [
    ...Keyword.prototype.dependencies,
    "@unevaluated",
    "prefixItems",
    "items",
    "contains",
  ],

  parse(context: SchemaContext): void {
    // §11.2 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §11.2 ¶2: The behavior of this keyword depends on the annotation
    // results of adjacent keywords that apply to the instance location
    // being validated. Specifically, the annotations from "prefixItems",
    // "items", and "contains".
    const annotations: OutputUnit[] = [];
    getAnnotations(frame.parent?.output, "/prefixItems", annotations);
    getAnnotations(frame.parent?.output, "/items", annotations);
    getAnnotations(frame.parent?.output, "/contains", annotations);
    getAnnotations(frame.parent?.output, "/unevaluatedItems", annotations);

    // §11.2 ¶3: If no relevant annotations are present, the "unevaluatedItems"
    // subschema MUST be applied to all locations in the array.
    let startIndex = 0;

    // §11.2 ¶3: If a boolean true value is present from any of
    // the relevant annotations, "unevaluatedItems" MUST be ignored.
    // Otherwise, the subschema MUST be applied to any index greater
    // than the largest annotation value for "prefixItems",
    // which does not appear in any annotation value for "contains".
    let contained: Set<number> | undefined;
    for (const annotation of annotations) {
      const value = annotation.annotation;
      if (value === true) {
        return;
      } else if (typeof value === "number") {
        startIndex = Math.max(startIndex, value);
      } else if (isArray(value)) {
        contained ??= new Set();
        for (const index of value) {
          contained.add(index as number);
        }
      }
    }

    let valid = true;
    let count = 0;
    for (let index = startIndex; index < instance.length; index += 1) {
      if (contained?.has(index) === true) {
        continue;
      }
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.node = node;
        frame.instanceKey = index;
        frame.instance = instance[index];
        frame.output = { valid: true };
        validateSchemaResource(context);
        valid &&= frame.output.valid;
        count += 1;
        emitOutput(context, frame);
      });
    }

    // §11.2 ¶5: If the "unevaluatedItems" subschema is applied to any
    // positions within the instance array, it produces an annotation result
    // of boolean true, analogous to the behavior of "items". This annotation
    // affects the behavior of "unevaluatedItems" in parent schemas.
    attachAnnotation(context, true);
  },
} as const satisfies Keyword<unknown>;

/**
 * The `unevaluatedProperties` keyword.
 *
 * @see [JSON Schema Core §11.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11.3)
 * @category Keywords
 */
export const unevaluatedPropertiesKeyword = {
  ...Keyword.prototype,
  key: "unevaluatedProperties",

  // §11.3 ¶5: "properties", "patternProperties", "additionalProperties",
  // and all in-place applicators MUST be evaluated before this keyword
  // can be evaluated.
  dependencies: [
    ...Keyword.prototype.dependencies,
    "@unevaluated",
    "properties",
    "patternProperties",
    "additionalProperties",
  ],

  parse(context: SchemaContext): void {
    // §11.3 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §11.3 ¶2: The behavior of this keyword depends on the annotation results
    // of adjacent keywords that apply to the instance location being validated.
    // Specifically, the annotations from "properties", "patternProperties",
    // and "additionalProperties".
    const annotations: OutputUnit[] = [];
    getAnnotations(frame.parent?.output, "/properties", annotations);
    getAnnotations(frame.parent?.output, "/patternProperties", annotations);
    getAnnotations(frame.parent?.output, "/additionalProperties", annotations);
    getAnnotations(frame.parent?.output, "/unevaluatedProperties", annotations);

    // §11.3 ¶3: Validation with "unevaluatedProperties" applies only to the
    // child values of instance names that do not appear in the "properties",
    // "patternProperties", "additionalProperties", or "unevaluatedProperties"
    // annotation results that apply to the instance location being validated.
    let propertyNames: Set<string> | undefined;
    for (const annotation of annotations) {
      const value = annotation.annotation;
      if (isArray(value)) {
        for (const key of value) {
          propertyNames ??= new Set();
          propertyNames.add(key as string);
        }
      }
    }

    // §11.3 ¶4: For all such properties, validation succeeds if the child
    // instance validates against the "unevaluatedProperties" schema.
    let valid = true;
    const evaluatedProperties: string[] = [];
    for (const [key, value] of Object.entries(instance)) {
      if (propertyNames?.has(key) === true) {
        continue;
      }

      nestFrame(context, (frame: SchemaFrame): void => {
        frame.node = node;
        frame.instanceKey = key;
        frame.instance = value;
        frame.output = { valid: true };
        validateSchemaResource(context);
        evaluatedProperties.push(key);
        valid &&= frame.output.valid;
        emitOutput(context, frame);
      });
    }

    // §11.3 ¶6: The annotation result of this keyword is the set of instance
    // property names validated by this keyword's subschema. This annotation
    // affects the behavior of "unevaluatedProperties" in parent schemas.
    attachAnnotation(context, evaluatedProperties);
  },
} as const satisfies Keyword<unknown>;

/**
 * The JSON Schema Draft 2020-12 Unevaluated Applicator vocabulary.
 *
 * @see [JSON Schema Core §11](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-11)
 * @category Vocabularies
 */
export const unevaluatedVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/unevaluated",

  keywords: {
    unevaluatedItems: unevaluatedItemsKeyword,
    unevaluatedProperties: unevaluatedPropertiesKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/unevaluated",
    $dynamicAnchor: "meta",
    title: "Unevaluated applicator vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      unevaluatedItems: { $dynamicRef: "#meta" },
      unevaluatedProperties: { $dynamicRef: "#meta" },
    },
  },
} as const satisfies Vocabulary;
