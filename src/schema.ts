import {
  initContext,
  nestFrame,
  getResource,
  resolveReferences,
} from "tool-json";
import type {
  SchemaContext,
  SchemaContextOptions,
  SchemaFrame,
} from "./context.ts";
import { initSchemaContext } from "./context.ts";
import type { OutputUnit } from "./output.ts";
import type { Dialect } from "./dialect.ts";
import type { SchemaResource } from "./resource.ts";
import {
  parseSchemaResource,
  validateSchemaResource,
  parseMetaSchemaResource,
} from "./resource.ts";
import { dialect as dialect202012 } from "./draft-2020-12/dialect.ts";
import { dialect as dialect07 } from "./draft-07/dialect.ts";
import { dialect as dialect05 } from "./draft-05/dialect.ts";
import { dialect as dialectOas31 } from "./oas-3.1/dialect.ts";

/**
 * Options for parsing a JSON schema.
 *
 * @category Schema
 */
export interface SchemaOptions extends SchemaContextOptions {
  /**
   * The base URI for the schema.
   */
  baseUri?: string | undefined;
}

/**
 * A handle to a resolved JSON schema.
 *
 * @category Schema
 */
export class Schema {
  /**
   * The raw schema node.
   */
  readonly node: unknown;

  /**
   * The context in which the schema was parsed.
   */
  readonly #context: SchemaContext;

  /** @internal */
  constructor(node: unknown, context: SchemaContext) {
    this.node = node;
    this.#context = context;
  }

  /**
   * The context in which the schema was parsed.
   */
  get context(): SchemaContext {
    return this.#context;
  }

  /**
   * The JSON resource associated with the schema node.
   */
  get resource(): SchemaResource | undefined {
    return getResource(this.context, this.node) as SchemaResource | undefined;
  }

  /**
   * Validates an instance against this schema.
   */
  validate(instance: unknown): OutputUnit {
    // Initialize the validation output.
    const output: OutputUnit = { valid: true };

    // Isolate validation in a nested stack frame.
    nestFrame(this.context, (frame: SchemaFrame): void => {
      frame.node = this.node;
      frame.instance = instance;
      frame.output = output;
      validateSchemaResource(this.context);
    });

    return output;
  }

  /**
   * Returns the raw schema node.
   */
  toJSON(): unknown {
    return this.node;
  }
}

/**
 * Parses a JSON schema.
 *
 * @category Schema
 */
export async function parseSchema(
  node: unknown,
  options?: SchemaOptions,
): Promise<Schema> {
  const context = initSchemaContext(initContext({}, options), options);

  // Configure default dialects.
  if (context.dialects === undefined) {
    // Support all standard dialects.
    context.dialects = dialects;
  }

  // Configure the default dialect.
  if (context.dialect === undefined) {
    // Use the first dialect as the default.
    for (const dialect of context.dialects.values()) {
      context.dialect = dialect;
      break;
    }
  }

  // Isolate parsing in a nested stack frame.
  await nestFrame(context, async (frame: SchemaFrame): Promise<void> => {
    frame.baseUri = options?.baseUri;
    frame.node = node;
    // Parse the schema resource.
    const resource = parseSchemaResource(context);
    // Resolve all references registered during parsing.
    await resolveReferences(context, resource);
  });

  return new Schema(node, context);
}

/**
 * Standard JSON Schema dialects.
 *
 * @category Dialect
 * @internal
 */
export const dialects: ReadonlyMap<string, Dialect> = new Map<string, Dialect>([
  [dialect202012.uri, dialect202012],
  [dialect07.uri, dialect07],
  [dialect05.uri, dialect05],
  [dialectOas31.uri, dialectOas31],
]);

/**
 * Parses a JSON meta-schema node as a JSON schema dialect.
 *
 * @throws ValidationError if the node is not a valid meta-schema.
 * @category Dialect
 */
export async function parseDialect(
  node: unknown,
  context: SchemaContext,
): Promise<Dialect> {
  // Isolate parsing in a nested stack frame.
  return await nestFrame(
    context,
    async (frame: SchemaFrame): Promise<Dialect> => {
      frame.node = node;
      // Parse the meta-schema resource.
      const resource = parseMetaSchemaResource(context);
      // Resolve all references registered during parsing.
      await resolveReferences(context, resource);
      return resource;
    },
  );
}
