import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseSchema } from "tool-schema";

void suite("date-time format", async () => {
  const schema = await parseSchema(
    { format: "date-time" },
    { validation: true },
  );

  void test("accepts valid date-time strings", () => {
    assert(schema.validate("2025-01-01T12:30:00Z").valid);
    assert(schema.validate("2024-02-29T23:59:59Z").valid);
    assert(schema.validate("2000-12-31T00:00:00Z").valid);
    assert(schema.validate("2024-06-15T12:30:00.5Z").valid);
    assert(schema.validate("2024-06-15T12:30:00+01:00").valid);
    assert(schema.validate("2024-06-15T12:30:00-05:00").valid);
  });

  void test("rejects invalid date-time strings", () => {
    assert(!schema.validate("2024-13-01T12:30:00Z").valid);
    assert(!schema.validate("2024-01-32T12:30:00Z").valid);
    assert(!schema.validate("2024-06-15T24:30:00Z").valid);
    assert(!schema.validate("2024-06-15T12:60:00Z").valid);
    assert(!schema.validate("2024-06-15 12:30:00Z").valid);
    assert(!schema.validate("test").valid);
  });
});

void suite("date format", async () => {
  const schema = await parseSchema({ format: "date" }, { validation: true });

  void test("accepts valid date strings", () => {
    assert(schema.validate("2025-01-01").valid);
    assert(schema.validate("2024-02-29").valid);
    assert(schema.validate("2000-12-31").valid);
  });

  void test("rejects invalid date strings", () => {
    assert(!schema.validate("2024-13-01").valid);
    assert(!schema.validate("2024-00-01").valid);
    assert(!schema.validate("2024-01-32").valid);
    assert(!schema.validate("2024-01-00").valid);
    assert(!schema.validate("24-01-01").valid);
    assert(!schema.validate("2024/01/01").valid);
    assert(!schema.validate("test").valid);
  });
});

void suite("time format", async () => {
  const schema = await parseSchema({ format: "time" }, { validation: true });

  void test("accepts valid time strings", () => {
    assert(schema.validate("12:30:00Z").valid);
    assert(schema.validate("23:59:59Z").valid);
    assert(schema.validate("00:00:00Z").valid);
    assert(schema.validate("12:30:00.5Z").valid);
    assert(schema.validate("12:30:00+01:00").valid);
    assert(schema.validate("12:30:00-05:00").valid);
  });

  void test("rejects invalid time strings", () => {
    assert(!schema.validate("24:00:00Z").valid);
    assert(!schema.validate("12:60:00Z").valid);
    assert(!schema.validate("12:30:61Z").valid);
    assert(!schema.validate("12:30:00").valid);
    assert(!schema.validate("12:30:00+24:00").valid);
    assert(!schema.validate("test").valid);
  });
});

void suite("duration format", async () => {
  const schema = await parseSchema(
    { format: "duration" },
    { validation: true },
  );

  void test("accepts valid duration strings", () => {
    assert(schema.validate("P1Y").valid);
    assert(schema.validate("P1M").valid);
    assert(schema.validate("P1W").valid);
    assert(schema.validate("P1D").valid);
    assert(schema.validate("PT1H").valid);
    assert(schema.validate("PT1M").valid);
    assert(schema.validate("PT1S").valid);
    assert(schema.validate("P1Y2M3D").valid);
  });

  void test("rejects invalid duration strings", () => {
    assert(!schema.validate("P").valid);
    assert(!schema.validate("PT").valid);
    assert(!schema.validate("P1H").valid);
    assert(!schema.validate("T1H").valid);
    assert(!schema.validate("P1Y1W").valid);
    assert(!schema.validate("test").valid);
  });
});
