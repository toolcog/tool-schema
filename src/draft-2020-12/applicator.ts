import {
  isArray,
  isObject,
  nestFrame,
  currentFrame,
  currentLocation,
} from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import { cachePattern } from "../context.ts";
import {
  emitOutput,
  attachError,
  attachAnnotation,
  getChildAnnotation,
  saveCheckpoint,
  restoreCheckpoint,
} from "../output.ts";
import { Keyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";
import { parseSchemaResource, validateSchemaResource } from "../resource.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Applicator vocabulary.
 *
 * @see [JSON Schema Core §10](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10)
 * @category Vocabularies
 */
export interface ApplicatorVocabulary<Schema> {
  /**
   * An array of schemas, all of which must validate instances.
   * Provides a conjunction (logical AND) of subschemas.
   *
   * @see [JSON Schema Core §10.2.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.1)
   */
  readonly allOf?: readonly (Schema | boolean)[];

  /**
   * An array of schemas, at least one of which must validate instances.
   * Provides a disjunction (logical OR) of subschemas.
   *
   * @see [JSON Schema Core §10.2.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.2)
   */
  readonly anyOf?: readonly (Schema | boolean)[];

  /**
   * An array of schemas, exactly one of which must validate instances.
   * Ensures exclusivity among subschemas.
   *
   * @see [JSON Schema Core §10.2.1.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.3)
   */
  readonly oneOf?: readonly (Schema | boolean)[];

  /**
   * A schema which instances must not validate against.
   * Used to negate subschema matches.
   *
   * @see [JSON Schema Core §10.2.1.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.4)
   */
  readonly not?: Schema | boolean;

  /**
   * A schema to match against instances to determine whether to validate
   * against `then` or `else`. Acts as a predicate whose validation result
   * dictates the branch taken.
   *
   * @see [JSON Schema Core §10.2.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.1)
   */
  readonly if?: Schema;

  /**
   * The subschema to apply if the `if` subschema validation succeeds.
   * Only evaluated when `if` passes validation.
   *
   * @see [JSON Schema Core §10.2.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.2)
   */
  readonly then?: Schema | boolean;

  /**
   * The subschema to apply if the `if` subschema validation fails.
   * Only evaluated when `if` fails validation.
   *
   * @see [JSON Schema Core §10.2.2.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.3)
   */
  readonly else?: Schema | boolean;

  /**
   * Schema dependencies where the presence of a property triggers
   * validation of the entire object against a subschema.
   *
   * @see [JSON Schema Core §10.2.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.4)
   */
  readonly dependentSchemas?: { readonly [key: string]: Schema | boolean };

  /**
   * Applies subschemas to items of array instances by position.
   * Replaces the array form of `items` from Draft 7.
   *
   * @see [JSON Schema Core §10.3.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.1.1)
   */
  readonly prefixItems?: readonly (Schema | boolean)[];

  /**
   * A schema to apply to items not covered by `prefixItems`.
   *
   * @see [JSON Schema Core §10.3.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.1.2)
   */
  readonly items?: Schema | boolean;

  /**
   * A schema that at least one item in array instances must satisfy.
   *
   * @see [JSON Schema Core §10.3.1.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.1.3)
   */
  readonly contains?: Schema | boolean;

  /**
   * Schemas for validating the properties of object instances.
   *
   * @see [JSON Schema Core §10.3.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.1)
   */
  readonly properties?: { readonly [key: string]: Schema | boolean };

  /**
   * Schemas for properties matching regex patterns.
   * Patterns should be valid regex as per ECMA-262.
   *
   * @see [JSON Schema Core §10.3.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.2)
   */
  readonly patternProperties?: { readonly [key: string]: Schema | boolean };

  /**
   * A schema for properties not matched by `properties`
   * or `patternProperties`.
   *
   * @see [JSON Schema Core §10.3.2.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.3)
   */
  readonly additionalProperties?: Schema | boolean;

  /**
   * A schema to validate all property names of object instances.
   *
   * @see [JSON Schema Core §10.3.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.4)
   */
  readonly propertyNames?: Schema | boolean;
}

/**
 * The `allOf` keyword.
 *
 * @see [JSON Schema Core §10.2.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.1)
 * @category Keywords
 */
export const allOfKeyword = {
  ...Keyword.prototype,
  key: "allOf",

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §10.2.1.1 ¶1: MUST be a non-empty array.
    if (!isArray(node) || node.length === 0) {
      throw new ValidationError('"allOf" must be a non-empty array', {
        location: currentLocation(context),
      });
    }

    // §10.2.1.1 ¶1: Each item of the array MUST be a valid JSON Schema.
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
    const node = frame.node as readonly unknown[];
    const instance = frame.instance;

    // §10.2.1.1 ¶2: An instance validates successfully against this keyword
    // if it validates successfully against all schemas defined by this
    // keyword's value.
    let valid = true;
    for (let index = 0; index < node.length; index += 1) {
      const subschema = node[index]!;
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = index;
        frame.node = subschema;
        frame.instance = instance;
        frame.output = { valid: true };
        validateSchemaResource(context);
        valid &&= frame.output.valid;
        emitOutput(context, frame);
      });
    }

    if (!valid) {
      attachError(context, "not valid against all subschemas");
    }
  },
} as const satisfies Keyword<readonly unknown[]>;

/**
 * The `anyOf` keyword.
 *
 * @see [JSON Schema Core §10.2.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.2)
 * @category Keywords
 */
export const anyOfKeyword = {
  ...Keyword.prototype,
  key: "anyOf",

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §10.2.1.2 ¶1: MUST be a non-empty array.
    if (!isArray(node) || node.length === 0) {
      throw new ValidationError('"anyOf" must be a non-empty array', {
        location: currentLocation(context),
      });
    }

    // §10.2.1.2 ¶1: Each item of the array MUST be a valid JSON Schema.
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
    const node = frame.node as readonly unknown[];
    const instance = frame.instance;

    const checkpoint = saveCheckpoint(frame.output);

    // §10.2.1.2 ¶2: An instance validates successfully against this keyword
    // if it validates successfully against at least one schema defined by
    // this keyword's value.
    let valid = false;
    for (let index = 0; index < node.length; index += 1) {
      const subschema = node[index]!;
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = index;
        frame.node = subschema;
        frame.instance = instance;
        frame.output = { valid: true };
        validateSchemaResource(context);
        valid ||= frame.output.valid;
        emitOutput(context, frame);
      });
    }

    if (!valid) {
      attachError(context, "not valid against any subschemas");
      return;
    }

    restoreCheckpoint(checkpoint);
  },
} as const satisfies Keyword<readonly unknown[]>;

/**
 * The `oneOf` keyword.
 *
 * @see [JSON Schema Core §10.2.1.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.3)
 * @category Keywords
 */
export const oneOfKeyword = {
  ...Keyword.prototype,
  key: "oneOf",

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §10.2.1.3 ¶1: MUST be a non-empty array.
    if (!isArray(node) || node.length === 0) {
      throw new ValidationError('"oneOf" must be a non-empty array', {
        location: currentLocation(context),
      });
    }

    // §10.2.1.3 ¶1: Each item of the array MUST be a valid JSON Schema.
    for (let index = 0; index < node.length; index += 1) {
      const subschema = node[index];
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = index;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as readonly unknown[];
    const instance = frame.instance;

    const checkpoint = saveCheckpoint(frame.output);

    // §10.2.1.3 ¶2: An instance validates successfully against this keyword
    // if it validates successfully against exactly one schema defined by
    // this keyword's value.
    let validCount = 0;
    for (let index = 0; index < node.length; index += 1) {
      const subschema = node[index]!;
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = index;
        frame.node = subschema;
        frame.instance = instance;
        frame.output = { valid: true };
        validateSchemaResource(context);
        if (frame.output.valid) {
          validCount += 1;
        }
        emitOutput(context, frame);
      });
    }

    if (validCount !== 1) {
      attachError(context, "not valid against exactly one subschema");
      return;
    }

    restoreCheckpoint(checkpoint);
  },
} as const satisfies Keyword<readonly unknown[]>;

/**
 * The `not` keyword.
 *
 * @see [JSON Schema Core §10.2.1.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.1.4)
 * @category Keywords
 */
export const notKeyword = {
  ...Keyword.prototype,
  key: "not",

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    // §10.2.1.4 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;

    const checkpoint = saveCheckpoint(frame.output);

    validateSchemaResource(context);

    if (frame.output?.valid !== false) {
      attachError(context, "unexpectedly valid");
      return;
    }

    restoreCheckpoint(checkpoint);
  },
} as const satisfies Keyword<unknown>;

/**
 * The `if` keyword.
 *
 * @see [JSON Schema Core §10.2.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.1)
 * @category Keywords
 */
export const ifKeyword = {
  ...Keyword.prototype,
  key: "if",

  parse(context: SchemaContext): void {
    // §10.2.2.1 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;

    const checkpoint = saveCheckpoint(frame.output);

    validateSchemaResource(context);

    attachAnnotation(context, frame.output?.valid);

    // §10.2.2.1 ¶2: The validation outcome of this keyword's subschema
    // has no direct effect on the overall validation result.
    restoreCheckpoint(checkpoint);
  },
} as const satisfies Keyword<unknown>;

/**
 * The `then` keyword.
 *
 * @see [JSON Schema Core §10.2.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.2)
 * @category Keywords
 */
export const thenKeyword = {
  ...Keyword.prototype,
  key: "then",

  dependencies: [...Keyword.prototype.dependencies, "if"],

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    // §10.2.2.2 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;

    // §10.2.2.2 ¶2: When "if" is present, and the instance successfully
    // validates against its subschema, then validation succeeds against this
    // keyword if the instance also successfully validates against this
    // keyword's subschema.
    const condition = getChildAnnotation(frame.parent, "if")?.annotation;
    if (condition === true) {
      validateSchemaResource(context);
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The `else` keyword.
 *
 * @see [JSON Schema Core §10.2.2.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.3)
 * @category Keywords
 */
export const elseKeyword = {
  ...Keyword.prototype,
  key: "else",

  dependencies: [...Keyword.prototype.dependencies, "if"],

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    // §10.2.2.3 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;

    // §10.2.2.3 ¶2: When "if" is present, and the instance fails to validate
    // against its subschema, then validation succeeds against this keyword
    // if the instance successfully validates against this keyword's subschema.
    const condition = getChildAnnotation(frame.parent, "if")?.annotation;
    if (condition === false) {
      validateSchemaResource(context);
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The `dependentSchemas` keyword.
 *
 * @see [JSON Schema Core §10.2.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.2.2.4)
 * @category Keywords
 */
export const dependentSchemasKeyword = {
  ...Keyword.prototype,
  key: "dependentSchemas",

  dependents: [...Keyword.prototype.dependents, "@unevaluated"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §10.2.2.4 ¶2: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"dependentSchemas" must be an object', {
        location: currentLocation(context),
      });
    }

    // §10.2.2.4 ¶2: Each value in the object MUST be a valid JSON Schema.
    for (const [key, subschema] of Object.entries(node)) {
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = key;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as { readonly [key: string]: unknown };
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §10.2.2.4 ¶3: If the object key is a property in the instance,
    // the entire instance must validate against the subschema.
    // Its use is dependent on the presence of the property.
    let invalidDependents: string[] | undefined;
    for (const [key, subschema] of Object.entries(node)) {
      if (instance[key] === undefined) {
        continue;
      }

      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = key;
        frame.node = subschema;
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

    if (invalidDependents !== undefined) {
      let message = "not valid against ";
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
      attachError(context, message);
    }
  },
} as const satisfies Keyword<{ readonly [key: string]: unknown }>;

/**
 * The `prefixItems` keyword.
 *
 * @see [JSON Schema Core §10.3.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.1.1)
 * @category Keywords
 */
export const prefixItemsKeyword = {
  ...Keyword.prototype,
  key: "prefixItems",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // 10.3.1.1 ¶1: MUST be a non-empty array...
    if (!isArray(node) || node.length === 0) {
      throw new ValidationError('"prefixItems" must be a non-empty array', {
        location: currentLocation(context),
      });
    }

    // 10.3.1.1 ¶1: ...of valid JSON Schemas.
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
    const node = frame.node as readonly unknown[];
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // 10.3.1.1 ¶2: Validation succeeds if each element of the instance
    // validates against the schema at the same position, if any.
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

    // 10.3.1.1 ¶3: This keyword produces an annotation value which is the
    // largest index to which this keyword applied a subschema. The value
    // MAY be a boolean true if a subschema was applied to every index of
    // the instance, such as is produced by the "items" keyword.
    if (valid) {
      if (commonLength === instance.length) {
        attachAnnotation(context, true);
      } else {
        attachAnnotation(context, commonLength);
      }
    }
  },
} as const satisfies Keyword<readonly unknown[]>;

/**
 * The `items` keyword.
 *
 * @see [JSON Schema Core §10.3.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.1.2)
 * @category Keywords
 */
export const itemsKeyword = {
  ...Keyword.prototype,
  key: "items",

  dependencies: [...Keyword.prototype.dependencies, "prefixItems"],

  parse(context: SchemaContext): void {
    // §10.3.1.2 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §10.3.1.2 ¶2: This keyword applies its subschema to all instance
    // elements at indexes greater than the length of the "prefixItems" array
    // in the same schema object, as reported by the annotation result of
    // that "prefixItems" keyword. If no such annotation result exists,
    // "items" applies its subschema to all instance array elements.
    const prefixItemsAnnotation = getChildAnnotation(
      frame.parent,
      "prefixItems",
    )?.annotation;
    const startIndex =
      prefixItemsAnnotation === true ? instance.length
      : typeof prefixItemsAnnotation === "number" ? prefixItemsAnnotation
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
      attachError(context, "not valid against all items");
    }

    // §10.3.1.2 ¶3: If the "items" subschema is applied to any positions
    // within the instance array, it produces an annotation result of
    // boolean true, indicating that all remaining array elements have
    // been evaluated against this keyword's subschema.
    if (valid && startIndex < instance.length) {
      attachAnnotation(context, true);
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The `contains` keyword.
 *
 * @see [JSON Schema Core §10.3.1.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.1.3)
 * @category Keywords
 */
export const containsKeyword = {
  ...Keyword.prototype,
  key: "contains",

  parse(context: SchemaContext): void {
    // §10.3.1.3 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    const checkpoint = saveCheckpoint(frame.output);

    // §10.3.1.3 ¶2: An array instance is valid against "contains" if at least
    // one of its elements is valid against the given schema, except when
    // "minContains" is present and has a value of 0, in which case an array
    // instance MUST be considered valid against the "contains" keyword,
    // even if none of its elements is valid against the given schema.
    let contains: number[] | true = true;
    let containsCount = 0;
    for (let index = 0; index < instance.length; index += 1) {
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.node = node;
        frame.instanceKey = index;
        frame.instance = instance[index];
        frame.output = { valid: true };
        validateSchemaResource(context);
        if (frame.output.valid) {
          if (contains !== true) {
            // Record subsequent valid index.
            contains.push(index);
          } else {
            // All indexes up to this point are valid.
          }
          containsCount += 1;
        } else if (contains === true) {
          // Encountered first invalid index.
          contains = [];
          // Initialize valid array with all preceding indexes.
          for (let i = 0; i < index; i += 1) {
            contains.push(i);
          }
        } else {
          // Subsequent invalid index.
        }
        emitOutput(context, frame);
      });
    }

    const parentNode = frame.parent?.node;
    const minContains =
      isObject(parentNode) && typeof parentNode.minContains === "number" ?
        parentNode.minContains
      : 1;

    if (containsCount === 0 && minContains !== 0) {
      attachError(context, "does not contain item");
      return;
    }

    restoreCheckpoint(checkpoint);

    // §10.3.1.3 ¶3: This keyword produces an annotation value which is an
    // array of the indexes to which this keyword validates successfully when
    // applying its subschema, in ascending order. The value MAY be a boolean
    // "true" if the subschema validates successfully when applied to every
    // index of the instance. The annotation MUST be present if the instance
    // array to which this keyword's schema applies is empty.
    attachAnnotation(context, contains);
  },
} as const satisfies Keyword<unknown>;

/**
 * The `properties` keyword.
 *
 * @see [JSON Schema Core §10.3.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.1)
 * @category Keywords
 */
export const propertiesKeyword = {
  ...Keyword.prototype,
  key: "properties",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §10.3.2.1 ¶1: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"properties" must be an object', {
        location: currentLocation(context),
      });
    }

    // §10.3.2.1 ¶1: Each value of this object MUST be a valid JSON Schema.
    for (const [key, subschema] of Object.entries(node)) {
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = key;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as { readonly [key: string]: unknown };
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §10.3.2.1 ¶2: Validation succeeds if, for each name that appears
    // in both the instance and as a name within this keyword's value,
    // the child instance for that name successfully validates against
    // the corresponding schema.
    const evaluatedProperties: string[] = [];
    let invalidProperties: string[] | undefined;
    for (const [key, value] of Object.entries(instance)) {
      const subschema = node[key];
      if (subschema === undefined || value === undefined) {
        continue;
      }

      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = key;
        frame.node = subschema;
        frame.instanceKey = key;
        frame.instance = value;
        frame.output = { valid: true };
        validateSchemaResource(context);
        evaluatedProperties.push(key);
        if (!frame.output.valid) {
          invalidProperties ??= [];
          invalidProperties.push(key);
        }
        emitOutput(context, frame);
      });
    }

    if (invalidProperties !== undefined) {
      let message: string;
      if (invalidProperties.length === 1) {
        message = "invalid property " + JSON.stringify(invalidProperties[0]);
      } else {
        message = "invalid properties ";
        for (let i = 0; i < invalidProperties.length; i += 1) {
          if (i !== 0) {
            message += i !== invalidProperties.length - 1 ? ", " : " and ";
          }
          message += JSON.stringify(invalidProperties[i]);
        }
      }
      attachError(context, message);
    }

    // §10.3.2.1 ¶3: The annotation result of this keyword is the set of
    // instance property names matched by this keyword. This annotation
    // affects the behavior of "additionalProperties" (in this vocabulary)
    // and "unevaluatedProperties" in the Unevaluated vocabulary.
    if (invalidProperties === undefined) {
      attachAnnotation(context, evaluatedProperties);
    }
  },
} as const satisfies Keyword<{ readonly [key: string]: unknown }>;

/**
 * The `patternProperties` keyword.
 * @see [JSON Schema Core §10.3.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.2)
 * @category Keywords
 */
export const patternPropertiesKeyword = {
  ...Keyword.prototype,
  key: "patternProperties",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §10.3.2.2 ¶1: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"patternProperties" must be an object', {
        location: currentLocation(context),
      });
    }

    // §10.3.2.2 ¶1: Each property name of this object SHOULD be a valid
    // regular expression, according to the ECMA-262 regular expression dialect.
    // Each property value of this object MUST be a valid JSON Schema.
    for (const [pattern, subschema] of Object.entries(node)) {
      try {
        cachePattern(context, pattern);
      } catch (cause) {
        //throw new ValidationError(
        //  "Pattern property is not a valid regular expression: " +
        //    JSON.stringify(pattern),
        //  { location: currentLocation(context), cause },
        //);
      }

      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = pattern;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as { readonly [pattern: string]: unknown };
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §10.3.2.2 ¶2: Validation succeeds if, for each instance name that
    // matches any regular expressions that appear as a property name in this
    // keyword's value, the child instance for that name successfully validates
    // against each schema that corresponds to a matching regular expression.
    const evaluatedProperties: string[] = [];
    let invalidProperties: string[] | undefined;
    for (const [pattern, subschema] of Object.entries(node)) {
      const regex = cachePattern(context, pattern);

      for (const [key, value] of Object.entries(instance)) {
        if (value === undefined || !regex.test(key)) {
          continue;
        }

        nestFrame(context, (frame: SchemaFrame): void => {
          frame.nodeKey = pattern;
          frame.node = subschema;
          frame.instanceKey = key;
          frame.instance = value;
          frame.output = { valid: true };
          validateSchemaResource(context);
          evaluatedProperties.push(key);
          if (!frame.output.valid) {
            invalidProperties ??= [];
            if (!invalidProperties.includes(key)) {
              invalidProperties.push(key);
            }
          }
        });
      }
    }

    if (invalidProperties !== undefined) {
      let message: string;
      if (invalidProperties.length === 1) {
        message =
          "invalid pattern property " + JSON.stringify(invalidProperties[0]);
      } else {
        message = "invalid pattern properties ";
        for (let i = 0; i < invalidProperties.length; i += 1) {
          if (i !== 0) {
            message += i !== invalidProperties.length - 1 ? ", " : " and ";
          }
          message += JSON.stringify(invalidProperties[i]);
        }
      }
      attachError(context, message);
    }

    // §10.3.2.2 ¶3: The annotation result of this keyword is the set of
    // instance property names matched by this keyword. This annotation
    // affects the behavior of "additionalProperties" (in this vocabulary)
    // and "unevaluatedProperties" (in the Unevaluated vocabulary).
    if (invalidProperties === undefined) {
      attachAnnotation(context, evaluatedProperties);
    }
  },
} as const satisfies Keyword<{ readonly [pattern: string]: unknown }>;

/**
 * The `additionalProperties` keyword.
 *
 * @see [JSON Schema Core §10.3.2.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.3)
 * @category Keywords
 */
export const additionalPropertiesKeyword = {
  ...Keyword.prototype,
  key: "additionalProperties",

  dependencies: [
    ...Keyword.prototype.dependencies,
    "properties",
    "patternProperties",
  ],

  parse(context: SchemaContext): void {
    // §10.3.2.3 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §10.3.2.3 ¶2: The behavior of this keyword depends on the presence and
    // annotation results of "properties" and "patternProperties" within the
    // same schema object. Validation with "additionalProperties" applies only
    // to the child values of instance names that do not appear in the
    // annotation results of either "properties" or "patternProperties".
    const propertiesAnnotation = getChildAnnotation(
      frame.parent,
      "properties",
    )?.annotation;
    const patternPropertiesAnnotation = getChildAnnotation(
      frame.parent,
      "patternProperties",
    )?.annotation;
    const propertyNames = new Set<string>([
      ...(Array.isArray(propertiesAnnotation) ?
        (propertiesAnnotation as string[])
      : []),
      ...(Array.isArray(patternPropertiesAnnotation) ?
        (patternPropertiesAnnotation as string[])
      : []),
    ] as string[]);

    // §10.3.2.3 ¶3: For all such properties, validation succeeds if the child
    // instance validates against the "additionalProperties" schema.
    const evaluatedProperties: string[] = [];
    let invalidProperties: string[] | undefined;
    for (const [key, value] of Object.entries(instance)) {
      if (value === undefined || propertyNames.has(key)) {
        continue;
      }

      nestFrame(context, (frame: SchemaFrame): void => {
        frame.node = node;
        frame.instanceKey = key;
        frame.instance = value;
        frame.output = { valid: true };
        validateSchemaResource(context);
        evaluatedProperties.push(key);
        if (!frame.output.valid) {
          invalidProperties ??= [];
          invalidProperties.push(key);
        }
      });
    }

    if (invalidProperties !== undefined) {
      let message: string;
      if (invalidProperties.length === 1) {
        message =
          "invalid additional property " + JSON.stringify(invalidProperties[0]);
      } else {
        message = "invalid additional properties ";
        for (let i = 0; i < invalidProperties.length; i += 1) {
          if (i !== 0) {
            message += i !== invalidProperties.length - 1 ? ", " : " and ";
          }
          message += JSON.stringify(invalidProperties[i]);
        }
      }
      attachError(context, message);
    }

    // §10.3.2.3 ¶4: The annotation result of this keyword is the set of
    // instance property names validated by this keyword's subschema.
    // This annotation affects the behavior of "unevaluatedProperties"
    // in the Unevaluated vocabulary.
    if (invalidProperties === undefined) {
      attachAnnotation(context, evaluatedProperties);
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The `propertyNames` keyword.
 *
 * @see [JSON Schema Core §10.3.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10.3.2.4)
 * @category Keywords
 */
export const propertyNamesKeyword = {
  ...Keyword.prototype,
  key: "propertyNames",

  parse(context: SchemaContext): void {
    // §10.3.2.4 ¶1: MUST be a valid JSON Schema.
    parseSchemaResource(context);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §10.3.2.4 ¶2: If the instance is an object, this keyword validates
    // if every property name in the instance validates against the provided
    // schema. Note the property name that the schema is testing will always
    // be a string.
    let invalidProperties: string[] | undefined;
    for (const [key, value] of Object.entries(instance)) {
      if (value === undefined) {
        continue;
      }

      nestFrame(context, (frame: SchemaFrame): void => {
        frame.node = node;
        frame.instanceKey = key;
        frame.instance = key;
        frame.output = { valid: true };
        validateSchemaResource(context);
        if (!frame.output.valid) {
          invalidProperties ??= [];
          invalidProperties.push(key);
        }
      });
    }

    if (invalidProperties !== undefined) {
      let message: string;
      if (invalidProperties.length === 1) {
        message =
          "invalid property name " + JSON.stringify(invalidProperties[0]);
      } else {
        message = "invalid property names ";
        for (let i = 0; i < invalidProperties.length; i += 1) {
          if (i !== 0) {
            message += i !== invalidProperties.length - 1 ? ", " : " and ";
          }
          message += JSON.stringify(invalidProperties[i]);
        }
      }
      attachError(context, message);
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The JSON Schema Draft 2020-12 Applicator vocabulary.
 *
 * @see [JSON Schema Core §10](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-10)
 * @category Vocabularies
 */
export const applicatorVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/applicator",

  keywords: {
    allOf: allOfKeyword,
    anyOf: anyOfKeyword,
    oneOf: oneOfKeyword,
    not: notKeyword,
    if: ifKeyword,
    then: thenKeyword,
    else: elseKeyword,
    dependentSchemas: dependentSchemasKeyword,
    prefixItems: prefixItemsKeyword,
    items: itemsKeyword,
    contains: containsKeyword,
    properties: propertiesKeyword,
    patternProperties: patternPropertiesKeyword,
    additionalProperties: additionalPropertiesKeyword,
    propertyNames: propertyNamesKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/applicator",
    $dynamicAnchor: "meta",
    title: "Applicator vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      prefixItems: { $ref: "#/$defs/schemaArray" },
      items: { $dynamicRef: "#meta" },
      contains: { $dynamicRef: "#meta" },
      additionalProperties: { $dynamicRef: "#meta" },
      properties: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        default: {},
      },
      patternProperties: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        propertyNames: { format: "regex" },
        default: {},
      },
      dependentSchemas: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
        default: {},
      },
      propertyNames: { $dynamicRef: "#meta" },
      if: { $dynamicRef: "#meta" },
      then: { $dynamicRef: "#meta" },
      else: { $dynamicRef: "#meta" },
      allOf: { $ref: "#/$defs/schemaArray" },
      anyOf: { $ref: "#/$defs/schemaArray" },
      oneOf: { $ref: "#/$defs/schemaArray" },
      not: { $dynamicRef: "#meta" },
    },
    $defs: {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: { $dynamicRef: "#meta" },
      },
    },
  },
} as const satisfies Vocabulary;
