import { isDigit, hexDecode } from "tool-uri";

/** @internal */
export interface InputBuffer {
  readonly input: string;
  offset: number;
  limit: number;
}

/**
 * Returns the next character code from the buffer without consuming it.
 *
 * @internal
 */
export function peekCharCode(buf: InputBuffer): number {
  return buf.offset < buf.limit ? buf.input.charCodeAt(buf.offset) : -1;
}

/**
 * Tries to parse the given character from the buffer.
 *
 * @internal
 */
export function tryParseCharCode(buf: InputBuffer, c: number): boolean {
  if (buf.offset < buf.limit && buf.input.charCodeAt(buf.offset) === c) {
    buf.offset += 1;
    return true;
  }
  return false;
}

/**
 * Parses the given character from the buffer.
 *
 * @internal
 */
export function parseCharCode(buf: InputBuffer, c: number): void {
  if (!tryParseCharCode(buf, c)) {
    throw new Error("Expected " + JSON.stringify(String.fromCharCode(c)));
  }
}

/**
 * Tries to parse at least `min` and at most `max` digits from the buffer.
 *
 * @internal
 */
export function tryParseDigits(
  buf: InputBuffer,
  min: number,
  max?: number,
): number | undefined;
export function tryParseDigits(
  buf: InputBuffer,
  min: number,
  max: number | undefined,
  required: true,
): number;
export function tryParseDigits(
  buf: InputBuffer,
  min: number,
  max?: number,
  required: boolean = false,
): number | undefined {
  const start = buf.offset;
  let value = 0;
  let c: number;

  while (
    (max === undefined || buf.offset - start < max) &&
    buf.offset < buf.limit &&
    ((c = buf.input.charCodeAt(buf.offset)), isDigit(c))
  ) {
    buf.offset += 1;
    value = value * 10 + (c - 0x30) /*"0"*/;
  }

  const count = buf.offset - start;
  if ((required || count !== 0) && count < min) {
    const digits = min === 1 ? "digit" : "digits";
    if (min === max) {
      throw new Error("Expected " + min + " " + digits);
    } else {
      throw new Error("Expected at least " + min + " " + digits);
    }
  } else if (count === 0) {
    return undefined;
  }

  return value;
}

/**
 * Parses at least `min` and at most `max` digits from the buffer.
 *
 * @internal
 */
export function parseDigits(
  buf: InputBuffer,
  min: number,
  max?: number,
): number {
  return tryParseDigits(buf, min, max, true);
}

/**
 * Parses the given number of hex digits from the buffer.
 *
 * @internal
 */
export function parseHexDigits(buf: InputBuffer, count: number): number {
  let value = 0;
  while (count > 0) {
    const c = buf.offset < buf.limit ? buf.input.charCodeAt(buf.offset) : -1;
    const digit = hexDecode(c);
    if (digit === undefined) {
      throw new Error("Expected hex digit");
    }
    value = (value << 4) | digit;
    buf.offset += 1;
    count -= 1;
  }
  return value;
}

/**
 * Parses the end of the buffer.
 *
 * @internal
 */
export function parseEnd(buf: InputBuffer): void {
  if (buf.offset < buf.limit) {
    throw new Error("Expected end of input");
  }
}
