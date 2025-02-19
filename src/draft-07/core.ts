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
import {
  $schemaKeyword,
  $refKeyword,
  $commentKeyword,
} from "../draft-2020-12/core.ts";

/**
 * A JSON Schema that uses the Draft 07 Core vocabulary.
 *
 * @see [JSON Schema Core Draft 07](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01)
 * @category Vocabularies
 */
export interface CoreVocabulary {
  /**
   * A URI identifying the JSON Schema dialect used for validation.
   * Should be used only in the root schema.
   *
   * @see [JSON Schema Core §7](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01#section-7)
   */
  readonly $schema?: string;

  /**
   * A URI for identifying and resolving references to the schema.
   *
   * @see [JSON Schema Core §8.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01#section-8.2)
   */
  readonly $id?: string;

  /**
   * A URI-reference to the schema to include. Resolves to a full schema
   * which replaces the `$ref` at its location.
   *
   * @see [JSON Schema Core §8.3](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01#section-8.3)
   */
  readonly $ref?: string;

  /**
   * A comment for schema maintainers. Not intended for end-users.
   *
   * @see [JSON Schema Core §9](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01#section-9)
   */
  readonly $comment?: string;
}

/**
 * The `$id` keyword.
 *
 * @see [JSON Schema Core §8.2](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01#section-8.2)
 * @category Keywords
 */
export const $idKeyword = {
  ...Keyword.prototype,
  key: "$id",

  parse(context: SchemaContext): void {
    const frame = currentFrame(context) as SchemaFrame;
    const node = frame.node;

    // §8.2 ¶2: MUST be a string.
    if (typeof node !== "string") {
      throw new ValidationError('"$id" must be a string', {
        location: currentLocation(context),
      });
    }

    // §8.2 ¶2: MUST represent a valid URI-reference.
    let uri: Uri;
    try {
      uri = parseUriReference(node);
    } catch (cause) {
      throw new ValidationError('"$id" must be a valid URI reference', {
        location: currentLocation(context),
        cause,
      });
    }

    // §8.2 ¶1: The base URI that other URI references within the schema
    // are resolved against.
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

    // §8.2 ¶1: The "$id" keyword defines a URI for the schema.
    if (isAbsoluteUri(uri)) {
      // §8.2.2 ¶1: the object containing that "$id" and all of its subschemas
      // can be identified by using a JSON Pointer fragment starting from that
      // location.
      resource.uri = uri.href;
      setResource(context, resource);
    }

    // §8.2 ¶1: The base URI that other URI references within the schema
    // are resolved against.
    resource.baseUri = uri.href;
    schemaFrame.baseUri = uri.href;

    // §8.2.3 ¶2: To specify such a subschema identifier, the "$id" keyword
    // is set to a URI reference with a plain name fragment (not a JSON Pointer
    // fragment). This value MUST begin with the number sign that specifies
    // a fragment ("#").
    const hashIndex = node.indexOf("#");
    if (hashIndex !== -1 && hashIndex < node.length - 1) {
      const anchor = node.slice(hashIndex + 1);
      // §8.2.3 ¶2: Then a letter ([A-Za-z]), followed by any number of
      // letters, digits ([0-9]), hyphens ("-"), underscores ("_"),
      // colons (":"), or periods (".").
      if (/^[A-Za-z][A-Za-z0-9\-_:.]*$/.test(anchor)) {
        setResourceAnchor(resource, node, schemaFrame.node);
      }
    }
  },
} as const satisfies Keyword<string>;

/**
 * The JSON Schema Draft 07 Core vocabulary.
 *
 * @see [JSON Schema Core Draft 07](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-01)
 * @category Vocabularies
 */
export const coreVocabulary = {
  keywords: {
    $schema: $schemaKeyword,
    $id: $idKeyword,
    $ref: $refKeyword,
    $comment: $commentKeyword,
  },
} as const;
