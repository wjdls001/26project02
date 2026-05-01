document.addEventListener("DOMContentLoaded", () => {
  /* fullPage.js v4 브라우저 전역 생성자 */
  if (typeof fullpage !== "function") {
    document.body.classList.add("fullpage-static");
    return;
  }

  new fullpage("#fullpage", {
    licenseKey: "OPEN-SOURCE-GPLv3-License",
    navigation: true,
    navigationPosition: "right",
    scrollBar: false,
    anchors: ["s1", "s2", "s3", "s4", "footer"],
    fixedElements: ".site-header",
    responsiveWidth: 768,
    afterResponsive(isResponsive) {
      document.body.classList.toggle("fullpage-responsive", !!isResponsive);
    },
    afterLoad(origin, destination) {
      if (
        destination &&
        destination.anchor !== undefined &&
        destination.anchor !== null
      ) {
        document.body.dataset.fpAnchor = String(destination.anchor);
      }
    },
  });
});
