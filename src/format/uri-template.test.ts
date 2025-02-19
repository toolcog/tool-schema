import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("uri-template format", async () => {
  const schema = await parseSchema(
    { format: "uri-template" },
    { validation: true },
  );

  void test("accepts valid uri-template strings", () => {
    assert(schema.validate("").valid);
    assert(schema.validate("http://example.com/").valid);
    assert(schema.validate("http://example.com/{id}").valid);
    assert(schema.validate("http://example.com/{+path}/here").valid);
    assert(schema.validate("http://example.com/{#path}").valid);
    assert(schema.validate("http://example.com/{.who}").valid);
    assert(schema.validate("http://example.com/{/var}").valid);
    assert(schema.validate("http://example.com/{;x,y,empty}").valid);
    assert(schema.validate("http://example.com/{?x,y,empty}").valid);
    assert(schema.validate("http://example.com/{&x,y,empty}").valid);
    assert(schema.validate("http://example.com/{var:3}").valid);
    assert(schema.validate("http://example.com/{list*}").valid);
  });

  void test("rejects invalid uri-template strings", () => {
    assert(!schema.validate("{").valid);
    assert(!schema.validate("}").valid);
    assert(!schema.validate("{}").valid);
    assert(!schema.validate("{invalid").valid);
    assert(!schema.validate("invalid}").valid);
    assert(!schema.validate("{!var}").valid);
    assert(!schema.validate("{var}}").valid);
    assert(!schema.validate("{{var}}").valid);
  });
});
