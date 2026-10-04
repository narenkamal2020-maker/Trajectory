import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/platform';

/** Three.js hero: planet, orbit rings, a satellite on a rising trajectory, and a starfield. */
export function OrbitScene({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('three');
      const el = host.current;
      if (!el || disposed) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        return; // No WebGL: the CSS gradient behind the canvas remains.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
      camera.position.set(0, 2.2, 11);

      const gold = new THREE.Color('#ffd371');
      const amber = new THREE.Color('#edb40b');

      // Planet with a fresnel-style rim glow.
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(2, 64, 64),
        new THREE.ShaderMaterial({
          uniforms: { cA: { value: new THREE.Color('#1d1f2a') }, cB: { value: amber } },
          vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix*mv; }`,
          fragmentShader: `uniform vec3 cA; uniform vec3 cB; varying vec3 vN; varying vec3 vP;
            void main(){ float rim = pow(1.0 - max(dot(normalize(-vP), vN), 0.0), 2.4);
              float band = 0.5 + 0.5*sin(vN.y*18.0);
              vec3 col = mix(cA, cA*1.4, band*0.25) + cB*rim*1.3; gl_FragColor = vec4(col, 1.0); }`,
        })
      );
      scene.add(planet);

      // Atmosphere halo.
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(2.35, 48, 48),
        new THREE.ShaderMaterial({
          transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { c: { value: gold } },
          vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
          fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.65 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c, clamp(i,0.0,1.0)*0.9); }`,
        })
      );
      scene.add(halo);

      // Orbit rings.
      const rings = new THREE.Group();
      [3.2, 4.3, 5.6].forEach((r, i) => {
        const pts = new THREE.EllipseCurve(0, 0, r, r * 0.92, 0, Math.PI * 2).getPoints(160).map((p) => new THREE.Vector3(p.x, 0, p.y));
        const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineDashedMaterial({ color: gold, transparent: true, opacity: 0.35 - i * 0.08, dashSize: 0.18, gapSize: 0.12 }));
        line.computeLineDistances();
        rings.add(line);
      });
      rings.rotation.x = 0.35;
      rings.rotation.z = -0.18;
      scene.add(rings);

      // Trajectory: a spiral that climbs outward — the "path to your target role".
      const trajPts: import('three').Vector3[] = [];
      for (let i = 0; i <= 240; i++) {
        const t = i / 240, a = t * Math.PI * 3.2, r = 2.8 + t * 3.6;
        trajPts.push(new THREE.Vector3(Math.cos(a) * r, -1.2 + t * 3.4, Math.sin(a) * r * 0.9));
      }
      const traj = new THREE.CatmullRomCurve3(trajPts);
      const trajLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(traj.getPoints(400)),
        new THREE.LineBasicMaterial({ color: amber, transparent: true, opacity: 0.25 }));
      scene.add(trajLine);

      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), new THREE.MeshBasicMaterial({ color: gold }));
      // Soft round glow: a radial-gradient texture (an untextured sprite renders as a square).
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = glowCanvas.height = 64;
      const g2d = glowCanvas.getContext('2d')!;
      const grad = g2d.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,211,113,1)');
      grad.addColorStop(0.35, 'rgba(255,211,113,0.35)');
      grad.addColorStop(1, 'rgba(255,211,113,0)');
      g2d.fillStyle = grad;
      g2d.fillRect(0, 0, 64, 64);
      const glowTex = new THREE.CanvasTexture(glowCanvas);
      const satGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      satGlow.scale.set(0.7, 0.7, 0.7);
      sat.add(satGlow);
      scene.add(sat);

      // Fading trail behind the satellite.
      const TRAIL = 60;
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
      const trailColors = new Float32Array(TRAIL * 3);
      for (let i = 0; i < TRAIL; i++) { const f = i / TRAIL; trailColors.set([gold.r * f, gold.g * f, gold.b * f], i * 3); }
      trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
      const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending }));
      scene.add(trail);

      // Starfield.
      const starCount = 1400;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 30 + Math.random() * 60, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        starPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#e1e1f1', size: 0.12, transparent: true, opacity: 0.7 }));
      scene.add(stars);

      const resize = () => {
        const w = el.clientWidth || 1, h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        camera.aspect = w / h;
        camera.position.z = w < 640 ? 15 : 11;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const mouse = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; };
      window.addEventListener('pointermove', onMove);

      const history: import('three').Vector3[] = [];
      let t = 0.15, raf = 0, visible = true;
      const reduced = prefersReducedMotion();

      const frame = () => {
        t = (t + 0.0012) % 1;
        const p = traj.getPointAt(t);
        sat.position.copy(p);
        history.push(p.clone());
        if (history.length > TRAIL) history.shift();
        const arr = trailGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < TRAIL; i++) { const h = history[Math.max(0, i - (TRAIL - history.length))] ?? p; arr.set([h.x, h.y, h.z], i * 3); }
        trailGeo.attributes.position.needsUpdate = true;

        planet.rotation.y += 0.0015;
        rings.rotation.y += 0.0008;
        stars.rotation.y += 0.0002;
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
        camera.position.y += (2.2 - mouse.y * 0.8 - camera.position.y) * 0.03;
        camera.lookAt(0, 0.3, 0);
        renderer.render(scene, camera);
      };

      if (reduced) {
        for (let i = 0; i < TRAIL; i++) frame(); // build a trail, then hold still
      } else {
        const loop = () => { if (visible) frame(); raf = requestAnimationFrame(loop); };
        loop();
      }
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(el);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener('pointermove', onMove);
        scene.traverse((o) => {
          const m = o as import('three').Mesh;
          m.geometry?.dispose();
          const mat = m.material as import('three').Material | import('three').Material[] | undefined;
          (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
        });
        glowTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, []);

  return <div ref={host} className={className} />;
}
