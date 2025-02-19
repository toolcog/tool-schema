import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("Draft 05", () => {
  void test("supports type assertions", async () => {
    const schema = await parseSchema({
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "string",
    });
    assert(schema.validate("hello").valid);
  });
});
