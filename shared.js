(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }
  root.GlobisDbLogic = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function parseLikeState(chipEl) {
    if (!chipEl) return "unliked";

    if (chipEl.classList && chipEl.classList.contains("bg-primary2")) return "liked";
    if (chipEl.classList && chipEl.classList.contains("bg-gray2")) return "unliked";

    const iconPath = chipEl.querySelector ? chipEl.querySelector("svg path") : null;
    const d = iconPath && typeof iconPath.getAttribute === "function"
      ? (iconPath.getAttribute("d") || "")
      : "";
    if (d.startsWith("M13.12 2.06")) return "liked";
    if (d.startsWith("M21 8h-6.31")) return "unliked";

    const countEl = chipEl.querySelector ? chipEl.querySelector("span") : null;
    const text = countEl && typeof countEl.textContent === "string"
      ? countEl.textContent.trim()
      : "";

    if (text === "+") return "unliked";
    if (text.length > 0) return "liked";

    return "unliked";
  }

  function expandContentElement(contentEl) {
    if (!contentEl || !contentEl.classList) return false;
    if (!contentEl.classList.contains("line-clamp-3")) return false;

    contentEl.classList.remove("line-clamp-3");
    if (contentEl.style && typeof contentEl.style.removeProperty === "function") {
      contentEl.style.removeProperty("-webkit-line-clamp");
      contentEl.style.removeProperty("overflow");
      contentEl.style.removeProperty("display");
      contentEl.style.removeProperty("-webkit-box-orient");
    }
    return true;
  }

  function collapseContentElement(contentEl) {
    if (!contentEl || !contentEl.classList) return false;
    if (contentEl.classList.contains("line-clamp-3") && !contentEl.classList.contains("line-clamp-none")) {
      return false;
    }

    contentEl.classList.remove("line-clamp-none");
    contentEl.classList.add("line-clamp-3");
    if (typeof contentEl.removeAttribute === "function") {
      contentEl.removeAttribute("data-vc-expanded");
    }
    if (contentEl.style && typeof contentEl.style.removeProperty === "function") {
      contentEl.style.removeProperty("-webkit-line-clamp");
      contentEl.style.removeProperty("overflow");
      contentEl.style.removeProperty("display");
      contentEl.style.removeProperty("-webkit-box-orient");
    }
    return true;
  }

  function updateToggleButton(buttonEl, isExpanded) {
    if (!buttonEl || typeof buttonEl.textContent !== "string") return false;

    const text = buttonEl.textContent;
    if (!text.includes("more") && !text.includes("閉じる")) return false;

    buttonEl.textContent = isExpanded ? "閉じる" : "more";

    const parent = buttonEl.parentElement;
    if (parent && parent.style && typeof parent.style.removeProperty === "function") {
      parent.style.removeProperty("display");
    }

    return true;
  }

  function isMoreLabel(text) {
    if (typeof text !== "string") return false;
    return text.trim().toLowerCase() === "more";
  }

  function isCloseLabel(text) {
    if (typeof text !== "string") return false;
    return text.trim() === "閉じる";
  }

  function shouldAutoClickMore(likeState) {
    return likeState === "unliked";
  }

  function shouldAutoCollapseOnLike(likeState) {
    return likeState === "liked";
  }

  return {
    parseLikeState,
    expandContentElement,
    collapseContentElement,
    updateToggleButton,
    isMoreLabel,
    isCloseLabel,
    shouldAutoClickMore,
    shouldAutoCollapseOnLike
  };
});
