import { isValidUri } from "tool-uri";
import type { Resource } from "tool-json";
import {
  ProcessingError,
  isObject,
  nestFrame,
  currentFrame,
  currentLocation,
  createResource,
  getResource,
  setResource,
} from "tool-json";
import { ValidationError } from "./error.ts";
import type { SchemaContext, SchemaFrame } from "./context.ts";
import { emitOutput, attachError } from "./output.ts";
import type { Format } from "./format.ts";
import type { Keyword } from "./keyword.ts";
import { unknownKeyword, sortKeywords } from "./keyword.ts";
import type { Vocabulary } from "./vocabulary.ts";
import type { Dialect } from "./dialect.ts";

/**
 * A JSON Schema resource.
 *
 * @category Resource
 */
export interface SchemaResource extends Resource {
  /**
   * The dialect used by the schema.
   */
  dialect: Dialect | undefined;

  /**
   * The dependency-ordered keywords used by the schema.
   */
  keys: readonly Keyword[] | undefined;
}

/**
 * Returns `true` if the given resource is a JSON schema resource.
 *
 * @category Resource
 */
export function isSchemaResource(
  resource:
    | (Resource & {
        [K in keyof SchemaResource]?: SchemaResource[K] | undefined;
      })
    | undefined,
): resource is SchemaResource {
  return resource?.dialect !== undefined && resource.keys !== undefined;
}

/**
 * Initializes a JSON resource as a JSON schema resource.
 *
 * @category Resource
 */
export function initSchemaResource(
  resource: Resource & Partial<SchemaResource>,
): SchemaResource {
  if (!("dialect" in resource)) {
    resource.dialect = undefined;
  }
  if (!("keys" in resource)) {
    resource.keys = undefined;
  }
  return resource as SchemaResource;
}

/**
 * Parses the node at the top of the stack as a JSON schema.
 *
 * @throws ValidationError if the node is not a valid schema.
 * @category Resource
 * @internal
 */
export function parseSchemaResource(
  context: SchemaContext,
): SchemaResource | undefined {
  // Get the schema node from the top of the stack.
  const frame = currentFrame(context) as SchemaFrame;
  const node = frame.node;

  // Short-circuit boolean schemas.
  if (typeof node === "boolean") {
    return undefined;
  }

  // Ensure the schema is an object.
  if (!isObject(node)) {
    throw new ValidationError("Schema must be an object or a boolean", {
      location: currentLocation(context),
    });
  }

  // Get the JSON resource associated with the schema node.
  let resource = getResource(context, node) as SchemaResource | undefined;
  if (isSchemaResource(resource)) {
    // The node has already been parsed as a schema resource.
    return resource;
  }
  // Create and register a new JSON resource, if one doesn't already exist.
  if (resource === undefined) {
    resource = createResource(undefined, node) as SchemaResource;
    setResource(context, resource);
  }
  // Initialize the JSON resource as a schema resource.
  initSchemaResource(resource);

  // Determine the dialect used by the schema.
  const dialectUri = node.$schema;
  if (dialectUri !== undefined) {
    // §8.1.1 ¶2: MUST be a URI.
    if (typeof dialectUri !== "string") {
      throw new ValidationError('"$schema" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.1.1 ¶5: MUST be a URI (containing a scheme).
    if (!isValidUri(dialectUri)) {
      throw new ValidationError('"$schema" must be a valid URI', {
        location: currentLocation(context),
      });
    }

    // §8.1.1 ¶1: The identifier of a resource which is itself a JSON Schema,
    // which describes the set of valid schemas written for this particular
    // dialect.
    resource.dialect = context.dialects?.get(dialectUri);
    if (resource.dialect === undefined) {
      throw new ValidationError(
        "Unknown dialect " + JSON.stringify(dialectUri),
        { location: currentLocation(context) },
      );
    }
  } else {
    // Fall back to the default dialect.
    resource.dialect = context.dialect;
    if (resource.dialect === undefined) {
      throw new ValidationError("No default dialect", {
        location: currentLocation(context),
      });
    }
  }

  // Collect the schema's keyword implementations.
  const keywords: Keyword[] = [];
  for (const key of Object.keys(node)) {
    keywords.push(resource.dialect.keywords[key] ?? unknownKeyword(key));
  }
  // Sort the schema's keywords into dependency order.
  sortKeywords(keywords, context);
  // Cache the sorted keywords in the schema resource.
  resource.keys = keywords;

  // Parse the schema's keywords in dependency order.
  for (const keyword of keywords) {
    nestFrame(context, (frame: SchemaFrame): void => {
      frame.nodeKey = keyword.key;
      frame.node = node[keyword.key];
      keyword.parse(context);
    });
  }

  return resource;
}

/**
 * Validates the instance at the top of the stack against the schema node
 * at the top of the stack.
 *
 * @category Resource
 * @internal
 */
export function validateSchemaResource(context: SchemaContext): void {
  // Get the schema node and the instance to validate from the top of the stack.
  const frame = currentFrame(context) as SchemaFrame;
  const node = frame.node;
  const instance = frame.instance;

  // Validate boolean schemas.
  if (node === true) {
    return;
  } else if (node === false) {
    attachError(context, "never valid");
    return;
  }

  // Ensure the schema is an object.
  if (!isObject(node)) {
    throw new ProcessingError("Unexpected schema node", {
      location: currentLocation(context),
    });
  }

  // Get the JSON resource associated with the schema node.
  const resource = getResource(context, node);
  if (!isSchemaResource(resource)) {
    throw new ProcessingError("Uninitialized schema resource", {
      location: currentLocation(context),
    });
  }

  // Use the base URI of the schema as the base URI for the frame.
  if (frame.baseUri === undefined) {
    frame.baseUri = resource.baseUri;
  }

  // Validate the instance against the schema's keywords.
  for (const keyword of resource.keys!) {
    nestFrame(context, (frame: SchemaFrame): void => {
      frame.nodeKey = keyword.key;
      frame.node = node[keyword.key];
      frame.instance = instance;
      frame.output = { valid: true };
      keyword.validate(context);
      emitOutput(context, frame);
    });
  }
}

/**
 * A JSON meta-schema resource.
 *
 * @category Resource
 */
export interface MetaSchemaResource extends SchemaResource, Dialect {
  /**
   * The meta-schema itself.
   * @override
   */
  readonly node: object;

  /**
   * The canonical URI of the meta-schema.
   * @override
   */
  readonly uri: string;

  /**
   * The formats supported by the meta-schema.
   */
  formats: { readonly [format: string]: Format };

  /**
   * The keywords supported by the meta-schema.
   */
  keywords: { readonly [key: string]: Keyword };

  /**
   * The vocabularies used by the meta-schema.
   */
  vocabularies: { readonly [uri: string]: Vocabulary };
}

/**
 * Returns `true` if the given resource is a JSON meta-schema resource.
 *
 * @category Resource
 */
export function isMetaSchemaResource(
  resource:
    | (Resource & {
        [K in keyof MetaSchemaResource]?: MetaSchemaResource[K] | undefined;
      })
    | undefined,
): resource is MetaSchemaResource {
  return (
    resource?.formats !== undefined &&
    resource.keywords !== undefined &&
    resource.vocabularies !== undefined
  );
}

/**
 * Initializes a JSON schema resource as a JSON meta-schema resource.
 *
 * @category Resource
 */
export function initMetaSchemaResource(
  resource: SchemaResource & Partial<MetaSchemaResource>,
): MetaSchemaResource {
  if (!("formats" in resource)) {
    resource.formats = {};
  }
  if (!("keywords" in resource)) {
    resource.keywords = {};
  }
  if (!("vocabularies" in resource)) {
    resource.vocabularies = {};
  }
  return resource as MetaSchemaResource;
}

/**
 * Parses the node at the top of the stack as a JSON meta-schema.
 *
 * @throws ValidationError if the node is not a valid meta-schema.
 * @category Resource
 * @internal
 */
export function parseMetaSchemaResource(
  context: SchemaContext,
): MetaSchemaResource {
  // Get the meta-schema node at the top of the stack.
  const frame = currentFrame(context) as SchemaFrame;
  const node = frame.node;

  // Ensure the meta-schema is an object.
  if (!isObject(node)) {
    throw new ValidationError("Meta-schema must be an object", {
      location: currentLocation(context),
    });
  }

  // Determine the canonical URI of the schema.
  const canonicalUri =
    typeof node.$id === "string" ? node.$id
    : typeof node.id === "string" ? node.id
    : undefined;
  if (canonicalUri === undefined) {
    throw new ValidationError("Meta-schema must have a canonical URI", {
      location: currentLocation(context),
    });
  }

  // Use the canonical URI of the meta-schema as the base URI for the frame.
  if (frame.baseUri === undefined) {
    frame.baseUri = canonicalUri;
  }

  // Get the JSON resource associated with the meta-schema node.
  let resource = getResource(context, node) as MetaSchemaResource | undefined;
  if (isMetaSchemaResource(resource)) {
    // The node has already been parsed as a meta-schema resource.
    return resource;
  }
  // Create and register a new JSON resource, if one doesn't already exist.
  if (resource === undefined) {
    resource = createResource(canonicalUri, node) as MetaSchemaResource;
    setResource(context, resource);
  }
  // Initialize the JSON resource as a meta-schema resource.
  initSchemaResource(resource);
  initMetaSchemaResource(resource);

  // Parse the meta-schema as a regular schema.
  parseSchemaResource(context);

  return resource;
}
