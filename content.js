(() => {
  "use strict";

  const URL_POLL_MS = 500;
  let lastUrl = location.href;
  let urlPollTimer = null;
  let bootstrapped = false;
  let featureStarted = false;

  function isDiscussionPage(pathname = location.pathname) {
    return /^\/my\/cm(\/|$)/.test(pathname);
  }

  function isExcludedPage(pathname = location.pathname) {
    return /^\/my\/cm\/740(\/|$)/.test(pathname);
  }

  function shouldActivate() {
    return isDiscussionPage() && !isExcludedPage();
  }

  function tryStartFeature() {
    if (featureStarted || !shouldActivate()) return;
    featureStarted = true;
    startFeature();
  }

  function onUrlChange() {
    if (lastUrl === location.href) return;
    lastUrl = location.href;
    tryStartFeature();
  }

  function hookHistory() {
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      onUrlChange();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      onUrlChange();
    };

    window.addEventListener("popstate", onUrlChange);
  }

  function startUrlPoll() {
    if (urlPollTimer) return;
    urlPollTimer = setInterval(onUrlChange, URL_POLL_MS);
  }

  function bootstrap() {
    if (bootstrapped) return;
    bootstrapped = true;
    hookHistory();
    startUrlPoll();
    tryStartFeature();
  }

  function startFeature() {
    const logic = globalThis.GlobisDbLogic;
    const POST_SELECTOR = "div.relative.rounded-t-3xl.bg-white";
    const LIKE_CHIP_SELECTOR = "div.relative.rounded-full.h-6.w-fit.cursor-pointer";
    const MORE_BUTTON_SELECTOR = ".flex.justify-end.mr-3 > button";
    const TABS_SELECTOR = "#tabs";
    const DISCUSSION_TOOLBAR_SELECTOR = "div.flex.justify-between.md\\:py-6.relative";
    const HEADER_NAV_SELECTOR = "#header-desktop-nav";

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

    function adjustTabsHeight() {
      const tabsEl = document.querySelector(TABS_SELECTOR);
      if (!tabsEl) return;

      tabsEl.classList.remove("md:h-[52px]");
      tabsEl.classList.add("md:h-[42px]");
    }

    function adjustDiscussionToolbarPadding() {
      const toolbarEls = document.querySelectorAll(DISCUSSION_TOOLBAR_SELECTOR);
      for (const toolbarEl of toolbarEls) {
        toolbarEl.classList.remove("md:py-6");
        toolbarEl.classList.add("md:py-3");
      }
    }

    function adjustHeaderNavPadding() {
      const navEl = document.querySelector(HEADER_NAV_SELECTOR);
      if (!navEl) return;

      navEl.classList.remove("py-[7px]");
      navEl.classList.add("py-[1px]");
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
          adjustTabsHeight();
          adjustDiscussionToolbarPadding();
          adjustHeaderNavPadding();
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
    adjustTabsHeight();
    adjustDiscussionToolbarPadding();
    adjustHeaderNavPadding();
    setTimeout(adjustTabsHeight, 300);
    setTimeout(adjustDiscussionToolbarPadding, 300);
    setTimeout(adjustHeaderNavPadding, 300);
    setTimeout(scheduleExpand, 900);
    setTimeout(scheduleExpand, 1500);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
