import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { ValidationError, sortKeywords } from "tool-schema";

void suite("Keyword sorting", () => {
  void test("orders dependencies before the keyword", () => {
    const keywords = [
      { key: "B", dependencies: ["A"], dependents: [] },
      { key: "A", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: ["A"], dependents: [] },
    ]);
  });

  void test("orders dependents after the keyword", () => {
    const keywords = [
      { key: "B", dependencies: [], dependents: [] },
      { key: "A", dependencies: [], dependents: ["B"] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: ["B"] },
      { key: "B", dependencies: [], dependents: [] },
    ]);
  });

  void test("orders relative to virtual keywords", () => {
    const keywords = [
      { key: "B", dependencies: ["@V"], dependents: [] },
      { key: "A", dependencies: [], dependents: ["@V"] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: ["@V"] },
      { key: "B", dependencies: ["@V"], dependents: [] },
    ]);
  });

  void test("orders a keyword after all its dependencies", () => {
    const keywords = [
      { key: "C", dependencies: ["A", "B"], dependents: [] },
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
      { key: "C", dependencies: ["A", "B"], dependents: [] },
    ]);
  });

  void test("orders keywords after their mutual dependencies", () => {
    const keywords = [
      { key: "A", dependencies: ["C"], dependents: [] },
      { key: "B", dependencies: ["C"], dependents: [] },
      { key: "C", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "C", dependencies: [], dependents: [] },
      { key: "A", dependencies: ["C"], dependents: [] },
      { key: "B", dependencies: ["C"], dependents: [] },
    ]);
  });

  void test("orders a keyword before all its dependents", () => {
    const keywords = [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
      { key: "C", dependencies: [], dependents: ["A", "B"] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "C", dependencies: [], dependents: ["A", "B"] },
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
    ]);
  });

  void test("orders complex dependencies and dependents", () => {
    const keywords = [
      { key: "D", dependencies: ["B"], dependents: [] },
      { key: "B", dependencies: [], dependents: ["C"] },
      { key: "C", dependencies: ["A"], dependents: [] },
      { key: "A", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "B", dependencies: [], dependents: ["C"] },
      { key: "D", dependencies: ["B"], dependents: [] },
      { key: "A", dependencies: [], dependents: [] },
      { key: "C", dependencies: ["A"], dependents: [] },
    ]);
  });

  void test("preserves the relative order of independent keywords", () => {
    const keywords = [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
      { key: "C", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
      { key: "C", dependencies: [], dependents: [] },
    ]);
  });

  void test("ignores dependencies and dependents not present in the array", () => {
    const keywords = [
      { key: "A", dependencies: ["nil"], dependents: [] },
      { key: "B", dependencies: [], dependents: ["nil"] },
      { key: "C", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: ["nil"], dependents: [] },
      { key: "B", dependencies: [], dependents: ["nil"] },
      { key: "C", dependencies: [], dependents: [] },
    ]);
  });

  void test("ignores virtual keywords that do not appear in both dependencies and dependents", () => {
    const keywords = [
      { key: "A", dependencies: ["@V"], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: ["@V"], dependents: [] },
      { key: "B", dependencies: [], dependents: [] },
    ]);
  });

  void test("orders with respect to multiple virtual keywords", () => {
    const keywords = [
      { key: "C", dependencies: ["@V2"], dependents: [] },
      { key: "B", dependencies: ["@V1"], dependents: ["@V2"] },
      { key: "A", dependencies: [], dependents: ["@V1"] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: ["@V1"] },
      { key: "B", dependencies: ["@V1"], dependents: ["@V2"] },
      { key: "C", dependencies: ["@V2"], dependents: [] },
    ]);
  });

  void test("makes minimal rearrangements", () => {
    const keywords = [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: ["A"], dependents: [] },
      { key: "D", dependencies: ["C"], dependents: [] },
      { key: "C", dependencies: [], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "A", dependencies: [], dependents: [] },
      { key: "B", dependencies: ["A"], dependents: [] },
      { key: "C", dependencies: [], dependents: [] },
      { key: "D", dependencies: ["C"], dependents: [] },
    ]);
  });

  void test("orders a complex dependency graph with virtual keywords", () => {
    const keywords = [
      { key: "E", dependencies: ["@V3"], dependents: [] },
      { key: "D", dependencies: ["B"], dependents: ["@V3"] },
      { key: "C", dependencies: ["@V2"], dependents: [] },
      { key: "B", dependencies: [], dependents: ["@V1"] },
      { key: "A", dependencies: [], dependents: ["@V2"] },
      { key: "F", dependencies: ["@V1"], dependents: [] },
    ];

    sortKeywords(keywords);
    assert.deepEqual(keywords, [
      { key: "B", dependencies: [], dependents: ["@V1"] },
      { key: "D", dependencies: ["B"], dependents: ["@V3"] },
      { key: "E", dependencies: ["@V3"], dependents: [] },
      { key: "A", dependencies: [], dependents: ["@V2"] },
      { key: "C", dependencies: ["@V2"], dependents: [] },
      { key: "F", dependencies: ["@V1"], dependents: [] },
    ]);
  });

  void test("rejects cyclic keyword dependencies", () => {
    const keywords = [
      { key: "A", dependencies: ["B"], dependents: [] },
      { key: "B", dependencies: ["A"], dependents: [] },
    ];

    assert.throws(() => sortKeywords(keywords), ValidationError);
  });
});
