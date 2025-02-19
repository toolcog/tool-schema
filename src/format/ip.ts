/**
 * IP addresses.
 *
 * @see [JSON Schema Validation §7.3.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.4)
 * @module
 */

import { parseIpv4, parseIpv6 } from "tool-uri";
import { Format } from "../format.ts";

/**
 * A string instance is valid against these attributes if it is a valid
 * representation of an IP address as an IPv4 address according to the
 * "dotted-quad" ABNF syntax as defined in
 * [RFC 2673 §3.2](https://datatracker.ietf.org/doc/html/rfc2673#section-3.2).
 */
export const ipv4Format = {
  ...Format.prototype,
  name: "ipv4",
  parse: parseIpv4,
} as const satisfies Format<string>;

/**
 * A string instance is valid against these attributes if it is a valid
 * representation of an IP address as an IPv6 address as defined in
 * [RFC 4291 §2.2](https://datatracker.ietf.org/doc/html/rfc4291#section-2.2).
 */
export const ipv6Format = {
  ...Format.prototype,
  name: "ipv6",
  parse: parseIpv6,
} as const satisfies Format<string>;
