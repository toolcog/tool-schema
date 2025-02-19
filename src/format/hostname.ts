/**
 * Hostnames.
 *
 * @see [JSON Schema Validation §7.3.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.3)
 * @module
 */

import { Format } from "../format.ts";

/**
 * A string instance is valid against these attributes if it is a valid
 * representation for an Internet hostname as defined by
 * [RFC 1123 §2.1](https://datatracker.ietf.org/doc/html/rfc1123#section-2.1),
 * including host names produced using the Punycode algorithm specified in
 * [RFC 5891 §4.4](https://datatracker.ietf.org/doc/html/rfc5891#section-4.4).
 */
export const hostnameFormat = {
  ...Format.prototype,
  name: "hostname",
  parse: parseHostname,
} as const satisfies Format<string>;

/**
 * A string instance is valid against these attributes if it is a valid
 * representation for an Internet hostname as defined by either
 * [RFC 1123 §2.1](https://datatracker.ietf.org/doc/html/rfc1123#section-2.1)
 * as for hostname, or an internationalized hostname as defined by
 * [RFC 5890 §2.3.2.3](https://datatracker.ietf.org/doc/html/rfc5890#section-2.3.2.3).
 */
export const idnHostnameFormat = {
  ...Format.prototype,
  name: "idn-hostname",
  parse: parseIdnHostname,
} as const satisfies Format<string>;

/** @internal */
export function parseHostname(input: string): string {
  if (input.length > 255) {
    throw new Error("Hostname exceeds maximum length of 255 characters");
  }

  if (input.length === 0) {
    throw new Error("Hostname cannot be empty");
  }

  const labels = input.split(".");
  for (const label of labels) {
    if (label.length === 0) {
      throw new Error("Hostname contains an empty label");
    }

    if (label.length > 63) {
      throw new Error("Hostname label exceeds maximum length of 63 characters");
    }

    // Labels must contain only alphanumeric chars and hyphens.
    // Hyphens cannot be at start or end.
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(label)) {
      throw new Error(
        "Hostname label must contain only ASCII letters, digits, and medial hyphens",
      );
    }
  }

  return input;
}

/** @internal */
export function parseIdnHostname(input: string): string {
  if (input.length > 255) {
    throw new Error("IDN hostname exceeds maximum length of 255 characters");
  }

  if (input.length === 0) {
    throw new Error("IDN hostname cannot be empty");
  }

  const labels = input.split(".");
  for (const label of labels) {
    if (label.length === 0) {
      throw new Error("IDN hostname contains an empty label");
    }

    if (label.length > 63) {
      throw new Error(
        "IDN hostname label exceeds maximum length of 63 characters",
      );
    }

    // Handle A-labels (Punycode).
    if (label.toLowerCase().startsWith("xn--")) {
      // A-labels must be ASCII-only.
      if (!/^[a-zA-Z0-9-]*$/.test(label)) {
        throw new Error(
          "A-label must contain only ASCII letters, digits, and hyphens",
        );
      }
    }

    // All labels (A-labels, U-labels, NR-LDH labels) must not:
    // - Contain control chars, whitespace, or invisible chars.
    // - Start or end with hyphens.
    if (
      /[\s\x00-\x1F\x7F\u200B-\u200D\uFEFF]/.test(label) ||
      label.startsWith("-") ||
      label.endsWith("-")
    ) {
      throw new Error(
        "IDN hostname label contains invalid characters or positioning",
      );
    }
  }

  return input;
}
