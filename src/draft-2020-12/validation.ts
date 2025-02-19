import type { NodeType } from "tool-json";
import {
  referToType,
  isInteger,
  isArray,
  isObject,
  isType,
  equal,
  unicodeLength,
  currentFrame,
  currentLocation,
} from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import { cachePattern } from "../context.ts";
import { attachError, getChildAnnotation } from "../output.ts";
import { Keyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Validation vocabulary.
 *
 * @see [JSON Schema Validation §6](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6)
 * @category Vocabularies
 */
export interface ValidationVocabulary {
  /**
   * The allowed types of valid instances.
   *
   * @see [JSON Schema Validation §6.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1.1)
   */
  readonly type?: readonly NodeType[] | NodeType;

  /**
   * An array of values, to one of which an instance must be equal.
   * Elements should be unique; order is not significant.
   *
   * @see [JSON Schema Validation §6.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1.2)
   */
  readonly enum?: readonly unknown[];

  /**
   * A value to which an instance must be equal.
   *
   * @see [JSON Schema Validation §6.1.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1.3)
   */
  readonly const?: unknown;

  /**
   * A factor by which numeric instances must be an integer multiple.
   * Must be strictly greater than `0`.
   *
   * @see [JSON Schema Validation §6.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.1)
   */
  readonly multipleOf?: number;

  /**
   * The inclusive upper bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.2)
   */
  readonly maximum?: number;

  /**
   * The exclusive upper bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.3)
   */
  readonly exclusiveMaximum?: number;

  /**
   * The inclusive lower bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.4)
   */
  readonly minimum?: number;

  /**
   * The exclusive lower bound for numeric instances.
   *
   * @see [JSON Schema Validation §6.2.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.5)
   */
  readonly exclusiveMinimum?: number;

  /**
   * The maximum length of string instances. Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3.1)
   */
  readonly maxLength?: number;

  /**
   * The minimum length of string instances. Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3.2)
   */
  readonly minLength?: number;

  /**
   * A regular expression pattern that string instances must match.
   * Should be a valid regex according to ECMA-262.
   *
   * @see [JSON Schema Validation §6.3.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3.3)
   */
  readonly pattern?: string;

  /**
   * The maximum number of items allowed in array instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.4.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.1)
   */
  readonly maxItems?: number;

  /**
   * The minimum number of items required in array instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.4.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.2)
   */
  readonly minItems?: number;

  /**
   * Indicates that all items in array instances must be unique.
   *
   * @see [JSON Schema Validation §6.4.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.3)
   */
  readonly uniqueItems?: boolean;

  /**
   * The maximum number of items allowed to match the `contains` schema.
   *
   * @see [JSON Schema Validation §6.4.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.4)
   */
  readonly maxContains?: number;

  /**
   * The minimum number of items required to match the `contains` schema.
   *
   * @see [JSON Schema Validation §6.4.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.5)
   */
  readonly minContains?: number;

  /**
   * The maximum number of properties allowed in object instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.5.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.1)
   */
  readonly maxProperties?: number;

  /**
   * The minimum number of properties required in object instances.
   * Must be a non-negative integer.
   *
   * @see [JSON Schema Validation §6.5.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.2)
   */
  readonly minProperties?: number;

  /**
   * A list of property names that object instances are required to have.
   * Elements must be unique.
   *
   * @see [JSON Schema Validation §6.5.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.3)
   */
  readonly required?: readonly string[];

  /**
   * Property dependencies where the presence of a property requires
   * the presence of certain other properties.
   *
   * @see [JSON Schema Validation §6.5.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.4)
   */
  readonly dependentRequired?: { readonly [key: string]: readonly string[] };
}

/**
 * The `type` keyword.
 *
 * @see [JSON Schema Validation §6.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1.1)
 * @category Keywords
 */
export const typeKeyword = {
  ...Keyword.prototype,
  key: "type",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.1.1 ¶1: MUST be either a string or an array.
    if (typeof node !== "string" && !isArray(node)) {
      throw new ValidationError(
        '"type" must be a string or an array of strings',
        { location: currentLocation(context) },
      );
    }

    // §6.1.1 ¶1: If it is an array, elements of the array MUST be strings.
    if (
      isArray(node) &&
      !node.every((element) => typeof element === "string")
    ) {
      throw new ValidationError('"type" array elements must be strings', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as readonly NodeType[] | NodeType;
    const instance = frame.instance;

    // §6.1.1 ¶3: An instance validates successfully if its type matches
    // the type represented by the value of the string.
    if (typeof node === "string" && !isType(node, instance)) {
      attachError(context, "not " + referToType(node));
      return;
    }

    // §6.1.1 ¶3: An instance validates successfully if its type matches
    // any of the types indicated by the strings in the array
    if (isArray(node)) {
      let valid = false;
      for (const type of node) {
        valid ||= isType(type, instance);
      }
      if (!valid) {
        let message: string;
        if (node.length === 0) {
          message = "no types allowed";
        } else {
          message = "not ";
          for (let i = 0; i < node.length; i += 1) {
            if (i !== 0) {
              message += i !== node.length - 1 ? ", " : " or ";
            }
            message += referToType(node[i]!);
          }
        }
        attachError(context, message);
      }
    }
  },
} as const satisfies Keyword<readonly NodeType[] | NodeType>;

/**
 * The `enum` keyword.
 *
 * @see [JSON Schema Validation §6.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1.2)
 * @category Keywords
 */
export const enumKeyword = {
  ...Keyword.prototype,
  key: "enum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.1.2 ¶1: MUST be an array.
    if (!isArray(node)) {
      throw new ValidationError('"enum" must be an array', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as readonly unknown[];
    const instance = frame.instance;

    // §6.1.2 ¶2: An instance validates successfully against this keyword
    // if its value is equal to one of the elements in this keyword's
    // array value.
    let valid: boolean;
    switch (instance === null ? "null" : typeof instance) {
      case "null":
      case "boolean":
      case "number":
      case "string":
        valid = node.includes(instance);
        break;
      default:
        valid = false;
        for (const value of node) {
          valid ||= equal(instance, value);
        }
    }

    if (!valid) {
      let message = "not one of ";
      if (node.length === 0) {
        message += "empty enum";
      } else {
        for (let i = 0; i < node.length; i += 1) {
          if (i !== 0) {
            message += i !== node.length - 1 ? ", " : " or ";
          }
          message += JSON.stringify(node[i]);
        }
      }
      attachError(context, message);
    }
  },
} as const satisfies Keyword<readonly unknown[]>;

/**
 * The `const` keyword.
 *
 * @see [JSON Schema Validation §6.1.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.1.3)
 * @category Keywords
 */
export const constKeyword = {
  ...Keyword.prototype,
  key: "const",

  parse(context: SchemaContext): void {
    // §6.1.3 ¶1: MAY be of any type, including null.
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;
    const instance = frame.instance;

    // §6.1.3 ¶3: An instance validates successfully against this keyword
    // if its value is equal to the value of the keyword.
    if (!equal(node, instance)) {
      attachError(context, "not equal to " + JSON.stringify(node));
    }
  },
} as const satisfies Keyword<unknown>;

/**
 * The `multipleOf` keyword.
 *
 * @see [JSON Schema Validation §6.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.1)
 * @category Keywords
 */
export const multipleOfKeyword = {
  ...Keyword.prototype,
  key: "multipleOf",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.2.1 ¶1: MUST be a number, strictly greater than 0.
    if (typeof node !== "number" || node <= 0) {
      throw new ValidationError('"multipleOf" must be a positive number', {
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

    // §6.2.1 ¶2: A numeric instance is valid only if division
    // by this keyword's value results in an integer.
    if (!isInteger(instance / node)) {
      attachError(context, "not a multiple of " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `maximum` keyword.
 *
 * @see [JSON Schema Validation §6.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.2)
 * @category Keywords
 */
export const maximumKeyword = {
  ...Keyword.prototype,
  key: "maximum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.2.2 ¶2: MUST be a number.
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

    // §6.2.2 ¶2: If the instance is a number, then this keyword validates
    // only if the instance is less than or exactly equal to "maximum".
    if (instance > node) {
      attachError(context, "greater than " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `exclusiveMaximum` keyword.
 *
 * @see [JSON Schema Validation §6.2.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.3)
 * @category Keywords
 */
export const exclusiveMaximumKeyword = {
  ...Keyword.prototype,
  key: "exclusiveMaximum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.2.3 ¶2: MUST be a number.
    if (typeof node !== "number") {
      throw new ValidationError('"exclusiveMaximum" must be a number', {
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

    // §6.2.3 ¶2: If the instance is a number, then the instance is valid only
    // if it has a value strictly less than (not equal to) "exclusiveMaximum".
    if (instance >= node) {
      attachError(context, "greater than or equal to " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `minimum` keyword.
 *
 * @see [JSON Schema Validation §6.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.4)
 * @category Keywords
 */
export const minimumKeyword = {
  ...Keyword.prototype,
  key: "minimum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.2.4 ¶2: MUST be a number.
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

    // §6.2.4 ¶2: If the instance is a number, then this keyword validates
    // only if the instance is greater than or exactly equal to "minimum".
    if (instance < node) {
      attachError(context, "less than " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `exclusiveMinimum` keyword.
 *
 * @see [JSON Schema Validation §6.2.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.2.5)
 * @category Keywords
 */
export const exclusiveMinimumKeyword = {
  ...Keyword.prototype,
  key: "exclusiveMinimum",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.2.5 ¶2: MUST be a number.
    if (typeof node !== "number") {
      throw new ValidationError('"exclusiveMinimum" must be a number', {
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

    // §6.2.5 ¶2: If the instance is a number, then the instance is valid only
    // if it has a value strictly greater than (not equal to) "exclusiveMinimum".
    if (instance <= node) {
      attachError(context, "less than or equal to " + node);
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `maxLength` keyword.
 *
 * @see [JSON Schema Validation §6.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3.1)
 * @category Keywords
 */
export const maxLengthKeyword = {
  ...Keyword.prototype,
  key: "maxLength",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.3.1 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError('"maxLength" must be a non-negative integer', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (typeof instance !== "string") {
      return; // Not applicable.
    }

    // §6.3.1 ¶2: A string instance is valid against this keyword if
    // its length is less than, or equal to, the value of this keyword.
    if (unicodeLength(instance) > node) {
      attachError(context, "longer than " + node + " characters");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `minLength` keyword.
 *
 * @see [JSON Schema Validation §6.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3.2)
 * @category Keywords
 */
export const minLengthKeyword = {
  ...Keyword.prototype,
  key: "minLength",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.3.2 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError('"minLength" must be a non-negative integer', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (typeof instance !== "string") {
      return; // Not applicable.
    }

    // §6.3.2 ¶2: A string instance is valid against this keyword if
    // its length is greater than, or equal to, the value of this keyword.
    if (unicodeLength(instance) < node) {
      attachError(context, "shorter than " + node + " characters");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `pattern` keyword.
 *
 * @see [JSON Schema Validation §6.3.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.3.3)
 * @category Keywords
 */
export const patternKeyword = {
  ...Keyword.prototype,
  key: "pattern",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.3.3 ¶1: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"pattern" must be a string', {
        location: currentLocation(context),
      });
    }

    // §6.3.3 ¶1: SHOULD be a valid regular expression, according to the
    // ECMA-262 regular expression dialect.
    try {
      cachePattern(context, node);
    } catch (cause) {
      //throw new ValidationError('"pattern" is not a valid regular expression', {
      //  location: currentLocation(context),
      //  cause,
      //});
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as string;
    const instance = frame.instance;

    if (typeof instance !== "string") {
      return; // Not applicable.
    }

    // §6.3.3 ¶2: A string instance is considered valid if
    // the regular expression matches the instance successfully.
    // Recall: regular expressions are not implicitly anchored.
    if (!cachePattern(context, node).test(instance)) {
      attachError(context, "does not match pattern " + JSON.stringify(node));
    }
  },
} as const satisfies Keyword<string>;

/**
 * The `maxItems` keyword.
 *
 * @see [JSON Schema Validation §6.4.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.1)
 * @category Keywords
 */
export const maxItemsKeyword = {
  ...Keyword.prototype,
  key: "maxItems",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.4.1 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError('"maxItems" must be a non-negative integer', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §6.4.1 ¶2: An array instance is valid against "maxItems" if
    // its size is less than, or equal to, the value of this keyword.
    if (instance.length > node) {
      attachError(context, "more than " + node + " items");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `minItems` keyword.
 *
 * @see [JSON Schema Validation §6.4.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.2)
 * @category Keywords
 */
export const minItemsKeyword = {
  ...Keyword.prototype,
  key: "minItems",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.4.2 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError('"minItems" must be a non-negative integer', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §6.4.2 ¶2: An array instance is valid against "minItems" if
    // its size is greater than, or equal to, the value of this keyword.
    if (instance.length < node) {
      attachError(context, "fewer than " + node + " items");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `uniqueItems` keyword.
 *
 * @see [JSON Schema Validation §6.4.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.3)
 * @category Keywords
 */
export const uniqueItemsKeyword = {
  ...Keyword.prototype,
  key: "uniqueItems",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.4.3 ¶1: MUST be a boolean.
    if (typeof node !== "boolean") {
      throw new ValidationError('"uniqueItems" must be a boolean', {
        location: currentLocation(context),
      });
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as boolean;
    const instance = frame.instance;

    if (!isArray(instance) || !node) {
      return; // Not applicable.
    }

    // §6.4.3 ¶2: If this keyword has boolean value false, the instance
    // validates successfully. If it has boolean value true, the instance
    // validates successfully if all of its elements are unique.
    for (let i = 0; i < instance.length; i += 1) {
      for (let j = i + 1; j < instance.length; j += 1) {
        if (equal(instance[i], instance[j])) {
          attachError(context, "duplicate item at index " + i + " and " + j);
          return;
        }
      }
    }
  },
} as const satisfies Keyword<boolean>;

/**
 * The `maxContains` keyword.
 *
 * @see [JSON Schema Validation §6.4.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.4)
 * @category Keywords
 */
export const maxContainsKeyword = {
  ...Keyword.prototype,
  key: "maxContains",

  dependencies: [...Keyword.prototype.dependencies, "contains"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.4.4 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError(
        '"maxContains" must be a non-negative integer',
        {
          location: currentLocation(context),
        },
      );
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §6.4.4 ¶2: If "contains" is not present within the same schema object,
    // then this keyword has no effect.
    const contained = getChildAnnotation(frame.parent, "contains")?.annotation;

    // §6.4.4 ¶3: An instance array is valid against "maxContains" in two ways,
    // depending on the form of the annotation result of an adjacent "contains"
    // keyword. The first way is if the annotation result is an array and the
    // length of that array is less than or equal to the "maxContains" value.
    // The second way is if the annotation result is a boolean "true" and the
    // instance array length is less than or equal to the "maxContains" value.
    if (
      (isArray(contained) && contained.length > node) ||
      (contained === true && instance.length > node)
    ) {
      attachError(context, "more than " + node + " contained items");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `minContains` keyword.
 *
 * @see [JSON Schema Validation §6.4.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.4.5)
 * @category Keywords
 */
export const minContainsKeyword = {
  ...Keyword.prototype,
  key: "minContains",

  dependencies: [...Keyword.prototype.dependencies, "contains"],

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.4.5 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError(
        '"minContains" must be a non-negative integer',
        { location: currentLocation(context) },
      );
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (!isArray(instance)) {
      return; // Not applicable.
    }

    // §6.4.5 ¶2: If "contains" is not present within the same schema object,
    // then this keyword has no effect.
    const contained = getChildAnnotation(frame.parent, "contains")?.annotation;

    // §6.4.5 ¶3: An instance array is valid against "minContains" in two ways,
    // depending on the form of the annotation result of an adjacent "contains"
    // keyword. The first way is if the annotation result is an array and the
    // length of that array is greater than or equal to the "minContains" value.
    // The second way is if the annotation result is a boolean "true" and the
    // instance array length is greater than or equal to the "minContains" value.
    if (
      (isArray(contained) && contained.length < node) ||
      (contained === true && instance.length < node)
    ) {
      attachError(context, "fewer than " + node + " contained items");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `maxProperties` keyword.
 *
 * @see [JSON Schema Validation §6.5.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.1)
 * @category Keywords
 */
export const maxPropertiesKeyword = {
  ...Keyword.prototype,
  key: "maxProperties",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.5.1 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError(
        '"maxProperties" must be a non-negative integer',
        { location: currentLocation(context) },
      );
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §6.5.1 ¶2: An object instance is valid against "maxProperties" if its
    // number of properties is less than, or equal to, the value of this keyword.
    if (Object.keys(instance).length > node) {
      attachError(context, "more than " + node + " properties");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `minProperties` keyword.
 *
 * @see [JSON Schema Validation §6.5.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.2)
 * @category Keywords
 */
export const minPropertiesKeyword = {
  ...Keyword.prototype,
  key: "minProperties",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.5.2 ¶1: MUST be a non-negative integer.
    if (!isInteger(node) || node < 0) {
      throw new ValidationError(
        '"minProperties" must be a non-negative integer',
        { location: currentLocation(context) },
      );
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as number;
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §6.5.2 ¶2: An object instance is valid against "minProperties" if its
    // number of properties is greater than, or equal to, the value of this
    // keyword.
    if (Object.keys(instance).length < node) {
      attachError(context, "fewer than " + node + " properties");
    }
  },
} as const satisfies Keyword<number>;

/**
 * The `required` keyword.
 *
 * @see [JSON Schema Validation §6.5.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.3)
 * @category Keywords
 */
export const requiredKeyword = {
  ...Keyword.prototype,
  key: "required",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.5.3 ¶1: MUST be an array.
    if (!isArray(node)) {
      throw new ValidationError('"required" must be an array of strings', {
        location: currentLocation(context),
      });
    }

    // §6.5.3 ¶1: Elements of this array, if any, MUST be strings,
    // and MUST be unique.
    const seen = new Set<string>();
    for (const element of node) {
      if (typeof element !== "string") {
        throw new ValidationError('"required" must be an array of strings', {
          location: currentLocation(context),
        });
      }
      if (seen.has(element)) {
        throw new ValidationError(
          '"required" property names must be unique (' + element + ")",
          { location: currentLocation(context) },
        );
      }
      seen.add(element);
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as readonly string[];
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §6.5.3 ¶2: An object instance is valid against this keyword if
    // every item in the array is the name of a property in the instance.
    let missing: string[] | undefined;
    for (const key of node) {
      if (instance[key] !== undefined) {
        continue; // Required key is present.
      }
      // Required key is missing.
      missing ??= [];
      missing.push(key);
    }

    if (missing !== undefined && missing.length !== 0) {
      let message = "missing required ";
      message += missing.length === 1 ? "property " : "properties ";
      for (let i = 0; i < missing.length; i += 1) {
        if (i !== 0) {
          message += i !== missing.length - 1 ? ", " : " and ";
        }
        message += JSON.stringify(missing[i]!);
      }
      attachError(context, message);
    }
  },
} as const satisfies Keyword<readonly string[]>;

/**
 * The `dependentRequired` keyword.
 *
 * @see [JSON Schema Validation §6.5.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6.5.4)
 * @category Keywords
 */
export const dependentRequiredKeyword = {
  ...Keyword.prototype,
  key: "dependentRequired",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §6.5.4 ¶1: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"dependentRequired" must be an object', {
        location: currentLocation(context),
      });
    }

    // §6.5.4 ¶1: Properties in this object, if any, MUST be arrays.
    // Elements in each array, if any, MUST be strings, and MUST be unique.
    for (const value of Object.values(node)) {
      if (!isArray(value)) {
        throw new ValidationError(
          '"dependentRequired" property values must be arrays',
          { location: currentLocation(context) },
        );
      }

      const dependencies = new Set<string>();
      for (const dependency of value) {
        if (typeof dependency !== "string") {
          throw new ValidationError(
            '"dependentRequired" array elements must be strings',
            { location: currentLocation(context) },
          );
        }
        if (dependencies.has(dependency)) {
          throw new ValidationError(
            '"dependentRequired" array elements must be unique',
            { location: currentLocation(context) },
          );
        }
        dependencies.add(dependency);
      }
    }
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as { readonly [key: string]: readonly string[] };
    const instance = frame.instance;

    if (!isObject(instance)) {
      return; // Not applicable.
    }

    // §6.5.3 ¶2: Validation succeeds if, for each name that appears in both
    // the instance and as a name within this keyword's value, every item in
    // the corresponding array is also the name of a property in the instance.
    let missing: [key: string, requirement: string][] | undefined;
    for (const key of Object.keys(instance)) {
      const requirements = node[key];
      if (requirements === undefined) {
        continue; // No dependent requirements.
      }
      for (const requirement of requirements) {
        if (instance[requirement] === undefined) {
          missing ??= [];
          missing.push([key, requirement]);
        }
      }
    }

    if (missing !== undefined && missing.length !== 0) {
      let message = "missing dependent ";
      message += missing.length === 1 ? "property " : "properties ";
      for (let i = 0; i < missing.length; i += 1) {
        const [key, requirement] = missing[i]!;
        if (i !== 0) {
          message += i !== missing.length - 1 ? ", " : " and ";
        }
        message +=
          JSON.stringify(requirement) +
          " (required by " +
          JSON.stringify(key) +
          ")";
      }
      attachError(context, message);
    }
  },
} as const satisfies Keyword<{ readonly [key: string]: readonly string[] }>;

/**
 * The JSON Schema Draft 2020-12 Validation vocabulary.
 *
 * @see [JSON Schema Validation §6](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-6)
 * @category Vocabularies
 */
export const validationVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/validation",

  keywords: {
    type: typeKeyword,
    enum: enumKeyword,
    const: constKeyword,
    multipleOf: multipleOfKeyword,
    maximum: maximumKeyword,
    exclusiveMaximum: exclusiveMaximumKeyword,
    minimum: minimumKeyword,
    exclusiveMinimum: exclusiveMinimumKeyword,
    maxLength: maxLengthKeyword,
    minLength: minLengthKeyword,
    pattern: patternKeyword,
    maxItems: maxItemsKeyword,
    minItems: minItemsKeyword,
    uniqueItems: uniqueItemsKeyword,
    maxContains: maxContainsKeyword,
    minContains: minContainsKeyword,
    maxProperties: maxPropertiesKeyword,
    minProperties: minPropertiesKeyword,
    required: requiredKeyword,
    dependentRequired: dependentRequiredKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/validation",
    $dynamicAnchor: "meta",
    title: "Validation vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      type: {
        anyOf: [
          { $ref: "#/$defs/simpleTypes" },
          {
            type: "array",
            items: { $ref: "#/$defs/simpleTypes" },
            minItems: 1,
            uniqueItems: true,
          },
        ],
      },
      const: true,
      enum: {
        type: "array",
        items: true,
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0,
      },
      maximum: {
        type: "number",
      },
      exclusiveMaximum: {
        type: "number",
      },
      minimum: {
        type: "number",
      },
      exclusiveMinimum: {
        type: "number",
      },
      maxLength: { $ref: "#/$defs/nonNegativeInteger" },
      minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
      pattern: {
        type: "string",
        format: "regex",
      },
      maxItems: { $ref: "#/$defs/nonNegativeInteger" },
      minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
      uniqueItems: {
        type: "boolean",
        default: false,
      },
      maxContains: { $ref: "#/$defs/nonNegativeInteger" },
      minContains: {
        $ref: "#/$defs/nonNegativeInteger",
        default: 1,
      },
      maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
      minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
      required: { $ref: "#/$defs/stringArray" },
      dependentRequired: {
        type: "object",
        additionalProperties: {
          $ref: "#/$defs/stringArray",
        },
      },
    },
    $defs: {
      nonNegativeInteger: {
        type: "integer",
        minimum: 0,
      },
      nonNegativeIntegerDefault0: {
        $ref: "#/$defs/nonNegativeInteger",
        default: 0,
      },
      simpleTypes: {
        enum: [
          "array",
          "boolean",
          "integer",
          "null",
          "number",
          "object",
          "string",
        ],
      },
      stringArray: {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
        default: [],
      },
    },
  },
} as const satisfies Vocabulary;
