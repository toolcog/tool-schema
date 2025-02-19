/**
 * URI templates.
 *
 * @see [JSON Schema Validation §7.3.6](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.6)
 * @module
 */

import type { UriTemplate } from "tool-uri";
import { parseUriTemplate } from "tool-uri";
import { Format } from "../format.ts";

/**
 * A string instance is valid against this attribute if it is a valid
 * URI Template (of any level), according to
 * [RFC 6570](https://datatracker.ietf.org/doc/html/rfc6570).
 */
export const uriTemplateFormat = {
  ...Format.prototype,
  name: "uri-template",
  parse: parseUriTemplate,
} as const satisfies Format<UriTemplate>;
