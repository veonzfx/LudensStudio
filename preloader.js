/* ========================================
   LUDENS STUDIO — PRELOADER SCRIPT
======================================== */

document.body.classList.add("loading");

const preloader = document.getElementById("preloader");

const minimumLoadingTime = 1800;
const loadingStartTime = performance.now();

function finishLoading() {

    const elapsedTime = performance.now() - loadingStartTime;
    const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

    setTimeout(() => {

        preloader.classList.add("loaded");
        document.body.classList.remove("loading");

        /* beri tahu script lain (hero.js) bahwa loading selesai */
        window.dispatchEvent(new Event("ludens:loaded"));

    }, remainingTime);
}

if (document.readyState === "complete") {
    finishLoading();
} else {
    window.addEventListener("load", finishLoading, { once: true });
}
