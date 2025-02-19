export { ValidationError } from "./error.ts";

export type {
  SchemaContext,
  SchemaContextOptions,
  SchemaFrame,
} from "./context.ts";
export {
  initSchemaContext,
  createSchemaContext,
  cachePattern,
  createSchemaFrame,
  keywordLocation,
  absoluteKeywordLocation,
  instanceLocation,
} from "./context.ts";

export type { OutputUnit, OutputCheckpoint } from "./output.ts";
export {
  initOutput,
  emitOutput,
  attachError,
  attachAnnotation,
  getAnnotations,
  getAnnotation,
  getChildAnnotation,
  saveCheckpoint,
  restoreCheckpoint,
} from "./output.ts";

export { Format } from "./format.ts";

export {
  Keyword,
  AnnotationKeyword,
  unknownKeyword,
  sortKeywords,
} from "./keyword.ts";

export type { Vocabulary } from "./vocabulary.ts";

export type { Dialect } from "./dialect.ts";

export type { SchemaResource, MetaSchemaResource } from "./resource.ts";
export {
  isSchemaResource,
  initSchemaResource,
  parseSchemaResource,
  validateSchemaResource,
  isMetaSchemaResource,
  initMetaSchemaResource,
  parseMetaSchemaResource,
} from "./resource.ts";

/** @category Dialect */
export * as formats from "./format/mod.ts";

/** @category Dialect */
export * as draft202012 from "./draft-2020-12/mod.ts";

/** @category Schema */
export type { Schema as Schema202012 } from "./draft-2020-12/mod.ts";

/** @category Dialect */
export { dialect as dialect202012 } from "./draft-2020-12/mod.ts";

/** @category Dialect */
export * as draft07 from "./draft-07/mod.ts";

/** @category Schema */
export type { Schema as Schema07 } from "./draft-07/mod.ts";

/** @category Dialect */
export { dialect as dialect07 } from "./draft-07/mod.ts";

/** @category Dialect */
export * as draft05 from "./draft-05/mod.ts";

/** @category Schema */
export type { Schema as Schema05 } from "./draft-05/mod.ts";

/** @category Dialect */
export { dialect as dialect05 } from "./draft-05/mod.ts";

/** @category Dialect */
export * as oas31 from "./oas-3.1/mod.ts";

/** @category Schema */
export type { Schema as SchemaOas31 } from "./oas-3.1/mod.ts";

/** @category Dialect */
export { dialect as dialectOas31 } from "./oas-3.1/mod.ts";

export type { SchemaOptions } from "./schema.ts";
export { Schema, dialects, parseSchema, parseDialect } from "./schema.ts";
