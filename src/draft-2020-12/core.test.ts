import assert from "node:assert/strict";
import { suite, test } from "node:test";
import {
  ValidationError,
  createSchemaContext,
  getAnnotation,
  parseSchema,
} from "tool-schema";

void suite("Draft 2020-12 Core Vocabulary", () => {
  void suite("$id keyword", () => {
    void test("accepts canonical URIs", async () => {
      await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/schemas/test",
      });
      await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f",
      });
    });

    void test("rejects invalid URIs", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "not a uri",
        });
      }, ValidationError);
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "http://%/",
        });
      }, ValidationError);
    });

    void test("accepts URIs with empty fragments", async () => {
      await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/schemas/test#",
      });
    });

    void test("rejects URIs with non-empty fragments", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/schemas/test#foo",
        });
      }, ValidationError);
    });
  });

  void suite("$anchor keyword", () => {
    void test("accepts identifiers", async () => {
      await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $anchor: "myAnchor",
      });
      await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $anchor: "my_Anchor-123.test",
      });
    });

    void test("rejects invalid identifiers", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $anchor: "123invalid",
        });
      }, ValidationError);
    });
  });

  void suite("$dynamicAnchor keyword", () => {
    void test("accepts identifiers", async () => {
      await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $dynamicAnchor: "recursiveAnchor",
      });
    });

    void test("rejects invalid identifiers", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $dynamicAnchor: "invalid@char",
        });
      }, ValidationError);
    });
  });

  void suite("$ref keyword", () => {
    void test("resolves internal pointers", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: {
          positiveInteger: { type: "integer", minimum: 0 },
        },
        properties: {
          count: { $ref: "#/$defs/positiveInteger" },
        },
      });

      assert(schema.validate({ count: 42 }).valid);
      assert(!schema.validate({ count: -1 }).valid);
      assert(!schema.validate({ count: "42" }).valid);
    });

    void test("resolves internal anchors", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: {
          positive: { $anchor: "num", type: "integer", minimum: 0 },
        },
        properties: {
          count: { $ref: "#num" },
        },
      });

      assert(schema.validate({ count: 42 }).valid);
      assert(!schema.validate({ count: -1 }).valid);
    });

    void test("resolves bundled resources", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/root/",
        $defs: {
          child: {
            $id: "child/",
            $defs: {
              grandchild: { $id: "grandchild", type: "integer", minimum: 0 },
            },
          },
        },
        properties: {
          a: { $ref: "child/grandchild" },
          b: { $ref: "https://example.com/root/child/grandchild" },
        },
      });

      assert(schema.validate({ a: 1, b: 2 }).valid);
      assert(!schema.validate({ a: -1, b: 2 }).valid);
      assert(!schema.validate({ a: 1, b: -2 }).valid);
    });

    void test("resolves canonical resources", async () => {
      const context = createSchemaContext();
      await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/number",
          type: "number",
          minimum: 0,
        },
        context,
      );
      const schema = await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          properties: {
            count: { $ref: "https://example.com/number" },
          },
        },
        context,
      );

      assert(schema.validate({ count: 42 }).valid);
      assert(!schema.validate({ count: -1 }).valid);
      assert(!schema.validate({ count: "42" }).valid);
    });

    void test("resolves relative resources", async () => {
      const context = createSchemaContext();
      await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/schemas/common/number",
          type: "number",
        },
        context,
      );
      await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/schemas/main/string",
          type: "string",
        },
        context,
      );
      const schema = await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/schemas/main/",
          properties: {
            a: { $ref: "../common/number" },
            b: { $ref: "./string" },
          },
        },
        context,
      );

      assert(schema.validate({ a: 42, b: "test" }).valid);
      assert(!schema.validate({ a: "42", b: "test" }).valid);
      assert(!schema.validate({ a: 42, b: 42 }).valid);
    });

    void test("respects base URIs", async () => {
      const schema = await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/root/",
          $defs: {
            A: {
              $id: "folder/",
              $defs: {
                B: {
                  $id: "subfolder/",
                  $defs: {
                    C: { $id: "schema", type: "integer" },
                  },
                },
              },
            },
          },
          properties: {
            a: { $ref: "folder/subfolder/schema" },
            b: { $ref: "https://example.com/root/folder/subfolder/schema" },
          },
        },
        { baseUri: "https://example.com/root/" },
      );

      assert(schema.validate({ a: 1, b: 2 }).valid);
      assert(!schema.validate({ a: "1", b: 2 }).valid);
    });

    void test("handles recursive references", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/tree",
        type: "object",
        properties: {
          value: { type: "integer" },
          children: {
            type: "array",
            items: { $ref: "#" },
          },
        },
      });

      assert(
        schema.validate({
          value: 1,
          children: [{ value: 2, children: [{ value: 3, children: [] }] }],
        }).valid,
      );
    });
  });

  void suite("$dynamicRef keyword", () => {
    void test("resolves to outermost $dynamicAnchor", async () => {
      const context = createSchemaContext();
      const loose = await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/tree",
          $dynamicAnchor: "node",
          type: "object",
          properties: {
            data: true,
            children: {
              type: "array",
              items: { $dynamicRef: "#node" },
            },
          },
        },
        context,
      );
      const strict = await parseSchema(
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://example.com/strict-tree",
          $dynamicAnchor: "node",
          $ref: "tree",
          unevaluatedProperties: false,
        },
        context,
      );

      assert(loose.validate({ children: [{ daat: "misspelled" }] }).valid);
      assert(!strict.validate({ children: [{ daat: "misspelled" }] }).valid);
    });
  });

  void suite("$defs keyword", () => {
    void test("resolves schema definitions", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: {
          positiveInteger: { type: "integer", minimum: 0 },
          negativeInteger: { type: "integer", maximum: 0 },
        },
        oneOf: [
          { $ref: "#/$defs/positiveInteger" },
          { $ref: "#/$defs/negativeInteger" },
        ],
      });

      assert(schema.validate(42).valid);
      assert(schema.validate(-42).valid);
      assert(!schema.validate(0).valid);
      assert(!schema.validate("42").valid);
    });

    void test("rejects non-schema definitions", async () => {
      await assert.rejects(async () => {
        await parseSchema({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $defs: { notASchema: "not a schema" },
        });
      }, ValidationError);
    });

    void test("resolves nested schema definitions", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: {
          nested: {
            $defs: {
              positiveInteger: {
                type: "integer",
                minimum: 0,
              },
            },
          },
        },
        properties: {
          count: { $ref: "#/$defs/nested/$defs/positiveInteger" },
        },
      });

      assert(schema.validate({ count: 42 }).valid);
      assert(!schema.validate({ count: -1 }).valid);
    });
  });

  void suite("$comment keyword", () => {
    void test("ignores comments", async () => {
      const schema = await parseSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $comment: "This is a comment",
        type: "string",
      });

      const output = schema.validate("test");
      assert.deepEqual(getAnnotation(output, "/$comment"), undefined);
    });
  });
});
