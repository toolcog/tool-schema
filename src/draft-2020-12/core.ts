import type { Uri } from "tool-uri";
import {
  isAbsoluteUri,
  isValidUri,
  parseUriReference,
  resolveUri,
} from "tool-uri";
import {
  isObject,
  nestFrame,
  currentFrame,
  currentBaseUri,
  currentLocation,
  getResource,
  setResource,
  currentResource,
  setResourceAnchor,
  getReference,
  registerReference,
} from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import { attachError } from "../output.ts";
import type { Format } from "../format.ts";
import { Keyword } from "../keyword.ts";
import type { Vocabulary } from "../vocabulary.ts";
import {
  isSchemaResource,
  parseSchemaResource,
  validateSchemaResource,
  isMetaSchemaResource,
} from "../resource.ts";

/**
 * A JSON Schema that uses the Draft 2020-12 Core vocabulary.
 *
 * @see [JSON Schema Core §8](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8)
 * @category Vocabularies
 */
export interface CoreVocabulary<Schema> {
  /**
   * A URI identifying the JSON Schema dialect used for validation.
   * Should be used only in the root schema.
   *
   * @see [JSON Schema Core §8.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.1.1)
   */
  readonly $schema?: string;

  /**
   * A mapping of vocabulary URIs to boolean values indicating whether the
   * vocabulary is required.
   *
   * @see [JSON Schema Core §8.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.1.2)
   */
  readonly $vocabulary?: { readonly [uri: string]: boolean };

  /**
   * A URI for identifying and resolving references to the schema.
   *
   * @see [JSON Schema Core §8.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.1)
   */
  readonly $id?: string;

  /**
   * Defines an anchor within the schema for reference.
   *
   * @see [JSON Schema Core §8.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.2)
   */
  readonly $anchor?: string;

  /**
   * Defines a dynamic anchor within the schema for dynamic references.
   *
   * @see [JSON Schema Core §8.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.2)
   */
  readonly $dynamicAnchor?: string;

  /**
   * A URI-reference to the schema to include.
   *
   * @see [JSON Schema Core §8.2.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.3.1)
   */
  readonly $ref?: string;

  /**
   * A URI-reference to a dynamically determined schema.
   *
   * @see [JSON Schema Core §8.2.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.3.2)
   */
  readonly $dynamicRef?: string;

  /**
   * Inline schema definitions for reuse. Replaces `definitions` from Draft 7.
   *
   * @see [JSON Schema Core §8.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.4)
   */
  readonly $defs?: { readonly [key: string]: Schema | boolean };

  /**
   * A comment for schema maintainers. Not intended for end-users.
   *
   * @see [JSON Schema Core §8.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.3)
   */
  readonly $comment?: string;
}

/**
 * The `$schema` keyword.
 *
 * @see [JSON Schema Core §8.1.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.1.1)
 * @category Keywords
 */
export const $schemaKeyword = {
  ...Keyword.prototype,
  key: "$schema",
  // Handled by `parseSchemaResource`.
} as const satisfies Keyword<string>;

/**
 * The `$vocabulary` keyword.
 *
 * @see [JSON Schema Core §8.1.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.1.2)
 * @category Keywords
 */
export const $vocabularyKeyword = {
  ...Keyword.prototype,
  key: "$vocabulary",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.1.2 ¶7: MUST be ignored in schema documents that are not being
    // processed as a meta-schema.
    const resource = getResource(context, frame.parent?.node);
    if (!isMetaSchemaResource(resource)) {
      return;
    }

    // §8.1.2 ¶2: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"$vocabulary" must be an object', {
        location: currentLocation(context),
      });
    }

    const formats: { [name: string]: Format } = {};
    const keywords: { [key: string]: Keyword } = {};
    const vocabularies: { [uri: string]: Vocabulary } = {};

    for (const [uri, required] of Object.entries(node)) {
      // §8.1.2 ¶2: The property names in the object MUST be URIs
      // (containing a scheme).
      if (!isValidUri(uri)) {
        throw new ValidationError("Vocabulary URI must contain a scheme", {
          location: currentLocation(context),
        });
      }

      // §8.1.2 ¶4: The values of the object properties MUST be booleans.
      if (typeof required !== "boolean") {
        throw new ValidationError("Vocabulary value must be a boolean", {
          location: currentLocation(context),
        });
      }

      // §8.1.2 ¶4: If the value is true, then implementations that do not
      // recognize the vocabulary MUST refuse to process any schemas that
      // declare this meta-schema.
      const vocabulary = resource.vocabularies[uri];
      if (vocabulary === undefined && required) {
        throw new ValidationError(
          "Unsupported vocabulary: " + JSON.stringify(uri),
          { location: currentLocation(context) },
        );
      }

      // §8 ¶2: MUST have a value of true indicating that it is required.
      if (uri === coreVocabulary.uri && !required) {
        throw new ValidationError("The core vocabulary must be required", {
          location: currentLocation(context),
        });
      }

      if (vocabulary !== undefined) {
        // Enable the vocabulary's formats.
        if (vocabulary.formats !== undefined) {
          for (const [name, format] of Object.entries(vocabulary.formats)) {
            formats[name] = format;
          }
        }

        // Enable the vocabulary's keywords.
        for (const [key, keyword] of Object.entries(vocabulary.keywords)) {
          keywords[key] = keyword;
        }

        // Enable the vocabulary.
        vocabularies[uri] = vocabulary;
      }
    }

    // §8 ¶2: MUST explicitly list the Core vocabulary.
    if (vocabularies[coreVocabulary.uri] === undefined) {
      // OpenAPI violates this requirement in their base vocabulary meta-schema.
      //throw new ValidationError(
      //  "$vocabulary must require the core vocabulary",
      //  { location: currentLocation(context) },
      //);
    }

    // Update the meta-schema resource with all enabled formats.
    resource.formats = formats;

    // §8.1.2 ¶1: Any vocabulary that is understood by the implementation
    // MUST be processed in a manner consistent with the semantic definitions
    // contained within the vocabulary.
    resource.keywords = keywords;

    // §8.1.2 ¶1: Used in meta-schemas to identify the vocabularies available
    // for use in schemas described by that meta-schema.
    resource.vocabularies = vocabularies;
  },
} as const satisfies Keyword<{ readonly [uri: string]: boolean }>;

/**
 * The `$id` keyword.
 *
 * @see [JSON Schema Core §8.2.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.1)
 * @category Keywords
 */
export const $idKeyword = {
  ...Keyword.prototype,
  key: "$id",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2.1 ¶3: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$id" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2.1 ¶3: MUST represent a valid URI-reference.
    let uri: Uri;
    try {
      uri = parseUriReference(node);
    } catch (cause) {
      throw new ValidationError('"$id" must be a valid URI reference', {
        location: currentLocation(context),
        cause,
      });
    }

    // §8.2.1 ¶7: The base URI for resolving that reference is the URI
    // of the parent schema resource.
    uri = resolveUri(currentBaseUri(frame), uri);

    // §8.2.1 ¶5: MUST NOT contain a non-empty fragment.
    if (uri.fragment !== undefined && uri.fragment.length !== 0) {
      throw new ValidationError(
        '"$id" must not contain a non-empty fragment identifier',
        { location: currentLocation(context) },
      );
    }

    // Get the stack frame associated with the keyword's parent schema.
    const schemaFrame = frame.parent;
    if (!isObject(schemaFrame?.node)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    const resource = getResource(context, schemaFrame.node);
    if (!isSchemaResource(resource)) {
      throw new ValidationError("Unknown parent resource", {
        location: currentLocation(context),
      });
    }

    if (isAbsoluteUri(uri)) {
      // §8.2.1 ¶5: The absolute-URI form MUST be considered the canonical URI.
      resource.uri = uri.href;
      setResource(context, resource);
    }

    // §8.2.1 ¶6: Serves as the base URI for relative URI-references.
    resource.baseUri = uri.href;
    schemaFrame.baseUri = uri.href;
  },
} as const satisfies Keyword<string>;

/**
 * The `$anchor` keyword.
 *
 * @see [JSON Schema Core §8.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.2)
 * @category Keywords
 */
export const $anchorKeyword = {
  ...Keyword.prototype,
  key: "$anchor",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2.2 ¶6: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$anchor" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2.2 ¶6: MUST start with a letter ([A-Za-z]) or underscore ("_"),
    // followed by any number of letters, digits ([0-9]), hyphens ("-"),
    // underscores ("_"), and periods (".").
    if (!/^[A-Za-z_][A-Za-z0-9\-_.]*$/.test(node)) {
      throw new ValidationError('"$anchor" must be a valid identifier', {
        location: currentLocation(context),
      });
    }

    // Get the stack frame associated with the keyword's parent schema.
    const schemaFrame = frame.parent;
    if (!isObject(schemaFrame?.node)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    // Get the nearest enclosing canonical resource.
    const resource = currentResource(context, schemaFrame);
    if (resource === undefined) {
      throw new ValidationError("No current resource", {
        location: currentLocation(context),
      });
    }

    // §8.2.2 ¶7: The effect of specifying the same fragment name multiple
    // times within the same resource, using any combination of "$anchor"
    // and/or "$dynamicAnchor", is undefined.
    setResourceAnchor(resource, node, schemaFrame.node);
  },
} as const satisfies Keyword<string>;

/**
 * The `$dynamicAnchor` keyword.
 *
 * @see [JSON Schema Core §8.2.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.2)
 * @category Keywords
 */
export const $dynamicAnchorKeyword = {
  ...Keyword.prototype,
  key: "$dynamicAnchor",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2.2 ¶6: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$dynamicAnchor" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2.2 ¶6: MUST start with a letter ([A-Za-z]) or underscore ("_"),
    // followed by any number of letters, digits ([0-9]), hyphens ("-"),
    // underscores ("_"), and periods (".").
    if (!/^[A-Za-z_][A-Za-z0-9\-_.]*$/.test(node)) {
      throw new ValidationError('"$dynamicAnchor" must be a valid identifier', {
        location: currentLocation(context),
      });
    }

    // Get the stack frame associated with the keyword's parent schema.
    const schemaFrame = frame.parent;
    if (!isObject(schemaFrame?.node)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    // Get the nearest enclosing canonical resource.
    const resource = currentResource(context, schemaFrame);
    if (resource === undefined) {
      throw new ValidationError("No current resource", {
        location: currentLocation(context),
      });
    }

    // §8.2.3 ¶7: The effect of specifying the same fragment name multiple
    // times within the same resource, using any combination of "$anchor"
    // and/or "$dynamicAnchor", is undefined.
    setResourceAnchor(resource, node, schemaFrame.node);
  },
} as const satisfies Keyword<string>;

/**
 * The `$ref` keyword.
 *
 * @see [JSON Schema Core §8.2.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.3.1)
 * @category Keywords
 */
export const $refKeyword = {
  ...Keyword.prototype,
  key: "$ref",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2.3.1 ¶2: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$ref" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2.3.1 ¶2: Is a URI-Reference.
    let refUri: Uri;
    try {
      refUri = parseUriReference(node);
    } catch (cause) {
      throw new ValidationError('"$ref" must be a valid URI reference', {
        location: currentLocation(context),
        cause,
      });
    }

    // §8.2.3.1 ¶2: Resolved against the current URI base.
    refUri = resolveUri(currentBaseUri(frame), refUri);

    // Get the stack frame associated with the keyword's parent schema.
    const schemaFrame = frame.parent;
    if (!isObject(schemaFrame?.node)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    // §8.2.3.1 ¶2: It produces the URI of the schema to apply.
    registerReference(context, schemaFrame.node, "$ref", refUri.href);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const instance = frame.instance;

    const reference = getReference(context, frame.parent?.node);
    if (reference === undefined) {
      attachError(context, "unknown schema reference");
      return;
    }

    const resolved = reference.target;
    if (!isObject(resolved)) {
      attachError(context, "unresolved schema reference");
      return;
    }

    nestFrame(context, (frame: SchemaFrame): void => {
      frame.node = resolved;
      frame.instance = instance;
      validateSchemaResource(context);
    });
  },
} as const satisfies Keyword<string>;

/**
 * The `$dynamicRef` keyword.
 *
 * @see [JSON Schema Core §8.2.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.3.2)
 * @category Keywords
 */
export const $dynamicRefKeyword = {
  ...Keyword.prototype,
  key: "$dynamicRef",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2.3.2 ¶3: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$dynamicRef" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2.3.2 ¶3: Is a URI-Reference.
    let refUri: Uri;
    try {
      refUri = parseUriReference(node);
    } catch (cause) {
      throw new ValidationError('"$dynamicRef" must be a valid URI reference', {
        location: currentLocation(context),
        cause,
      });
    }

    // §8.2.3.2 ¶3: Resolved against the current URI base.
    refUri = resolveUri(currentBaseUri(frame), refUri);

    // Get the stack frame associated with the keyword's parent schema.
    const schemaFrame = frame.parent;
    if (!isObject(schemaFrame?.node)) {
      throw new ValidationError("Unknown parent schema", {
        location: currentLocation(context),
      });
    }

    // §8.2.3.2 ¶3: It produces the URI used as the starting point
    // for runtime resolution.
    registerReference(context, schemaFrame.node, "$dynamicRef", refUri.href);
  },

  validate(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node as string;
    const instance = frame.instance;

    const reference = getReference(context, frame.parent?.node);
    if (reference === undefined) {
      attachError(context, "unknown schema reference");
      return;
    }

    let resolved = reference.target;
    if (!isObject(resolved)) {
      attachError(context, "unresolved schema reference");
      return;
    }

    // §8.2.3.2 ¶4: If the initially resolved starting point URI includes
    // a fragment that was created by the "$dynamicAnchor" keyword,
    // the initial URI MUST be replaced by the URI (including the fragment)
    // for the outermost schema resource in the dynamic scope that defines
    // an identically named fragment with "$dynamicAnchor".
    const hashIndex = node.indexOf("#");
    const anchor = hashIndex !== -1 ? node.slice(hashIndex + 1) : undefined;
    if (anchor !== undefined) {
      let dynamicFrame: SchemaFrame | undefined = frame;
      do {
        const dynamicNode = dynamicFrame.node;
        if (isObject(dynamicNode) && dynamicNode?.$dynamicAnchor === anchor) {
          resolved = dynamicNode;
        }
        dynamicFrame = dynamicFrame.parent;
      } while (dynamicFrame !== undefined);
    }

    // §8.2.3.2 ¶5: Otherwise, its behavior is identical to "$ref",
    // and no runtime resolution is needed.
    nestFrame(context, (frame: SchemaFrame): void => {
      frame.node = resolved;
      frame.instance = instance;
      validateSchemaResource(context);
    });
  },
} as const satisfies Keyword<string>;

/**
 * The `$defs` keyword.
 *
 * @see [JSON Schema Core §8.2.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.2.4)
 * @category Keywords
 */
export const $defsKeyword = {
  ...Keyword.prototype,
  key: "$defs",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2.4 ¶2: MUST be an object.
    if (!isObject(node)) {
      throw new ValidationError('"$defs" must be an object', {
        location: currentLocation(context),
      });
    }

    // §8.2.4 ¶2: Each member value of this object MUST be a valid JSON Schema.
    for (const [key, subschema] of Object.entries(node)) {
      nestFrame(context, (frame: SchemaFrame): void => {
        frame.nodeKey = key;
        frame.node = subschema;
        parseSchemaResource(context);
      });
    }
  },
} as const satisfies Keyword<{ readonly [key: string]: unknown }>;

/**
 * The `$comment` keyword.
 *
 * @see [JSON Schema Core §8.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8.3)
 * @category Keywords
 */
export const $commentKeyword = {
  ...Keyword.prototype,
  key: "$comment",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.3 ¶2: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$comment" must be a string', {
        location: currentLocation(context),
      });
    }
  },
} as const satisfies Keyword<string>;

/**
 * The JSON Schema Draft 2020-12 Core vocabulary.
 *
 * @see [JSON Schema Core §8](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-8)
 * @category Vocabularies
 */
export const coreVocabulary = {
  uri: "https://json-schema.org/draft/2020-12/vocab/core",

  keywords: {
    $schema: $schemaKeyword,
    $vocabulary: $vocabularyKeyword,
    $id: $idKeyword,
    $anchor: $anchorKeyword,
    $dynamicAnchor: $dynamicAnchorKeyword,
    $ref: $refKeyword,
    $dynamicRef: $dynamicRefKeyword,
    $defs: $defsKeyword,
    $comment: $commentKeyword,
  },

  node: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://json-schema.org/draft/2020-12/meta/core",
    $dynamicAnchor: "meta",
    title: "Core vocabulary meta-schema",
    type: ["object", "boolean"],
    properties: {
      $id: {
        $ref: "#/$defs/uriReferenceString",
        $comment: "Non-empty fragments not allowed.",
        pattern: "^[^#]*#?$",
      },
      $schema: { $ref: "#/$defs/uriString" },
      $ref: { $ref: "#/$defs/uriReferenceString" },
      $anchor: { $ref: "#/$defs/anchorString" },
      $dynamicRef: { $ref: "#/$defs/uriReferenceString" },
      $dynamicAnchor: { $ref: "#/$defs/anchorString" },
      $vocabulary: {
        type: "object",
        propertyNames: { $ref: "#/$defs/uriString" },
        additionalProperties: {
          type: "boolean",
        },
      },
      $comment: {
        type: "string",
      },
      $defs: {
        type: "object",
        additionalProperties: { $dynamicRef: "#meta" },
      },
    },
    $defs: {
      anchorString: {
        type: "string",
        pattern: "^[A-Za-z_][-A-Za-z0-9._]*$",
      },
      uriString: {
        type: "string",
        format: "uri",
      },
      uriReferenceString: {
        type: "string",
        format: "uri-reference",
      },
    },
  },
} as const satisfies Vocabulary;
