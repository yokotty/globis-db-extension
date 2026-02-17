(() => {
  "use strict";

  const logic = globalThis.GlobisDbLogic;
  if (!logic) return;

  const POST_SELECTOR = "div.relative.rounded-t-3xl.bg-white";
  const LIKE_CHIP_SELECTOR = "div.relative.rounded-full.h-6.w-fit.cursor-pointer";
  const CONTENT_SELECTOR = ".editor-content";

  function getMainSection(postEl) {
    return postEl.querySelector(":scope > .text-black2.grid.grid-cols-1");
  }

  function getLikeChip(postEl) {
    const section = getMainSection(postEl);
    if (section) {
      const sectionChip = section.querySelector(LIKE_CHIP_SELECTOR);
      if (sectionChip) return sectionChip;
    }
    return postEl.querySelector(LIKE_CHIP_SELECTOR);
  }

  function shouldExpand(postEl) {
    const chip = getLikeChip(postEl);
    return logic.parseLikeState(chip) === "unliked";
  }

  function expandUnlikedPost(postEl) {
    const section = getMainSection(postEl);
    const base = section || postEl;
    const contentEls = base.querySelectorAll(CONTENT_SELECTOR);
    for (const contentEl of contentEls) {
      logic.expandContentElement(contentEl);
    }
  }

  function processAllPosts() {
    const postEls = document.querySelectorAll(POST_SELECTOR);
    for (const postEl of postEls) {
      if (!shouldExpand(postEl)) continue;
      expandUnlikedPost(postEl);
    }
  }

  let scheduled = false;
  function scheduleProcess() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      processAllPosts();
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        scheduleProcess();
        return;
      }
      if (m.type === "attributes") {
        scheduleProcess();
        return;
      }
    }
  });

  processAllPosts();
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });
})();
