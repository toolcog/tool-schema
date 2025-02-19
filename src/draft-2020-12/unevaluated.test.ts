import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { getAnnotation, parseSchema } from "tool-schema";

void suite("Draft 2020-12 Unevaluated Vocabulary", () => {
  void suite("unevaluatedItems keyword", () => {
    void test("validates all items when no other item keywords present", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        unevaluatedItems: { type: "number" },
      });

      assert(schema.validate([1, 2, 3]).valid);
      assert(!schema.validate([1, "not a number", 3]).valid);
      assert(schema.validate([]).valid);
    });

    void test("validates items not covered by prefixItems", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        prefixItems: [{ type: "string" }],
        unevaluatedItems: { type: "number" },
      });

      assert(schema.validate(["test", 1, 2]).valid);
      assert(!schema.validate(["test", "not a number"]).valid);
      assert(schema.validate(["test"]).valid);
    });

    void test("defers to items keyword when present", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        items: { type: "string" },
        unevaluatedItems: { type: "number" },
      });

      assert(schema.validate(["a", "b", "c"]).valid);
      assert(!schema.validate(["a", 1, "c"]).valid);
    });

    void test("validates items not matched by contains", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        contains: { type: "string" },
        unevaluatedItems: { type: "number" },
      });

      assert(schema.validate([1, "test", 3]).valid);
      assert(!schema.validate([1, "test", false]).valid);
    });

    void test("produces expected annotations", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        prefixItems: [{ type: "string" }],
        unevaluatedItems: { type: "number" },
      });

      assert.deepEqual(
        getAnnotation(schema.validate(["test", 1, 2]), "/unevaluatedItems")
          ?.annotation,
        true,
      );
    });

    void test("validates through nested evaluation scopes", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        allOf: [{ prefixItems: [{ type: "string" }] }],
        unevaluatedItems: { type: "number" },
      });

      assert(schema.validate(["test", 1, 2]).valid);
      assert(!schema.validate(["test", "not a number"]).valid);
      assert(schema.validate(["test"]).valid);
    });

    void test("validates through complex nested schemas", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        allOf: [
          { prefixItems: [{ type: "string" }] },
          { contains: { type: "boolean" } },
        ],
        anyOf: [
          {
            prefixItems: [{ type: "string" }, { type: "number", maximum: 10 }],
          },
        ],
        unevaluatedItems: { type: "string" },
      });

      assert(schema.validate(["test", 5, true, "valid"]).valid);
      assert(!schema.validate(["test", 20, true, "valid"]).valid);
      assert(!schema.validate(["test", 5, "not bool", "valid"]).valid);
      assert(!schema.validate(["test", 5, true, 123]).valid);
    });

    void test("validates through multiple evaluation paths", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "array",
        oneOf: [
          {
            prefixItems: [{ type: "string" }, { type: "number" }],
            unevaluatedItems: { type: "boolean" },
          },
          { items: { type: "string" } },
        ],
      });

      assert(schema.validate(["test", 123, true, true]).valid); // First path.
      assert(schema.validate(["a", "b", "c", "d"]).valid); // Second path.
      assert(!schema.validate([123, "wrong", true]).valid); // Wrong prefix types.
      assert(!schema.validate(["test", 123, "wrong"]).valid); // Wrong unevaluated type.
      assert(!schema.validate(["a", "b", 123, "d"]).valid); // Wrong items type.
    });
  });

  void suite("unevaluatedProperties keyword", () => {
    void test("validates all properties when no other property keywords present", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        unevaluatedProperties: { type: "number" },
      });

      assert(schema.validate({ a: 1, b: 2 }).valid);
      assert(!schema.validate({ a: 1, b: "not a number" }).valid);
      assert(schema.validate({}).valid);
    });

    void test("validates properties not covered by properties", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
        },
        unevaluatedProperties: { type: "number" },
      });

      assert(schema.validate({ name: "test", age: 30 }).valid);
      assert(!schema.validate({ name: "test", age: "30" }).valid);
      assert(schema.validate({ name: "test" }).valid);
    });

    void test("validates properties not covered by patternProperties", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        patternProperties: {
          "^S_": { type: "string" },
        },
        unevaluatedProperties: { type: "number" },
      });

      assert(schema.validate({ S_name: "test", age: 30 }).valid);
      assert(!schema.validate({ S_name: "test", age: "30" }).valid);
    });

    void test("defers to additionalProperties when present", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
        },
        additionalProperties: { type: "number" },
        unevaluatedProperties: { type: "boolean" },
      });

      assert(schema.validate({ name: "test", age: 30 }).valid);
      assert(!schema.validate({ name: "test", age: true }).valid);
    });

    void test("produces expected annotations", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
        },
        unevaluatedProperties: { type: "number" },
      });

      assert.deepEqual(
        getAnnotation(
          schema.validate({ name: "test", age: 30 }),
          "/unevaluatedProperties",
        )?.annotation,
        ["age"],
      );
    });

    void test("validates through nested evaluation scopes", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        allOf: [
          {
            properties: {
              name: { type: "string" },
            },
          },
        ],
        unevaluatedProperties: { type: "number" },
      });

      assert(schema.validate({ name: "test", age: 30 }).valid);
      assert(!schema.validate({ name: "test", age: "30" }).valid);
      assert(schema.validate({ name: "test" }).valid);
    });

    void test("validates through complex nested schemas", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        allOf: [
          {
            properties: {
              name: { type: "string" },
            },
          },
          {
            patternProperties: {
              "^test_": { type: "string" },
            },
          },
        ],
        anyOf: [
          {
            properties: {
              age: { type: "number", maximum: 100 },
            },
          },
        ],
        unevaluatedProperties: { type: "boolean" },
      });

      assert(
        schema.validate({
          name: "John",
          test_1: "a",
          age: 30,
          isActive: true,
        }).valid,
      );
      assert(
        !schema.validate({
          name: "John",
          test_1: "a",
          age: 150, // Exceeds maximum.
        }).valid,
      );
      assert(
        !schema.validate({
          name: "John",
          test_1: "a",
          age: 30,
          isActive: "not a boolean",
        }).valid,
      );
    });

    void test("validates through multiple evaluation paths", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        oneOf: [
          {
            properties: {
              type: { const: "user" },
              name: { type: "string" },
            },
            unevaluatedProperties: { type: "boolean" },
          },
          {
            properties: {
              type: { const: "system" },
              properties: { type: "object" },
            },
          },
        ],
      });

      assert(
        schema.validate({
          type: "user",
          name: "John",
          isActive: true,
        }).valid,
      ); // First path.
      assert(
        schema.validate({
          type: "system",
          properties: {},
        }).valid,
      ); // Second path.
      assert(
        !schema.validate({
          type: "user",
          name: "John",
          isActive: "wrong",
        }).valid,
      ); // Wrong unevaluated type.
      assert(
        !schema.validate({
          type: "system",
          properties: "wrong",
        }).valid,
      ); // Wrong properties type.
    });
  });
});
