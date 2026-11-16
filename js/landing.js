/* ========================================
   LUDENS STUDIO — LANDING (scroll + hover)
   Butuh: THREE, gsap, ScrollTrigger, Lenis
======================================== */

(() => {
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) {
        console.warn("Landing: library belum termuat.");
        return;
    }

    /* ---------- PENGATURAN ---------- */
    const CONFIG = {
        fadeBgOnScroll: true,   // true = logo Sadrajya menghilang saat scroll; false = tetap di belakang papan
        autoSpin: 0.35          // kecepatan putar otomatis papan
    };

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- Smooth scroll ---------- */
    let scrollVel = 0;
    if (!reduce && window.Lenis) {
        const lenis = new Lenis({ lerp: 0.1 });
        lenis.on("scroll", (e) => { ScrollTrigger.update(); scrollVel = e.velocity; });
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    /* ---------- Scene ---------- */
    const canvas = document.getElementById("board");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(4, 8, 6);
    scene.add(sun);

    /* ---------- Papan sementara (ganti dengan model GLB nanti) ---------- */
    const tex = document.createElement("canvas");
    tex.width = tex.height = 512;
    const g = tex.getContext("2d");
    g.fillStyle = "#F4EFE6"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#E66B3E"; g.lineWidth = 14; g.strokeRect(16, 16, 480, 480);
    g.fillStyle = "#E66B3E";
    for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
            if ((i + j) % 2 === 0) g.fillRect(48 + i * 52, 48 + j * 52, 52, 52);

    const board = new THREE.Group();
    const side = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const top = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(tex) });
    board.add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.35, 5), [side, side, top, side, side, side]));

    const pawnColors = [0xE66B3E, 0x111111, 0xE66B3E, 0x111111];
    [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([x, z], i) => {
        const m = new THREE.MeshStandardMaterial({ color: pawnColors[i] });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.7, 24), m);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), m);
        body.position.set(x, 0.52, z);
        head.position.set(x, 1.0, z);
        board.add(body, head);
    });
    scene.add(board);

    /* ---------- Ukuran ---------- */
    function resize() {
        const w = innerWidth, h = innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = camera.aspect < 1 ? 50 : 35;
        camera.updateProjectionMatrix();
    }
    addEventListener("resize", resize);
    resize();

    /* ---------- State yang digerakkan scroll & hover ---------- */
    const state = { spin: 0, x: 0, y: 0 };
    const hover = { k: 0 };

    /* ---------- Timeline scroll: 4 bab ---------- */
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 769px)", mob: "(max-width: 768px)" }, (ctx) => {
        const desk = ctx.conditions.desk;
        const ch = gsap.utils.toArray(".chapter");
        const X = desk ? 2.3 : 0;       // papan bergeser ke kanan di desktop
        const Y = desk ? 0 : -1.6;      // di mobile papan turun, teks di atas

        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: { trigger: ".scroll", start: "top top", end: "bottom bottom", scrub: 1 }
        });

        tl  /* bab 1 -> 2 */
            .to(camera.position, { z: desk ? 6.5 : 9, duration: 1 }, 0)
            .to(state, { spin: Math.PI, duration: 1 }, 0)
            .to(ch[0], { autoAlpha: 0, y: -40, duration: 0.35 }, 0.55)
            .to(state, { x: X, y: Y, duration: 0.8 }, 0.7)
            .fromTo(ch[1], { y: 40 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 1)
            /* bab 2 -> 3 */
            .to(camera.position, { z: desk ? 5 : 8, duration: 1 }, 1.2)
            .to(state, { spin: Math.PI * 2, duration: 1 }, 1.2)
            .to(ch[1], { autoAlpha: 0, y: -40, duration: 0.35 }, 1.9)
            .fromTo(ch[2], { y: 40 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 2.2)
            /* bab 3 -> 4 */
            .to(camera.position, { z: desk ? 9 : 10.5, duration: 1 }, 2.4)
            .to(state, { spin: Math.PI * 3, duration: 1 }, 2.4)
            .to(ch[2], { autoAlpha: 0, y: -40, duration: 0.35 }, 3.0)
            .fromTo(ch[3], { y: 40 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 3.3)
            .to(camera.position, { z: desk ? 7.5 : 10, duration: 0.6 }, 3.4);

        if (CONFIG.fadeBgOnScroll) {
            tl.to(".bg", { opacity: 0, y: -60, ease: "none", duration: 0.8 }, 0.2);
        }
    });

    /* ---------- Intro setelah preloader selesai ---------- */
    const introTargets = ".navbar > *, .ch-hero > *";
    if (!reduce) {
        gsap.set(introTargets, { opacity: 0, y: 24 });
        board.scale.set(0.6, 0.6, 0.6);
    }
    function intro() {
        if (reduce) return;
        gsap.to(introTargets, { opacity: (i, el) => (el.classList.contains("hint") ? 0.7 : 1), y: 0,
                                duration: 0.9, stagger: 0.08, ease: "power3.out" });
        gsap.to(board.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "power3.out" });
    }
    const loader = document.getElementById("preloader");
    if (loader && !loader.classList.contains("loaded")) {
        window.addEventListener("ludens:loaded", intro, { once: true });
    } else {
        intro();
    }

    /* ---------- Hover ---------- */
    const mouse = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
    addEventListener("pointermove", (e) => {
        mouse.x = (e.clientX / innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / innerHeight - 0.5) * 2;
    });

    // hover pada proyek dan tombol: papan berputar lebih cepat dan sedikit membesar
    document.querySelectorAll(".work, .cta, .navbar-cta").forEach((el) => {
        el.addEventListener("pointerenter", () => gsap.to(hover, { k: 1, duration: 0.6, ease: "power2.out" }));
        el.addEventListener("pointerleave", () => gsap.to(hover, { k: 0, duration: 0.8, ease: "power2.out" }));
    });

    /* ---------- Loop ---------- */
    const clock = new THREE.Clock();
    let auto = 0;
    renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        tilt.x += (mouse.y * 0.25 - tilt.x) * 0.06;
        tilt.y += (mouse.x * 0.35 - tilt.y) * 0.06;

        auto += (reduce ? 0 : dt * (CONFIG.autoSpin + hover.k * 1.2)) + scrollVel * 0.0015;
        scrollVel *= 0.9;

        board.rotation.set(0.55 + tilt.x, auto + state.spin, 0);
        board.position.set(state.x + tilt.y * 0.6, state.y, 0);
        const s = 1 + hover.k * 0.08;
        if (board.scale.x >= 0.99) board.scale.set(s, s, s);   // tidak menimpa animasi intro

        renderer.render(scene, camera);
    });
})();
