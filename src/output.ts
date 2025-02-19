import {
  escapePointer,
  currentFrame,
  currentPointer,
  currentLocation,
} from "tool-json";
import type { SchemaContext, SchemaFrame } from "./context.ts";
import { instanceLocation } from "./context.ts";

/**
 * A JSON Schema output unit.
 *
 * @see [JSON Schema Core §12.4](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.4)
 * @category Output
 */
export interface OutputUnit {
  /**
   * Indicates the overall validation success or failure.
   *
   * @see [JSON Schema Core §12.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3)
   */
  valid: boolean;

  /**
   * A JSON Pointer to the relative location of the validating keyword
   * following the validation path.
   *
   * @see [JSON Schema Core §12.3.1](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3.1)
   */
  keywordLocation?: string | undefined;

  /**
   * The absolute, dereferenced location of the validating keyword.
   *
   * @see [JSON Schema Core §12.3.2](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3.2)
   */
  absoluteKeywordLocation?: string | undefined;

  /**
   * A JSON Pointer following the instance key path of the stack frame.
   *
   * @see [JSON Schema Core §12.3.3](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01#section-12.3.3)
   */
  instanceLocation?: string | undefined;

  /**
   * The error message produced by a failed validation.
   */
  error?: string | undefined;

  /**
   * The annotation produced by a successful validation.
   */
  annotation?: unknown | undefined;

  /**
   * The collection of errors produced by a failed validation.
   */
  errors?: OutputUnit[] | undefined;

  /**
   * The collection of annotations produced by a successful validation.
   */
  annotations?: OutputUnit[] | undefined;
}

/**
 * Initializes a new schema output unit for the current stack frame.
 *
 * @category Output
 * @internal
 */
export function initOutput(
  context: SchemaContext,
  frame: SchemaFrame,
): OutputUnit {
  let output = frame.output;
  if (output === undefined) {
    frame.output = output = { valid: true };
  }

  if (output.keywordLocation === undefined) {
    output.keywordLocation = currentPointer(frame);
  }
  if (output.absoluteKeywordLocation === undefined) {
    output.absoluteKeywordLocation = currentLocation(context, frame);
  }
  if (output.instanceLocation === undefined) {
    output.instanceLocation = instanceLocation(frame);
  }

  if (!("error" in output)) {
    output.error = undefined;
  }
  if (!("annotation" in output)) {
    output.annotation = undefined;
  }
  if (!("errors" in output)) {
    output.errors = undefined;
  }
  if (!("annotations" in output)) {
    output.annotations = undefined;
  }

  return output;
}

/**
 * Chains the output unit attached to the given stack frame to the output unit
 * of the nearest ancestor frame that has an output unit. Returns the ancestor
 * output unit, or `undefined` if no ancestor output was found.
 *
 * @category Output
 * @internal
 */
export function emitOutput(
  context: SchemaContext,
  frame: SchemaFrame | undefined,
): OutputUnit | undefined {
  let output = frame?.output;
  if (
    output === undefined ||
    (output.error === undefined &&
      output.annotation === undefined &&
      (output.errors === undefined || output.errors.length === 0) &&
      (output.annotations === undefined || output.annotations.length === 0))
  ) {
    return undefined;
  }

  if (output.error === undefined && output.annotation === undefined) {
    if (
      output.errors?.length === 1 &&
      (output.annotations === undefined || output.annotations?.length === 1)
    ) {
      output = output.errors[0]!;
    } else if (
      output.annotations?.length === 1 &&
      (output.errors === undefined || output.errors?.length === 1)
    ) {
      output = output.annotations[0]!;
    }
  }

  frame = frame?.parent;
  while (frame !== undefined) {
    const baseOutput = frame.output;
    if (baseOutput !== undefined) {
      initOutput(context, frame);

      if (!output.valid) {
        baseOutput.valid = false;
        let baseErrors = baseOutput.errors;
        if (baseErrors === undefined) {
          baseOutput.errors = baseErrors = [];
        }
        baseErrors.push(output);
      } else {
        let baseAnnotations = baseOutput.annotations;
        if (baseAnnotations === undefined) {
          baseOutput.annotations = baseAnnotations = [];
        }
        baseAnnotations.push(output);
      }

      return baseOutput;
    }
    frame = frame.parent;
  }

  return undefined;
}

/**
 * Attaches a schema error to the current stack location.
 *
 * @category Output
 */
export function attachError(
  context: SchemaContext,
  message: string,
): OutputUnit {
  const frame = currentFrame(context) as SchemaFrame;

  // Attach the error to the output unit for the current stack frame.
  const output = initOutput(context, frame);
  output.valid = false;
  output.error = message;

  return output;
}

/**
 * Attaches a schema annotation to the current stack location.
 *
 * @category Output
 */
export function attachAnnotation(
  context: SchemaContext,
  value: unknown,
): OutputUnit {
  const frame = currentFrame(context) as SchemaFrame;

  // Attach the annotation to the output unit for the current stack frame.
  const output = initOutput(context, frame);
  output.annotation = value;

  return output;
}

/**
 * Returns all output units containing annotations with the given keyword
 * suffix for the current instance location. Includes annotations produced
 * by all successfully evaluated dynamic-scope subschemas.
 *
 * Accumulates annotations in the provided `annotations` array.
 *
 * @category Output
 */
export function getAnnotations(
  output: OutputUnit | undefined,
  keywordSuffix: string,
  annotations: OutputUnit[] = [],
): OutputUnit[] {
  if (output?.valid !== true) {
    return annotations;
  }

  if (
    output.annotation !== undefined &&
    output.keywordLocation?.endsWith(keywordSuffix) === true
  ) {
    annotations.push(output);
  }

  if (output.annotations !== undefined) {
    for (const outputUnit of output.annotations) {
      if (
        output.instanceLocation === undefined ||
        output.instanceLocation === outputUnit.instanceLocation
      ) {
        getAnnotations(outputUnit, keywordSuffix, annotations);
      }
    }
  }

  return annotations;
}

/**
 * Returns the annotation associated with the given keyword location,
 * relative to the specified output. Returns `undefined` if no such
 * annotation exists.
 *
 * @category Output
 */
export function getAnnotation(
  output: OutputUnit | undefined,
  keywordLocation: string,
): OutputUnit | undefined {
  if (output === undefined) {
    return undefined;
  }

  if (
    output.keywordLocation === keywordLocation &&
    output.annotation !== undefined
  ) {
    return output;
  }

  if (
    output.annotations !== undefined &&
    (output.keywordLocation === undefined ||
      keywordLocation.startsWith(output.keywordLocation))
  ) {
    for (const outputUnit of output.annotations) {
      const subUnit = getAnnotation(outputUnit, keywordLocation);
      if (subUnit !== undefined) {
        return subUnit;
      }
    }
  }

  return undefined;
}

/**
 * Returns the annotation associated with the keyword child the given location.
 * Returns `undefined` if no such annotation exists.
 *
 * @category Output
 * @internal
 */
export function getChildAnnotation(
  frame: SchemaFrame | undefined,
  keyword: string,
): OutputUnit | undefined {
  if (frame === undefined) {
    return undefined;
  }

  const keywordLocation = currentPointer(frame) + "/" + escapePointer(keyword);
  return getAnnotation(frame.output, keywordLocation);
}

/**
 * A checkpoint of an output unit.
 *
 * @category Output
 * @internal
 */
export interface OutputCheckpoint {
  output: OutputUnit | undefined;
  valid: boolean | undefined;
  error: string | undefined;
  errors: OutputUnit[] | undefined;
}

/**
 * Saves a checkpoint of the current output unit.
 *
 * @category Output
 * @internal
 */
export function saveCheckpoint(
  output: OutputUnit | undefined,
): OutputCheckpoint {
  return {
    output,
    valid: output?.valid,
    error: output?.error,
    errors: output?.errors?.slice(),
  };
}

/**
 * Restores an output unit checkpoint.
 *
 * @category Output
 * @internal
 */
export function restoreCheckpoint(checkpoint: OutputCheckpoint): void {
  const output = checkpoint.output;
  if (output === undefined) {
    return;
  }

  output.valid = checkpoint.valid!;
  output.error = checkpoint.error;
  output.errors = checkpoint.errors;
}
