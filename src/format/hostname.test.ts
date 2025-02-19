import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("hostname format", async () => {
  const schema = await parseSchema(
    { format: "hostname" },
    { validation: true },
  );

  void test("accepts valid hostname strings", () => {
    assert(schema.validate("example.com").valid);
    assert(schema.validate("localhost").valid);
    assert(schema.validate("sub.example.com").valid);
    assert(schema.validate("host-name.com").valid);
    assert(schema.validate("a.b.c.d.e.f.g").valid);

    // RFC 1123 specific cases
    assert(schema.validate("123.example.com").valid); // Digit start allowed
    assert(schema.validate("example123.com").valid);
    assert(schema.validate("11.22.33").valid); // All-numeric labels
    assert(schema.validate("a1").valid); // Two chars, mixed
    assert(schema.validate("1a").valid); // Two chars, starts with number

    // Edge cases for label length and content
    assert(schema.validate("a".repeat(63) + ".com").valid); // Max label length
    assert(schema.validate("a").valid); // Single char label
    assert(schema.validate("1").valid); // Single digit label
    assert(schema.validate("a-b").valid); // Single hyphen
    assert(schema.validate("a" + "-".repeat(61) + "b").valid); // Many hyphens

    // Case sensitivity
    assert(schema.validate("ExAmPlE.CoM").valid);
    assert(schema.validate("LOCALHOST").valid);

    // Many labels (127 is valid)
    assert(schema.validate("a.".repeat(126) + "a").valid);
  });

  void test("rejects invalid hostname strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate(".").valid);
    assert(!schema.validate(".com").valid);
    assert(!schema.validate("example.").valid);
    assert(!schema.validate(".example.com").valid);
    assert(!schema.validate("example..com").valid);
    assert(!schema.validate("-example.com").valid);
    assert(!schema.validate("example-.com").valid);
    assert(!schema.validate("exam@ple.com").valid);
    assert(!schema.validate("exa mple.com").valid);
    assert(!schema.validate("example_.com").valid);
    assert(!schema.validate("example*.com").valid);
    assert(!schema.validate("a".repeat(64) + ".com").valid);
    assert(!schema.validate("x." + "a".repeat(256)).valid);
  });
});

void suite("idn-hostname format", async () => {
  const schema = await parseSchema(
    { format: "idn-hostname" },
    { validation: true },
  );

  void test("accepts valid idn-hostname strings", () => {
    assert(schema.validate("example.com").valid);
    assert(schema.validate("localhost").valid);

    // Basic Unicode cases
    assert(schema.validate("例子.广告").valid);
    assert(schema.validate("sub.例子.广告").valid);
    assert(schema.validate("пример.рф").valid);
    assert(schema.validate("مثال.إختبار").valid);
    assert(schema.validate("παράδειγμα.δοκιμή").valid);
    assert(schema.validate("उदाहरण.परीक्षा").valid);

    // Mixed A-label and U-label
    assert(schema.validate("example-测试.网站").valid);
    assert(schema.validate("xn--8y0a063a.com").valid); // Valid A-label
    assert(schema.validate("xn--8y0a063a.测试.com").valid);
    assert(schema.validate("test.XN--MGBH0FB.net").valid); // Case-insensitive prefix

    // Normalization forms
    assert(schema.validate("bücher.de").valid); // Precomposed
    assert(schema.validate("bu\u0308cher.de").valid); // Decomposed

    // Right-to-left with mixed directionality
    assert(schema.validate("موقع.إختبار-test").valid);
  });

  void test("rejects invalid idn-hostname strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate(".").valid);
    assert(!schema.validate(".广告").valid);
    assert(!schema.validate("例子.").valid);
    assert(!schema.validate(".例子.广告").valid);
    assert(!schema.validate("例子..广告").valid);
    assert(!schema.validate("-例子.广告").valid);
    assert(!schema.validate("例子-.广告").valid);
    assert(!schema.validate("例\u0000子.广告").valid); // Null char
    assert(!schema.validate("例\u0020子.广告").valid); // Space
    assert(!schema.validate("例\u007F子.广告").valid); // Delete
    assert(!schema.validate("测".repeat(64) + ".网站").valid);
    assert(!schema.validate("x." + "测".repeat(256)).valid);
    assert(!schema.validate("xn--\u0080.com").valid); // Non-ASCII in A-label
    assert(!schema.validate("日本\u200B語.jp").valid); // Zero-width space
    assert(!schema.validate("a\uFEFF.test").valid); // BOM
  });
});
