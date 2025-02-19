import { currentLocation } from "tool-json";
import { ValidationError } from "./error.ts";
import type { SchemaContext } from "./context.ts";
import { attachAnnotation } from "./output.ts";

/**
 * A JSON Schema keyword implementation.
 *
 * @see [JSON Schema Core §7](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-7)
 * @category Dialect
 */
export interface Keyword<T = unknown> {
  /**
   * The name of this keyword.
   */
  readonly key: string;

  /**
   * Keywords that must be evaluated before this keyword.
   */
  readonly dependencies: readonly string[];

  /**
   * Keywords that must be evaluated after this keyword.
   */
  readonly dependents: readonly string[];

  /**
   * Parses the input as a keyword node.
   *
   * @throws ValidationError if the input is not a valid keyword node.
   */
  parse(context: SchemaContext): void;

  /**
   * Validates an instance against a keyword node.
   */
  validate(context: SchemaContext): void;
}

/**
 * JSON schema keyword mixin.
 *
 * @category Dialect
 * @internal
 */
export const Keyword = {
  prototype: {
    key: undefined,
    dependencies: [],
    dependents: [],
    parse(context: SchemaContext): void {
      // nop
    },
    validate(context: SchemaContext): void {
      // nop
    },
  },
} as const;

/**
 * JSON schema annotation keyword mixin.
 *
 * @category Dialect
 * @internal
 */
export const AnnotationKeyword = {
  prototype: {
    ...Keyword.prototype,
    validate(context: SchemaContext): void {
      attachAnnotation(context, context.stack?.node);
    },
  },
} as const;

/**
 * Returns a keyword that is not recognized by the current JSON Schema dialect.
 *
 * @see [JSON Schema Core §4.3.1 ¶6](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-4.3.1)
 * @category Dialect
 * @internal
 */
export function unknownKeyword(key: string): Keyword {
  // $6.5 ¶1: Implementations SHOULD treat keywords they do not support
  // as annotations, where the value of the keyword is the value of the
  // annotation.
  return {
    ...AnnotationKeyword.prototype,
    key,
  };
}

/**
 * Performs a stable topological sort in-place on the given `keywords` array,
 * ensuring that all keywords appear after all of their transitive dependencies,
 * and before all of their transitive dependents.
 *
 * Keywords can depend on "virtual" keywords that are not present in the
 * `keywords` array. Virtual keywords create logical barriers relative to
 * which real keywords can be ordered. Virtual keywords must start with an
 * `@` character.
 *
 * @category Dialect
 * @internal
 */
export function sortKeywords(
  keywords: {
    readonly key: string;
    readonly dependencies: readonly string[];
    readonly dependents: readonly string[];
  }[],
  context?: SchemaContext,
): void {
  const n = keywords.length;
  if (n === 0) {
    return;
  }

  const maxIterations = n * n;
  let iterations = 0;
  let changed = true;

  while (changed) {
    if (iterations >= maxIterations) {
      throw new ValidationError(
        "Cycle detected in keyword dependencies: " +
          keywords.map((keyword) => JSON.stringify(keyword.key)).join(", "),
        context !== undefined ?
          { location: currentLocation(context) }
        : undefined,
      );
    }
    iterations += 1;
    changed = false;

    for (let i = 0; i < n; i += 1) {
      const keyword = keywords[i]!;

      // Process dependencies.
      for (const dependency of keyword.dependencies) {
        if (dependency.startsWith("@")) {
          // Find keywords that list this virtual keyword in their dependents.
          for (let j = 0; j < n; j += 1) {
            const dependentKeyword = keywords[j]!;
            if (dependentKeyword.dependents.includes(dependency) && j > i) {
              // Shift the dependent keyword to before the current keyword.
              const depKeyword = dependentKeyword;
              for (let k = j; k > i; k -= 1) {
                keywords[k] = keywords[k - 1]!;
              }
              keywords[i] = depKeyword;
              changed = true;
              break;
            }
          }
          if (changed) {
            break;
          }
        } else {
          // Find the index of the dependency in the array.
          let depIndex = -1;
          for (let j = 0; j < n; j += 1) {
            if (keywords[j]!.key === dependency) {
              depIndex = j;
              break;
            }
          }

          if (depIndex !== -1 && depIndex > i) {
            // Shift the dependency to before the current keyword.
            const depKeyword = keywords[depIndex]!;
            for (let k = depIndex; k > i; k -= 1) {
              keywords[k] = keywords[k - 1]!;
            }
            keywords[i] = depKeyword;
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        break;
      }

      // Process dependents.
      for (const dependent of keyword.dependents) {
        if (dependent.startsWith("@")) {
          // Find keywords that list this virtual keyword in their dependencies.
          for (let j = 0; j < n; j += 1) {
            const dependencyKeyword = keywords[j]!;
            if (dependencyKeyword.dependencies.includes(dependent) && j < i) {
              // Shift the dependency keyword to after the current keyword.
              const currentKeyword = keywords[i]!;
              for (let k = i; k > j; k -= 1) {
                keywords[k] = keywords[k - 1]!;
              }
              keywords[j] = currentKeyword;
              changed = true;
              break;
            }
          }
          if (changed) {
            break;
          }
        } else {
          // Find the index of the dependent in the array.
          let depIndex = -1;
          for (let j = 0; j < n; j += 1) {
            if (keywords[j]!.key === dependent) {
              depIndex = j;
              break;
            }
          }

          if (depIndex !== -1 && depIndex < i) {
            // Shift the current keyword to before the dependent.
            const currentKeyword = keywords[i]!;
            for (let k = i; k > depIndex; k -= 1) {
              keywords[k] = keywords[k - 1]!;
            }
            keywords[depIndex] = currentKeyword;
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        break;
      }
    }
  }
}
