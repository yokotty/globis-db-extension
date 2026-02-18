(() => {
  "use strict";

  const logic = globalThis.GlobisDbLogic;
  const POST_SELECTOR = "div.relative.rounded-t-3xl.bg-white";
  const LIKE_CHIP_SELECTOR = "div.relative.rounded-full.h-6.w-fit.cursor-pointer";
  const MORE_BUTTON_SELECTOR = ".flex.justify-end.mr-3 > button";

  function isMoreButton(buttonEl) {
    if (!buttonEl || typeof buttonEl.textContent !== "string") return false;
    if (logic && typeof logic.isMoreLabel === "function") {
      return logic.isMoreLabel(buttonEl.textContent);
    }
    return buttonEl.textContent.trim().toLowerCase() === "more";
  }

  function getMainSection(postEl) {
    return postEl.querySelector(":scope > .text-black2.grid.grid-cols-1");
  }

  function getLikeChip(postEl) {
    const section = getMainSection(postEl);
    if (section) {
      const sectionChip = section.querySelector(`:scope > ${LIKE_CHIP_SELECTOR}`);
      if (sectionChip) return sectionChip;
    }
    return postEl.querySelector(LIKE_CHIP_SELECTOR);
  }

  function isUnlikedPost(postEl) {
    const chip = getLikeChip(postEl);
    if (!chip) return true;
    if (!logic || typeof logic.parseLikeState !== "function") return true;
    const likeState = logic.parseLikeState(chip);
    if (typeof logic.shouldAutoClickMore === "function") {
      return logic.shouldAutoClickMore(likeState);
    }
    return likeState === "unliked";
  }

  function isLikedPost(postEl) {
    const chip = getLikeChip(postEl);
    if (!chip) return false;
    if (!logic || typeof logic.parseLikeState !== "function") return false;
    const likeState = logic.parseLikeState(chip);
    if (typeof logic.shouldAutoCollapseOnLike === "function") {
      return logic.shouldAutoCollapseOnLike(likeState);
    }
    return likeState === "liked";
  }

  function isCloseButton(buttonEl) {
    if (!buttonEl || typeof buttonEl.textContent !== "string") return false;
    if (logic && typeof logic.isCloseLabel === "function") {
      return logic.isCloseLabel(buttonEl.textContent);
    }
    return buttonEl.textContent.trim() === "閉じる";
  }

  function collapsePostViaToggle(postEl) {
    if (!isLikedPost(postEl)) return false;
    const btn = postEl.querySelector(MORE_BUTTON_SELECTOR);
    if (!isCloseButton(btn)) return false;
    btn.click();
    return true;
  }

  function clickAllMoreButtons() {
    const postEls = document.querySelectorAll(POST_SELECTOR);
    let clicked = 0;

    for (const postEl of postEls) {
      if (!isUnlikedPost(postEl)) continue;
      const btn = postEl.querySelector(MORE_BUTTON_SELECTOR);
      if (!isMoreButton(btn)) continue;
      btn.click();
      clicked += 1;
    }

    return clicked;
  }

  let scheduled = false;
  function scheduleExpand() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const clicked = clickAllMoreButtons();
      if (clicked > 0) {
        // Some posts may render delayed after expanding others.
        setTimeout(scheduleExpand, 120);
      }
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        scheduleExpand();
        return;
      }
    }
  });

  function scheduleCollapseForPost(postEl) {
    if (!postEl) return;
    const tryCollapse = () => {
      collapsePostViaToggle(postEl);
    };
    setTimeout(tryCollapse, 60);
    setTimeout(tryCollapse, 180);
    setTimeout(tryCollapse, 400);
    setTimeout(tryCollapse, 800);
  }

  // いいね連動ロジックは後で復活できるようコメントアウト
  // document.addEventListener("click", (event) => {
  //   const target = event.target;
  //   if (!(target instanceof Element)) return;
  //   const chip = target.closest("div.relative.rounded-full.h-6.w-fit.cursor-pointer");
  //   if (!chip) return;
  //   scheduleExpand();
  //   setTimeout(scheduleExpand, 60);
  //   setTimeout(scheduleExpand, 180);
  //   setTimeout(scheduleExpand, 400);
  // }, true);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const chip = target.closest(LIKE_CHIP_SELECTOR);
    if (!chip) return;
    const postEl = chip.closest(POST_SELECTOR);
    if (!postEl) return;
    const mainChip = getLikeChip(postEl);
    if (mainChip !== chip) return;

    scheduleCollapseForPost(postEl);
  }, true);

  // 初期表示後、少し待ってから more を押して全文表示する
  setTimeout(scheduleExpand, 900);
  setTimeout(scheduleExpand, 1500);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
