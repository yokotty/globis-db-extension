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

  function collapseLikedPost(postEl) {
    const section = getMainSection(postEl);
    const base = section || postEl;
    const contentEls = base.querySelectorAll(CONTENT_SELECTOR);
    for (const contentEl of contentEls) {
      logic.collapseContentElement(contentEl);
    }
  }

  function processAllPosts() {
    const postEls = document.querySelectorAll(POST_SELECTOR);
    for (const postEl of postEls) {
      if (shouldExpand(postEl)) {
        expandUnlikedPost(postEl);
        continue;
      }
      collapseLikedPost(postEl);
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

  function shouldSyncByRequest(url, method) {
    if (typeof url !== "string" || typeof method !== "string") return false;
    const normalizedMethod = method.toUpperCase();
    if (normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS") {
      return false;
    }
    return /\/api\//.test(url) || /\/my\//.test(url);
  }

  function installNetworkHooks() {
    if (globalThis.__vcLikeSyncHookInstalled) return;
    globalThis.__vcLikeSyncHookInstalled = true;

    if (typeof fetch === "function") {
      const originalFetch = fetch;
      globalThis.fetch = async function (...args) {
        let url = "";
        let method = "GET";

        const input = args[0];
        const init = args[1];

        if (typeof input === "string") {
          url = input;
        } else if (input && typeof input.url === "string") {
          url = input.url;
          if (input.method) method = String(input.method);
        }
        if (init && init.method) method = String(init.method);

        const response = await originalFetch.apply(this, args);
        if (shouldSyncByRequest(url, method)) {
          scheduleProcess();
          setTimeout(scheduleProcess, 80);
          setTimeout(scheduleProcess, 250);
        }
        return response;
      };
    }

    if (typeof XMLHttpRequest !== "undefined") {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this.__vcMethod = typeof method === "string" ? method : "GET";
        this.__vcUrl = typeof url === "string" ? url : "";
        return originalOpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener("loadend", () => {
          if (shouldSyncByRequest(this.__vcUrl, this.__vcMethod || "GET")) {
            scheduleProcess();
            setTimeout(scheduleProcess, 80);
            setTimeout(scheduleProcess, 250);
          }
        }, { once: true });
        return originalSend.apply(this, args);
      };
    }
  }

  installNetworkHooks();
  processAllPosts();
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });
})();
