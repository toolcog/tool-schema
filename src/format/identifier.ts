/**
 * Resource identifiers.
 *
 * @see [JSON Schema Validation §7.3.5](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.5)
 * @module
 */

import type { Uri } from "tool-uri";
import {
  parseUri,
  parseUriReference,
  parseIri,
  parseIriReference,
} from "tool-uri";
import { Format } from "../format.ts";
import { parseCharCode, parseHexDigits, parseEnd } from "./parse.ts";

/**
 * A string instance is valid against this attribute if it is a valid URI,
 * according to [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986).
 */
export const uriFormat = {
  ...Format.prototype,
  name: "uri",
  parse: parseUri,
} as const satisfies Format<Uri>;

/**
 * A string instance is valid against this attribute if it is a valid
 * URI Reference (either a URI or a relative-reference), according to
 * [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986).
 */
export const uriReferenceFormat = {
  ...Format.prototype,
  name: "uri-reference",
  parse: parseUriReference,
} as const satisfies Format<Uri>;

/**
 * A string instance is valid against this attribute if it is a valid IRI,
 * according to [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987).
 */
export const iriFormat = {
  ...Format.prototype,
  name: "iri",
  parse: parseIri,
} as const satisfies Format<Uri>;

/**
 * A string instance is valid against this attribute if it is a valid
 * IRI Reference (either an IRI or a relative-reference), according to
 * [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987).
 */
export const iriReferenceFormat = {
  ...Format.prototype,
  name: "iri-reference",
  parse: parseIriReference,
} as const satisfies Format<Uri>;

/**
 * A string instance is valid against this attribute if it is a valid
 * string representation of a UUID, according to
 * [RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122).
 */
export const uuidFormat = {
  ...Format.prototype,
  name: "uuid",
  parse: parseUuid,
} as const satisfies Format<string>;

/** @internal */
export function parseUuid(input: string): string {
  const buf = { input, offset: 0, limit: input.length };

  parseHexDigits(buf, 8);
  parseCharCode(buf, 0x2d /*"-"*/);
  parseHexDigits(buf, 4);
  parseCharCode(buf, 0x2d /*"-"*/);
  const version = parseHexDigits(buf, 1);
  if (version < 1 || version > 5) {
    throw new Error("UUID version must be between 1 and 5");
  }
  parseHexDigits(buf, 3);
  parseCharCode(buf, 0x2d /*"-"*/);
  const variant = parseHexDigits(buf, 1);
  if ((variant & 0xc) !== 0x8) {
    throw new Error("UUID variant must be RFC 4122");
  }
  parseHexDigits(buf, 3);
  parseCharCode(buf, 0x2d /*"-"*/);
  parseHexDigits(buf, 12);
  parseEnd(buf);

  return input;
}
