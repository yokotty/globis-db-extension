const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseLikeState,
  isMoreLabel,
  isCloseLabel,
  shouldAutoClickMore,
  shouldAutoCollapseOnLike,
  shouldTriggerMoreClick,
  shouldTriggerCloseClick
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

test("isMoreLabel: true only for exact more label", () => {
  assert.equal(isMoreLabel("more"), true);
  assert.equal(isMoreLabel(" more "), true);
  assert.equal(isMoreLabel("閉じる"), false);
  assert.equal(isMoreLabel("more!"), false);
});

test("shouldAutoClickMore: true only for unliked state", () => {
  assert.equal(shouldAutoClickMore("unliked"), true);
  assert.equal(shouldAutoClickMore("liked"), false);
  assert.equal(shouldAutoClickMore(""), false);
});

test("isCloseLabel: true only for 閉じる", () => {
  assert.equal(isCloseLabel("閉じる"), true);
  assert.equal(isCloseLabel(" 閉じる "), true);
  assert.equal(isCloseLabel("more"), false);
});

test("shouldAutoCollapseOnLike: true only for liked state", () => {
  assert.equal(shouldAutoCollapseOnLike("liked"), true);
  assert.equal(shouldAutoCollapseOnLike("unliked"), false);
  assert.equal(shouldAutoCollapseOnLike(""), false);
});

test("shouldTriggerMoreClick: unliked + more only", () => {
  assert.equal(shouldTriggerMoreClick("unliked", "more"), true);
  assert.equal(shouldTriggerMoreClick("liked", "more"), false);
  assert.equal(shouldTriggerMoreClick("unliked", "閉じる"), false);
});

test("shouldTriggerCloseClick: liked + 閉じる only", () => {
  assert.equal(shouldTriggerCloseClick("liked", "閉じる"), true);
  assert.equal(shouldTriggerCloseClick("unliked", "閉じる"), false);
  assert.equal(shouldTriggerCloseClick("liked", "more"), false);
});
