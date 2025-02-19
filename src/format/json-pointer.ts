/**
 * URI templates.
 *
 * @see [JSON Schema Validation §7.3.7](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.7)
 * @module
 */

import { parsePointer, parseRelativePointer } from "tool-json";
import { Format } from "../format.ts";

/**
 * A string instance is valid against this attribute if it is a valid
 * JSON string representation of a JSON Pointer, according to
 * [RFC 6901 §5](https://datatracker.ietf.org/doc/html/rfc6901#section-5).
 */
export const jsonPointerFormat = {
  ...Format.prototype,
  name: "json-pointer",
  parse: parsePointer,
} as const satisfies Format<string[]>;

/**
 * A string instance is valid against this attribute if it is a valid
 * [Relative JSON Pointer](https://datatracker.ietf.org/doc/html/draft-handrews-relative-json-pointer-01).
 */
export const relativeJsonPointerFormat = {
  ...Format.prototype,
  name: "relative-json-pointer",
  parse: parseRelativePointer,
} as const satisfies Format<{
  prefix: number;
  tokens: string[] | "#" | undefined;
}>;
