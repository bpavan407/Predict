import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

/**
 * Full-viewport Three.js ambient scene for the landing:
 *  - an infinite synthwave grid receding to the horizon
 *  - a slow-drifting field of translucent house wireframes at varying depths
 *  - a starfield, depth fog, and subtle mouse parallax
 *  - a GSAP camera fly-in on mount
 */
export default function LandingBackground() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07080f, 0.055);

    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 120);
    camera.position.set(0, 2.2, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const ICE = new THREE.Color("#5fe3ff");
    const VIOLET = new THREE.Color("#a98bff");
    const PINK = new THREE.Color("#ff8fd0");

    /* ---- synthwave grid floor (two grids for seamless scroll) ---- */
    const gridGroup = new THREE.Group();
    const mkGrid = () => {
      const g = new THREE.GridHelper(60, 60, VIOLET, 0x243056);
      (g.material as THREE.Material).transparent = true;
      (g.material as THREE.Material).opacity = 0.28;
      g.position.y = -2.4;
      return g;
    };
    const gA = mkGrid();
    const gB = mkGrid();
    gB.position.z = -60;
    gridGroup.add(gA, gB);
    scene.add(gridGroup);

    /* ---- house wireframe factory ---- */
    const bodyEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, 1, 1.2));
    function makeRoof() {
      const geo = new THREE.BufferGeometry();
      const y0 = 0.5, apex = 1.15, hx = 0.75, hz = 0.65;
      const v = [
        [-hx, y0, hz], [hx, y0, hz], [0, apex, hz],
        [-hx, y0, -hz], [hx, y0, -hz], [0, apex, -hz],
      ];
      const e: number[] = [];
      const s = (a: number[], b: number[]) => e.push(...a, ...b);
      s(v[0], v[1]); s(v[1], v[2]); s(v[2], v[0]);
      s(v[3], v[4]); s(v[4], v[5]); s(v[5], v[3]);
      s(v[0], v[3]); s(v[1], v[4]); s(v[2], v[5]);
      geo.setAttribute("position", new THREE.Float32BufferAttribute(e, 3));
      return geo;
    }
    const roofGeo = makeRoof();

    interface Floater { g: THREE.Group; rot: number; bob: number; phase: number; }
    const houses: Floater[] = [];
    const COUNT = 14;
    for (let i = 0; i < COUNT; i++) {
      const g = new THREE.Group();
      const col = [ICE, VIOLET, PINK][i % 3];
      const bodyMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
      const roofMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
      g.add(new THREE.LineSegments(bodyEdges, bodyMat));
      g.add(new THREE.LineSegments(roofGeo, roofMat));
      const s = 0.6 + Math.random() * 1.3;
      g.scale.setScalar(s);
      g.position.set(
        (Math.random() - 0.5) * 26,
        Math.random() * 7 - 1,
        -Math.random() * 55 - 3
      );
      g.rotation.y = Math.random() * Math.PI;
      scene.add(g);
      houses.push({ g, rot: (Math.random() - 0.5) * 0.4, bob: 0.2 + Math.random() * 0.3, phase: Math.random() * 6 });
    }

    /* ---- starfield ---- */
    const starN = 380;
    const sp = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 90;
      sp[i * 3 + 1] = Math.random() * 30 - 4;
      sp[i * 3 + 2] = -Math.random() * 90;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x9fc0ff, size: 0.09, transparent: true, opacity: 0.75, fog: false })
    );
    scene.add(stars);

    /* ---- mouse parallax ---- */
    const target = { x: 0, y: 2.2 };
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / innerWidth - 0.5);
      const ny = (e.clientY / innerHeight - 0.5);
      target.x = nx * 2.2;
      target.y = 2.2 - ny * 1.2;
    };
    window.addEventListener("pointermove", onMove);

    /* ---- GSAP intro fly-in ---- */
    gsap.fromTo(camera.position, { z: 20 }, { z: 12, duration: 1.6, ease: "power3.out" });
    gsap.fromTo(scene.fog, { density: 0.12 }, { density: 0.055, duration: 1.8, ease: "power2.out" });

    let raf = 0, t = 0;
    const render = () => {
      t += 0.016;
      // scroll grids toward camera, wrap
      for (const g of [gA, gB]) {
        g.position.z += 0.12;
        if (g.position.z > 60) g.position.z -= 120;
      }
      // drift houses toward camera, recycle when passed
      for (const h of houses) {
        h.g.position.z += 0.05;
        h.g.rotation.y += h.rot * 0.01;
        h.g.position.y += Math.sin(t + h.phase) * 0.0016 * h.bob * 10;
        if (h.g.position.z > 10) {
          h.g.position.z = -60;
          h.g.position.x = (Math.random() - 0.5) * 26;
          h.g.position.y = Math.random() * 7 - 1;
        }
      }
      stars.rotation.y += 0.0004;
      // ease camera to parallax target
      camera.position.x += (target.x - camera.position.x) * 0.04;
      camera.position.y += (target.y - camera.position.y) * 0.04;
      camera.lookAt(0, 1.4, -6);
      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(render);
    };
    render();

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      renderer.dispose();
      bodyEdges.dispose();
      roofGeo.dispose();
      starGeo.dispose();
      scene.traverse((o) => {
        const any = o as unknown as { material?: THREE.Material };
        if (any.material) any.material.dispose();
      });
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="landing-bg" aria-hidden="true" />;
}
