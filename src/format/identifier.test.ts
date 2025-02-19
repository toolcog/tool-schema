import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("uri format", async () => {
  const schema = await parseSchema({ format: "uri" }, { validation: true });

  void test("accepts valid uri strings", () => {
    // Scheme variations
    assert(schema.validate("http://example.com").valid);
    assert(schema.validate("HTTP://example.com").valid);
    assert(schema.validate("Http://example.com").valid);
    assert(schema.validate("https://example.com").valid);
    assert(schema.validate("ftp://example.com").valid);
    assert(schema.validate("mailto:").valid);
    assert(schema.validate("urn:isbn:0-486-27557-4").valid);

    // Authority variations
    assert(schema.validate("http://example.com:8080").valid);
    assert(schema.validate("http://example.com:").valid); // Empty port
    assert(schema.validate("http://example.com:65535").valid); // Max port
    assert(schema.validate("http://user:pass@example.com").valid);
    assert(schema.validate("http://user@example.com").valid); // No password
    assert(schema.validate("http://192.168.1.1").valid);
    assert(schema.validate("http://[2001:db8::1]").valid);
    assert(schema.validate("http://[v6.example.com]").valid); // RFC 6874

    // Path variations
    assert(schema.validate("http://example.com/").valid);
    assert(schema.validate("http://example.com//").valid); // Empty segment
    assert(schema.validate("http://example.com/./").valid); // Dot segment
    assert(schema.validate("http://example.com/../").valid); // Dot-dot segment
    assert(schema.validate("http://example.com/path").valid);
    assert(schema.validate("http://example.com/path/to/resource").valid);
    assert(schema.validate("file:///path/to/file").valid);

    // Query variations
    assert(schema.validate("http://example.com?").valid); // Empty query
    assert(schema.validate("http://example.com?key=value").valid);
    assert(schema.validate("http://example.com/?key=value").valid);
    assert(schema.validate("http://example.com?k1=v1&k2=v2").valid);
    assert(schema.validate("http://example.com?q=1+2").valid); // Space as +
    assert(schema.validate("http://example.com?q=1%202").valid); // Space as %20

    // Fragment variations
    assert(schema.validate("http://example.com#").valid); // Empty fragment
    assert(schema.validate("http://example.com#fragment").valid);
    assert(schema.validate("http://example.com/#fragment").valid);
    assert(schema.validate("http://example.com/path#fragment").valid);

    // Percent-encoding
    assert(schema.validate("http://example.com/path%20with%20spaces").valid);
    assert(schema.validate("http://example.com/%E2%82%AC").valid); // UTF-8 bytes
    assert(schema.validate("http://example.com/%e2%82%ac").valid); // Lowercase hex
    assert(schema.validate("http://example.com/%00").valid); // Null byte
    assert(schema.validate("http://example.com/%7F").valid); // DEL char

    // Empty components
    assert(schema.validate("http://").valid);
    assert(schema.validate("scheme:").valid);
    assert(schema.validate("http:/example.com").valid); // Relative-like
  });

  void test("rejects invalid uri strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate("://example.com").valid); // No scheme
    assert(!schema.validate("1http://example.com").valid); // Invalid scheme
    assert(!schema.validate("http://example.com:65536").valid); // Invalid port
    assert(!schema.validate("http://exa mple.com").valid); // Space in host
    assert(!schema.validate("http://[2001:db8::1%eth0]").valid); // Zone index
    assert(!schema.validate("http://example.com#fra gment").valid); // Space
    assert(!schema.validate("http://example.com%").valid); // Incomplete %
    assert(!schema.validate("http://example.com%2").valid); // Incomplete %2
    assert(!schema.validate("http://example.com%XX").valid); // Invalid hex
  });
});

void suite("uri-reference format", async () => {
  const schema = await parseSchema(
    { format: "uri-reference" },
    { validation: true },
  );

  void test("accepts valid uri-reference strings", () => {
    // Absolute URIs
    assert(schema.validate("http://example.com").valid);
    assert(schema.validate("https://example.com/path").valid);
    assert(schema.validate("scheme:").valid);

    // Path-absolute references
    assert(schema.validate("/").valid);
    assert(schema.validate("//").valid); // Empty authority
    assert(schema.validate("/path").valid);
    assert(schema.validate("/path/to/resource").valid);
    assert(schema.validate("/.").valid); // Single dot
    assert(schema.validate("/..").valid); // Double dot

    // Path-rootless references
    assert(schema.validate("path").valid);
    assert(schema.validate("path/to/resource").valid);
    assert(schema.validate("./path").valid);
    assert(schema.validate("../path").valid);
    assert(schema.validate("../../path").valid); // Multiple levels up

    // Query variations
    assert(schema.validate("?").valid); // Empty query
    assert(schema.validate("?query").valid);
    assert(schema.validate("/path?query").valid);
    assert(schema.validate("path?key=value").valid);
    assert(schema.validate("?q=1+2").valid); // Space as +
    assert(schema.validate("?q=1%202").valid); // Space as %20

    // Fragment variations
    assert(schema.validate("#").valid); // Empty fragment
    assert(schema.validate("#fragment").valid);
    assert(schema.validate("/path#fragment").valid);
    assert(schema.validate("path#fragment").valid);

    // Percent-encoding
    assert(schema.validate("path%20with%20spaces").valid);
    assert(schema.validate("/path%20with%20spaces").valid);
    assert(schema.validate("%E2%82%AC").valid); // UTF-8 bytes
    assert(schema.validate("%e2%82%ac").valid); // Lowercase hex
    assert(schema.validate("%00").valid); // Null byte
    assert(schema.validate("%7F").valid); // DEL char

    // Empty reference
    assert(schema.validate("").valid);
    assert(schema.validate("http:/example.com").valid);
  });

  void test("rejects invalid uri-reference strings", () => {
    assert(!schema.validate("path with spaces").valid);
    assert(!schema.validate("#fra gment").valid); // Space
    assert(!schema.validate("%").valid); // Incomplete %
    assert(!schema.validate("%2").valid); // Incomplete %2
    assert(!schema.validate("%XX").valid); // Invalid hex
    assert(!schema.validate("http://[2001:db8::1%eth0]").valid); // Zone index
  });
});

void suite("iri format", async () => {
  const schema = await parseSchema({ format: "iri" }, { validation: true });

  void test("accepts valid iri strings", () => {
    // Scheme variations
    assert(schema.validate("http://example.com").valid);
    assert(schema.validate("HTTP://example.com").valid); // Case-insensitive
    assert(schema.validate("https://example.com").valid);
    assert(schema.validate("ftp://example.com").valid);

    // Authority variations
    assert(schema.validate("http://例子.com").valid);
    assert(schema.validate("http://пример.рф").valid);
    assert(schema.validate("http://user:пароль@例子.com").valid);
    assert(schema.validate("http://用户@例子.com").valid); // No password

    // Path variations
    assert(schema.validate("http://example.com/路径").valid);
    assert(schema.validate("http://example.com/путь/к/ресурсу").valid);
    assert(schema.validate("http://example.com/./路径").valid); // Dot segment
    assert(schema.validate("http://example.com/../路径").valid); // Dot-dot segment

    // Query variations
    assert(schema.validate("http://example.com?键=值").valid);
    assert(schema.validate("http://例子.com/路径?键=值").valid);
    assert(schema.validate("http://example.com?ключ=значение&键=值").valid);
    assert(schema.validate("http://example.com?").valid); // Empty query

    // Fragment variations
    assert(schema.validate("http://example.com#фрагмент").valid);
    assert(schema.validate("http://例子.com/路径#片段").valid);
    assert(schema.validate("http://example.com#").valid); // Empty fragment

    // Mixed ASCII and Unicode
    assert(schema.validate("http://example.com/path/文件").valid);
    assert(schema.validate("http://example.com/文件.html").valid);
    assert(schema.validate("http://example.com/%E2%82%AC").valid); // Percent-encoded UTF-8

    // Normalization forms
    assert(schema.validate("http://example.com/nörf").valid); // NFC
    assert(schema.validate("http://example.com/no\u0308rf").valid); // NFD
    assert(schema.validate("http://example.com/\u00F1").valid); // Composed
    assert(schema.validate("http://example.com/n\u0303").valid); // Decomposed

    // Bidirectional text
    assert(schema.validate("http://example.com/path/to/מסמך").valid); // RTL
    assert(schema.validate("http://example.com/path/to/מסמך/file").valid); // Mixed

    // Empty components
    assert(schema.validate("http://").valid);
    assert(schema.validate("scheme:").valid);
    assert(schema.validate("http:/例子.com").valid);
  });

  void test("rejects invalid iri strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate("://example.com").valid);
    assert(!schema.validate("1http://example.com").valid); // Invalid scheme
    assert(!schema.validate("http://例子.com:端口").valid); // Non-ASCII port
    assert(!schema.validate("http://exa mple.com").valid); // Space in host
    assert(!schema.validate("http://example.com#碎 片").valid); // Space
    assert(!schema.validate("http://example.com%").valid); // Incomplete %
    assert(!schema.validate("http://example.com%2").valid); // Incomplete %2
    assert(!schema.validate("http://example.com%XX").valid); // Invalid hex
    assert(!schema.validate("http://[2001:db8::1%eth0]").valid); // Zone index
  });
});

void suite("iri-reference format", async () => {
  const schema = await parseSchema(
    { format: "iri-reference" },
    { validation: true },
  );

  void test("accepts valid iri-reference strings", () => {
    // Absolute IRIs
    assert(schema.validate("http://例子.com").valid);
    assert(schema.validate("https://example.com/路径").valid);

    assert(schema.validate("scheme:").valid);

    // Path-absolute references
    assert(schema.validate("/").valid);
    assert(schema.validate("//").valid); // Empty authority
    assert(schema.validate("/路径").valid);
    assert(schema.validate("/路径/到/资源").valid);
    assert(schema.validate("/.").valid); // Single dot
    assert(schema.validate("/..").valid); // Double dot

    // Path-rootless references
    assert(schema.validate("路径").valid);
    assert(schema.validate("路径/到/资源").valid);
    assert(schema.validate("./路径").valid);
    assert(schema.validate("../路径").valid);
    assert(schema.validate("../../路径").valid); // Multiple levels up

    // Query variations
    assert(schema.validate("?").valid); // Empty query
    assert(schema.validate("?查询").valid);
    assert(schema.validate("/路径?查询").valid);
    assert(schema.validate("路径?键=值").valid);

    // Fragment variations
    assert(schema.validate("#").valid); // Empty fragment
    assert(schema.validate("#片段").valid);
    assert(schema.validate("/路径#片段").valid);
    assert(schema.validate("路径#片段").valid);

    // Mixed ASCII and Unicode
    assert(schema.validate("path/文件").valid);
    assert(schema.validate("/path/文件").valid);
    assert(schema.validate("%E2%82%AC").valid); // Percent-encoded UTF-8

    // Normalization forms
    assert(schema.validate("nörf").valid); // NFC
    assert(schema.validate("no\u0308rf").valid); // NFD
    assert(schema.validate("\u00F1").valid); // Composed
    assert(schema.validate("n\u0303").valid); // Decomposed

    // Empty reference
    assert(schema.validate("").valid);
    assert(schema.validate("http:/例子.com").valid);
  });

  void test("rejects invalid iri-reference strings", () => {
    assert(!schema.validate("路径 带空格").valid); // Space
    assert(!schema.validate("#片 段").valid); // Space
    assert(!schema.validate("%").valid); // Incomplete %
    assert(!schema.validate("%2").valid); // Incomplete %2
    assert(!schema.validate("%XX").valid); // Invalid hex
  });
});

void suite("uuid format", async () => {
  const schema = await parseSchema({ format: "uuid" }, { validation: true });

  void test("accepts valid uuid strings", () => {
    // Version 4 (random) UUIDs
    assert(schema.validate("123e4567-e89b-42d3-a456-426614174000").valid);
    assert(schema.validate("c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd").valid);
    assert(schema.validate("C73BCDCC-2669-4BF6-81D3-E4AE73FB11FD").valid); // Uppercase
    assert(schema.validate("c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd").valid); // Mixed case

    // Version 1 (time-based) UUIDs
    assert(schema.validate("6ba7b810-9dad-11d1-80b4-00c04fd430c8").valid);
    assert(schema.validate("6ba7b811-9dad-11d1-80b4-00c04fd430c8").valid);
    assert(schema.validate("6ba7b812-9dad-11d1-80b4-00c04fd430c8").valid);

    // Version 3 (MD5 namespace) UUIDs
    assert(schema.validate("6ba7b810-9dad-3000-80b4-00c04fd430c8").valid);
    assert(schema.validate("6ba7b811-9dad-3000-80b4-00c04fd430c8").valid);

    // Version 5 (SHA-1 namespace) UUIDs
    assert(schema.validate("6ba7b810-9dad-5000-80b4-00c04fd430c8").valid);
    assert(schema.validate("6ba7b811-9dad-5000-80b4-00c04fd430c8").valid);

    // Variant edge cases (must be 0b10xx)
    assert(schema.validate("6ba7b810-9dad-11d1-8000-00c04fd430c8").valid); // 0b1000
    assert(schema.validate("6ba7b810-9dad-11d1-9000-00c04fd430c8").valid); // 0b1001
    assert(schema.validate("6ba7b810-9dad-11d1-a000-00c04fd430c8").valid); // 0b1010
    assert(schema.validate("6ba7b810-9dad-11d1-b000-00c04fd430c8").valid); // 0b1011

    // Nil UUID
    assert(schema.validate("00000000-0000-4000-8000-000000000000").valid);
  });

  void test("rejects invalid uuid strings", () => {
    assert(!schema.validate("").valid);
    assert(!schema.validate("not-a-uuid").valid);
    assert(!schema.validate("123e4567-e89b-12d3-a456").valid); // Too short
    assert(!schema.validate("123e4567-e89b-12d3-a456-42661417400").valid); // Too short
    assert(!schema.validate("123e4567-e89b-12d3-a456-4266141740000").valid); // Too long
    assert(!schema.validate("123e4567-e89b-02d3-a456-426614174000").valid); // Invalid version (0)
    assert(!schema.validate("123e4567-e89b-62d3-a456-426614174000").valid); // Invalid version (6)
    assert(!schema.validate("123e4567-e89b-12d3-7456-426614174000").valid); // Invalid variant (0b01xx)
    assert(!schema.validate("123e4567-e89b-12d3-c456-426614174000").valid); // Invalid variant (0b11xx)
    assert(!schema.validate("123e4567-e89b-12d3-a456_426614174000").valid); // Invalid separator
    assert(!schema.validate("123e4567e89b12d3a456426614174000").valid); // No separators
    assert(!schema.validate("123e4567-e89b-12g3-a456-426614174000").valid); // Invalid hex (g)
  });
});
