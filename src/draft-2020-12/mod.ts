export type { CoreVocabulary } from "./core.ts";
export {
  $schemaKeyword,
  $vocabularyKeyword,
  $idKeyword,
  $anchorKeyword,
  $dynamicAnchorKeyword,
  $refKeyword,
  $dynamicRefKeyword,
  $defsKeyword,
  $commentKeyword,
  coreVocabulary,
} from "./core.ts";

export type { ApplicatorVocabulary } from "./applicator.ts";
export {
  allOfKeyword,
  anyOfKeyword,
  oneOfKeyword,
  notKeyword,
  ifKeyword,
  thenKeyword,
  elseKeyword,
  dependentSchemasKeyword,
  prefixItemsKeyword,
  itemsKeyword,
  containsKeyword,
  propertiesKeyword,
  patternPropertiesKeyword,
  additionalPropertiesKeyword,
  propertyNamesKeyword,
  applicatorVocabulary,
} from "./applicator.ts";

export type { UnevaluatedVocabulary } from "./unevaluated.ts";
export {
  unevaluatedItemsKeyword,
  unevaluatedPropertiesKeyword,
  unevaluatedVocabulary,
} from "./unevaluated.ts";

export type { ValidationVocabulary } from "./validation.ts";
export {
  typeKeyword,
  enumKeyword,
  constKeyword,
  multipleOfKeyword,
  maximumKeyword,
  exclusiveMaximumKeyword,
  minimumKeyword,
  exclusiveMinimumKeyword,
  maxLengthKeyword,
  minLengthKeyword,
  patternKeyword,
  maxItemsKeyword,
  minItemsKeyword,
  uniqueItemsKeyword,
  maxContainsKeyword,
  minContainsKeyword,
  maxPropertiesKeyword,
  minPropertiesKeyword,
  requiredKeyword,
  dependentRequiredKeyword,
  validationVocabulary,
} from "./validation.ts";

export type { FormatAnnotationVocabulary } from "./format-annotation.ts";
export {
  formatAnnotationKeyword,
  formatAnnotationVocabulary,
} from "./format-annotation.ts";

export type { FormatAssertionVocabulary } from "./format-assertion.ts";
export {
  formatAssertionKeyword,
  formatAssertionVocabulary,
} from "./format-assertion.ts";

export type { ContentVocabulary } from "./content.ts";
export {
  contentEncodingKeyword,
  contentMediaTypeKeyword,
  contentSchemaKeyword,
  contentVocabulary,
} from "./content.ts";

export type { MetaDataVocabulary } from "./meta-data.ts";
export {
  titleKeyword,
  descriptionKeyword,
  defaultKeyword,
  deprecatedKeyword,
  readOnlyKeyword,
  writeOnlyKeyword,
  examplesKeyword,
  metaDataVocabulary,
} from "./meta-data.ts";

export type { Schema } from "./dialect.ts";
export { dialect } from "./dialect.ts";
