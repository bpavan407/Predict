import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Futuristic hero: a slowly rotating wireframe house wrapped in a drifting
 * particle field. Pure Three.js, no external assets.
 */
export default function HouseScene({ height = 240 }: { height?: number }) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const w = el.clientWidth;
    const h = height;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // ---- wireframe house (box + prism roof) ----
    const ice = new THREE.Color("#5fe3ff");
    const violet = new THREE.Color("#a98bff");

    const bodyGeo = new THREE.BoxGeometry(2.4, 1.6, 2);
    const body = new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo),
      new THREE.LineBasicMaterial({ color: ice, transparent: true, opacity: 0.9 })
    );
    body.position.y = -0.2;
    group.add(body);

    // roof: triangular prism via custom geometry
    const roofShape = new THREE.BufferGeometry();
    const y0 = 0.6, apex = 1.5, hx = 1.25, hz = 1.05;
    const v = [
      [-hx, y0, hz], [hx, y0, hz], [0, apex, hz],   // front tri
      [-hx, y0, -hz], [hx, y0, -hz], [0, apex, -hz], // back tri
    ];
    const edges: number[] = [];
    const seg = (a: number[], b: number[]) => edges.push(...a, ...b);
    seg(v[0], v[1]); seg(v[1], v[2]); seg(v[2], v[0]);
    seg(v[3], v[4]); seg(v[4], v[5]); seg(v[5], v[3]);
    seg(v[0], v[3]); seg(v[1], v[4]); seg(v[2], v[5]);
    roofShape.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
    const roof = new THREE.LineSegments(
      roofShape,
      new THREE.LineBasicMaterial({ color: violet, transparent: true, opacity: 0.95 })
    );
    roof.position.y = -0.2;
    group.add(roof);

    // door + windows as small glowing quads
    const glow = new THREE.MeshBasicMaterial({ color: ice, transparent: true, opacity: 0.5 });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.55 }));
    door.position.set(0, -0.65, 1.001);
    group.add(door);
    for (const dx of [-0.7, 0.7]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glow);
      win.position.set(dx, -0.1, 1.001);
      group.add(win);
    }

    // ---- particle field ----
    const COUNT = 260;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: new THREE.Color("#8fb6ff"), size: 0.04, transparent: true, opacity: 0.7 })
    );
    scene.add(particles);

    // ---- animate ----
    let raf = 0;
    let t = 0;
    const render = () => {
      t += 0.01;
      group.rotation.y = t * 0.5;
      group.rotation.x = Math.sin(t * 0.4) * 0.08;
      particles.rotation.y = t * 0.05;
      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(render);
    };
    render();

    const onResize = () => {
      const nw = el.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      bodyGeo.dispose();
      roofShape.dispose();
      pGeo.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [height]);

  return <div ref={mount} style={{ width: "100%", height }} aria-hidden="true" />;
}
