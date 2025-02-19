import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { ValidationError, getAnnotation, parseSchema } from "tool-schema";

void suite("Draft 2020-12 Applicator Vocabulary", () => {
  void suite("allOf keyword", () => {
    void test("validates against all subschemas", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        allOf: [
          { type: "object" },
          { properties: { name: { type: "string" } } },
          { required: ["name"] },
        ],
      });

      assert(schema.validate({ name: "test" }).valid);
      assert(!schema.validate({ name: 123 }).valid);
      assert(!schema.validate({ other: "test" }).valid);
      assert(!schema.validate("not an object").valid);
    });

    void test("requires a non-empty array of subschemas", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          allOf: "not an array",
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          allOf: [],
        });
      }, ValidationError);
    });
  });

  void suite("anyOf keyword", () => {
    void test("validates against any subschema", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
      });

      assert(schema.validate("test").valid);
      assert(schema.validate(123).valid);
      assert(schema.validate(true).valid);
      assert(!schema.validate(null).valid);
      assert(!schema.validate([]).valid);
      assert(!schema.validate({}).valid);
    });

    void test("requires a non-empty array of subschemas", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          anyOf: "not an array",
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          anyOf: [],
        });
      }, ValidationError);
    });
  });

  void suite("oneOf keyword", () => {
    void test("validates against exactly one subschema", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        oneOf: [
          { type: "string", minLength: 3 },
          { type: "string", maxLength: 3 },
        ],
      });

      assert(schema.validate("test").valid); // Only matches `minLength: 3`
      assert(schema.validate("hi").valid); // Only matches `maxLength: 3`
      assert(!schema.validate("foo").valid); // Matches both
      assert(!schema.validate(123).valid); // Matches neither
    });

    void test("requires a non-empty array of subschemas", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          oneOf: "not an array",
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          oneOf: [],
        });
      }, ValidationError);
    });
  });

  void suite("not keyword", () => {
    void test("validates when subschema fails", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        not: { type: "string" },
      });

      assert(schema.validate(123).valid);
      assert(schema.validate(true).valid);
      assert(schema.validate(null).valid);
      assert(!schema.validate("test").valid);
    });
  });

  void suite("if/then/else keywords", () => {
    void test("applies then schema when if passes", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        if: { properties: { type: { const: "string" } } },
        then: { properties: { value: { type: "string" } } },
        else: { properties: { value: { type: "number" } } },
      });

      assert(schema.validate({ type: "string", value: "test" }).valid);
      assert(!schema.validate({ type: "string", value: 123 }).valid);
      assert(schema.validate({ type: "number", value: 123 }).valid);
      assert(!schema.validate({ type: "number", value: "test" }).valid);
    });

    void test("applies else schema when if fails", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        if: { type: "string" },
        then: { minLength: 3 },
        else: { type: "number", minimum: 0 },
      });

      assert(schema.validate("test").valid);
      assert(!schema.validate("hi").valid);
      assert(schema.validate(123).valid);
      assert(!schema.validate(-1).valid);
      assert(!schema.validate(true).valid);
    });

    void test("annotates condition result", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        if: { type: "string" },
        then: { minLength: 3 },
      });

      assert.deepEqual(
        getAnnotation(schema.validate("test"), "/if")?.annotation,
        true,
      );
      assert.deepEqual(
        getAnnotation(schema.validate(null), "/if")?.annotation,
        false,
      );
    });
  });

  void suite("dependentSchemas keyword", () => {
    void test("validates dependent schemas when property present", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        dependentSchemas: {
          credit_card: {
            properties: {
              billing_address: { type: "string" },
            },
            required: ["billing_address"],
          },
        },
      });

      assert(schema.validate({ name: "John" }).valid);
      assert(
        schema.validate({
          name: "John",
          credit_card: "1234",
          billing_address: "123 Main St",
        }).valid,
      );
      assert(
        !schema.validate({
          name: "John",
          credit_card: "1234",
        }).valid,
      );
    });

    void test("rejects non-object schemas", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          dependentSchemas: "not an object",
        });
      }, ValidationError);
    });
  });

  void suite("prefixItems keyword", () => {
    void test("validates items by position", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        prefixItems: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
        ],
      });

      assert(schema.validate(["test", 123, true]).valid);
      assert(schema.validate(["test", 123, true, false]).valid);
      assert(!schema.validate(["test", 123]).valid);
      assert(!schema.validate([123, "test", true]).valid);
      assert(!schema.validate(["test", 123, "not boolean"]).valid);
    });

    void test("annotates full match", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        prefixItems: [{ type: "string" }, { type: "number" }],
      });

      assert.deepEqual(
        getAnnotation(schema.validate(["test", 123]), "/prefixItems")
          ?.annotation,
        true,
      );
    });

    void test("annotates partial match length", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        prefixItems: [{ type: "string" }, { type: "number" }],
      });

      assert.deepEqual(
        getAnnotation(schema.validate(["test", 123, true]), "/prefixItems")
          ?.annotation,
        2,
      );
    });
  });

  void suite("items keyword", () => {
    void test("validates all items", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        items: { type: "number" },
      });

      assert(schema.validate([1, 2, 3]).valid);
      assert(schema.validate([]).valid);
      assert(!schema.validate([1, "not a number", 3]).valid);
      assert(!schema.validate(["not a number"]).valid);
    });

    void test("validates items after prefix", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        prefixItems: [{ type: "string" }],
        items: { type: "number" },
      });

      assert(schema.validate(["test", 1, 2, 3]).valid);
      assert(!schema.validate(["test", "not a number"]).valid);
      assert(schema.validate(["test"]).valid); // No additional items to validate
    });

    void test("annotates successful validation", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        items: { type: "number" },
      });

      assert.deepEqual(
        getAnnotation(schema.validate([1, 2, 3]), "/items")?.annotation,
        true,
      );
    });
  });

  void suite("contains keyword", () => {
    void test("validates when any item matches", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        contains: { type: "number", minimum: 5 },
      });

      assert(schema.validate([1, 5, "test"]).valid);
      assert(schema.validate([10]).valid);
      assert(!schema.validate([1, 2, 3]).valid);
      assert(!schema.validate(["test"]).valid);
    });

    void test("annotates partial match indices", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        contains: { type: "number" },
      });

      assert.deepEqual(
        getAnnotation(schema.validate([true, 123, "test"]), "/contains")
          ?.annotation,
        [1],
      );
    });

    void test("annotates full match", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        contains: { type: "number" },
      });

      assert.deepEqual(
        getAnnotation(schema.validate([1, 2, 3]), "/contains")?.annotation,
        true,
      );
    });
  });

  void suite("properties keyword", () => {
    void test("validates specified properties", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      });

      assert(schema.validate({ name: "John", age: 30 }).valid);
      assert(schema.validate({ name: "John" }).valid); // Optional properties.
      assert(!schema.validate({ name: 123 }).valid);
      assert(!schema.validate({ age: "30" }).valid);
    });

    void test("annotates property names", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      });

      assert.deepEqual(
        getAnnotation(schema.validate({ name: "John", age: 30 }), "/properties")
          ?.annotation,
        ["name", "age"],
      );
    });
  });

  void suite("patternProperties keyword", () => {
    void test("validates matching property names", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        patternProperties: {
          "^S_": { type: "string" },
          "^N_": { type: "number" },
        },
      });

      assert(schema.validate({ S_name: "John", N_age: 30 }).valid);
      assert(!schema.validate({ S_name: 123, N_age: "30" }).valid);
    });

    //void test("rejects invalid regex patterns", async () => {
    //  await assert.rejects(async () => {
    //    await parseSchema({
    //      $schema: "https://json-schema.org/draft/2020-12/schema",
    //      patternProperties: {
    //        "[": { type: "string" }, // Invalid regex
    //      },
    //    });
    //  }, ValidationError);
    //});

    void test("annotates matching property names", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        patternProperties: {
          "^test_": { type: "string" },
        },
      });

      assert.deepEqual(
        getAnnotation(
          schema.validate({ test_1: "a", test_2: "b", other: "c" }),
          "/patternProperties",
        )?.annotation,
        ["test_1", "test_2"],
      );
    });
  });

  void suite("additionalProperties keyword", () => {
    void test("validates unconstrained properties", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
        },
        patternProperties: {
          "^test_": { type: "string" },
        },
        additionalProperties: { type: "number" },
      });

      assert(schema.validate({ name: "John", test_1: "a", age: 30 }).valid);
      assert(
        !schema.validate({
          name: "John",
          test_1: "a",
          other: "not a number",
        }).valid,
      );
    });

    void test("annotates additional property names", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        properties: {
          name: { type: "string" },
        },
        additionalProperties: { type: "number" },
      });

      assert.deepEqual(
        getAnnotation(
          schema.validate({ name: "John", age: 30, score: 100 }),
          "/additionalProperties",
        )?.annotation,
        ["age", "score"],
      );
    });
  });

  void suite("propertyNames keyword", () => {
    void test("validates all property names", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        propertyNames: {
          pattern: "^[A-Z][a-z]+$",
        },
      });

      assert(schema.validate({ Name: "John", Age: 30 }).valid);
      assert(!schema.validate({ name: "John" }).valid);
    });
  });
});
