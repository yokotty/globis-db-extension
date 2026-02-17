const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseLikeState,
  expandContentElement,
  collapseContentElement
} = require("./shared.js");

function makeClassList(initial = []) {
  const set = new Set(initial);
  return {
    contains(name) {
      return set.has(name);
    },
    add(name) {
      set.add(name);
    },
    remove(name) {
      set.delete(name);
    },
    toArray() {
      return [...set];
    }
  };
}

function makeChip({ classes = [], countText = "" } = {}) {
  return {
    classList: makeClassList(classes),
    querySelector(selector) {
      if (selector !== "span") return null;
      return { textContent: countText };
    }
  };
}

function makeContent({ classes = [] } = {}) {
  const removed = [];
  return {
    classList: makeClassList(classes),
    style: {
      removeProperty(name) {
        removed.push(name);
      }
    },
    getRemovedStyles() {
      return removed;
    }
  };
}

test("parseLikeState: liked when bg-primary2 exists", () => {
  const chip = makeChip({ classes: ["bg-primary2"], countText: "+" });
  assert.equal(parseLikeState(chip), "liked");
});

test("parseLikeState: unliked when bg-gray2 exists", () => {
  const chip = makeChip({ classes: ["bg-gray2"], countText: "1" });
  assert.equal(parseLikeState(chip), "unliked");
});

test("parseLikeState: unliked when count is + and no color hint", () => {
  const chip = makeChip({ classes: ["foo"], countText: "+" });
  assert.equal(parseLikeState(chip), "unliked");
});

test("parseLikeState: liked when count is numeric and no color hint", () => {
  const chip = makeChip({ classes: ["foo"], countText: "2" });
  assert.equal(parseLikeState(chip), "liked");
});

test("expandContentElement: removes clamp class and inline styles", () => {
  const content = makeContent({ classes: ["editor-content", "line-clamp-3"] });
  const changed = expandContentElement(content);

  assert.equal(changed, true);
  assert.equal(content.classList.contains("line-clamp-3"), false);
  assert.deepEqual(content.getRemovedStyles(), [
    "-webkit-line-clamp",
    "overflow",
    "display",
    "-webkit-box-orient"
  ]);
});

test("expandContentElement: no-op when clamp class does not exist", () => {
  const content = makeContent({ classes: ["editor-content"] });
  const changed = expandContentElement(content);

  assert.equal(changed, false);
  assert.deepEqual(content.getRemovedStyles(), []);
});

test("collapseContentElement: adds clamp class back", () => {
  const content = makeContent({ classes: ["editor-content"] });
  content.removeAttribute = () => {};
  const changed = collapseContentElement(content);

  assert.equal(changed, true);
  assert.equal(content.classList.contains("line-clamp-3"), true);
  assert.deepEqual(content.getRemovedStyles(), [
    "-webkit-line-clamp",
    "overflow",
    "display",
    "-webkit-box-orient"
  ]);
});

test("collapseContentElement: no-op when already clamped", () => {
  const content = makeContent({ classes: ["editor-content", "line-clamp-3"] });
  const changed = collapseContentElement(content);

  assert.equal(changed, false);
  assert.deepEqual(content.getRemovedStyles(), []);
});

test("parseLikeState: liked when icon path matches liked thumb", () => {
  const chip = makeChip({ classes: ["foo"], countText: "" });
  chip.querySelector = (selector) => {
    if (selector === "span") return { textContent: "" };
    if (selector === "svg path") {
      return { getAttribute: () => "M13.12 2.06L7.58 7.6" };
    }
    return null;
  };
  assert.equal(parseLikeState(chip), "liked");
});
