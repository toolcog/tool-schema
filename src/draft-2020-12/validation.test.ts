import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { ValidationError, parseSchema } from "tool-schema";

void suite("Draft 2020-12 Validation Vocabulary", () => {
  void suite("type keyword", () => {
    void test("validates primitive types", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "string",
      });

      assert(schema.validate("hello").valid);
      assert(!schema.validate(null).valid);
      assert(!schema.validate(true).valid);
      assert(!schema.validate(42).valid);
      assert(!schema.validate([]).valid);
      assert(!schema.validate({}).valid);
    });

    void test("validates unions of types", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: ["string", "number"],
      });

      assert(schema.validate("hello").valid);
      assert(schema.validate(42).valid);
      assert(!schema.validate(true).valid);
      assert(!schema.validate(null).valid);
    });

    void test("validates integer type as distinct from number type", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "integer",
      });

      assert(schema.validate(42).valid);
      assert(!schema.validate(3.14).valid);
    });

    void test("rejects non-string and non-array type values", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: 123,
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: ["string", 123],
        });
      }, ValidationError);
    });
  });

  void suite("enum keyword", () => {
    void test("validates exact matches against string enum", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        enum: ["red", "green", "blue"],
      });

      assert(schema.validate("red").valid);
      assert(schema.validate("green").valid);
      assert(schema.validate("blue").valid);
      assert(!schema.validate("yellow").valid);
    });

    void test("validates exact matches against heterogeneous enum", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        enum: ["red", 42, true, null, [1, 2], { a: 1 }],
      });

      assert(schema.validate("red").valid);
      assert(schema.validate(42).valid);
      assert(schema.validate(true).valid);
      assert(schema.validate(null).valid);
      assert(schema.validate([1, 2]).valid);
      assert(schema.validate({ a: 1 }).valid);
      assert(!schema.validate("blue").valid);
      assert(!schema.validate([1, 3]).valid);
    });

    void test("rejects non-array enum definition", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          enum: "not an array",
        });
      }, ValidationError);
    });
  });

  void suite("const keyword", () => {
    void test("validates exact match against primitive const", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        const: "hello",
      });

      assert(schema.validate("hello").valid);
      assert(!schema.validate("world").valid);
    });

    void test("validates deep equality against object const", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        const: { foo: [1, 2, 3], bar: "baz" },
      });

      assert(schema.validate({ foo: [1, 2, 3], bar: "baz" }).valid);
      assert(!schema.validate({ foo: [1, 2, 3], bar: "qux" }).valid);
    });
  });

  void suite("multipleOf keyword", () => {
    void test("validates integer multiples", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        multipleOf: 3,
      });

      assert(schema.validate(0).valid);
      assert(schema.validate(3).valid);
      assert(schema.validate(6).valid);
      assert(!schema.validate(4).valid);
    });

    void test("validates decimal multiples with exact division", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        multipleOf: 0.5,
      });

      assert(schema.validate(1).valid);
      assert(schema.validate(1.5).valid);
      assert(!schema.validate(1.7).valid);
    });

    void test("rejects zero and negative divisors", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          multipleOf: 0,
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          multipleOf: -1,
        });
      }, ValidationError);
    });
  });

  void suite("number range keywords", () => {
    void test("validates inclusive maximum bound", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        maximum: 5,
      });

      assert(schema.validate(5).valid);
      assert(schema.validate(4).valid);
      assert(!schema.validate(6).valid);
    });

    void test("validates exclusive maximum bound", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        exclusiveMaximum: 5,
      });

      assert(schema.validate(4).valid);
      assert(!schema.validate(5).valid);
      assert(!schema.validate(6).valid);
    });

    void test("validates inclusive minimum bound", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        minimum: 5,
      });

      assert(schema.validate(5).valid);
      assert(schema.validate(6).valid);
      assert(!schema.validate(4).valid);
    });

    void test("validates exclusive minimum bound", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        exclusiveMinimum: 5,
      });

      assert(schema.validate(6).valid);
      assert(!schema.validate(5).valid);
      assert(!schema.validate(4).valid);
    });
  });

  void suite("string length keywords", () => {
    void test("validates maximum string length", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        maxLength: 5,
      });

      assert(schema.validate("hello").valid);
      assert(schema.validate("hi").valid);
      assert(!schema.validate("hello world").valid);
    });

    void test("validates minimum string length", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        minLength: 5,
      });

      assert(schema.validate("hello").valid);
      assert(schema.validate("hello world").valid);
      assert(!schema.validate("hi").valid);
    });

    void test("rejects negative length constraints", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          maxLength: -1,
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          minLength: -1,
        });
      }, ValidationError);
    });
  });

  void suite("pattern keyword", () => {
    void test("validates string against regex pattern", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        pattern: "^[a-z]+$",
      });

      assert(schema.validate("hello").valid);
      assert(!schema.validate("hello123").valid);
      assert(!schema.validate("HELLO").valid);
    });

    //void test("rejects invalid regex syntax", async () => {
    //  await assert.rejects(async () => {
    //    await parseSchema({
    //      $schema: "https://json-schema.org/draft/2020-12/schema",
    //      pattern: "[",
    //    });
    //  }, ValidationError);
    //});
  });

  void suite("array length keywords", () => {
    void test("validates maximum array length", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        maxItems: 3,
      });

      assert(schema.validate([1, 2, 3]).valid);
      assert(schema.validate([1, 2]).valid);
      assert(!schema.validate([1, 2, 3, 4]).valid);
    });

    void test("validates minimum array length", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        minItems: 2,
      });

      assert(schema.validate([1, 2]).valid);
      assert(schema.validate([1, 2, 3]).valid);
      assert(!schema.validate([1]).valid);
    });
  });

  void suite("uniqueItems keyword", () => {
    void test("validates uniqueness with deep equality", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        uniqueItems: true,
      });

      assert(schema.validate([1, 2, 3]).valid);
      assert(!schema.validate([1, 2, 2]).valid);
      assert(schema.validate([{ a: 1 }, { b: 2 }]).valid);
      assert(!schema.validate([{ a: 1 }, { a: 1 }]).valid);
    });
  });

  void suite("contains keywords", () => {
    void test("validates maximum match count", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        contains: { type: "number" },
        maxContains: 2,
      });

      assert(schema.validate(["a", 1]).valid);
      assert(schema.validate(["a", 1, "b"]).valid);
      assert(!schema.validate([1, 2, 3]).valid);
    });

    void test("validates minimum match count", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        contains: { type: "number" },
        minContains: 2,
      });

      assert(schema.validate([1, 2, "a"]).valid);
      assert(!schema.validate([1, "a", "b"]).valid);
    });
  });

  void suite("object size keywords", () => {
    void test("validates maximum property count", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        maxProperties: 2,
      });

      assert(schema.validate({ a: 1, b: 2 }).valid);
      assert(schema.validate({ a: 1 }).valid);
      assert(!schema.validate({ a: 1, b: 2, c: 3 }).valid);
    });

    void test("validates minimum property count", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        minProperties: 2,
      });

      assert(schema.validate({ a: 1, b: 2 }).valid);
      assert(schema.validate({ a: 1, b: 2, c: 3 }).valid);
      assert(!schema.validate({ a: 1 }).valid);
    });
  });

  void suite("required keyword", () => {
    void test("validates presence of all required properties", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        required: ["name", "age"],
      });

      assert(schema.validate({ name: "John", age: 30 }).valid);
      assert(schema.validate({ name: "John", age: 30, city: "NY" }).valid);
      assert(!schema.validate({ name: "John" }).valid);
      assert(!schema.validate({ age: 30 }).valid);
    });

    void test("rejects non-string property names in required array", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          required: "not an array",
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          required: [123],
        });
      }, ValidationError);
    });
  });

  void suite("dependentRequired keyword", () => {
    void test("validates presence of dependent properties", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        dependentRequired: {
          credit_card: ["billing_address"],
          billing_address: ["state", "zip"],
        },
      });

      assert(schema.validate({ name: "John" }).valid);
      assert(
        schema.validate({
          name: "John",
          credit_card: "1234",
          billing_address: "123 Main St",
          state: "CA",
          zip: "12345",
        }).valid,
      );
      assert(
        !schema.validate({
          name: "John",
          credit_card: "1234",
        }).valid,
      );
      assert(
        !schema.validate({
          name: "John",
          billing_address: "123 Main St",
        }).valid,
      );
    });

    void test("rejects non-array and non-string property dependencies", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          dependentRequired: {
            credit_card: "not an array",
          },
        });
      }, ValidationError);

      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          dependentRequired: {
            credit_card: [123],
          },
        });
      }, ValidationError);
    });
  });
});
