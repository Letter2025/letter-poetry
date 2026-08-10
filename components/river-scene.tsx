"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type * as THREE from "three";

// [LETTER-POETRY-PLAN-013] 诗河：四万七千余首真实诗作化作河灯，沿朝代之河从《诗经》源头流向明清。
// 全部自研（three.js MIT），仅借鉴诗云「星图漫游」交互概念，不引入其源码/字库/数据。

type RiverPoem = { id: string; t: string; a: string; c: string };

// 选集 → 朝代（时间排序 9 段；千家诗为宋明蒙学选本，归入明段以保证 9 段都有灯）
const COLLECTION_DYNASTY: Record<string, string> = {
  shijing: "先秦", chuci: "战国", caocao: "汉末",
  quantangshi: "唐", tangshi300: "唐", shuimo: "唐",
  huajianji: "五代", nantang: "五代",
  songci300: "宋", qianjiashi: "明",
  yuanqu: "元",
  nalan: "清", qingyan: "清",
};

const DYNASTIES = ["先秦", "战国", "汉末", "唐", "五代", "宋", "元", "明", "清"] as const;

// 河灯/航标配色：基于 Letter 设计令牌色板（blue/cyan/orange + 中性色）的朝代可视化色
const DYNASTY_COLOR: Record<string, string> = {
  先秦: "#45c4b0", 战国: "#168d96", 汉末: "#175cd3",
  唐: "#ffd9a0", 五代: "#ffad68", 宋: "#78a9ff",
  元: "#c65d22", 明: "#b9c3d4", 清: "#e6edf3",
};

// 河道：XZ 平面一条蜿蜒曲线（先秦在左源，明清在右海）
const CURVE_POINTS: Array<[number, number, number]> = [
  [-240, 0, 0], [-180, 0, 44], [-120, 0, -34], [-60, 0, 48],
  [0, 0, -16], [60, 0, 42], [120, 0, -38], [180, 0, 30], [240, 0, 0],
];

// 确定性哈希（FNV-1a），同一首诗的灯位永远不变
function hash01(str: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function dynastyOf(collection: string): string {
  return COLLECTION_DYNASTY[collection] ?? "唐";
}

interface Engine {
  flyToT(t: number, dist?: number): void;
  flyTo(x: number, y: number, z: number, dist?: number): void;
  poemPoint(id: string): { x: number; y: number; z: number } | null;
  randomPoem(): RiverPoem | null;
  pick(clientX: number, clientY: number): RiverPoem | null;
  dispose(): void;
}

export default function RiverScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [dynastyCounts, setDynastyCounts] = useState<Record<string, number>>({});
  const [hovered, setHovered] = useState<RiverPoem | null>(null);
  const [selected, setSelected] = useState<RiverPoem | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let engine: Engine | null = null;

    (async () => {
      let poems: RiverPoem[];
      try {
        const res = await fetch("/data/river.json");
        if (!res.ok) throw new Error("river.json 加载失败: HTTP " + res.status);
        poems = (await res.json()) as RiverPoem[];
      } catch (e) {
        if (!disposed) { setStatus("error"); setErrorMsg(e instanceof Error ? e.message : String(e)); }
        return;
      }
      if (disposed) return;

      const counts: Record<string, number> = {};
      for (const p of poems) {
        const d = dynastyOf(p.c);
        counts[d] = (counts[d] ?? 0) + 1;
      }
      setDynastyCounts(counts);
      setTotal(poems.length);

      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch {
        if (!disposed) { setStatus("error"); setErrorMsg("当前环境不支持 WebGL，诗河需要 3D 渲染支持。"); }
        return;
      }
      if (disposed) { renderer.dispose(); return; }

      const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x080d14);

      const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 3000);
      camera.position.set(-210, 130, 90);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !reduced;
      controls.dampingFactor = 0.08;
      controls.minDistance = 8;
      controls.maxDistance = 520;
      controls.maxPolarAngle = Math.PI * 0.53;
      controls.target.set(0, 0, 0);

      const curve = new THREE.CatmullRomCurve3(
        CURVE_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
        false, "centripetal", 0.5
      );

      // ---- 河灯（47,629 个 Points）----
      const positions = new Float32Array(poems.length * 3);
      const colors = new Float32Array(poems.length * 3);
      const poemPointMap = new Map<string, THREE.Vector3>();
      const segLen = 1 / DYNASTIES.length;
      const tmpColor = new THREE.Color();
      const dynArr = DYNASTIES as readonly string[];
      for (let i = 0; i < poems.length; i++) {
        const id = poems[i].id;
        const d = dynastyOf(poems[i].c);
        const seg = Math.max(0, dynArr.indexOf(d));
        const t = seg / DYNASTIES.length + hash01(id, 1) * segLen;
        const pt = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const side = (hash01(id, 2) - 0.5) * 3.4;
        const y = (hash01(id, 3) - 0.5) * 0.8 + 0.5;
        const x = pt.x + -tan.z * side;
        const z = pt.z + tan.x * side;
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        tmpColor.set(DYNASTY_COLOR[d] ?? "#e6edf3");
        const bright = 0.55 + 0.5 * hash01(id, 4);
        colors[i * 3] = tmpColor.r * bright; colors[i * 3 + 1] = tmpColor.g * bright; colors[i * 3 + 2] = tmpColor.b * bright;
        poemPointMap.set(id, new THREE.Vector3(x, y, z));
      }

      // 圆光纹理（Canvas 径向渐变）
      const makeGlowTexture = () => {
        const c = document.createElement("canvas");
        c.width = 64; c.height = 64;
        const ctx = c.getContext("2d")!;
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,255,255,0.85)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
      };

      const glowTex = makeGlowTexture();
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.62, map: glowTex, vertexColors: true, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      });
      const points = new THREE.Points(geom, mat);
      scene.add(points);

      // ---- 背景星野 ----
      const bgCount = reduced ? 900 : 2200;
      const bgGeo = new THREE.BufferGeometry();
      const bgPos = new Float32Array(bgCount * 3);
      for (let i = 0; i < bgCount; i++) {
        const r = 500 + hash01("bg" + i, 5) * 900;
        const theta = hash01("bg" + i, 6) * Math.PI * 2;
        const phi = Math.acos(2 * hash01("bg" + i, 7) - 1);
        bgPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        bgPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.35;
        bgPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
      const bgMat = new THREE.PointsMaterial({ size: 0.9, color: 0x9fb4d0, transparent: true, opacity: 0.6, depthWrite: false });
      const bgStars = new THREE.Points(bgGeo, bgMat);
      scene.add(bgStars);

      // ---- 航标（朝代光球 + 文字标签）----
      const makeTextSprite = (text: string, color: string) => {
        const c = document.createElement("canvas");
        const scale = 2;
        const font = '700 30px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
        c.width = 512; c.height = 96;
        const ctx = c.getContext("2d")!;
        ctx.font = font;
        const w = Math.min(480, Math.ceil(ctx.measureText(text).width) + 24);
        c.width = w * scale; c.height = 96 * scale;
        const g2 = c.getContext("2d")!;
        g2.scale(scale, scale);
        g2.font = font;
        g2.textBaseline = "middle";
        g2.shadowColor = "rgba(0,0,0,0.8)";
        g2.shadowBlur = 8;
        g2.fillStyle = color;
        g2.fillText(text, 12, 48);
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        sp.scale.set((w * scale) / 90, (96 * scale) / 90, 1);
        return sp;
      };

      const labels: THREE.Sprite[] = [];
      const glows: THREE.Sprite[] = [];
      for (let i = 0; i < DYNASTIES.length; i++) {
        const d = DYNASTIES[i];
        const t = (i + 0.5) / DYNASTIES.length;
        const pt = curve.getPointAt(t);
        const color = DYNASTY_COLOR[d] ?? "#e6edf3";
        const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.85, depthWrite: false }));
        g.scale.setScalar(7);
        g.position.set(pt.x, 4.2, pt.z);
        scene.add(g); glows.push(g);
        const label = makeTextSprite(d + " · " + (counts[d] ?? 0).toLocaleString(), color);
        label.position.set(pt.x, 8.6 + (i % 2) * 2, pt.z);
        scene.add(label); labels.push(label);
      }

      // ---- 拾取 ----
      const ray = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pick = (clientX: number, clientY: number): RiverPoem | null => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointer.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
        ray.setFromCamera(pointer, camera);
        const hits = ray.intersectObject(points, false);
        if (hits.length && typeof hits[0].index === "number") return poems[hits[0].index] ?? null;
        return null;
      };

      let downX = 0, downY = 0;
      const onDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; };
      const onUp = (e: PointerEvent) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // 拖拽不算点击
        const hit = pick(e.clientX, e.clientY);
        setSelected(hit);
        setHovered(hit);
      };
      let lastHover = 0;
      const onMove = (e: PointerEvent) => {
        const now = Date.now();
        if (now - lastHover < 150) return;
        lastHover = now;
        setHovered(pick(e.clientX, e.clientY));
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointermove", onMove);

      // ---- 飞行 ----
      let flyTarget: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
      const cancelFly = () => { flyTarget = null; };
      controls.addEventListener("start", cancelFly);
      const flyTo = (x: number, y: number, z: number, dist = 64) => {
        const p = new THREE.Vector3(x, y, z);
        const offset = camera.position.clone().sub(controls.target).normalize();
        if (offset.lengthSq() < 0.0001) offset.set(0, 1, 0);
        flyTarget = { pos: p.clone().add(offset.multiplyScalar(dist)), target: p.clone() };
        if (reduced) { camera.position.copy(flyTarget.pos); controls.target.copy(flyTarget.target); controls.update(); }
      };
      const flyToT = (t: number, dist = 90) => {
        const pt = curve.getPointAt(Math.min(1, Math.max(0, t)));
        flyTo(pt.x, pt.y + 8, pt.z, dist);
      };

      const onResize = () => {
        const w = mount.clientWidth, h = mount.clientHeight;
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      renderer.setAnimationLoop(() => {
        if (flyTarget) {
          camera.position.lerp(flyTarget.pos, 0.05);
          controls.target.lerp(flyTarget.target, 0.05);
          if (camera.position.distanceTo(flyTarget.pos) < 0.6) flyTarget = null;
        }
        controls.update();
        renderer.render(scene, camera);
      });

      engine = {
        flyToT,
        flyTo,
        poemPoint: (id) => { const v = poemPointMap.get(id); return v ? { x: v.x, y: v.y, z: v.z } : null; },
        randomPoem: () => poems[Math.floor(Math.random() * poems.length)] ?? null,
        pick,
        dispose: () => {
          renderer.setAnimationLoop(null);
          window.removeEventListener("resize", onResize);
          renderer.domElement.removeEventListener("pointerdown", onDown);
          renderer.domElement.removeEventListener("pointerup", onUp);
          renderer.domElement.removeEventListener("pointermove", onMove);
          controls.removeEventListener("start", cancelFly);
          controls.dispose();
          geom.dispose(); mat.dispose(); glowTex.dispose();
          bgGeo.dispose(); bgMat.dispose();
          for (const l of labels) { l.material.dispose(); l.material.map?.dispose(); }
          for (const g of glows) { g.material.dispose(); g.material.map?.dispose(); }
          renderer.dispose();
          renderer.domElement.remove();
        },
      };
      engineRef.current = engine;
      setStatus("ready");
    })();

    return () => {
      disposed = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  const flyToSegment = (dynasty: string) => {
    const e = engineRef.current; if (!e) return;
    const seg = (DYNASTIES as readonly string[]).indexOf(dynasty);
    if (seg < 0) return;
    e.flyToT((seg + 0.5) / DYNASTIES.length, 90);
  };
  const goStart = () => engineRef.current?.flyToT(0, 90);
  const goEnd = () => engineRef.current?.flyToT(1, 90);
  const goRandom = () => {
    const e = engineRef.current; if (!e) return;
    const p = e.randomPoem(); if (!p) return;
    const pt = e.poemPoint(p.id);
    if (pt) e.flyTo(pt.x, pt.y, pt.z, 46);
    setSelected(p);
    setHovered(p);
  };
  const closeCard = () => setSelected(null);

  const selectedDyn = selected ? dynastyOf(selected.c) : "";
  const selectedNo = selected ? String((DYNASTIES as readonly string[]).indexOf(selectedDyn) + 1).padStart(2, "0") : "";

  return (
    <div className="river-root">
      <div ref={mountRef} className="river-canvas" />
      {status === "loading" && (
        <div className="river-loading">
          <div className="river-loading-inner"><span className="pulse" /> LOADING · 装载 47,000+ 盏河灯…</div>
        </div>
      )}
      {status === "error" && (
        <div className="river-loading">
          <div className="river-card river-card--err">
            <div className="eyebrow"><span className="blue">{"//"}</span> RIVER / 诗河</div>
            <h2>这条河暂时无法流淌</h2>
            <p>{errorMsg}</p>
            <Link className="button" href="/poems">去全部诗文 →</Link>
          </div>
        </div>
      )}
      {status === "ready" && (
        <div className="river-hud">
          <div className="river-top">
            <Link href="/" className="river-brand">
              <span className="river-brand-name">LETTER POETRY</span>
              <span className="river-brand-sub">诗河航图 · RIVER MAP</span>
            </Link>
            <div className="river-ready"><span className="pulse" /> READY · {total.toLocaleString()} 盏河灯</div>
          </div>
          <div className="river-legend">
            {DYNASTIES.map((d, i) => (
              <button key={d} className="river-chip" onClick={() => flyToSegment(d)}>
                <span className="river-dot" style={{ background: DYNASTY_COLOR[d] }} />
                {String(i + 1).padStart(2, "0")} {d} · {(dynastyCounts[d] ?? 0).toLocaleString()}
              </button>
            ))}
          </div>
          <div className="river-controls">
            <button className="river-btn" onClick={goStart}>逆流溯源</button>
            <button className="river-btn" onClick={goRandom}>随机一盏灯</button>
            <button className="river-btn" onClick={goEnd}>顺流入海</button>
          </div>
          {selected && (
            <div className="river-card">
              <button className="river-card-close" onClick={closeCard} aria-label="关闭">×</button>
              <div className="eyebrow">{"//"} POEM · {selectedNo} / {selectedDyn}</div>
              <h2>{selected.t}</h2>
              <p className="river-card-author">{selected.a || "佚名"}</p>
              <div className="tags"><span className="tag">{selected.c}</span></div>
              <Link className="button" href={`/poem/${selected.id}`}>读这首诗 →</Link>
            </div>
          )}
          <div className="river-hint">
            {hovered ? `悬停：${hovered.t} · ${hovered.a || "佚名"}` : "拖拽旋转 · 滚轮缩放 · 点击河灯读诗"}
          </div>
        </div>
      )}
    </div>
  );
}