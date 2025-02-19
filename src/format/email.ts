/**
 * Email addresses.
 *
 * @see [JSON Schema Validation §7.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.2)
 * @module
 */

import { Format } from "../format.ts";
import { parseHostname, parseIdnHostname } from "./hostname.ts";

/**
 * A string instance is valid against these attributes if it is a valid
 * Internet email address as defined by the "Mailbox" ABNF rule in
 * [RFC 5321 §4.1.2](https://datatracker.ietf.org/doc/html/rfc5321#section-4.1.2).
 */
export const emailFormat = {
  ...Format.prototype,
  name: "email",
  parse: parseEmail,
} as const satisfies Format<string>;

/**
 * A string instance is valid against these attributes if it is a valid
 * Internet email address as defined by the extended "Mailbox" ABNF rule in
 * [RFC 6531 §3.3](https://datatracker.ietf.org/doc/html/rfc6531#section-3.3).
 */
export const idnEmailFormat = {
  ...Format.prototype,
  name: "idn-email",
  parse: parseIdnEmail,
} as const satisfies Format<string>;

/** @internal */
export function parseEmail(input: string): string {
  if (input.length === 0) {
    throw new Error("Email address cannot be empty");
  }

  // Common implementation limit; not an RFC requirement.
  if (input.length > 254) {
    throw new Error("Email address exceeds maximum length of 254 characters");
  }

  // Split into local part and domain.
  const atIndex = input.lastIndexOf("@");
  if (atIndex === -1) {
    throw new Error("Email address must contain exactly one @ character");
  } else if (atIndex === 0) {
    throw new Error("Email address local part cannot be empty");
  } else if (atIndex === input.length - 1) {
    throw new Error("Email address domain cannot be empty");
  }

  const localPart = input.slice(0, atIndex);
  const domain = input.slice(atIndex + 1);

  // Common implementation limit; not an RFC requirement.
  if (localPart.length > 64) {
    throw new Error(
      "Email address local part exceeds maximum length of 64 characters",
    );
  }

  // Handle quoted local part.
  if (localPart.startsWith('"') && localPart.endsWith('"')) {
    const content = localPart.slice(1, -1);

    // Check for invalid characters in quoted string.
    // Allow any ASCII graphic or space except unescaped `"` and `\`.
    for (let i = 0; i < content.length; i += 1) {
      const char = content[i]!;
      const code = char.charCodeAt(0);

      // Handle escaped characters.
      if (char === "\\") {
        i += 1;
        if (i >= content.length) {
          throw new Error(
            "Email address local part ends with unmatched escape character",
          );
        }
        const nextCode = content.charCodeAt(i);
        // Only ASCII graphic or space can be escaped.
        if (nextCode < 32 || nextCode > 126) {
          throw new Error(
            "Email address local part contains invalid escaped character",
          );
        }
        continue;
      }

      // Unescaped characters must be ASCII graphic or space.
      if (code < 32 || code > 126 || char === '"' || char === "\\") {
        throw new Error("Email address local part contains invalid characters");
      }
    }
  } else {
    // Unquoted local part must be dot-separated sequence of atoms.
    const atoms = localPart.split(".");

    // No empty atoms (consecutive dots or leading/trailing dots).
    if (atoms.some((atom) => atom.length === 0)) {
      throw new Error(
        "Email address local part contains invalid dot placement",
      );
    }

    // Each atom must contain only atext characters.
    for (const atom of atoms) {
      if (!/^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]+$/.test(atom)) {
        throw new Error("Email address local part contains invalid characters");
      }
    }
  }

  // Domain can be either a domain name or an address literal.
  if (domain.startsWith("[") && domain.endsWith("]")) {
    // Basic validation of address literal.
    const literal = domain.slice(1, -1);
    if (!/^[A-Za-z0-9.:]+$/.test(literal)) {
      throw new Error("Email address contains invalid address literal");
    }
  } else {
    // Regular domain name validation.
    const labels = domain.split(".");
    if (labels.length < 2) {
      throw new Error("Email address domain must contain at least two parts");
    }
    parseHostname(domain);
  }

  return input;
}

/** @internal */
export function parseIdnEmail(input: string): string {
  if (input.length === 0) {
    throw new Error("IDN email address cannot be empty");
  }

  // Common implementation limit; not an RFC requirement.
  if (input.length > 254) {
    throw new Error(
      "IDN email address exceeds maximum length of 254 characters",
    );
  }

  // Split into local part and domain.
  const atIndex = input.lastIndexOf("@");
  if (atIndex === -1) {
    throw new Error("IDN email address must contain exactly one @ character");
  }
  if (atIndex === 0) {
    throw new Error("IDN email address local part cannot be empty");
  }
  if (atIndex === input.length - 1) {
    throw new Error("IDN email address domain cannot be empty");
  }

  const localPart = input.slice(0, atIndex);
  const domain = input.slice(atIndex + 1);

  // Common implementation limit; not an RFC requirement.
  if (localPart.length > 64) {
    throw new Error(
      "IDN email address local part exceeds maximum length of 64 characters",
    );
  }

  // Handle quoted local part.
  if (localPart.startsWith('"') && localPart.endsWith('"')) {
    const content = localPart.slice(1, -1);

    // Check for invalid characters in quoted string.
    // Allow any UTF-8 except control chars and unescaped `"` and `\`.
    for (let i = 0; i < content.length; i += 1) {
      const char = content[i]!;
      const code = char.charCodeAt(0);

      // Handle escaped characters.
      if (char === "\\") {
        i += 1;
        if (i >= content.length) {
          throw new Error(
            "IDN email address local part ends with unmatched escape character",
          );
        }
        // Allow escaping of any non-control character.
        const nextCode = content.charCodeAt(i);
        if (nextCode < 32 || nextCode === 127) {
          throw new Error(
            "IDN email address local part contains invalid escaped character",
          );
        }
        continue;
      }

      // Unescaped characters must not be control characters.
      if (code < 32 || code === 127 || char === '"' || char === "\\") {
        throw new Error(
          "IDN email address local part contains invalid characters",
        );
      }
    }
  } else {
    // Unquoted local part must be dot-separated sequence of atoms.
    const atoms = localPart.split(".");

    // No empty atoms (consecutive dots or leading/trailing dots).
    if (atoms.some((atom) => atom.length === 0)) {
      throw new Error(
        "IDN email address local part contains invalid dot placement",
      );
    }

    // Each atom must contain only atext or UTF8-non-ascii characters.
    // Exclude ASCII control chars, space, and specials.
    for (const atom of atoms) {
      if (/[\x00-\x20\x7F()<>[\]\\,;:@"]/.test(atom)) {
        throw new Error(
          "IDN email address local part contains invalid characters",
        );
      }
    }
  }

  // Domain can be either a domain name or an address literal.
  if (domain.startsWith("[") && domain.endsWith("]")) {
    // Basic validation of address literal.
    const literal = domain.slice(1, -1);
    if (!/^[A-Za-z0-9.:]+$/.test(literal)) {
      throw new Error("IDN email address contains invalid address literal");
    }
  } else {
    // Regular domain name validation.
    const labels = domain.split(".");
    if (labels.length < 2) {
      throw new Error(
        "IDN email address domain must contain at least two parts",
      );
    }
    parseIdnHostname(domain);
  }

  return input;
}
