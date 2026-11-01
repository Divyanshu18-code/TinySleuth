import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

interface ThreeDPriceStackProps {
  isAuditing?: boolean;
  activeLayer?: number; // 0: base price, 1: handling, 2: service, 3: protection
  onLayerSelect?: (index: number) => void;
  className?: string;
}

export const LAYER_DATA = [
  {
    id: "base",
    title: "Product Price",
    amount: "₹999",
    color: "#3B82F6",
    type: "base",
    description: "Advertised base listing rate",
  },
  {
    id: "handling",
    title: "Handling Fee",
    amount: "+₹29",
    color: "#6366F1",
    type: "mandatory",
    description: "Mandatory checkout processing",
  },
  {
    id: "service",
    title: "Service Fee",
    amount: "+₹49",
    color: "#8B5CF6",
    type: "mandatory",
    description: "Platform packaging charge",
  },
  {
    id: "protection",
    title: "Protection Plan",
    amount: "+₹99",
    badge: "OPTIONAL",
    color: "#F59E0B",
    type: "optional",
    description: "Pre-ticked opt-in add-on",
  },
];

export const ThreeDPriceStack: React.FC<ThreeDPriceStackProps> = ({
  isAuditing = false,
  activeLayer = 0,
  onLayerSelect,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const auditStateRef = useRef(isAuditing);
  const activeLayerRef = useRef(activeLayer);
  const prefersReducedMotion = useReducedMotion();
  const mouseTargetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    auditStateRef.current = isAuditing;
  }, [isAuditing]);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 480;

    // 1. Scene & Perspective Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    camera.lookAt(0, 0, 0);

    // 2. High-Fidelity WebGL Renderer with Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Programmatic Studio Environment Map (Creates Rich Specular Refractions on Glass)
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ctx = envCanvas.getContext("2d");
    if (ctx) {
      // Dark space gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 512, 256);
      bgGrad.addColorStop(0, "#080714");
      bgGrad.addColorStop(0.5, "#0d0c24");
      bgGrad.addColorStop(1, "#05050d");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      // Warm copper softbox stripe (Top-Right)
      const copperGrad = ctx.createRadialGradient(400, 60, 5, 400, 60, 110);
      copperGrad.addColorStop(0, "rgba(245, 158, 11, 0.95)");
      copperGrad.addColorStop(0.4, "rgba(217, 119, 6, 0.5)");
      copperGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = copperGrad;
      ctx.beginPath();
      ctx.arc(400, 60, 110, 0, Math.PI * 2);
      ctx.fill();

      // Electric cyan/blue softbox stripe (Bottom-Left)
      const blueGrad = ctx.createRadialGradient(100, 200, 5, 100, 200, 130);
      blueGrad.addColorStop(0, "rgba(59, 130, 246, 0.9)");
      blueGrad.addColorStop(0.5, "rgba(37, 99, 235, 0.45)");
      blueGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = blueGrad;
      ctx.beginPath();
      ctx.arc(100, 200, 130, 0, Math.PI * 2);
      ctx.fill();

      // Neon lime highlight (Center-Right)
      const greenGrad = ctx.createRadialGradient(320, 140, 5, 320, 140, 90);
      greenGrad.addColorStop(0, "rgba(16, 185, 129, 0.85)");
      greenGrad.addColorStop(0.6, "rgba(5, 150, 105, 0.3)");
      greenGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = greenGrad;
      ctx.beginPath();
      ctx.arc(320, 140, 90, 0, Math.PI * 2);
      ctx.fill();
    }
    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envTexture;

    // 4. Studio Lighting Rig (Molten Copper Rim + Electric Blue Fill + Neon Green Core Glow)
    const ambientLight = new THREE.AmbientLight(0x0f0f1f, 1.8);
    scene.add(ambientLight);

    // Top-Right: Molten Copper / Amber Rim Light (Creates the video's fiery upper edge)
    const copperRimLight = new THREE.DirectionalLight(0xf59e0b, 5.2);
    copperRimLight.position.set(5.5, 6.0, 3.5);
    scene.add(copperRimLight);

    // Bottom-Left: Electric Royal Blue Fill Light
    const blueFillLight = new THREE.PointLight(0x2563eb, 4.8, 18);
    blueFillLight.position.set(-5.0, -4.0, 3.0);
    scene.add(blueFillLight);

    // Center Core: Neon Green / Lime Glow (Shines through interior of knot)
    const neonGreenLight = new THREE.PointLight(0x10b981, 4.2, 12);
    neonGreenLight.position.set(0.3, 0.2, 0.5);
    scene.add(neonGreenLight);

    // Deep Plum / Violet Backlight (Adds cinematic atmosphere)
    const plumBackLight = new THREE.PointLight(0x7c3aed, 3.8, 16);
    plumBackLight.position.set(0, 2.5, -4.5);
    scene.add(plumBackLight);

    // 5. 3D Master Sculpture Group (Torus Knot Organic Loop)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- OUTER SHELL: Smoked Obsidian Glass Torus Knot ---
    // Matches the organic flowing mobius loop seen in the video
    const outerKnotGeom = new THREE.TorusKnotGeometry(2.1, 0.62, 220, 54, 2, 3);
    const outerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x080913,
      emissive: 0x030308,
      roughness: 0.04,
      metalness: 0.12,
      transmission: 0.91, // Smoked glass transmission
      ior: 1.58, // High refractive index
      thickness: 1.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      specularIntensity: 1.5,
      specularColor: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    const outerGlassMesh = new THREE.Mesh(outerKnotGeom, outerGlassMat);
    masterGroup.add(outerGlassMesh);

    // --- INNER LUMINOUS CORE 1: Neon Emerald / Lime Channel ---
    // Looping through the hollow interior of the knot
    const innerKnotGeom1 = new THREE.TorusKnotGeometry(2.08, 0.24, 180, 28, 2, 3);
    const innerNeonMat1 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 3.2,
      roughness: 0.15,
      metalness: 0.85,
    });
    const innerNeonMesh1 = new THREE.Mesh(innerKnotGeom1, innerNeonMat1);
    masterGroup.add(innerNeonMesh1);

    // --- INNER LUMINOUS CORE 2: Electric Cyan / Royal Blue Accent Filament ---
    const innerKnotGeom2 = new THREE.TorusKnotGeometry(2.11, 0.14, 160, 24, 2, 3);
    const innerNeonMat2 = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0088ff,
      emissiveIntensity: 2.8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const innerNeonMesh2 = new THREE.Mesh(innerKnotGeom2, innerNeonMat2);
    innerNeonMesh2.rotation.y = 0.15;
    innerNeonMesh2.rotation.z = 0.1;
    masterGroup.add(innerNeonMesh2);

    // --- OUTER SPECULAR ORBITAL RING (Subtle Truth Inspection Halo) ---
    const haloGeom = new THREE.TorusGeometry(3.1, 0.02, 16, 100);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = Math.PI / 2.3;
    masterGroup.add(haloMesh);

    // 6. Interactive Parallax Mouse Listener
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseTargetRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    container.addEventListener("mousemove", handleMouseMove);

    // 7. Render Animation Loop (Continuous Fluid Rotation + Dynamic Pulse)
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const isReduced = prefersReducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let currentTiltX = 0;
    let currentTiltY = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isReduced) {
        renderer.render(scene, camera);
        return;
      }

      const elapsed = clock.getElapsedTime();
      const isScanning = auditStateRef.current;

      // Mouse Parallax Smooth Lerp
      currentTiltX += (mouseTargetRef.current.x * 0.45 - currentTiltX) * 0.06;
      currentTiltY += (mouseTargetRef.current.y * 0.35 - currentTiltY) * 0.06;

      // Organic Dual-Axis Continuous Rotation
      const rotSpeed = isScanning ? 0.022 : 0.0075;
      masterGroup.rotation.y += rotSpeed;
      masterGroup.rotation.z += rotSpeed * 0.55;
      masterGroup.rotation.x = Math.sin(elapsed * 0.6) * 0.15 + currentTiltY;
      masterGroup.position.x = currentTiltX * 0.3;
      masterGroup.position.y = Math.sin(elapsed * 1.1) * 0.08 - currentTiltY * 0.2;

      // Breathing Core Glow Effect (Intensifies during active audit)
      const basePulse = Math.sin(elapsed * (isScanning ? 5.0 : 2.0));
      const glowMultiplier = isScanning ? 1.4 : 1.0;
      innerNeonMat1.emissiveIntensity = (3.2 + basePulse * 0.8) * glowMultiplier;
      innerNeonMat2.emissiveIntensity = (2.8 + Math.cos(elapsed * 2.2) * 0.6) * glowMultiplier;
      neonGreenLight.intensity = (4.2 + basePulse * 1.2) * glowMultiplier;
      blueFillLight.intensity = (4.8 + Math.sin(elapsed * 1.8) * 0.8) * glowMultiplier;
      haloMesh.rotation.z = elapsed * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      outerKnotGeom.dispose();
      outerGlassMat.dispose();
      innerKnotGeom1.dispose();
      innerNeonMat1.dispose();
      innerKnotGeom2.dispose();
      innerNeonMat2.dispose();
      haloGeom.dispose();
      haloMat.dispose();
      envTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* 3D WebGL Canvas Container with Ambient Glows matching reference video */}
      <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[520px] flex items-center justify-center">
        {/* Soft atmospheric gradient glows behind the glass sculpture */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_65%_45%,rgba(245,158,11,0.08)_0%,rgba(16,185,129,0.06)_30%,rgba(37,99,235,0.08)_60%,transparent_75%)]" />

        {/* The Three.js Canvas */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />

        {/* ======================================================== */}
        {/* DESKTOP & TABLET SLEEK DARK GLASS BADGES (4-Corner Truth Pills) */}
        {/* ======================================================== */}
        <div className="hidden sm:block absolute inset-0 pointer-events-none z-20">
          {/* Label 1: Product Price (Top-Left) — Electric Blue Hero Focus */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            onClick={() => onLayerSelect && onLayerSelect(0)}
            className={`pointer-events-auto absolute top-4 left-4 rounded-2xl border bg-black/60 backdrop-blur-xl px-4 py-3 shadow-2xl transition transform cursor-pointer max-w-[190px] ${
              activeLayer === 0
                ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/40 shadow-blue-500/20"
                : "border-white/10 hover:border-blue-400/50 hover:bg-black/80 hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Product Price</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none my-1">₹999</div>
            <div className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1">
              <span>Advertised base rate</span>
            </div>
          </motion.div>

          {/* Label 4: Protection Plan (Top-Right) — Amber Optional */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            onClick={() => onLayerSelect && onLayerSelect(3)}
            className={`pointer-events-auto absolute top-4 right-4 rounded-2xl border bg-black/60 backdrop-blur-xl px-4 py-3 shadow-2xl transition transform cursor-pointer max-w-[200px] ${
              activeLayer === 3
                ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-950/40 shadow-amber-500/20"
                : "border-white/10 hover:border-amber-400/50 hover:bg-black/80 hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protection Plan</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/40 uppercase tracking-wider">
                OPTIONAL
              </span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">+₹99</div>
            <div className="text-[10px] font-medium text-amber-400/90 mt-0.5">Pre-ticked opt-in add-on</div>
          </motion.div>

          {/* Label 2: Handling Fee (Bottom-Left) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            onClick={() => onLayerSelect && onLayerSelect(1)}
            className={`pointer-events-auto absolute bottom-4 left-4 rounded-2xl border bg-black/60 backdrop-blur-xl px-4 py-3 shadow-2xl transition transform cursor-pointer max-w-[190px] ${
              activeLayer === 1
                ? "border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-950/40 shadow-indigo-500/20"
                : "border-white/10 hover:border-indigo-400/50 hover:bg-black/80 hover:-translate-y-0.5"
            }`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Handling Fee</div>
            <div className="text-lg font-bold text-white tracking-tight">+₹29</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Mandatory checkout fee</div>
          </motion.div>

          {/* Label 3: Service Fee (Bottom-Right) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            onClick={() => onLayerSelect && onLayerSelect(2)}
            className={`pointer-events-auto absolute bottom-4 right-4 rounded-2xl border bg-black/60 backdrop-blur-xl px-4 py-3 shadow-2xl transition transform cursor-pointer max-w-[190px] ${
              activeLayer === 2
                ? "border-purple-400 ring-2 ring-purple-400/30 bg-purple-950/40 shadow-purple-500/20"
                : "border-white/10 hover:border-purple-400/50 hover:bg-black/80 hover:-translate-y-0.5"
            }`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Service Fee</div>
            <div className="text-lg font-bold text-white tracking-tight">+₹49</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5">Platform packaging fee</div>
          </motion.div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE 2x2 DARK GLASS GRID (Zero-Overlap Responsive Fallback) */}
      {/* ======================================================== */}
      <div className="sm:hidden grid grid-cols-2 gap-2 mt-3 px-1">
        <div
          onClick={() => onLayerSelect && onLayerSelect(0)}
          className={`rounded-xl border bg-black/70 backdrop-blur-md p-2.5 ${
            activeLayer === 0 ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/30" : "border-white/10"
          }`}
        >
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Product Price</div>
          <div className="text-xl font-black text-white mt-0.5">₹999</div>
          <span className="text-[9px] font-semibold text-emerald-400">Base sticker rate</span>
        </div>

        <div
          onClick={() => onLayerSelect && onLayerSelect(3)}
          className={`rounded-xl border bg-black/70 backdrop-blur-md p-2.5 ${
            activeLayer === 3 ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-950/30" : "border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Protection</span>
            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-400 border border-amber-500/30">
              OPTIONAL
            </span>
          </div>
          <div className="text-base font-bold text-white">+₹99</div>
          <span className="text-[9px] font-medium text-amber-400">Pre-ticked add-on</span>
        </div>

        <div
          onClick={() => onLayerSelect && onLayerSelect(1)}
          className={`rounded-xl border bg-black/70 backdrop-blur-md p-2.5 ${
            activeLayer === 1 ? "border-indigo-400 ring-2 ring-indigo-400/20 bg-indigo-950/30" : "border-white/10"
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Handling Fee</div>
          <div className="text-base font-bold text-white mt-0.5">+₹29</div>
          <span className="text-[9px] font-medium text-slate-400">Mandatory fee</span>
        </div>

        <div
          onClick={() => onLayerSelect && onLayerSelect(2)}
          className={`rounded-xl border bg-black/70 backdrop-blur-md p-2.5 ${
            activeLayer === 2 ? "border-purple-400 ring-2 ring-purple-400/20 bg-purple-950/30" : "border-white/10"
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Service Fee</div>
          <div className="text-base font-bold text-white mt-0.5">+₹49</div>
          <span className="text-[9px] font-medium text-slate-400">Platform fee</span>
        </div>
      </div>

      {/* Disclosing Illustrative Sample Data Note */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium text-center">
        <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
        <span>Continuous Refractive 3D AI Audit Visualization · Interactive Parallax</span>
      </div>
    </div>
  );
};

export default ThreeDPriceStack;
