/**
 * Regular expressions.
 *
 * @see [JSON Schema Validation §7.3.8](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.8)
 * @module
 */

import { Format } from "../format.ts";

/**
 * A string instance is valid against this attribute if it is valid according
 * to the regular expression dialect described in
 * [ECMA-262 §21.2.1](https://262.ecma-international.org/11.0/index.html#sec-patterns).
 */
export const regexFormat = {
  ...Format.prototype,
  name: "regex",
  parse(input: string): RegExp {
    return new RegExp(input, "u");
  },
} as const satisfies Format<RegExp>;
