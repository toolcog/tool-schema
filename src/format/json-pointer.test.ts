import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("json-pointer format", async () => {
  const schema = await parseSchema(
    { format: "json-pointer" },
    { validation: true },
  );

  void test("accepts valid json-pointer strings", () => {
    assert(schema.validate("").valid);
    assert(schema.validate("/foo").valid);
    assert(schema.validate("/foo/").valid);
    assert(schema.validate("/foo/bar").valid);
    assert(schema.validate("/foo//bar").valid);
    assert(schema.validate("//foo/bar").valid);
    assert(schema.validate("/").valid);
    assert(schema.validate("/0").valid);
    assert(schema.validate("/1").valid);
    assert(schema.validate("/a~1b").valid);
    assert(schema.validate("/c%d").valid);
    assert(schema.validate("/e^f").valid);
    assert(schema.validate("/g|h").valid);
    assert(schema.validate("/i\\j").valid);
    assert(schema.validate('/k"l').valid);
    assert(schema.validate("/ ").valid);
    assert(schema.validate("/m~0n").valid);
    assert(schema.validate("/foo/0").valid);
    assert(schema.validate("/foo/bar/0").valid);
  });

  void test("rejects invalid json-pointer strings", () => {
    assert(!schema.validate("foo").valid);
    assert(!schema.validate("foo/bar").valid);
    assert(!schema.validate("/~").valid);
    assert(!schema.validate("/~2").valid);
    assert(!schema.validate("/~x").valid);
  });
});

void suite("relative-json-pointer format", async () => {
  const schema = await parseSchema(
    { format: "relative-json-pointer" },
    { validation: true },
  );

  void test("accepts valid relative-json-pointer strings", () => {
    assert(schema.validate("0").valid);
    assert(schema.validate("1").valid);
    assert(schema.validate("0/foo").valid);
    assert(schema.validate("1/0/foo").valid);
    assert(schema.validate("2/highly/nested/objects").valid);
    assert(schema.validate("0#").valid);
    assert(schema.validate("1#").valid);
    assert(schema.validate("10").valid);
    assert(schema.validate("20/foo").valid);
    assert(schema.validate("30#").valid);
    assert(schema.validate("1/").valid);
    assert(schema.validate("1//foo").valid);
  });

  void test("rejects invalid relative-json-pointer strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate("01").valid);
    assert(!schema.validate("-1").valid);
    assert(!schema.validate("1.0").valid);
    assert(!schema.validate("1/~").valid);
    assert(!schema.validate("1/~2").valid);
    assert(!schema.validate("#").valid);
    assert(!schema.validate("a").valid);
    assert(!schema.validate("0##").valid);
    assert(!schema.validate("1#/foo").valid);
  });
});
