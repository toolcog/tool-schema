/**
 * Dates, times, and durations.
 *
 * @see [JSON Schema Validation §7.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation#section-7.3.1)
 * @module
 */

import { Format } from "../format.ts";
import type { InputBuffer } from "./parse.ts";
import {
  peekCharCode,
  tryParseCharCode,
  parseCharCode,
  tryParseDigits,
  parseDigits,
  parseEnd,
} from "./parse.ts";

/**
 * A string instance is valid against this attribute if it is a valid
 * representation according to the "date-time" ABNF rule from
 * [RFC 3339 §5.6](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6).
 */
export const dateTimeFormat = {
  ...Format.prototype,
  name: "date-time",
  parse: parseDateTime,
} as const satisfies Format<{
  year: number;
  month: number;
  day: number;
}>;

/**
 * A string instance is valid against this attribute if it is a valid
 * representation according to the "full-date" ABNF rule from
 * [RFC 3339 §5.6](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6).
 */
export const dateFormat = {
  ...Format.prototype,
  name: "date",
  parse: parseFullDate,
} as const satisfies Format<{
  year: number;
  month: number;
  day: number;
}>;

/**
 * A string instance is valid against this attribute if it is a valid
 * representation according to the "full-time" ABNF rule from
 * [RFC 3339 §5.6](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6).
 */
export const timeFormat = {
  ...Format.prototype,
  name: "time",
  parse: parseFullTime,
} as const satisfies Format<{
  hour: number;
  minute: number;
  second: number;
  millisecond: number | undefined;
  offset: string;
}>;

/**
 * A string instance is valid against this attribute if it is a valid
 * representation according to the "duration" ABNF rule from
 * [RFC 3339 Appendix A](https://datatracker.ietf.org/doc/html/rfc3339#appendix-A).
 */
export const durationFormat = {
  ...Format.prototype,
  name: "duration",
  parse: parseDuration,
} as const satisfies Format<{
  years?: number | undefined;
  months?: number | undefined;
  weeks?: number | undefined;
  days?: number | undefined;
  hours?: number | undefined;
  minutes?: number | undefined;
  seconds?: number | undefined;
}>;

/** @internal */
export function parseDateTime(input: string | InputBuffer): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number | undefined;
  offset: string;
} {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length }
    : input;

  // date-time = full-date "T" full-time

  const date = parseFullDate(buf);
  parseCharCode(buf, 0x54); // "T"
  const time = parseFullTime(buf);

  if (typeof input === "string") {
    parseEnd(buf);
  }
  return { ...date, ...time };
}

/** @internal */
export function parseFullDate(input: string | InputBuffer): {
  year: number;
  month: number;
  day: number;
} {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length }
    : input;

  // date-fullyear = 4DIGIT
  // date-month    = 2DIGIT  ; 01-12
  // date-mday     = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on
  //                         ; month/year
  // full-date     = date-fullyear "-" date-month "-" date-mday

  const year = parseDigits(buf, 4, 4); // date-fullyear
  parseCharCode(buf, 0x2d); // "-"
  const month = parseDigits(buf, 2, 2); // date-month
  if (month < 1 || month > 12) {
    throw new Error("month must be between 1 and 12");
  }
  parseCharCode(buf, 0x2d); // "-"
  const day = parseDigits(buf, 2, 2); // date-mday
  if (day < 1) {
    throw new Error("day must be at least 1");
  }

  // Validate days in month, accounting for leap years.
  const maxDays =
    month === 2 ?
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ?
        29
      : 28
    : month === 4 || month === 6 || month === 9 || month === 11 ? 30
    : 31;

  if (day > maxDays) {
    throw new Error(`day must be between 1 and ${maxDays} for month ${month}`);
  }

  if (typeof input === "string") {
    parseEnd(buf);
  }
  return { year, month, day };
}

/** @internal */
export function parseFullTime(input: string | InputBuffer): {
  hour: number;
  minute: number;
  second: number;
  millisecond: number | undefined;
  offset: string;
} {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length }
    : input;

  // full-time = partial-time time-offset

  const time = parsePartialTime(buf);
  const offset = parseTimeOffset(buf);

  if (typeof input === "string") {
    parseEnd(buf);
  }
  return { ...time, offset };
}

/** @internal */
function parsePartialTime(buf: InputBuffer): {
  hour: number;
  minute: number;
  second: number;
  millisecond: number | undefined;
} {
  // time-hour    = 2DIGIT  ; 00-23
  // time-minute  = 2DIGIT  ; 00-59
  // time-second  = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second rules
  // time-secfrac = "." 1*DIGIT
  // partial-time = time-hour ":" time-minute ":" time-second [time-secfrac]

  const hour = parseDigits(buf, 2, 2); // time-hour
  if (hour > 23) {
    throw new Error("hour must be between 0 and 23");
  }
  parseCharCode(buf, 0x3a); // ":"
  const minute = parseDigits(buf, 2, 2); // time-minute
  if (minute > 59) {
    throw new Error("minute must be between 0 and 59");
  }
  parseCharCode(buf, 0x3a); // ":"
  const second = parseDigits(buf, 2, 2); // time-second
  if (second > 60) {
    // 60 is allowed for leap seconds
    throw new Error("second must be between 0 and 60");
  }

  let millisecond: number | undefined;
  if (tryParseCharCode(buf, 0x2e /*"."*/)) {
    millisecond = parseDigits(buf, 1); // time-secfrac
  }

  return { hour, minute, second, millisecond };
}

/** @internal */
function parseTimeOffset(buf: InputBuffer): string {
  // time-numoffset = ("+" / "-") time-hour ":" time-minute
  // time-offset    = "Z" / time-numoffset

  const start = buf.offset;

  if (!tryParseCharCode(buf, 0x5a /*"Z"*/)) {
    if (
      !tryParseCharCode(buf, 0x2b /*"+"*/) &&
      !tryParseCharCode(buf, 0x2d /*"-"*/)
    ) {
      throw new Error('expected "+" or "-"');
    }

    const hour = parseDigits(buf, 2, 2); // time-hour
    if (hour > 23) {
      throw new Error("offset hour must be between 0 and 23");
    }
    parseCharCode(buf, 0x3a); // ":"
    const minute = parseDigits(buf, 2, 2); // time-minute
    if (minute > 59) {
      throw new Error("offset minute must be between 0 and 59");
    }
  }

  return buf.input.slice(start, buf.offset);
}

/** @internal */
export function parseDuration(input: string | InputBuffer): {
  years?: number | undefined;
  months?: number | undefined;
  weeks?: number | undefined;
  days?: number | undefined;
  hours?: number | undefined;
  minutes?: number | undefined;
  seconds?: number | undefined;
} {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length }
    : input;

  // dur-second = 1*DIGIT "S"
  // dur-minute = 1*DIGIT "M" [dur-second]
  // dur-hour   = 1*DIGIT "H" [dur-minute]
  // dur-time   = "T" (dur-hour / dur-minute / dur-second)
  // dur-day    = 1*DIGIT "D"
  // dur-week   = 1*DIGIT "W"
  // dur-month  = 1*DIGIT "M" [dur-day]
  // dur-year   = 1*DIGIT "Y" [dur-month]
  // dur-date   = (dur-day / dur-month / dur-year) [dur-time]
  //
  // duration   = "P" (dur-date / dur-time / dur-week)

  parseCharCode(buf, 0x50); // "P"

  if (peekCharCode(buf) === 0x54 /*"T"*/) {
    const duration = parseTimeDuration(buf);
    if (typeof input === "string") {
      parseEnd(buf);
    }
    return duration;
  }

  let years: number | undefined;
  let months: number | undefined;
  let days: number | undefined;

  let value: number | undefined = parseDigits(buf, 1);

  switch (peekCharCode(buf)) {
    case 0x57 /*"W"*/:
      buf.offset += 1;
      if (typeof input === "string") {
        parseEnd(buf);
      }
      return { weeks: value };
    case 0x59 /*"Y"*/:
      buf.offset += 1;
      years = value;
      break;
    case 0x4d /*"M"*/:
      buf.offset += 1;
      months = value;
      break;
    case 0x44 /*"D"*/:
      buf.offset += 1;
      days = value;
      break;
    default:
      throw new Error('expected "W", "Y", "M" or "D"');
  }

  if (years !== undefined && (value = tryParseDigits(buf, 1)) !== undefined) {
    switch (peekCharCode(buf)) {
      case 0x4d /*"M"*/:
        buf.offset += 1;
        months = value;
        break;
      case 0x44 /*"D"*/:
        buf.offset += 1;
        days = value;
        break;
      default:
        throw new Error('expected "M" or "D"');
    }
  }

  if (months !== undefined && (value = tryParseDigits(buf, 1)) !== undefined) {
    switch (peekCharCode(buf)) {
      case 0x44 /*"D"*/:
        buf.offset += 1;
        days = value;
        break;
      default:
        throw new Error('expected "D"');
    }
  }

  if (typeof input === "string") {
    parseEnd(buf);
  }
  return {
    years,
    months,
    days,
  };
}

/** @internal */
function parseTimeDuration(buf: InputBuffer): {
  hours?: number | undefined;
  minutes?: number | undefined;
  seconds?: number | undefined;
} {
  // dur-second = 1*DIGIT "S"
  // dur-minute = 1*DIGIT "M" [dur-second]
  // dur-hour   = 1*DIGIT "H" [dur-minute]
  // dur-time   = "T" (dur-hour / dur-minute / dur-second)

  parseCharCode(buf, 0x54 /*"T"*/);

  let hours: number | undefined;
  let minutes: number | undefined;
  let seconds: number | undefined;

  let value: number | undefined = parseDigits(buf, 1);

  switch (peekCharCode(buf)) {
    case 0x48 /*"H"*/:
      buf.offset += 1;
      hours = value;
      break;
    case 0x4d /*"M"*/:
      buf.offset += 1;
      minutes = value;
      break;
    case 0x53 /*"S"*/:
      buf.offset += 1;
      seconds = value;
      break;
    default:
      throw new Error('expected "H", "M" or "S"');
  }

  if (hours !== undefined && (value = tryParseDigits(buf, 1)) !== undefined) {
    switch (peekCharCode(buf)) {
      case 0x4d /*"M"*/:
        buf.offset += 1;
        minutes = value;
        break;
      case 0x53 /*"S"*/:
        buf.offset += 1;
        seconds = value;
        break;
      default:
        throw new Error('expected "M" or "S"');
    }
  }

  if (minutes !== undefined && (value = tryParseDigits(buf, 1)) !== undefined) {
    switch (peekCharCode(buf)) {
      case 0x53 /*"S"*/:
        buf.offset += 1;
        seconds = value;
        break;
      default:
        throw new Error('expected "S"');
    }
  }

  return { hours, minutes, seconds };
}
