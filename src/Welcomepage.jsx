import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";

/* ═══════════════════════════════════════════════════════════
   CRYPTOFORGE — CINEMATIC WELCOME PAGE
   Boot sequence → Glitch → 3D scene → Identity lock → CTA
   ═══════════════════════════════════════════════════════════ */

const ACCENT = "#00E5FF";
const ALERT = "#FF2D55";
const MUTED_HEX = "#555566";

const BOOT_LINES = [
  { text: "CRYPTOFORGE KERNEL v3.1.0 — INITIALIZING", cls: "success" },
  { text: "GALOIS FIELD GF(2⁸) ARITHMETIC MODULE... LOADED", cls: "" },
  { text: "AES S-BOX TABLE (NL=112, δ=4, DEG=7)... VERIFIED", cls: "" },
  { text: "CAUCHY MDS MATRIX 32×32 (BN=33)... CONSTRUCTED", cls: "" },
  { text: "ENTROPY POOL SEEDED [████████████] 256bit", cls: "" },
  { text: "DAVIES-MEYER COMPRESSION FUNCTION... BOUND", cls: "" },
  { text: "WALSH-HADAMARD SPECTRAL ENGINE... ARMED", cls: "success" },
  { text: "NEURAL ADVERSARY (GOHR-RESNET, 677K PARAMS)... STANDBY", cls: "" },
  { text: "COLLISION FINDER (RL-DQN)... STANDBY", cls: "" },
  { text: "DEFENDER ENGINE v3 (NEURAL-IN-LOOP)... READY", cls: "" },
  { text: "IDENTITY FRAGMENT DETECTED", cls: "error" },
  { text: "CORRECTING... SPECTRAL FINGERPRINT MATCH", cls: "success" },
  { text: "LOADING THREAT SURFACE MAP...", cls: "" },
  { text: "ADVERSARIAL CO-EVOLUTION LOOP... PRIMED", cls: "success" },
  { text: "MATRIXHASH-256 PIPELINE... OPERATIONAL", cls: "success" },
  { text: "CLEARANCE: CONDITIONAL", cls: "error" },
];

function randomHex(len) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export default function WelcomePage({ onEnter }) {
  const canvasRef = useRef(null);
  const threeRef = useRef({});
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [phase, setPhase] = useState(0);
  const [bootLines, setBootLines] = useState([]);
  const [showGlitch, setShowGlitch] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [timerVal, setTimerVal] = useState("000:000:000");
  const [hashStrip, setHashStrip] = useState([]);
  const [ctaHover, setCtaHover] = useState(false);
  const startTime = useRef(Date.now());
  const charRefs = useRef([]);

  // ── Mouse tracking ──
  const handleMouse = useCallback((e) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [handleMouse]);

  // ── Session timer ──
  useEffect(() => {
    if (!showCta) return;
    const id = setInterval(() => {
      const el = Date.now() - startTime.current;
      const m = String(Math.floor(el / 60000)).padStart(3, "0");
      const s = String(Math.floor((el % 60000) / 1000)).padStart(3, "0");
      const ms = String(el % 1000).padStart(3, "0");
      setTimerVal(`${m}:${s}:${ms}`);
    }, 47);
    return () => clearInterval(id);
  }, [showCta]);

  // ── Hash strip ──
  useEffect(() => {
    if (!showCta) return;
    const id = setInterval(() => {
      setHashStrip([
        `MH256: ${randomHex(48)}`,
        `SHA26: ${randomHex(48)}`,
        `WALSH: ${randomHex(32)}`,
      ]);
    }, 150);
    return () => clearInterval(id);
  }, [showCta]);

  // ── THREE.JS SETUP ──
  useEffect(() => {
    if (phase < 3 || !canvasRef.current) return;
    if (threeRef.current.renderer) return; // already initialized

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 2000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Wireframe dodecahedron
    const geo = new THREE.DodecahedronGeometry(1.6, 0);
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.6,
    });
    const dodecahedron = new THREE.LineSegments(edges, lineMat);
    scene.add(dodecahedron);

    // Vertex glow
    const verts = geo.getAttribute("position");
    const dotGeo = new THREE.BufferGeometry();
    const dotPos = new Float32Array(verts.count * 3);
    for (let i = 0; i < verts.count; i++) {
      dotPos[i * 3] = verts.getX(i);
      dotPos[i * 3 + 1] = verts.getY(i);
      dotPos[i * 3 + 2] = verts.getZ(i);
    }
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x00e5ff, size: 0.06, transparent: true, opacity: 0.9,
    });
    dodecahedron.add(new THREE.Points(dotGeo, dotMat));

    // Orbiting particles
    const pCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 2.5 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);
      const rnd = Math.random();
      if (rnd > 0.95) {
        pColors[i*3]=1; pColors[i*3+1]=0.18; pColors[i*3+2]=0.34;
      } else if (rnd > 0.7) {
        pColors[i*3]=0.7; pColors[i*3+1]=0.7; pColors[i*3+2]=0.7;
      } else {
        pColors[i*3]=0; pColors[i*3+1]=0.6+Math.random()*0.4; pColors[i*3+2]=0.8+Math.random()*0.2;
      }
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.02, vertexColors: true, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Rings
    for (let i = 0; i < 3; i++) {
      const rGeo = new THREE.RingGeometry(3 + i * 1.5, 3.02 + i * 1.5, 64);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff, transparent: true, opacity: 0.04, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI / 2 + i * 0.2;
      scene.add(ring);
    }

    threeRef.current = { scene, camera, renderer, dodecahedron, particles };

    // Animation loop
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      dodecahedron.rotation.x = t * 0.08;
      dodecahedron.rotation.y = t * 0.12;
      particles.rotation.y = t * 0.015;
      particles.rotation.x = Math.sin(t * 0.05) * 0.1;

      const mx = (mouseRef.current.x - 0.5) * 0.17;
      const my = (mouseRef.current.y - 0.5) * 0.17;
      camera.position.x += (mx - camera.position.x) * 0.03;
      camera.position.y += (-my - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [phase]);

  // ── MAIN SEQUENCE ──
  useEffect(() => {
    async function run() {
      // Phase 0: Void (1.5s)
      setPhase(0);
      await delay(1500);

      // Phase 1: Boot (lines appear)
      setPhase(1);
      for (let i = 0; i < BOOT_LINES.length; i++) {
        setBootLines((prev) => [...prev, BOOT_LINES[i]]);
        await delay(120);
      }
      await delay(300);

      // Phase 2: Glitch (0.6s)
      setPhase(2);
      setShowGlitch(true);
      await delay(600);
      setShowGlitch(false);

      // Phase 3: Three.js world (2.5s fade in)
      setPhase(3);
      await delay(2500);

      // Phase 4: Identity assembles
      setPhase(4);
      setShowIdentity(true);
      await delay(2000);

      // Phase 5: CTA
      setPhase(5);
      setShowCta(true);
    }
    run();
  }, []);

  // ── Char animation for CRYPTOFORGE title ──
  useEffect(() => {
    if (!showIdentity) return;
    charRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        {
          opacity: 0,
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 400,
          scale: 0.3,
        },
        {
          opacity: 1, x: 0, y: 0, scale: 1,
          duration: 0.6,
          delay: i * 0.05,
          ease: "elastic.out(1.2, 0.5)",
        }
      );
    });
  }, [showIdentity]);

  return (
    <div style={styles.container}>
      {/* Scanlines + vignette overlays */}
      <div style={styles.scanlines} />
      <div style={styles.vignette} />

      {/* Phase 0: Void cursor */}
      {phase === 0 && <div style={styles.voidCursor}>█</div>}

      {/* Phase 1: Boot terminal */}
      {phase >= 1 && (
        <div style={{
          ...styles.terminal,
          opacity: phase >= 3 ? 0.06 : phase >= 2 ? 0.15 : 1,
        }}>
          {bootLines.map((line, i) => (
            <div
              key={i}
              style={{
                ...styles.termLine,
                color: line.cls === "error" ? ALERT : line.cls === "success" ? ACCENT : MUTED_HEX,
              }}
            >
              <span style={{ color: ACCENT, marginRight: 6 }}>▸</span>
              {line.text}
            </div>
          ))}
        </div>
      )}

      {/* Phase 2: Glitch */}
      {showGlitch && (
        <div style={styles.glitchOverlay}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0, width: "100%",
                top: `${i * 20}%`, height: "20%",
                background: i % 2 === 0 ? `${ACCENT}08` : `${ALERT}06`,
                transform: `translateX(${(Math.random() - 0.5) * 60}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Phase 3: Three.js canvas */}
      <canvas
        ref={canvasRef}
        style={{
          ...styles.canvas,
          opacity: phase >= 3 ? 1 : 0,
          transition: "opacity 2.5s ease",
        }}
      />

      {/* Phase 4: Identity */}
      {showIdentity && (
        <div style={styles.identity}>
          <div style={styles.projectName}>
            {"CRYPTOFORGE".split("").map((ch, i) => (
              <span
                key={i}
                ref={(el) => (charRefs.current[i] = el)}
                style={{ display: "inline-block", opacity: 0 }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div
            style={{
              ...styles.tagline,
              opacity: phase >= 4 ? 1 : 0,
              transition: "opacity 0.8s ease 0.4s",
            }}
          >
            ADVERSARIAL CO-EVOLUTION FOR HASH DESIGN
          </div>
          <div
            style={{
              ...styles.subtitle,
              opacity: phase >= 4 ? 1 : 0,
              transition: "opacity 0.8s ease 0.8s",
            }}
          >
            MATRIXHASH-256 • WALSH SPECTRAL • NEURAL CRYPTANALYSIS
          </div>
        </div>
      )}

      {/* Phase 5: CTA + chrome */}
      {showCta && (
        <>
          <div style={styles.ctaWrap}>
            <button
              style={{
                ...styles.ctaBtn,
                color: ctaHover ? "#fff" : MUTED_HEX,
                borderColor: ctaHover ? "#fff" : MUTED_HEX,
              }}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              onClick={onEnter}
            >
              {ctaHover && <span style={styles.ctaScanline} />}
              ENTER THE FORGE
            </button>
          </div>

          {/* Status bar */}
          <div style={styles.statusBar}>
            <span style={styles.statusDot} /> GF(2⁸) ACTIVE
            <span style={{ ...styles.statusDot, animationDelay: "0.5s", marginLeft: 16 }} /> WALSH READY
            <span style={{ ...styles.statusDot, animationDelay: "1s", marginLeft: 16 }} /> ADVERSARY STANDBY
          </div>

          {/* Hash strip */}
          <div style={styles.hashStrip}>
            {hashStrip.map((h, i) => (
              <div key={i}>{h}</div>
            ))}
          </div>

          {/* Session timer */}
          <div style={styles.timer}>
            <span style={{ color: "#333", marginRight: 4 }}>SESSION</span>
            {timerVal}
          </div>
        </>
      )}
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ═══════════════════════════════════════════════════════════
   STYLES — all inline for portability
   ═══════════════════════════════════════════════════════════ */
const mono = "'JetBrains Mono', 'Courier New', monospace";
const display = "'Syne', 'Arial Black', sans-serif";

const styles = {
  container: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "#000", overflow: "hidden", fontFamily: mono,
  },
  scanlines: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
    pointerEvents: "none", zIndex: 300, opacity: 0.4,
  },
  vignette: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
    pointerEvents: "none", zIndex: 55,
  },
  voidCursor: {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 18, color: ACCENT, zIndex: 100,
    animation: "blink 0.7s step-end infinite",
  },
  terminal: {
    position: "fixed", bottom: 20, left: 24,
    width: "min(55%, 500px)", maxHeight: "50vh", overflow: "hidden",
    fontSize: 12, lineHeight: 1.7, zIndex: 90,
    transition: "opacity 0.5s ease",
  },
  termLine: {
    opacity: 1,
    animation: "slideIn 0.15s ease-out",
  },
  glitchOverlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    zIndex: 200, pointerEvents: "none",
  },
  canvas: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    zIndex: 1,
  },
  identity: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    zIndex: 50, pointerEvents: "none",
  },
  projectName: {
    fontFamily: display,
    fontSize: "clamp(36px, 8vw, 90px)",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#fff",
  },
  tagline: {
    fontFamily: mono,
    fontSize: "clamp(10px, 1.4vw, 14px)",
    letterSpacing: "0.25em",
    color: MUTED_HEX,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: mono,
    fontSize: "clamp(9px, 1.1vw, 13px)",
    letterSpacing: "0.15em",
    color: ACCENT,
    marginTop: 8,
  },
  ctaWrap: {
    position: "fixed", bottom: "15%", left: "50%",
    transform: "translateX(-50%)", zIndex: 60,
    animation: "fadeIn 1s ease 0.5s both",
  },
  ctaBtn: {
    fontFamily: mono, fontSize: 13, fontWeight: 500,
    letterSpacing: "0.2em", textTransform: "uppercase",
    background: "transparent", border: "1px solid",
    padding: "14px 36px", cursor: "pointer",
    position: "relative", overflow: "hidden",
    transition: "color 0.3s, border-color 0.3s",
  },
  ctaScanline: {
    position: "absolute", top: 0, left: "-100%",
    width: "100%", height: "100%",
    background: `linear-gradient(90deg, transparent, ${ACCENT}22, transparent)`,
    animation: "scanSweep 0.4s ease forwards",
  },
  statusBar: {
    position: "fixed", top: 16, left: 20,
    fontFamily: mono, fontSize: 10, color: "#222",
    zIndex: 60, display: "flex", alignItems: "center", gap: 5,
    animation: "fadeIn 0.5s ease 1.2s both",
  },
  statusDot: {
    display: "inline-block", width: 5, height: 5,
    borderRadius: "50%", background: ACCENT,
    animation: "pulseDot 2s ease infinite",
  },
  hashStrip: {
    position: "fixed", top: 16, right: 20,
    fontFamily: mono, fontSize: 9, color: "#1a1a1a",
    zIndex: 60, textAlign: "right", lineHeight: 1.6,
    animation: "fadeIn 0.5s ease 1.4s both",
  },
  timer: {
    position: "fixed", bottom: 16, right: 20,
    fontFamily: mono, fontSize: 11, color: MUTED_HEX,
    letterSpacing: "0.1em", zIndex: 60,
    animation: "fadeIn 0.5s ease 0.8s both",
  },
};