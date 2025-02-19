import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("ipv4 format", async () => {
  const schema = await parseSchema({ format: "ipv4" }, { validation: true });

  void test("accepts valid ipv4 strings", () => {
    assert(schema.validate("192.168.1.1").valid);
    assert(schema.validate("0.0.0.0").valid);
    assert(schema.validate("255.255.255.255").valid);
    assert(schema.validate("1.2.3.4").valid);

    // Special addresses
    assert(schema.validate("127.0.0.1").valid); // Loopback
    assert(schema.validate("169.254.0.1").valid); // Link-local
    assert(schema.validate("10.0.0.0").valid); // Private network
    assert(schema.validate("224.0.0.1").valid); // Multicast
    assert(schema.validate("240.0.0.1").valid); // Reserved

    // Edge cases for octet values
    assert(schema.validate("0.0.0.0").valid); // Minimum values
    assert(schema.validate("255.255.255.255").valid); // Maximum values
    assert(schema.validate("1.255.255.255").valid); // Max in last three
    assert(schema.validate("255.1.255.255").valid); // Max in surrounding
  });

  void test("rejects invalid ipv4 strings", () => {
    assert(!schema.validate("").valid); // Empty string
    assert(!schema.validate("256.1.2.3").valid); // Octet > 255
    assert(!schema.validate("1.2.3.256").valid); // Last octet > 255
    assert(!schema.validate("-1.2.3.4").valid); // Negative number
    assert(!schema.validate("1.2.3.4.5").valid); // Too many parts
    assert(!schema.validate("192.168.01.1").valid); // Leading zeros
    assert(!schema.validate("192.168.1.1.").valid); // Trailing dot
    assert(!schema.validate(".192.168.1.1").valid); // Leading dot
    assert(!schema.validate("192.168..1").valid); // Empty part
    assert(!schema.validate("192.168.1").valid); // Too few parts
    assert(!schema.validate("1.2.3.d").valid); // Invalid character
    assert(!schema.validate("192.168.1.1/24").valid); // With prefix
    assert(!schema.validate("192.168.1.1:8080").valid); // With port
    assert(!schema.validate(" 192.168.1.1").valid); // Leading space
    assert(!schema.validate("192.168.1.1 ").valid); // Trailing space
    assert(!schema.validate("192.168.1.1\t").valid); // With tab
    assert(!schema.validate("0xFF.2.3.4").valid); // Hex notation
    assert(!schema.validate("0377.2.3.4").valid); // Octal notation
  });
});

void suite("ipv6 format", async () => {
  const schema = await parseSchema({ format: "ipv6" }, { validation: true });

  void test("accepts valid ipv6 strings", () => {
    assert(schema.validate("2001:db8::1").valid);
    assert(schema.validate("::1").valid); // Loopback
    assert(schema.validate("::").valid); // Unspecified

    // Full form addresses
    assert(schema.validate("2001:db8:3333:4444:5555:6666:7777:8888").valid);
    assert(schema.validate("2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF").valid);
    assert(schema.validate("2001:0db8:0001:0000:0000:0ab9:C0A8:0102").valid);

    // Compressed forms
    assert(schema.validate("2001:db8::1").valid); // Single number
    assert(schema.validate("2001:db8::").valid); // End compression
    assert(schema.validate("::1234:5678").valid); // Start compression
    assert(schema.validate("2001::5678").valid); // Middle compression
    assert(schema.validate("2001:db8::ab9:C0A8:102").valid); // Multiple groups

    // Mixed case
    assert(schema.validate("2001:DB8::1").valid); // Uppercase
    assert(schema.validate("2001:dB8::1").valid); // Mixed case

    // Leading zeros (up to 4 hex digits per hextet)
    assert(schema.validate("2001:0db8::1").valid); // Leading zero (4 digits)
    assert(schema.validate("2001:db8:0:0:0:0:0:1").valid); // Single-digit hextets
    assert(!schema.validate("2001:00db8::1").valid); // Too many digits (5)

    // IPv4-mapped addresses
    assert(schema.validate("::ffff:192.168.1.1").valid); // IPv4-mapped
    assert(schema.validate("::ffff:0:192.168.1.1").valid); // Alternative form
    assert(schema.validate("64:ff9b::192.168.1.1").valid); // Well-known prefix
  });

  void test("rejects invalid ipv6 strings", () => {
    assert(!schema.validate("").valid); // Empty string
    assert(!schema.validate(":::").valid); // Too many colons
    assert(!schema.validate("2001:db8").valid); // Incomplete
    assert(!schema.validate("2001:db8:::1").valid); // Invalid compression
    assert(!schema.validate("2001:db8::1::1").valid); // Multiple compression
    assert(!schema.validate("2001:db8:g::").valid); // Invalid character
    assert(!schema.validate("2001:db8::fffff").valid); // Group too long
    assert(!schema.validate("2001:db8:a:b:c:d:e:f:1").valid); // Too many parts
    assert(!schema.validate("2001:db8:a:b:c:d:e").valid); // Too few parts
    assert(!schema.validate("2001:db8::1/64").valid); // With prefix
    assert(!schema.validate("[2001:db8::1]").valid); // With brackets
    assert(!schema.validate("2001:db8::1::").valid); // Trailing compression
    assert(!schema.validate("::1::1").valid); // Multiple compression
    assert(!schema.validate(" 2001:db8::1").valid); // Leading space
    assert(!schema.validate("2001:db8::1 ").valid); // Trailing space
    assert(!schema.validate("2001:db8::1%eth0").valid); // Zone index
    assert(!schema.validate("::ffff:256.1.2.3").valid); // Invalid IPv4 part
    assert(!schema.validate("::ffff:1.2.3.4.5").valid); // Invalid IPv4 part
  });
});
