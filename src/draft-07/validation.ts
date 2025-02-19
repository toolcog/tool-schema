import type { NodeType } from "tool-json";
import {
  isArray,
  isObject,
  nestFrame,
  currentFrame,
  currentLocation,
} from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import {
  emitOutput,
  attachError,
  attachAnnotation,
  getChildAnnotation,
} from "../output.ts";
import { Keyword } from "../keyword.ts";
import { parseSchemaResource, validateSchemaResource } from "../resource.ts";
import {
  allOfKeyword,
  anyOfKeyword,
  oneOfKeyword,
  notKeyword,
  ifKeyword,
  thenKeyword,
  elseKeyword,
  containsKeyword,
  propertiesKeyword,
  patternPropertiesKeyword,
  additionalPropertiesKeyword,
  propertyNamesKeyword,
} from "../draft-2020-12/applicator.ts";
import {
  typeKeyword,
  enumKeyword,
  constKeyword,
  multipleOfKeyword,
  maximumKeyword,
  exclusiveMaximumKeyword,
  minimumKeyword,
  exclusiveMinimumKeyword,
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
  contentEncodingKeyword,
  contentMediaTypeKeyword,
} from "../draft-2020-12/content.ts";
import {
  titleKeyword,
  descriptionKeyword,
  defaultKeyword,
  readOnlyKeyword,
  writeOnlyKeyword,
  examplesKeyword,
} from "../draft-2020-12/meta-data.ts";

/**
 * A JSON Schema that uses the Draft 07 Validation vocabulary.
 *
 * @see [JSON Schema Validation Draft 07](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01)
 * @category Vocabularies
 */
export interface ValidationVocabulary<Schema> {
  /**
   * Inline schema definitions for re-use.
   * Used to define subschemas for `$ref`.
   *
   * @see [JSON Schema Validation §9](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-9)
   */
  readonly definitions?: { readonly [key: string]: Schema | boolean };

  /**
   * A short description for documentation purposes.
   *
   * @see [JSON Schema Validation §10.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10.1)
   */
  readonly title?: string;

  /**
   * A detailed description for documentation purposes.
   *
   * @see [JSON Schema Validation §10.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10.1)
   */
  readonly description?: string;

  /**
   * A default value to use when an instance is not provided.
   *
   * @see [JSON Schema Validation §10.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10.2)
   */
  readonly default?: unknown;

  /**
   * Indicates that instances should not be modified (read-only).
   *
   * @see [JSON Schema Validation §10.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10.3)
   */
  readonly readOnly?: boolean;

  /**
   * Indicates that instances should not be returned (write-only).
   *
   * @see [JSON Schema Validation §10.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10.3)
   */
  readonly writeOnly?: boolean;

  /**
   * An array of example instances that conform to this schema.
   *
   * @see [JSON Schema Validation §10.4](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-10.4)
   */
  readonly examples?: readonly unknown[];

  /**
   * The allowed types of valid instances.
   *
   * @see [JSON Schema Validation §6.1.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.1.1)
   */
  readonly type?: readonly NodeType[] | NodeType;

  /**
   * An array of values, to one of which an instance must be equal.
   * Elements should be unique; order is not significant.
   *
   * @see [JSON Schema Validation §6.1.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.1.2)
   */
  readonly enum?: readonly unknown[];

  /**
   * A value to which an instance must be equal.
   *
   * @see [JSON Schema Validation §6.1.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.1.3)
   */
  readonly const?: unknown;

  /**
   * Semantic validation for formats like "date-time", "email", etc.
   * Implementations may choose to validate or not.
   *
   * @see [JSON Schema Validation §7](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-7)
   */
  readonly format?: string;

  /**
   * A factor by which numeric instances must be an integer multiple.
   * Must be strictly greater than `0`.
   *
   * @see [JSON Schema Validation §6.2.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.2.1)
   */
  readonly multipleOf?: number;

  /**
   * The inclusive upper bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.2.2)
   */
  readonly maximum?: number;

  /**
   * The exclusive upper bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.2.3)
   */
  readonly exclusiveMaximum?: number;

  /**
   * The inclusive lower bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.4](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.2.4)
   */
  readonly minimum?: number;

  /**
   * The exclusive lower bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.5](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.2.5)
   */
  readonly exclusiveMinimum?: number;

  /**
   * The maximum length of string instances. Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.3.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.3.1)
   */
  readonly maxLength?: number;

  /**
   * The minimum length of string instances. Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.3.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.3.2)
   */
  readonly minLength?: number;

  /**
   * A regular expression pattern that string instances must match.
   * Should be a valid regex according to ECMA-262.
   *
   * @see [JSON Schema Validation §6.3.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.3.3)
   */
  readonly pattern?: string;

  /**
   * The binary-to-text encoding of string instance content.
   *
   * @see [JSON Schema Validation §8.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-8.3)
   */
  readonly contentEncoding?: string;

  /**
   * The MIME type of string instance content.
   *
   * @see [JSON Schema Validation §8.4](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-8.4)
   */
  readonly contentMediaType?: string;

  /**
   * A schema or array of schemas to validate items in array instances.
   *
   * @see [JSON Schema Validation §6.4.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.1)
   */
  readonly items?: readonly (Schema | boolean)[] | Schema | boolean;

  /**
   * A schema to validate items beyond those covered by `items`,
   * when `items` is an array.
   *
   * @see [JSON Schema Validation §6.4.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.2)
   */
  readonly additionalItems?: Schema | boolean;

  /**
   * The maximum number of items allowed in array instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.4.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.3)
   */
  readonly maxItems?: number;

  /**
   * The minimum number of items required in array instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.4.4](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.4)
   */
  readonly minItems?: number;

  /**
   * Indicates that all items in array instances must be unique.
   *
   * @see [JSON Schema Validation §6.4.5](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.5)
   */
  readonly uniqueItems?: boolean;

  /**
   * A schema that at least one item in array instances must satisfy.
   *
   * @see [JSON Schema Validation §6.4.6](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.6)
   */
  readonly contains?: Schema | boolean;

  /**
   * The maximum number of properties allowed in object instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.5.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.1)
   */
  readonly maxProperties?: number;

  /**
   * The minimum number of properties required in object instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.5.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.2)
   */
  readonly minProperties?: number;

  /**
   * A list of property names that object instances are required to have.
   * Elements must be unique.
   *
   * @see [JSON Schema Validation §6.5.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.3)
   */
  readonly required?: readonly string[];

  /**
   * Schemas for validating the properties of object instances.
   *
   * @see [JSON Schema Validation §6.5.4](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.4)
   */
  readonly properties?: { readonly [key: string]: Schema | boolean };

  /**
   * Schemas for properties matching regex patterns.
   * Patterns should be valid regex as per ECMA-262.
   *
   * @see [JSON Schema Validation §6.5.5](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.5)
   */
  readonly patternProperties?: { readonly [key: string]: Schema | boolean };

  /**
   * A schema for properties not matched by `properties` or `patternProperties`.
   *
   * @see [JSON Schema Validation §6.5.6](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.6)
   */
  readonly additionalProperties?: Schema | boolean;

  /**
   * Property dependencies. If a key is present, its dependencies must
   * be satisfied.
   *
   * @see [JSON Schema Validation §6.5.7](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.7)
   */
  readonly dependencies?: {
    readonly [key: string]: readonly string[] | Schema | boolean;
  };

  /**
   * A schema to validate all property names of object instances.
   *
   * @see [JSON Schema Validation §6.5.8](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.8)
   */
  readonly propertyNames?: Schema | boolean;

  /**
   * An array of schemas, all of which must validate instances.
   * Provides a conjunction (logical AND) of subschemas.
   *
   * @see [JSON Schema Validation §6.7.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.7.1)
   */
  readonly allOf?: readonly (Schema | boolean)[];

  /**
   * An array of schemas, at least one of which must validate instances.
   * Provides a disjunction (logical OR) of subschemas.
   *
   * @see [JSON Schema Validation §6.7.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.7.2)
   */
  readonly anyOf?: readonly (Schema | boolean)[];

  /**
   * An array of schemas, exactly one of which must validate instances.
   * Ensures exclusivity among subschemas.
   *
   * @see [JSON Schema Validation §6.7.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.7.3)
   */
  readonly oneOf?: readonly (Schema | boolean)[];

  /**
   * A schema which instances must not validate against.
   * Used to negate subschema matches.
   *
   * @see [JSON Schema Validation §6.7.4](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.7.4)
   */
  readonly not?: Schema | boolean;

  /**
   * A schema to match against instances to determine whether to validate
   * against `then` or `else`. Acts as a predicate whose validation result
   * dictates the branch taken.
   *
   * @see [JSON Schema Validation §6.6.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.6.1)
   */
  readonly if?: Schema | boolean;

  /**
   * The subschema to apply if the `if` subschema validation succeeds.
   * Only evaluated when `if` passes validation.
   *
   * @see [JSON Schema Validation §6.6.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.6.2)
   */
  readonly then?: Schema | boolean;

  /**
   * The subschema to apply if the `if` subschema validation fails.
   * Only evaluated when `if` fails validation.
   *
   * @see [JSON Schema Validation §6.6.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.6.3)
   */
  readonly else?: Schema | boolean;
}

/**
 * The `definitions` keyword.
 *
 * @see [JSON Schema Validation §9](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-9)
 * @category Keywords
 */
export const definitionsKeyword = {
  ...Keyword.prototype,
  key: "definitions",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §9 ¶2: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"definitions" must be an object', {
        location: currentLocation(context),
      });
    }

    // §9 ¶2: Each member value of this object MUST be a valid JSON Schema.
    for (const [key, subschema] of Object.entries(node)) {
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = key;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },
} as const satisfies Keyword<{ readonly [key: string]: unknown }>;

/**
 * The `items` keyword.
 *
 * @see [JSON Schema Validation §6.4.1](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.1)
 * @category Keywords
 */
export const itemsKeyword = {
  ...Keyword.prototype,
  key: "items",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.4.1 ¶1: MUST be either a valid JSON Schema...
    if (!isArray(node)) {
      parseSchemaResource(context);
      return;
    }

    // §6.4.1 ¶1: ...or an array of valid JSON Schemas.
    for (let index = 0; index < node.length; index += 1) {
      const subschema = node[index]!;
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = index;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    if (!isArray(node)) {
      // §6.4.1 ¶3: If "items" is a schema, validation succeeds if all
      // elements in the array successfully validate against that schema.
      let valid = true;
      for (let index = 0; index < instance.length; index += 1) {
        nestFrame(context, (frame: SchemaFrame): void => {
          frame.node = node;
          frame.instanceKey = index;
          frame.instance = instance[index];
          frame.output = { valid: true };
          validateSchemaResource(context);
          valid &&= frame.output.valid;
          emitOutput(context, frame);
        });
      }

      if (!valid) {
        attachError(context, "not valid against all items");
      } else if (instance.length !== 0) {
        attachAnnotation(context, true);
      }
      return;
    }

    // §6.4.1 ¶4: If "items" is an array of schemas, validation succeeds if
    // each element of the instance validates against the schema at the same
    // position, if any.
    let valid = true;
    const commonLength = Math.min(node.length, instance.length);
    for (let index = 0; index < commonLength; index += 1) {
      const subschema = node[index]!;
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = index;
        frame.node = subschema;
        frame.instanceKey = index;
        frame.instance = instance[index];
        frame.output = { valid: true };
        validateSchemaResource(context);
        valid &&= frame.output.valid;
        emitOutput(context, frame);
      });
    }

    if (commonLength !== node.length) {
      let message: string;
      if (instance.length === 0) {
        message = "empty array is missing ";
        message += node.length;
        message += " expected prefix ";
        message += node.length === 1 ? "item" : "items";
      } else {
        message = "array is missing ";
        message += node.length - instance.length;
        message += " of ";
        message += node.length;
        message += " expected prefix ";
        message += node.length === 1 ? "item" : "items";
      }
      attachError(context, message);
    }

    if (valid) {
      if (commonLength === instance.length) {
        attachAnnotation(context, true);
      } else {
        attachAnnotation(context, commonLength);
      }
    }
  },
} as const satisfies Keyword<readonly unknown[] | unknown>;

/**
 * The `additionalItems` keyword.
 *
 * @see [JSON Schema Validation §6.4.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.4.2)
 * @category Keywords
 */
export const additionalItemsKeyword = {
  ...Keyword.prototype,
  key: "additionalItems",

  dependencies: [...Keyword.prototype.dependencies, "items"],

  parse(context: SchemaContext): void {
    // §6.4.2 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §6.4.2 ¶3: If "items" is an array of schemas, validation succeeds if
    // every instance element at a position greater than the size of "items"
    // validates against "additionalItems".
    const itemsAnnotation = getChildAnnotation(
      frame.parent,
      "items",
    )?.annotation;
    const startIndex =
      itemsAnnotation === true ? instance.length
      : typeof itemsAnnotation === "number" ? itemsAnnotation
      : 0;

    let valid = true;
    for (let index = startIndex; index < instance.length; index += 1) {
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.node = node;
        frame.instanceKey = index;
        frame.instance = instance[index];
        frame.output = { valid: true };
        validateSchemaResource(context);
        valid &&= frame.output.valid;
        emitOutput(context, frame);
      });
    }

    if (!valid) {
      attachError(context, "not valid against all additional items");
    } else if (startIndex < instance.length) {
      attachAnnotation(context, true);
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The `dependencies` keyword.
 *
 * @see [JSON Schema Validation §6.5.7](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-6.5.7)
 * @category Keywords
 */
export const dependenciesKeyword = {
  ...Keyword.prototype,
  key: "dependencies",

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.5.7 ¶2: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"dependencies" must be an object', {
        location: currentLocation(context),
      });
    }

    // §6.5.7 ¶2: Each property specifies a dependency.
    for (const [key, dependency] of Object.entries(node)) {
      // §6.5.7 ¶2: Each dependency value MUST be an array
      // or a valid JSON Schema.
      if (isArray(dependency)) {
        // §6.5.7 ¶4: If the dependency value is an array, each element
        // in the array, if any, MUST be a string.
        if (!dependency.every((item) => typeof item === "string")) {
          throw new ValidationError(
            '"dependencies" array items must be strings',
            { location: currentLocation(context) },
          );
        }
        // §6.5.7 ¶4: And MUST be unique.
        if (new Set(dependency).size !== dependency.length) {
          throw new ValidationError(
            '"dependencies" array items must be unique',
            { location: currentLocation(context) },
          );
        }
      } else {
        nestFrame(context, (frame: SchemaFrame): void => {
          frame.nodeKey = key;
          frame.node = dependency;
          parseSchemaResource(context);
        });
      }
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as {
      readonly [key: string]: readonly string[] | unknown;
    };
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    let missingProperties: string[] | undefined;
    let invalidDependents: string[] | undefined;
    for (const [key, dependency] of Object.entries(node)) {
      if (instance[key] === undefined) {
        continue;
      }

      if (isArray(dependency)) {
        // §6.5.7 ¶4: If the dependency key is a property in the instance,
        // each of the items in the dependency value must be a property that
        // exists in the instance.
        for (const dependent of dependency) {
          if (instance[dependent as string] === undefined) {
            missingProperties ??= [];
            missingProperties.push(dependent as string);
            break;
          }
        }
      } else {
        // §6.5.7 ¶3: If the dependency value is a subschema,
        // and the dependency key is a property in the instance,
        // the entire instance must validate against the dependency value.
        nestFrame(context, (frame: SchemaFrame): void => {
          frame.nodeKey = key;
          frame.node = dependency;
          frame.instance = instance;
          frame.output = { valid: true };
          validateSchemaResource(context);
          if (!frame.output.valid) {
            invalidDependents ??= [];
            invalidDependents.push(key);
          }
          emitOutput(context, frame);
        });
      }
    }

    if (missingProperties !== undefined || invalidDependents !== undefined) {
      let message = "";

      if (invalidDependents !== undefined) {
        message = "not valid against ";
        if (invalidDependents.length === 1) {
          message = JSON.stringify(invalidDependents[0]);
          message += " dependent subschema";
        } else {
          for (let i = 0; i < invalidDependents.length; i += 1) {
            if (i !== 0) {
              message += i !== invalidDependents.length - 1 ? ", " : " and ";
            }
            message += JSON.stringify(invalidDependents[i]);
          }
          message += " dependent subschemas";
        }
      }

      if (missingProperties !== undefined && invalidDependents !== undefined) {
        message += " and ";
      }

      if (missingProperties !== undefined) {
        if (missingProperties.length === 1) {
          message =
            "missing dependent property " +
            JSON.stringify(missingProperties[0]);
        } else {
          message = "missing dependent properties ";
          for (let i = 0; i < missingProperties.length; i += 1) {
            if (i !== 0) {
              message += i !== missingProperties.length - 1 ? ", " : " and ";
            }
            message += JSON.stringify(missingProperties[i]);
          }
        }
      }

      attachError(context, message);
    }
  },
} as const as Keyword<{ readonly [key: string]: readonly string[] | unknown }>;

/**
 * The JSON Schema Draft 07 Validation vocabulary.
 *
 * @see [JSON Schema Validation Draft 07](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01)
 * @category Vocabularies
 */
export const validationVocabulary = {
  keywords: {
    definitions: definitionsKeyword,
    title: titleKeyword,
    description: descriptionKeyword,
    default: defaultKeyword,
    readOnly: readOnlyKeyword,
    writeOnly: writeOnlyKeyword,
    examples: examplesKeyword,
    type: typeKeyword,
    enum: enumKeyword,
    const: constKeyword,
    format: formatAnnotationKeyword,
    multipleOf: multipleOfKeyword,
    maximum: maximumKeyword,
    exclusiveMaximum: exclusiveMaximumKeyword,
    minimum: minimumKeyword,
    exclusiveMinimum: exclusiveMinimumKeyword,
    maxLength: maxLengthKeyword,
    minLength: minLengthKeyword,
    pattern: patternKeyword,
    contentEncoding: contentEncodingKeyword,
    contentMediaType: contentMediaTypeKeyword,
    items: itemsKeyword,
    additionalItems: additionalItemsKeyword,
    maxItems: maxItemsKeyword,
    minItems: minItemsKeyword,
    uniqueItems: uniqueItemsKeyword,
    contains: containsKeyword,
    maxProperties: maxPropertiesKeyword,
    minProperties: minPropertiesKeyword,
    required: requiredKeyword,
    properties: propertiesKeyword,
    patternProperties: patternPropertiesKeyword,
    additionalProperties: additionalPropertiesKeyword,
    dependencies: dependenciesKeyword,
    propertyNames: propertyNamesKeyword,
    allOf: allOfKeyword,
    anyOf: anyOfKeyword,
    oneOf: oneOfKeyword,
    not: notKeyword,
    if: ifKeyword,
    then: thenKeyword,
    else: elseKeyword,
  },
} as const;
