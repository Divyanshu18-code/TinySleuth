import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { motion, useReducedMotion } from "motion/react";
import { Info } from "lucide-react";

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
    color: "#2563EB",
    type: "base",
    description: "Advertised base listing rate",
  },
  {
    id: "handling",
    title: "Handling Fee",
    amount: "+₹29",
    color: "#6D28D9",
    type: "mandatory",
    description: "Mandatory checkout processing",
  },
  {
    id: "service",
    title: "Service Fee",
    amount: "+₹49",
    color: "#7C3AED",
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

  useEffect(() => {
    auditStateRef.current = isAuditing;
  }, [isAuditing]);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera Setup (Centered & Balanced Composition)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(5.2, 3.4, 6.8);
    camera.lookAt(0.1, 0.1, 0);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Clean SaaS Lighting: Key, Fill, Rim & Soft Violet Glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.85);
    dirLight.position.set(5.5, 8.5, 7.0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // Soft cool-violet fill light
    const fillLight = new THREE.PointLight(0xa5b4fc, 1.25, 20);
    fillLight.position.set(-5, 4, 3);
    scene.add(fillLight);

    // Soft blue-violet backlight glow (used sparingly behind the main object)
    const backGlowLight = new THREE.PointLight(0x7c3aed, 1.4, 12);
    backGlowLight.position.set(0, 0.4, -1.8);
    scene.add(backGlowLight);

    // Warm subtle rim accent
    const accentLight = new THREE.PointLight(0xfef3c7, 0.9, 15);
    accentLight.position.set(3.5, 5, 4);
    scene.add(accentLight);

    // Helper: Rounded Rectangle Shape for Box Extrusions
    function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
      const shape = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      return shape;
    }

    // 4. Ground Contact Shadow (Soft Radial Disc Grounding the Product Box)
    const shadowGeom = new THREE.PlaneGeometry(4.4, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.96, 0);
    scene.add(shadowMesh);

    // 5. Premium 3D Product Box (Stratified Checkout Tiers)
    const packageGroup = new THREE.Group();
    packageGroup.position.set(0, -0.4, 0);
    packageGroup.rotation.y = -Math.PI / 8; // Classic isometric angle
    scene.add(packageGroup);

    const slabShape = createRoundedRectShape(3.4, 2.3, 0.26);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    };
    const slabGeometry = new THREE.ExtrudeGeometry(slabShape, extrudeSettings);
    slabGeometry.rotateX(-Math.PI / 2); // Lay horizontal

    // Slabs: Royal Blue, Deep Violet, Bright Violet, Honey Amber (Translucent)
    const slabColors = [0x1d4ed8, 0x5b21b6, 0x7c3aed, 0xd97706];
    const slabMeshes: THREE.Mesh[] = [];
    const basePositionsY = [-0.65, -0.18, 0.30, 0.78];

    for (let i = 0; i < 4; i++) {
      const isTopLid = i === 3;
      const material = new THREE.MeshStandardMaterial({
        color: slabColors[i],
        roughness: isTopLid ? 0.18 : 0.24,
        metalness: isTopLid ? 0.08 : 0.20,
        transparent: isTopLid,
        opacity: isTopLid ? 0.88 : 1.0,
      });

      const mesh = new THREE.Mesh(slabGeometry, material);
      mesh.position.set(0, basePositionsY[i], 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      packageGroup.add(mesh);
      slabMeshes.push(mesh);
    }

    // Top Lid Verification Seal Tape (Represents Online Checkout Verification)
    const sealTapeShape = createRoundedRectShape(0.42, 2.34, 0.05);
    const sealTapeGeom = new THREE.ExtrudeGeometry(sealTapeShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
    sealTapeGeom.rotateX(-Math.PI / 2);
    const sealTapeMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.65,
      roughness: 0.25,
    });
    const sealTapeMesh = new THREE.Mesh(sealTapeGeom, sealTapeMat);
    sealTapeMesh.position.set(0, basePositionsY[3] + 0.34, 0);
    packageGroup.add(sealTapeMesh);

    // Central Brushed Audit Crest
    const crestGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.90,
      roughness: 0.15,
    });
    const crestMesh = new THREE.Mesh(crestGeom, crestMat);
    crestMesh.position.set(0, basePositionsY[3] + 0.38, 0);
    crestMesh.castShadow = true;
    packageGroup.add(crestMesh);

    // 6. Beautiful 3D Magnifying Glass (Checkout Truth Inspector)
    const glassGroup = new THREE.Group();

    // Metallic Royal Blue Rim Material
    const glassBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.14,
      metalness: 0.82,
    });

    // Sleek Torus Rim
    const rimGeom = new THREE.TorusGeometry(1.08, 0.11, 32, 64);
    const rimMesh = new THREE.Mesh(rimGeom, glassBlueMat);
    rimMesh.castShadow = true;
    glassGroup.add(rimMesh);

    // Crystal-Clear Refractive Glass Lens
    const lensGeom = new THREE.CylinderGeometry(1.05, 1.05, 0.02, 48);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.03,
      ior: 1.48,
      transparent: true,
      opacity: 0.24,
      reflectivity: 0.85,
    });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.rotation.x = Math.PI / 2;
    glassGroup.add(lensMesh);

    // Fine Inspection Reticle Ring inside Lens (Truth Auditor Signifier)
    const reticleGeom = new THREE.TorusGeometry(0.52, 0.012, 16, 48);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.55,
    });
    const reticleMesh = new THREE.Mesh(reticleGeom, reticleMat);
    glassGroup.add(reticleMesh);

    // Polished Chrome Junction Ring
    const collarGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.14, 24);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.90,
      roughness: 0.12,
    });
    const collarMesh = new THREE.Mesh(collarGeom, collarMat);
    collarMesh.position.set(-0.80, -0.80, 0);
    collarMesh.rotation.z = Math.PI / 4;
    glassGroup.add(collarMesh);

    // Slender Ergonomic Royal Blue Handle (Proportioned so it never clips or gets covered)
    const handleGeom = new THREE.CylinderGeometry(0.12, 0.10, 1.25, 24);
    const handleMesh = new THREE.Mesh(handleGeom, glassBlueMat);
    handleMesh.position.set(-1.20, -1.20, 0);
    handleMesh.rotation.z = Math.PI / 4;
    handleMesh.castShadow = true;
    glassGroup.add(handleMesh);

    // Polished Rounded Tip Cap
    const capGeom = new THREE.SphereGeometry(0.11, 20, 20);
    const capMesh = new THREE.Mesh(capGeom, glassBlueMat);
    capMesh.position.set(-1.64, -1.64, 0);
    glassGroup.add(capMesh);

    // Positioning: Hovering cleanly over the upper-right of the product box
    // Leaves generous whitespace on the bottom-left so the search icon handle is 100% visible
    glassGroup.position.set(1.50, 1.05, 1.80);
    glassGroup.rotation.order = "YXZ";
    glassGroup.rotation.y = 0.65;
    glassGroup.rotation.x = -0.32;
    scene.add(glassGroup);

    // 7. Lightweight Animation Loop (Gentle Motion & Reduced-Motion Aware)
    let animationFrameId: number;
    let clock = new THREE.Clock();
    const isReduced = prefersReducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (isReduced) {
        renderer.render(scene, camera);
        return;
      }

      const elapsedTime = clock.getElapsedTime();

      // Gentle floating motion for the main product box
      packageGroup.position.y = -0.4 + Math.sin(elapsedTime * 1.2) * 0.035;
      packageGroup.rotation.y = -Math.PI / 8 + Math.sin(elapsedTime * 0.7) * 0.02;

      // Subtle magnifying-glass inspection animation
      if (auditStateRef.current) {
        // Active scanning mode during audit execution
        const scanCycle = (Math.sin(elapsedTime * 3.2) + 1) / 2; // 0 to 1
        const targetY = 0.50 + scanCycle * 0.85;
        glassGroup.position.y += (targetY - glassGroup.position.y) * 0.15;
        glassGroup.position.x = 1.45 + Math.cos(elapsedTime * 2.2) * 0.12;
        glassGroup.position.z = 1.85 + Math.sin(elapsedTime * 1.8) * 0.08;
        glassGroup.rotation.z = Math.sin(elapsedTime * 2.8) * 0.05;

        // Subtle layer pulse reaction under scan
        slabMeshes.forEach((slab, idx) => {
          const dist = Math.abs(glassGroup.position.y - (basePositionsY[idx] + 0.4));
          if (dist < 0.35) {
            slab.scale.lerp(new THREE.Vector3(1.03, 1.03, 1.03), 0.15);
          } else {
            slab.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          }
        });
      } else {
        // Smooth idle inspection hover framing the upper-right of the product box
        // Leaves the entire bottom-left search handle completely unobstructed and in plain view
        const hoverOffsetY = Math.sin(elapsedTime * 1.5) * 0.04;
        const hoverOffsetX = Math.cos(elapsedTime * 1.1) * 0.03;
        const targetY = 1.05 + hoverOffsetY;
        const targetX = 1.50 + hoverOffsetX;

        glassGroup.position.y += (targetY - glassGroup.position.y) * 0.08;
        glassGroup.position.x += (targetX - glassGroup.position.x) * 0.08;
        glassGroup.position.z += (1.80 - glassGroup.position.z) * 0.08;
        glassGroup.rotation.z = Math.sin(elapsedTime * 1.2) * 0.025;

        // Gentle highlight on active layer if selected
        slabMeshes.forEach((slab, idx) => {
          const targetScale = idx === activeLayerRef.current ? 1.025 : 1.0;
          slab.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize Observer
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
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      slabGeometry.dispose();
      sealTapeGeom.dispose();
      crestGeom.dispose();
      rimGeom.dispose();
      lensGeom.dispose();
      reticleGeom.dispose();
      collarGeom.dispose();
      handleGeom.dispose();
      capGeom.dispose();
      shadowGeom.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* 3D WebGL Canvas Container with Soft Blue-Violet Glow */}
      <div className="relative w-full h-[320px] sm:h-[440px] flex items-center justify-center">
        {/* Soft blue-violet backlight glow behind main object */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_48%,rgba(99,102,241,0.10)_0%,rgba(124,58,237,0.05)_45%,transparent_70%)]" />

        <div ref={mountRef} className="w-full h-full cursor-pointer relative z-10" />

        {/* ======================================================== */}
        {/* DESKTOP & TABLET FLOATING LABELS (Zero-Overlap 4-Corner Layout) */}
        {/* ======================================================== */}
        <div className="hidden sm:block absolute inset-0 pointer-events-none z-20">
          {/* Label 4: Protection Plan (Top-Left) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            onClick={() => onLayerSelect && onLayerSelect(3)}
            className={`pointer-events-auto absolute top-3 left-3 sm:top-5 sm:left-5 rounded-xl border bg-white/95 backdrop-blur-md p-3 shadow-md transition transform cursor-pointer max-w-[210px] ${
              activeLayer === 3
                ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/90 shadow-amber-500/10"
                : "border-amber-200/90 hover:border-amber-300 hover:shadow-lg shadow-amber-500/5 hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Protection Plan
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200 uppercase tracking-wider">
                OPTIONAL
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">+₹99</div>
            <div className="text-[10px] font-medium text-amber-700 mt-0.5 flex items-center gap-1">
              <span>Pre-ticked add-on</span>
            </div>
          </motion.div>

          {/* Label 3: Service Fee (Top-Right) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            onClick={() => onLayerSelect && onLayerSelect(2)}
            className={`pointer-events-auto absolute top-3 right-3 sm:top-5 sm:right-5 rounded-xl border bg-white/95 backdrop-blur-md p-3 shadow-md transition transform cursor-pointer max-w-[190px] ${
              activeLayer === 2
                ? "border-purple-400 ring-2 ring-purple-400/30 bg-purple-50/90 shadow-purple-500/10"
                : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg shadow-slate-900/5 hover:-translate-y-0.5"
            }`}
          >
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Service Fee
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">+₹49</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Mandatory checkout fee</div>
          </motion.div>

          {/* Label 1: Product Price (Bottom-Left) — Sleek, Non-Overlapping Primary Hero Focus */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            onClick={() => onLayerSelect && onLayerSelect(0)}
            className={`pointer-events-auto absolute bottom-3 left-3 sm:bottom-4 sm:left-4 rounded-xl border-2 border-blue-600 bg-white/95 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/10 transition transform cursor-pointer w-auto max-w-[160px] sm:max-w-[170px] ${
              activeLayer === 0 ? "ring-blue-600/25 bg-blue-50/40" : "hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            <div className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Product Price
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none my-1">
              ₹999
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Base Sticker Rate</span>
            </div>
          </motion.div>

          {/* Label 2: Handling Fee (Bottom-Right) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.45 }}
            onClick={() => onLayerSelect && onLayerSelect(1)}
            className={`pointer-events-auto absolute bottom-4 right-3 sm:bottom-6 sm:right-5 rounded-xl border bg-white/95 backdrop-blur-md p-3 shadow-md transition transform cursor-pointer max-w-[190px] ${
              activeLayer === 1
                ? "border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-50/90 shadow-indigo-500/10"
                : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg shadow-slate-900/5 hover:-translate-y-0.5"
            }`}
          >
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Handling Fee
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">+₹29</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Mandatory checkout fee</div>
          </motion.div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE 2x2 BALANCED GRID (Zero-Overlap Responsive Fallback) */}
      {/* ======================================================== */}
      <div className="sm:hidden grid grid-cols-2 gap-2 mt-2 px-1">
        {/* Label 1 (Mobile Hero Focus) */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(0)}
          className={`rounded-xl border-2 border-blue-600 bg-white p-2.5 shadow-md ${
            activeLayer === 0 ? "ring-2 ring-blue-500/20 bg-blue-50/40" : ""
          }`}
        >
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Product Price</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">₹999</div>
          <span className="text-[9px] font-semibold text-emerald-600">Base sticker rate</span>
        </div>

        {/* Label 4 (Mobile Optional) */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(3)}
          className={`rounded-xl border border-amber-200 bg-white p-2.5 shadow-xs ${
            activeLayer === 3 ? "ring-2 ring-amber-400/30 bg-amber-50/50" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Protection</span>
            <span className="rounded bg-amber-50 px-1 py-0.2 text-[8px] font-bold text-amber-700 border border-amber-200">
              OPTIONAL
            </span>
          </div>
          <div className="text-base font-bold text-slate-900">+₹99</div>
          <span className="text-[9px] font-medium text-amber-700">Pre-ticked add-on</span>
        </div>

        {/* Label 2 (Mobile Mandatory) */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(1)}
          className={`rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs ${
            activeLayer === 1 ? "ring-2 ring-indigo-400/30 bg-indigo-50/50" : ""
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Handling Fee</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">+₹29</div>
          <span className="text-[9px] font-medium text-slate-500">Mandatory fee</span>
        </div>

        {/* Label 3 (Mobile Mandatory) */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(2)}
          className={`rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs ${
            activeLayer === 2 ? "ring-2 ring-purple-400/30 bg-purple-50/50" : ""
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Service Fee</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">+₹49</div>
          <span className="text-[9px] font-medium text-slate-500">Mandatory fee</span>
        </div>
      </div>

      {/* Disclosing Illustrative Sample Data Note */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium text-center">
        <Info className="h-3 w-3 text-slate-400 shrink-0" />
        <span>Illustrative demo breakdown · TinySleuth inspects real checkouts on demand</span>
      </div>
    </div>
  );
};

export default ThreeDPriceStack;
