import type { Format } from "./format.ts";
import type { Keyword } from "./keyword.ts";
import type { Vocabulary } from "./vocabulary.ts";

/**
 * A JSON Schema dialect.
 *
 * @category Dialect
 */
export interface Dialect {
  /**
   * The canonical URI of the dialect's meta-schema.
   */
  readonly uri: string;

  /**
   * The formats supported by the dialect.
   */
  readonly formats: { readonly [name: string]: Format };

  /**
   * The keywords supported by the dialect.
   */
  readonly keywords: { readonly [key: string]: Keyword };

  /**
   * The vocabularies used by the dialect.
   */
  readonly vocabularies: { readonly [uri: string]: Vocabulary };

  /**
   * An optional meta-schema to validate schemas that use the dialect.
   */
  readonly node?: object;
}
