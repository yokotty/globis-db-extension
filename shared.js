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

  function normalizeDisplayName(name) {
    if (typeof name !== "string") return "";
    return name.replace(/\s+/g, " ").trim();
  }

  function isOwnPost(authorName, currentUserName) {
    const normalizedAuthor = normalizeDisplayName(authorName);
    const normalizedCurrentUser = normalizeDisplayName(currentUserName);
    return normalizedAuthor.length > 0 && normalizedAuthor === normalizedCurrentUser;
  }

  function shouldAutoExpandPost(likeState, authorName, currentUserName) {
    return shouldAutoClickMore(likeState) && !isOwnPost(authorName, currentUserName);
  }

  function shouldTriggerMoreClick(likeState, labelText) {
    return shouldAutoClickMore(likeState) && isMoreLabel(labelText);
  }

  function shouldTriggerCloseClick(likeState, labelText) {
    return shouldAutoCollapseOnLike(likeState) && isCloseLabel(labelText);
  }

  return {
    parseLikeState,
    isMoreLabel,
    isCloseLabel,
    shouldAutoClickMore,
    shouldAutoCollapseOnLike,
    normalizeDisplayName,
    isOwnPost,
    shouldAutoExpandPost,
    shouldTriggerMoreClick,
    shouldTriggerCloseClick
  };
});
