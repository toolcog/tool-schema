import type { Context, ContextOptions, Frame } from "tool-json";
import {
  isArray,
  escapePointer,
  createContext,
  createFrame,
  currentPointer,
  currentLocation,
} from "tool-json";
import type { OutputUnit } from "./output.ts";
import type { Format } from "./format.ts";
import type { Dialect } from "./dialect.ts";

/**
 * A context for JSON Schema processing.
 *
 * @category Context
 */
export interface SchemaContext extends Context {
  /**
   * The topmost frame on the schema processing stack.
   * @readonly
   * @override
   */
  stack: SchemaFrame | undefined;

  /**
   * A function to create new frames for the schema processing stack.
   * @override
   * @internal
   */
  createFrame: ((parent?: SchemaFrame) => SchemaFrame) | undefined;

  /**
   * The default dialect to use when parsing schemas in this context.
   */
  dialect: Dialect | undefined;

  /**
   * Dialects to support when parsing schemes in this context,
   * keyed by meta-schema URI.
   * @readonly
   */
  dialects: ReadonlyMap<string, Dialect> | undefined;

  /**
   * Additional formats to support when validating schema instances,
   * keyed by format name.
   * @readonly
   */
  formats: ReadonlyMap<string, Format> | undefined;

  /**
   * The level of format validation to perform:
   * - `false`: do not perform format validation (default)
   * - `true`: validate known formats, ignoring unknown formats
   * - `"strict"`: validate all formats, failing on unknown formats
   */
  validation: "strict" | true | false | undefined;

  /**
   * A cache of compiled regular expressions.
   * @readonly
   * @internal
   */
  patternCache: Map<string, RegExp> | undefined;
}

/**
 * Options for configuring a schema context.
 *
 * @category Context
 */
export interface SchemaContextOptions extends ContextOptions {
  /**
   * The default dialect to use when parsing schemas.
   */
  dialect?: Dialect | undefined;

  /**
   * Dialects to support when parsing schemas.
   */
  dialects?: readonly Dialect[] | ReadonlyMap<string, Dialect> | undefined;

  /**
   * Additional formats to support when validating schema instances.
   */
  formats?: readonly Format[] | ReadonlyMap<string, Format> | undefined;

  /**
   * The level of format validation to perform:
   * - `false`: do not perform format validation (default)
   * - `true`: validate known formats, ignoring unknown formats
   * - `"strict"`: validate all formats, failing on unknown formats
   */
  validation?: "strict" | true | false | undefined;
}

/**
 * Initializes a context for JSON Schema processing.
 *
 * @category Context
 */
export function initSchemaContext(
  context: Context & Partial<SchemaContext>,
  options?: SchemaContextOptions,
): SchemaContext {
  // Minimize mixin shape variation.
  if (!("dialect" in context)) {
    context.dialect = undefined;
  }
  if (!("dialects" in context)) {
    context.dialects = undefined;
  }
  if (!("formats" in context)) {
    context.formats = undefined;
  }
  if (!("validation" in context)) {
    context.validation = undefined;
  }

  // Configure the stack frame factory.
  if (context.createFrame === undefined) {
    context.createFrame = createSchemaFrame;
  }

  // Configure the default dialect.
  if (options?.dialect !== undefined) {
    context.dialect = options.dialect;
  }

  // Configure supported dialects.
  if (options?.dialects !== undefined) {
    if (isArray(options.dialects)) {
      const dialects = new Map<string, Dialect>();
      for (const dialect of options.dialects) {
        dialects.set(dialect.uri, dialect);
      }
      context.dialects = dialects;
    } else if (context.dialects !== undefined) {
      const dialects = new Map<string, Dialect>(context.dialects);
      for (const [uri, dialect] of options.dialects.entries()) {
        dialects.set(uri, dialect);
      }
      context.dialects = dialects;
    } else {
      context.dialects = options.dialects;
    }
  }

  // Configure additional format validators.
  if (options?.formats !== undefined) {
    if (isArray(options.formats)) {
      const formats = new Map<string, Format>(context.formats);
      for (const format of options.formats) {
        formats.set(format.name, format);
      }
      context.formats = formats;
    } else if (context.formats !== undefined) {
      const formats = new Map<string, Format>(context.formats);
      for (const [name, format] of options.formats.entries()) {
        formats.set(name, format);
      }
      context.formats = formats;
    } else {
      context.formats = options.formats;
    }
  }

  // Configure the level of format validation.
  if (options?.validation !== undefined) {
    context.validation = options.validation;
  }

  return context as SchemaContext;
}

/**
 * Creates a new shared context for JSON Schema processing.
 *
 * @category Context
 */
export function createSchemaContext(
  options?: SchemaContextOptions,
): SchemaContext {
  const context = initSchemaContext(createContext(options), options);

  // Initialize shared regex cache.
  if (context.patternCache === undefined) {
    context.patternCache = new Map();
  }

  return context;
}

/**
 * Caches a regular expression in the specified context.
 *
 * @category Context
 * @internal
 */
export function cachePattern(context: SchemaContext, pattern: string): RegExp {
  let cache = context.patternCache;
  if (cache === undefined) {
    context.patternCache = cache = new Map();
  }

  let regex = cache.get(pattern);
  if (regex === undefined) {
    // §6.4 ¶2: Regular expressions SHOULD be built with the "u" flag
    // (or equivalent) to provide Unicode support
    regex = new RegExp(pattern, "u");
    cache.set(pattern, regex);
  }
  return regex;
}

/**
 * A stack frame representing a node in a JSON Schema.
 *
 * @category Context
 */
export interface SchemaFrame extends Frame {
  /**
   * The parent schema stack frame, or `undefined` if this is the root frame.
   * @override
   */
  readonly parent: SchemaFrame | undefined;

  /**
   * The key of the instance being processed in this stack frame.
   */
  instanceKey?: string | number | undefined;

  /**
   * The instance being processed in this stack frame.
   */
  instance?: unknown | undefined;

  /**
   * The output unit for the schema node being processed in this stack frame.
   */
  output?: OutputUnit | undefined;
}

/**
 * Creates a new schema stack frame with the given parent frame.
 *
 * @category Context
 * @internal
 */
export function createSchemaFrame(parent?: SchemaFrame): SchemaFrame {
  const frame = createFrame(parent) as SchemaFrame;
  frame.instanceKey = undefined;
  frame.instance = undefined;
  frame.output = undefined;
  return frame;
}

/**
 * Returns a JSON Pointer to the relative location of the validating keyword
 * following the validation path.
 *
 * @see [JSON Schema Core §12.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3.1)
 * @category Context
 */
export function keywordLocation(
  frame: SchemaContext | SchemaFrame | undefined,
): string {
  return currentPointer(frame);
}

/**
 * Returns the absolute, dereferenced location of the validating keyword.
 *
 * @see [JSON Schema Core §12.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3.2)
 * @category Context
 */
export function absoluteKeywordLocation(
  context: SchemaContext,
  frame?: SchemaFrame,
): string {
  return currentLocation(context, frame);
}

/**
 * Returns a JSON Pointer following the instance key path of the stack frame.
 *
 * @see [JSON Schema Core §12.3.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3.3)
 * @category Context
 */
export function instanceLocation(
  frame: SchemaContext | SchemaFrame | undefined,
): string {
  if (frame !== undefined && "stack" in frame) {
    frame = frame.stack;
  }
  if (frame === undefined) {
    return "";
  }

  let pointer = instanceLocation(frame.parent);
  if (frame.instanceKey !== undefined) {
    pointer += "/" + escapePointer(String(frame.instanceKey));
  }
  return pointer;
}
