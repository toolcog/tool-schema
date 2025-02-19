import type { NodeType } from "tool-json";
import { isObject, currentFrame, currentLocation } from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import { attachError } from "../output.ts";
import { Keyword, AnnotationKeyword } from "../keyword.ts";
import {
  allOfKeyword,
  anyOfKeyword,
  oneOfKeyword,
  notKeyword,
  propertiesKeyword,
  patternPropertiesKeyword,
  additionalPropertiesKeyword,
} from "../draft-2020-12/applicator.ts";
import {
  typeKeyword,
  enumKeyword,
  multipleOfKeyword,
  maxLengthKeyword,
  minLengthKeyword,
  patternKeyword,
  maxItemsKeyword,
  minItemsKeyword,
  uniqueItemsKeyword,
  maxPropertiesKeyword,
  minPropertiesKeyword,
  requiredKeyword,
} from "../draft-2020-12/validation.ts";
import { formatAnnotationKeyword } from "../draft-2020-12/format-annotation.ts";
import {
  titleKeyword,
  descriptionKeyword,
  defaultKeyword,
} from "../draft-2020-12/meta-data.ts";
import {
  definitionsKeyword,
  itemsKeyword,
  additionalItemsKeyword,
  dependenciesKeyword,
} from "../draft-07/validation.ts";

/**
 * A JSON Schema that uses the Draft 05 Validation vocabulary.
 *
 * @see [JSON Schema Validation Draft 05](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00)
 * @category Vocabularies
 */
export interface ValidationVocabulary<Schema> {
  /**
   * Inline schema definitions for re-use.
   * Used to define subschemas for `$ref`.
   *
   * @see [JSON Schema Validation §5.26](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.26)
   */
  readonly definitions?: { readonly [key: string]: Schema };

  /**
   * A short description for documentation purposes.
   *
   * @see [JSON Schema Validation §6.1](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-6.1)
   */
  readonly title?: string;

  /**
   * A detailed description for documentation purposes.
   *
   * @see [JSON Schema Validation §6.1](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-6.1)
   */
  readonly description?: string;

  /**
   * A default value to use when an instance is not provided.
   *
   * @see [JSON Schema Validation 6.2](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-6.2)
   */
  readonly default?: unknown;

  /**
   * The allowed types of valid instances.
   *
   * @see [JSON Schema Validation §5.21](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.21)
   */
  readonly type?: readonly NodeType[] | NodeType;

  /**
   * An array of values, to one of which an instance must be equal.
   * Elements should be unique; order is not significant.
   *
   * @see [JSON Schema Validation §5.20](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.20)
   */
  readonly enum?: readonly unknown[];

  /**
   * Semantic validation for formats like "date-time", "email", etc.
   * Implementations may choose to validate or not.
   *
   * @see [JSON Schema Validation §7](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-7)
   */
  readonly format?: string;

  /**
   * A factor by which numeric instances must be an integer multiple.
   * Must be strictly greater than `0`.
   *
   * @see [JSON Schema Validation §5.1](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.1)
   */
  readonly multipleOf?: number;

  /**
   * The inclusive upper bound for numeric instances.
   *
   * @see [JSON Schema Validation §5.2](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.2)
   */
  readonly maximum?: number;

  /**
   * Whether the limit in "maximum" is exclusive or not.
   *
   * @see [JSON Schema Validation §5.3](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.3)
   */
  readonly exclusiveMaximum?: boolean;

  /**
   * The inclusive lower bound for numeric instances.
   *
   * @see [JSON Schema Validation §5.4](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.4)
   */
  readonly minimum?: number;

  /**
   * Whether the limit in "minimum" is exclusive or not.
   *
   * @see [JSON Schema Validation §5.5](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.5)
   */
  readonly exclusiveMinimum?: boolean;

  /**
   * The maximum length of string instances. Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §5.6](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.6)
   */
  readonly maxLength?: number;

  /**
   * The minimum length of string instances. Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §5.7](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.7)
   */
  readonly minLength?: number;

  /**
   * A regular expression pattern that string instances must match.
   * Should be a valid regex according to ECMA-262.
   *
   * @see [JSON Schema Validation §5.8](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.8)
   */
  readonly pattern?: string;

  /**
   * A schema or array of schemas to validate items in array instances.
   *
   * @see [JSON Schema Validation §5.9](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.9)
   */
  readonly items?: readonly Schema[] | Schema;

  /**
   * A schema to validate items beyond those covered by `items`,
   * when `items` is an array.
   *
   * @see [JSON Schema Validation §5.9](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.9)
   */
  readonly additionalItems?: Schema | boolean;

  /**
   * The maximum number of items allowed in array instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §5.10](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.10)
   */
  readonly maxItems?: number;

  /**
   * The minimum number of items required in array instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §5.11](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.11)
   */
  readonly minItems?: number;

  /**
   * Indicates that all items in array instances must be unique.
   *
   * @see [JSON Schema Validation §5.12](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.12)
   */
  readonly uniqueItems?: boolean;

  /**
   * The maximum number of properties allowed in object instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §5.13](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.13)
   */
  readonly maxProperties?: number;

  /**
   * The minimum number of properties required in object instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §5.14](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.14)
   */
  readonly minProperties?: number;

  /**
   * A list of property names that object instances are required to have.
   * Elements must be unique.
   *
   * @see [JSON Schema Validation §5.15](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.15)
   */
  readonly required?: readonly string[];

  /**
   * Schemas for validating the properties of object instances.
   *
   * @see [JSON Schema Validation §5.16](hhttps://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.16)
   */
  readonly properties?: { readonly [key: string]: Schema };

  /**
   * Schemas for properties matching regex patterns.
   * Patterns should be valid regex as per ECMA-262.
   *
   * @see [JSON Schema Validation §5.17](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.17)
   */
  readonly patternProperties?: { readonly [key: string]: Schema };

  /**
   * A schema for properties not matched by `properties` or `patternProperties`.
   *
   * @see [JSON Schema Validation §5.18](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.18)
   */
  readonly additionalProperties?: Schema | boolean;

  /**
   * Property dependencies. If a key is present, its dependencies must
   * be satisfied.
   *
   * @see [JSON Schema Validation §5.19](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.19)
   */
  readonly dependencies?: {
    readonly [key: string]: readonly string[] | Schema;
  };

  /**
   * An array of schemas, all of which must validate instances.
   * Provides a conjunction (logical AND) of subschemas.
   *
   * @see [JSON Schema Validation §5.22](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.22)
   */
  readonly allOf?: readonly Schema[];

  /**
   * An array of schemas, at least one of which must validate instances.
   * Provides a disjunction (logical OR) of subschemas.
   *
   * @see [JSON Schema Validation §5.23](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.23)
   */
  readonly anyOf?: readonly Schema[];

  /**
   * An array of schemas, exactly one of which must validate instances.
   * Ensures exclusivity among subschemas.
   *
   * @see [JSON Schema Validation §5.24](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.24)
   */
  readonly oneOf?: readonly Schema[];

  /**
   * A schema which instances must not validate against.
   * Used to negate subschema matches.
   *
   * @see [JSON Schema Validation §5.25](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.25)
   */
  readonly not?: Schema;
}

/**
 * The `maximum` keyword.
 *
 * @see [JSON Schema Validation §5.2](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.2)
 * @category Keywords
 */
export const maximumKeyword = {
  ...Keyword.prototype,
  key: "maximum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §5.2 ¶2: MUST be a number.
    if (typeof node !== "number") {
      throw new ValidationError('"maximum" must be a number', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (typeof instance !== "number") {
      return; // Not applicable.
    }

    const parentNode = frame.parent?.node;
    const exclusive =
      isObject(parentNode) &&
      typeof parentNode.exclusiveMaximum === "boolean" &&
      parentNode.exclusiveMaximum;

    // §5.2 ¶2: If the instance is a number, then this keyword validates
    // if "exclusiveMaximum" is true and instance is less than the
    // provided value.
    if (exclusive && instance >= node) {
      attachError(context, "greater than or equal to " + node);
    }

    // §5.2 ¶2: Or else if the instance is less than or exactly equal
    // to the provided value.
    if (!exclusive && instance > node) {
      attachError(context, "greater than " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `exclusiveMaximum` keyword.
 *
 * @see [JSON Schema Validation §5.3](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.3)
 * @category Keywords
 */
export const exclusiveMaximumKeyword = {
  ...AnnotationKeyword.prototype,
  key: "exclusiveMaximum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §5.3 ¶1: MUST be a boolean.
    if (typeof node !== "boolean") {
      throw new ValidationError('"exclusiveMaximum" must be a boolean', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<boolean>;

/**
 * The `minimum` keyword.
 *
 * @see [JSON Schema Validation §5.4](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.4)
 * @category Keywords
 */
export const minimumKeyword = {
  ...Keyword.prototype,
  key: "minimum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §5.4 ¶1: MUST be a number.
    if (typeof node !== "number") {
      throw new ValidationError('"minimum" must be a number', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (typeof instance !== "number") {
      return; // Not applicable.
    }

    const parentNode = frame.parent?.node;
    const exclusive =
      isObject(parentNode) &&
      typeof parentNode.exclusiveMinimum === "boolean" &&
      parentNode.exclusiveMinimum;

    // §5.4 ¶2: If the instance is a number, then this keyword validates
    // if "exclusiveMinimum" is true and instance is greater than the
    // provided value.
    if (exclusive && instance <= node) {
      attachError(context, "less than or equal to " + node);
    }

    // §5.4 ¶2: Or else if the instance is greater than or exactly equal
    // to the provided value.
    if (!exclusive && instance < node) {
      attachError(context, "less than " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `exclusiveMinimum` keyword.
 *
 * @see [JSON Schema Validation §5.5](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.5)
 * @category Keywords
 */
export const exclusiveMinimumKeyword = {
  ...AnnotationKeyword.prototype,
  key: "exclusiveMinimum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §5.5 ¶1: MUST be a boolean.
    if (typeof node !== "boolean") {
      throw new ValidationError('"exclusiveMinimum" must be a boolean', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<boolean>;

/**
 * The JSON Schema Draft 05 Validation vocabulary.
 *
 * @see [JSON Schema Validation Draft 05](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00)
 * @category Vocabularies
 */
export const validationVocabulary = {
  keywords: {
    definitions: definitionsKeyword,
    title: titleKeyword,
    description: descriptionKeyword,
    default: defaultKeyword,
    type: typeKeyword,
    enum: enumKeyword,
    format: formatAnnotationKeyword,
    multipleOf: multipleOfKeyword,
    maximum: maximumKeyword,
    exclusiveMaximum: exclusiveMaximumKeyword,
    minimum: minimumKeyword,
    exclusiveMinimum: exclusiveMinimumKeyword,
    maxLength: maxLengthKeyword,
    minLength: minLengthKeyword,
    pattern: patternKeyword,
    items: itemsKeyword,
    additionalItems: additionalItemsKeyword,
    maxItems: maxItemsKeyword,
    minItems: minItemsKeyword,
    uniqueItems: uniqueItemsKeyword,
    maxProperties: maxPropertiesKeyword,
    minProperties: minPropertiesKeyword,
    required: requiredKeyword,
    properties: propertiesKeyword,
    patternProperties: patternPropertiesKeyword,
    additionalProperties: additionalPropertiesKeyword,
    dependencies: dependenciesKeyword,
    allOf: allOfKeyword,
    anyOf: anyOfKeyword,
    oneOf: oneOfKeyword,
    not: notKeyword,
  },
} as const;
