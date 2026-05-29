/* Auto-scale a .slide (1920×1080) to fit its viewport,
   preserving aspect ratio with letterboxing on black. */
(function () {
  function fit() {
    const slide = document.querySelector('.slide');
    if (!slide) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / 1920, vh / 1080);
    slide.style.transform = `scale(${s})`;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  fit();
})();
