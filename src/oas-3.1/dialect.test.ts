import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("OAS 3.1", () => {
  void test("supports type assertions", async () => {
    const schema = await parseSchema({
      $schema: "https://spec.openapis.org/oas/3.1/dialect/base",
      type: "string",
    });
    assert(schema.validate("hello").valid);
  });

  void test("supports discriminator keywords", async () => {
    const schema = await parseSchema({
      $schema: "https://spec.openapis.org/oas/3.1/dialect/base",
      $defs: {
        Cat: {
          allOf: [
            { $ref: "#" },
            {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          ],
        },
        Dog: {
          allOf: [
            { $ref: "#" },
            {
              type: "object",
              properties: {
                bark: { type: "string" },
              },
            },
          ],
        },
        Lizard: {
          allOf: [
            { $ref: "#" },
            {
              type: "object",
              properties: {
                lovesRocks: { type: "boolean" },
              },
            },
          ],
        },
      },
      title: "Pet",
      type: "object",
      required: ["petType"],
      properties: {
        petType: { type: "string" },
      },
      discriminator: {
        propertyName: "petType",
        mapping: {
          dog: "#/$defs/Dog",
        },
      },
    });
    assert(schema.validate({ petType: "Cat", name: "Misty" }).valid);
    assert(schema.validate({ petType: "Cat", name: "Misty" }).valid);
    assert(schema.validate({ petType: "dog", bark: "soft" }).valid);
  });

  void test("supports xml keywords", async () => {
    const schema = await parseSchema({
      type: "object",
      properties: {
        id: {
          type: "integer",
          format: "int32",
          xml: {
            attribute: true,
          },
        },
        name: {
          type: "string",
          xml: {
            namespace: "https://example.com/schema/sample",
            prefix: "sample",
          },
        },
      },
    });
    assert(schema.validate({ id: 1, name: "root" }).valid);
  });

  void test("supports externalDocs keywords", async () => {
    const schema = await parseSchema({
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
      },
      externalDocs: {
        description: "More information",
        url: "https://example.com/docs",
      },
    });
    assert(schema.validate({ id: 1, name: "root" }).valid);
  });

  void test("supports example keywords", async () => {
    const schema = await parseSchema({
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
      },
      example: { id: 2, name: "anon" },
    });
    assert(schema.validate({ id: 1, name: "root" }).valid);
  });
});
