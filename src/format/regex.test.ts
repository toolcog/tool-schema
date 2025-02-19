import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("regex format", async () => {
  const schema = await parseSchema({ format: "regex" }, { validation: true });

  void test("accepts valid regex strings", () => {
    assert(schema.validate("abc").valid);
    assert(schema.validate("[a-z]+").valid);
    assert(schema.validate("\\d+").valid);
    assert(schema.validate("a|b").valid);
    assert(schema.validate("a{1,3}").valid);
    assert(schema.validate("(?:abc)").valid);
    assert(schema.validate("\\p{Letter}").valid);
  });

  void test("rejects invalid regex strings", () => {
    assert(!schema.validate("[a-z").valid);
    assert(!schema.validate("a{2,1}").valid);
    assert(!schema.validate("\\").valid);
    assert(!schema.validate("*").valid);
    assert(!schema.validate("+").valid);
  });
});
