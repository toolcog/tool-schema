import type { Format } from "./format.ts";
import type { Keyword } from "./keyword.ts";

/**
 * A set of keywords comprising a JSON Schema vocabulary.
 *
 * @see [JSON Schema Core §4.3.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-4.3.3)
 * @category Dialect
 */
export interface Vocabulary {
  /**
   * The canonical URI of the vocabulary.
   */
  readonly uri: string;

  /**
   * The formats implemented by the vocabulary.
   */
  readonly formats?: { readonly [name: string]: Format } | undefined;

  /**
   * The keywords implemented by the vocabulary.
   */
  readonly keywords: { readonly [key: string]: Keyword };

  /**
   * An optional meta-schema to validate schemas that use the vocabulary.
   */
  readonly node?:
    | {
        readonly $id: string;
        readonly [key: string]: unknown;
      }
    | undefined;
}
