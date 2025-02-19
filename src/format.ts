import { currentFrame } from "tool-json";
import type { SchemaContext, SchemaFrame } from "./context.ts";
import { attachError } from "./output.ts";

/**
 * A JSON Schema format validator.
 *
 * @category Dialect
 */
export interface Format<T = unknown> {
  readonly name: string;

  parse?(input: string): T;

  validate?(context: SchemaContext): void;
}

/**
 * JSON schema format validator mixin.
 *
 * @category Dialect
 * @internal
 */
export const Format = {
  prototype: {
    name: undefined,

    parse: undefined,

    validate(this: Format, context: SchemaContext): void {
      const frame = currentFrame(context) as SchemaFrame;
      const instance = frame.instance;

      if (typeof instance !== "string") {
        return; // Not applicable.
      }

      try {
        this.parse?.(instance);
      } catch (error) {
        if (error instanceof Error) {
          attachError(context, error.message);
        } else {
          throw error;
        }
      }
    },
  },
} as const satisfies ThisType<Format>;
