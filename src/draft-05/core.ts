import type { Uri } from "tool-uri";
import { isAbsoluteUri, parseUriReference, resolveUri } from "tool-uri";
import {
  isObject,
  currentFrame,
  currentBaseUri,
  currentLocation,
  getResource,
  setResource,
  setResourceAnchor,
} from "tool-json";
import { ValidationError } from "../error.ts";
import type { SchemaContext, SchemaFrame } from "../context.ts";
import { Keyword } from "../keyword.ts";
import { isSchemaResource } from "../resource.ts";
import { $schemaKeyword, $refKeyword } from "../draft-2020-12/core.ts";

/**
 * A JSON Schema that uses the Draft 05 Core vocabulary.
 *
 * @see [JSON Schema Core Draft 05](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00)
 * @category Vocabularies
 */
export interface CoreVocabulary {
  /**
   * A URI identifying the JSON Schema dialect used for validation.
   * Should be used only in the root schema.
   *
   * @see [JSON Schema Core §6](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-6)
   */
  readonly $schema?: string;

  /**
   * A URI-reference to the schema to include. Resolves to a full schema
   * which replaces the `$ref` at its location.
   *
   * @see [JSON Schema Core §7](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-7)
   */
  readonly $ref?: string;

  /**
   * A URI for identifying and resolving references to the schema.
   *
   * @see [JSON Schema Core §8.2](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-8.2)
   */
  readonly id?: string;
}

/**
 * The `id` keyword.
 *
 * @see [JSON Schema Core §8.2](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-8.2)
 * @category Keywords
 */
export const idKeyword = {
  ...Keyword.prototype,
  key: "id",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2 ¶2: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"id" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2 ¶2: MUST represent a valid URI-reference.
    let uri: Uri;
    try {
      uri = parseUriReference(node);
    } catch (cause) {
      throw new ValidationError('"id" must be a valid URI reference', {
        location: currentLocation(context),
        cause,
      });
    }

    // §8.2 ¶1: Resolved against the base URI that the object as a whole
    // appears in.
    uri = resolveUri(currentBaseUri(frame), uri);

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

    // §8.2 ¶1: The "id" keyword defines a URI for the schema.
    if (isAbsoluteUri(uri)) {
      resource.uri = uri.href;
      setResource(context, resource);
    }

    // §8.2 ¶1: the base URI that other URI references within the schema
    // are resolved against.
    resource.baseUri = uri.href;
    schemaFrame.baseUri = uri.href;

    // §8.2 ¶4: Subschemas can use "id" to give themselves a document-local
    // identifier. This form of "id" keyword MUST begin with a hash ("#")
    // to identify it as a fragment URI reference.
    const hashIndex = node.indexOf("#");
    if (hashIndex !== -1 && hashIndex < node.length - 1) {
      const anchor = node.slice(hashIndex + 1);
      // §8.2 ¶4: Followed by a letter ([A-Za-z]), followed by any number of
      // letters, digits ([0-9]), hyphens ("-"), underscores ("_"),
      // colons (":"), or periods (".").
      if (/^[A-Za-z][A-Za-z0-9\-_:.]*$/.test(anchor)) {
        setResourceAnchor(resource, node, schemaFrame.node);
      }
    }
  },
} as const satisfies Keyword<string>;

/**
 * The JSON Schema Draft 05 Core vocabulary.
 *
 * @see [JSON Schema Core Draft 05](https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00)
 * @category Vocabularies
 */
export const coreVocabulary = {
  keywords: {
    $schema: $schemaKeyword,
    id: idKeyword,
    $ref: $refKeyword,
  },
} as const;
