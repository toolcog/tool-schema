import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("email format", async () => {
  const schema = await parseSchema({ format: "email" }, { validation: true });

  void test("accepts valid email strings", () => {
    assert(schema.validate("simple@example.com").valid);
    assert(schema.validate("very.common@example.com").valid);
    assert(schema.validate("x@example.com").valid);
    assert(
      schema.validate("long.email-address-with-hyphens@example.com").valid,
    );
    assert(schema.validate("user.name+tag@example.com").valid);
    assert(schema.validate("example-indeed@strange-example.com").valid);
    assert(schema.validate("test/test@test.com").valid);

    // Quoted local parts
    assert(schema.validate('"john..doe"@example.com').valid);
    assert(schema.validate('"john.doe"@example.com').valid);
    assert(schema.validate('"john\\"doe"@example.com').valid); // Escaped quote
    assert(schema.validate('"john\\\\doe"@example.com').valid); // Escaped backslash
    assert(schema.validate('" "@example.com').valid); // Space
    assert(
      schema.validate('"()<>[]:,;@\\"!#$%&\'*+-/=?^_`{}| ~.a"@example.com')
        .valid,
    ); // All special chars

    // Address literals
    assert(schema.validate("user@[192.0.2.1]").valid);
    assert(schema.validate("user@[IPv6:2001:db8::1]").valid);
    assert(schema.validate("user@[IPv6:2001:db8:0:0:0:0:0:1]").valid);

    // Edge cases
    assert(schema.validate("a@b.c.d.e.f.g.h.i.j.k.com").valid); // Many labels
    assert(schema.validate('"\\a"@example.com').valid); // Escaped letter
    assert(schema.validate("user." + "a".repeat(59) + "@example.com").valid); // Long unquoted local (64 chars: "user." + 59 "a"s = 64)
    assert(schema.validate('"' + "a".repeat(62) + '"@example.com').valid); // Long quoted local
  });

  void test("rejects invalid email strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate("invalid").valid);
    assert(!schema.validate("invalid@").valid);
    assert(!schema.validate("@invalid").valid);
    assert(!schema.validate("a@b@c").valid);
    assert(!schema.validate(".test@example.com").valid);
    assert(!schema.validate("test.@example.com").valid);
    assert(!schema.validate("test..test@example.com").valid);
    assert(!schema.validate("test@example..com").valid);
    assert(!schema.validate("test@-example.com").valid);
    assert(!schema.validate("test@example-.com").valid);
    assert(!schema.validate("test@.example.com").valid);
    assert(!schema.validate("test@example.com.").valid);
    assert(!schema.validate("test@example").valid);
    assert(!schema.validate("test@.com").valid);
    assert(!schema.validate("@example.com").valid);
    assert(!schema.validate("test@example.").valid);

    // Invalid quoted strings
    assert(!schema.validate('"test@example.com').valid); // Unclosed quote
    assert(!schema.validate('test"@example.com').valid); // Unmatched quote
    assert(!schema.validate('"te"st"@example.com').valid); // Quote in middle
    assert(!schema.validate('"test\\"@example.com').valid); // Incomplete escape
    assert(!schema.validate('"\x00"@example.com').valid); // Control char
    assert(!schema.validate('"\x7F"@example.com').valid); // DEL char

    // Length limits
    assert(!schema.validate("a".repeat(65) + "@example.com").valid);
    assert(!schema.validate("test@" + "a".repeat(255) + ".com").valid);
    assert(!schema.validate('"' + "a".repeat(65) + '"@example.com').valid);
  });
});

void suite("idn-email format", async () => {
  const schema = await parseSchema(
    { format: "idn-email" },
    { validation: true },
  );

  void test("accepts valid idn-email strings", () => {
    assert(schema.validate("simple@example.com").valid);
    assert(schema.validate('"john..doe"@example.com').valid);
    assert(schema.validate("user@[192.0.2.1]").valid);

    // Basic Unicode cases
    assert(schema.validate("用户@例子.广告").valid);
    assert(schema.validate("अजय@डाटा.भारत").valid);
    assert(schema.validate("квіточка@пошта.укр").valid);
    assert(schema.validate("θσερ@εχαμπλε.ψομ").valid);
    assert(schema.validate("Dörte@Sörensen.example.com").valid);
    assert(schema.validate("коля@пример.рф").valid);

    // Mixed ASCII/Unicode in local part
    assert(schema.validate("user.用户@example.com").valid);
    assert(schema.validate("用户.user@example.com").valid);

    // Quoted Unicode strings
    assert(schema.validate('"用户.."@例子.广告').valid);
    assert(schema.validate('"用户\\"测试"@例子.广告').valid); // Escaped quote
    assert(schema.validate('"用户\\\\测试"@例子.广告').valid); // Escaped backslash

    // A-label domains
    assert(schema.validate("用户@xn--fsqu00a.xn--0zwm56d").valid); // 测试.广告
    assert(schema.validate("user@xn--fsqu00a.xn--0zwm56d").valid);

    // Mixed A-label/U-label domains
    assert(schema.validate("用户@xn--fsqu00a.广告").valid);
    assert(schema.validate("用户@测试.xn--0zwm56d").valid);

    // Unicode normalization forms
    assert(schema.validate("nörf@example.com").valid); // NFC
    assert(schema.validate("no\u0308rf@example.com").valid); // NFD
  });

  void test("rejects invalid idn-email strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate("invalid").valid);
    assert(!schema.validate("invalid@").valid);
    assert(!schema.validate("@invalid").valid);
    assert(!schema.validate("a@b@c").valid);
    assert(!schema.validate(".test@例子.广告").valid);
    assert(!schema.validate("test.@例子.广告").valid);
    assert(!schema.validate("test..test@例子.广告").valid);
    assert(!schema.validate("用户@例子..广告").valid);
    assert(!schema.validate("用户@-例子.广告").valid);
    assert(!schema.validate("用户@例子-.广告").valid);
    assert(!schema.validate("用户@.例子.广告").valid);
    assert(!schema.validate("用户@例子.广告.").valid);
    assert(!schema.validate("用户@例子").valid);
    assert(!schema.validate("用户@.广告").valid);
    assert(!schema.validate("@例子.广告").valid);
    assert(!schema.validate("用户@例子.").valid);

    // Invalid quoted strings
    assert(!schema.validate('"用户@例子.广告').valid); // Unclosed quote
    assert(!schema.validate('用户"@例子.广告').valid); // Unmatched quote
    assert(!schema.validate('"用"户"@例子.广告').valid); // Quote in middle
    assert(!schema.validate('"用户\\"@例子.广告').valid); // Incomplete escape
    assert(!schema.validate('"\x00"@例子.广告').valid); // Control char
    assert(!schema.validate('"\x7F"@例子.广告').valid); // DEL char

    // Length limits
    assert(!schema.validate("用".repeat(65) + "@例子.广告").valid);
    assert(!schema.validate("test@" + "用".repeat(255) + ".广告").valid);
    assert(!schema.validate('"' + "用".repeat(65) + '"@例子.广告').valid);

    // Invalid Unicode
    assert(!schema.validate("用户@xn--\u0080.com").valid); // Non-ASCII in A-label
    assert(!schema.validate("用户@例\u200B子.广告").valid); // Zero-width space
    assert(!schema.validate("用户@a\uFEFF.test").valid); // BOM
  });
});
