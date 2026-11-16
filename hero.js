/* ========================================
   LUDENS STUDIO — HERO (papan 3D + scroll + hover)
   Butuh: THREE, gsap, ScrollTrigger, Lenis (dimuat di index.html)
======================================== */

(() => {
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) {
        console.warn("Hero: library belum termuat.");
        return;
    }

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
    board.rotation.x = 0.55;
    scene.add(board);

    /* ---------- Ukuran ---------- */
    function resize() {
        const w = innerWidth, h = innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = camera.aspect < 1 ? 50 : 35;   // layar potret butuh sudut lebih lebar
        camera.updateProjectionMatrix();
    }
    addEventListener("resize", resize);
    resize();

    /* ---------- Scroll: zoom in lalu zoom out, logo latar memudar ---------- */
    if (!reduce) {
        gsap.timeline({
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1 }
        })
        .to(camera.position, { z: 5.2, ease: "power2.inOut", duration: 1 })
        .to(camera.position, { z: 11,  ease: "power2.inOut", duration: 1 });

        gsap.to(".hero-bg", {
            opacity: 0, y: -80, ease: "none",
            scrollTrigger: { trigger: ".hero", start: "top top", end: "+=60%", scrub: true }
        });

        gsap.to(".hero-bottom", {
            opacity: 0, ease: "none",
            scrollTrigger: { trigger: ".hero", start: "top top", end: "+=15%", scrub: true }
        });
    }

    /* ---------- Intro: jalan setelah preloader selesai ---------- */
    if (!reduce) {
        gsap.set(".navbar > *", { opacity: 0, y: -24 });
        board.scale.set(0.6, 0.6, 0.6);
    }
    function intro() {
        if (reduce) return;
        gsap.to(".navbar > *", { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" });
        gsap.to(board.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "power3.out" });
    }
    const loader = document.getElementById("preloader");
    if (loader && !loader.classList.contains("loaded")) {
        window.addEventListener("ludens:loaded", intro, { once: true });
    } else {
        intro();
    }

    /* ---------- Hover: papan mengikuti kursor ---------- */
    const mouse = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
    addEventListener("pointermove", (e) => {
        mouse.x = (e.clientX / innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / innerHeight - 0.5) * 2;
    });

    /* ---------- Hemat performa: berhenti render saat hero tidak terlihat ---------- */
    let active = true;
    ScrollTrigger.create({
        trigger: ".hero", start: "top top", end: "bottom top",
        onToggle: (self) => { active = self.isActive; canvas.style.visibility = active ? "visible" : "hidden"; }
    });

    /* ---------- Loop ---------- */
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        if (!active) return;
        tilt.x += (mouse.y * 0.25 - tilt.x) * 0.06;
        tilt.y += (mouse.x * 0.35 - tilt.y) * 0.06;
        board.rotation.y += (reduce ? 0 : dt * 0.35) + scrollVel * 0.0015;
        board.rotation.x = 0.55 + tilt.x;
        board.position.x = tilt.y * 0.6;
        scrollVel *= 0.9;
        renderer.render(scene, camera);
    });
})();
