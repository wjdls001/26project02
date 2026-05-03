document.addEventListener("DOMContentLoaded", () => {
  const hideHeaderPeekImmediate = initHeaderPeek();
  initMobileDrawer();
  initFullpageOrStatic(hideHeaderPeekImmediate);
  initPetIntroScrollProgress();
});

function initMobileDrawer() {
  const drawer = document.getElementById("site-drawer");
  const toggle = document.getElementById("mobile-menu-toggle");

  if (!drawer || !toggle) return;

  const backdrop = drawer.querySelector(".site-drawer__backdrop");
  const closeBtn = drawer.querySelector(".site-drawer__close");
  const navLinks = drawer.querySelectorAll(".site-drawer__nav a");
  const drawerLangLinks = drawer.querySelectorAll(".site-drawer__lang a");

  function syncClosedState(drawerShut) {
    if (drawerShut) {
      drawer.setAttribute("inert", "");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "메뉴 열기");
    } else {
      drawer.removeAttribute("inert");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "메뉴 닫기");
    }
    drawer.setAttribute("aria-hidden", drawerShut ? "true" : "false");
  }

  /** @param {KeyboardEvent} e */
  function onDocumentEscape(e) {
    if (e.key === "Escape") {
      closeDrawer();
    }
  }

  function closeDrawer() {
    if (!drawer.classList.contains("site-drawer--open")) return;

    drawer.classList.remove("site-drawer--open");
    syncClosedState(true);
    document.body.classList.remove("site-drawer-open");
    document.removeEventListener("keydown", onDocumentEscape);

    requestAnimationFrame(() => {
      if (toggle.isConnected) toggle.focus();
    });
  }

  function openDrawer() {
    if (drawer.classList.contains("site-drawer--open")) return;

    drawer.classList.add("site-drawer--open");
    syncClosedState(false);
    document.body.classList.add("site-drawer-open");
    document.addEventListener("keydown", onDocumentEscape);

    requestAnimationFrame(() => {
      closeBtn?.focus();
    });
  }

  toggle.addEventListener("click", () => {
    if (drawer.classList.contains("site-drawer--open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  closeBtn?.addEventListener("click", () => closeDrawer());

  backdrop?.addEventListener("click", () => closeDrawer());

  [...navLinks, ...drawerLangLinks].forEach((el) => {
    el.addEventListener("click", () => closeDrawer());
  });
}

/** 상단 패널: 데스크톱에서 스크롤 시 peek 해제 훅 (fullpage / wheel / scroll 공용) */
function initHeaderPeek() {
  const header = document.querySelector(".site-header");
  const stack = header?.querySelector(".site-header-hover-stack");
  if (!header || !stack) return undefined;

  const mqPeekBar = window.matchMedia(
    "(min-width: 700px) and (hover: hover)"
  );
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  let leaveTimer = 0;

  function isPeekDesktop() {
    return mqPeekBar.matches && !mqReduce.matches;
  }

  function clearPeekLeave() {
    if (leaveTimer) {
      window.clearTimeout(leaveTimer);
      leaveTimer = 0;
    }
  }

  function isFirstSection() {
    return document.body.dataset.fpAnchor === "s1";
  }

  function hideHeaderPeekImmediate() {
    if (isFirstSection()) return;
    clearPeekLeave();
    header.classList.remove("site-header--peek");
  }

  function schedulePeekHide() {
    if (isFirstSection()) return;
    clearPeekLeave();
    leaveTimer = window.setTimeout(() => {
      hideHeaderPeekImmediate();
      leaveTimer = 0;
    }, 260);
  }

  function showHeaderPeek() {
    if (!isPeekDesktop()) return;
    clearPeekLeave();
    header.classList.add("site-header--peek");
  }

  stack.addEventListener("mouseenter", showHeaderPeek);
  stack.addEventListener("mouseleave", () => {
    if (!isPeekDesktop() || isFirstSection()) return;
    schedulePeekHide();
  });

  window.addEventListener("scroll", hideHeaderPeekImmediate, { passive: true });
  window.addEventListener("wheel", hideHeaderPeekImmediate, {
    passive: true,
    capture: true,
  });

  mqPeekBar.addEventListener("change", hideHeaderPeekImmediate);

  return hideHeaderPeekImmediate;
}

/** 펫팜 소개(4섹션): 스크롤 진행에 따라 메인 이미지 확대 (--pet-intro-progress) */
function initPetIntroScrollProgress() {
  const section = document.querySelector(".section--pet-intro");
  if (!section) return;

  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let overflowScrollBound = false;

  function applyProgress(p) {
    if (mqReduce.matches) {
      section.style.setProperty("--pet-intro-progress", "1");
      return;
    }
    section.style.setProperty(
      "--pet-intro-progress",
      String(Math.min(1, Math.max(0, p)))
    );
  }

  function updateFromScroller(scroller) {
    const range = scroller.scrollHeight - scroller.clientHeight;
    const p = range <= 0 ? 1 : scroller.scrollTop / range;
    applyProgress(p);
  }

  function updateFromWindow() {
    const track = section.querySelector(".pet-intro__track");
    if (!track) return;
    const topAbs = track.getBoundingClientRect().top + window.scrollY;
    const range = Math.max(1, track.offsetHeight - window.innerHeight);
    const p = (window.scrollY - topAbs) / range;
    applyProgress(p);
  }

  function findOverflowScroller() {
    const track = section.querySelector(".pet-intro__track");
    if (!track) return null;
    return track.closest(".fp-overflow");
  }

  function bindOverflowOnce() {
    if (overflowScrollBound) return;
    const scroller = findOverflowScroller();
    if (!scroller || scroller.scrollHeight <= scroller.clientHeight + 2) return;
    overflowScrollBound = true;
    scroller.addEventListener(
      "scroll",
      () => updateFromScroller(scroller),
      { passive: true }
    );
    updateFromScroller(scroller);
  }

  function tick() {
    if (mqReduce.matches) {
      applyProgress(1);
      return;
    }
    if (
      document.body.classList.contains("fullpage-responsive") ||
      document.body.classList.contains("fullpage-static")
    ) {
      updateFromWindow();
      return;
    }
    const scroller = findOverflowScroller();
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
      updateFromScroller(scroller);
    } else {
      applyProgress(0);
    }
  }

  window.addEventListener("scroll", tick, { passive: true });
  mqReduce.addEventListener("change", tick);

  /** fullpage가 오버플로우 래퍼를 붙인 뒤 갱신 */
  function retryBind() {
    bindOverflowOnce();
    tick();
  }

  requestAnimationFrame(retryBind);
  setTimeout(retryBind, 80);
  setTimeout(retryBind, 400);

  document.body.addEventListener("fpAfterLoad", retryBind);
  document.body.addEventListener("fpAfterResize", retryBind);

  queueMicrotask(retryBind);
}

/** @param {undefined | (() => void)} onAfterFpTransition */
function initFullpageOrStatic(onAfterFpTransition) {
  if (typeof fullpage !== "function") {
    document.body.classList.add("fullpage-static");
    return;
  }

  new fullpage("#fullpage", {
    licenseKey: "OPEN-SOURCE-GPLv3-License",
    navigation: true,
    navigationPosition: "right",
    scrollBar: false,
    scrollOverflow: true,
    scrollOverflowMacStyle: true,
    anchors: ["s1", "s2", "s3", "s4", "footer"],
    fixedElements: ".site-header",
    responsiveWidth: 768,
    afterResponsive(isResponsive) {
      document.body.classList.toggle("fullpage-responsive", !!isResponsive);
    },
    afterLoad(origin, destination) {
      onAfterFpTransition?.();
      if (
        destination &&
        destination.anchor !== undefined &&
        destination.anchor !== null
      ) {
        document.body.dataset.fpAnchor = String(destination.anchor);
      }
      document.body.dispatchEvent(
        new CustomEvent("fpAfterLoad", { bubbles: true })
      );
      requestAnimationFrame(() => {
        document.body.dispatchEvent(
          new CustomEvent("fpAfterResize", { bubbles: true })
        );
      });
    },
    afterResize() {
      document.body.dispatchEvent(
        new CustomEvent("fpAfterResize", { bubbles: true })
      );
    },
  });
}
