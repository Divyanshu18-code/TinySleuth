import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDPriceStackProps {
  isAuditing?: boolean;
  className?: string;
}

export const ThreeDPriceStack: React.FC<ThreeDPriceStackProps> = ({
  isAuditing = false,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const auditStateRef = useRef(isAuditing);
  const mouseTargetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    auditStateRef.current = isAuditing;
  }, [isAuditing]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 600;

    // 1. Scene & Perspective Camera Setup (Close, immersive view matching reference photo)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0.15, 0, 6.2);
    camera.lookAt(0.15, 0, 0);

    // 2. High-Performance WebGL Renderer with Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Programmatic High-Contrast Studio Environment Map
    // Generates rich molten copper, neon green, and electric blue reflections on the glass
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ctx = envCanvas.getContext("2d");
    if (ctx) {
      // Deep dark void
      const bgGrad = ctx.createLinearGradient(0, 0, 512, 256);
      bgGrad.addColorStop(0, "#06050e");
      bgGrad.addColorStop(0.5, "#0a091a");
      bgGrad.addColorStop(1, "#040409");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 256);

      // Intense Molten Copper / Amber Softbox (Upper-Right Crest)
      const copperGrad = ctx.createRadialGradient(420, 50, 2, 420, 50, 130);
      copperGrad.addColorStop(0, "rgba(255, 150, 10, 1.0)");
      copperGrad.addColorStop(0.35, "rgba(245, 120, 0, 0.75)");
      copperGrad.addColorStop(0.7, "rgba(180, 70, 0, 0.25)");
      copperGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = copperGrad;
      ctx.beginPath();
      ctx.arc(420, 50, 130, 0, Math.PI * 2);
      ctx.fill();

      // Electric Royal Blue Reflection Softbox (Lower-Left Sweep)
      const blueGrad = ctx.createRadialGradient(90, 210, 2, 90, 210, 140);
      blueGrad.addColorStop(0, "rgba(37, 99, 235, 1.0)");
      blueGrad.addColorStop(0.4, "rgba(29, 78, 216, 0.6)");
      blueGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = blueGrad;
      ctx.beginPath();
      ctx.arc(90, 210, 140, 0, Math.PI * 2);
      ctx.fill();

      // Brilliant Neon Emerald / Lime Aperture Glow (Center)
      const greenGrad = ctx.createRadialGradient(280, 130, 2, 280, 130, 100);
      greenGrad.addColorStop(0, "rgba(34, 197, 94, 0.95)");
      greenGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.45)");
      greenGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = greenGrad;
      ctx.beginPath();
      ctx.arc(280, 130, 100, 0, Math.PI * 2);
      ctx.fill();
    }
    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envTexture;

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0e0e1c, 2.0);
    scene.add(ambientLight);

    // Top-Right: Molten Copper Directional Rim Light (Creates the brilliant fiery upper ridge)
    const copperRimLight = new THREE.DirectionalLight(0xf59e0b, 7.5);
    copperRimLight.position.set(6.0, 7.0, 4.0);
    scene.add(copperRimLight);

    // Upper Copper Point Light (Direct specular hit on outer curvature)
    const copperPointLight = new THREE.PointLight(0xff7800, 5.5, 16);
    copperPointLight.position.set(3.5, 4.5, 3.5);
    scene.add(copperPointLight);

    // Lower-Left: Royal Electric Blue Point Light
    const royalBlueLight = new THREE.PointLight(0x0055ff, 6.0, 18);
    royalBlueLight.position.set(-4.5, -3.5, 3.0);
    scene.add(royalBlueLight);

    // Center Aperture: Brilliant Neon Green / Lime Glow (Shines out from the inner eye)
    const neonGreenCore = new THREE.PointLight(0x22c55e, 6.5, 12);
    neonGreenCore.position.set(0.4, 0.1, 0.2);
    scene.add(neonGreenCore);

    // Bottom Cusp Copper Flare
    const bottomCopperFlare = new THREE.PointLight(0xea580c, 4.5, 14);
    bottomCopperFlare.position.set(1.2, -3.2, 2.0);
    scene.add(bottomCopperFlare);

    // Deep Plum Backlight
    const plumBackLight = new THREE.PointLight(0x7c3aed, 4.5, 20);
    plumBackLight.position.set(0, 2.5, -4.5);
    scene.add(plumBackLight);

    // 5. 3D Master Sculpture Group (Smooth Organic Glass Sculpture matching reference photo)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- OUTER SHELL: Thick, Sweeping Smoked Obsidian Glass ---
    // Smooth, voluptuous organic loop with prominent central aperture / eye
    const outerKnotGeom = new THREE.TorusKnotGeometry(2.1, 0.78, 240, 56, 2, 3);
    const outerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050711,
      emissive: 0x010205,
      roughness: 0.02,
      metalness: 0.08,
      transmission: 0.93, // Liquid glass refraction
      ior: 1.62, // Heavy refractive glass
      thickness: 3.2, // Deep volume refraction
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      specularIntensity: 2.2,
      specularColor: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    const outerGlassMesh = new THREE.Mesh(outerKnotGeom, outerGlassMat);
    masterGroup.add(outerGlassMesh);

    // --- INNER LUMINOUS NEON GREEN / LIME CHANNEL ---
    // Visible directly through the aperture / eye of the sculpture
    const innerKnotGeom1 = new THREE.TorusKnotGeometry(2.08, 0.28, 180, 32, 2, 3);
    const innerNeonMat1 = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 4.8,
      roughness: 0.1,
      metalness: 0.85,
    });
    const innerNeonMesh1 = new THREE.Mesh(innerKnotGeom1, innerNeonMat1);
    masterGroup.add(innerNeonMesh1);

    // --- INNER APERTURE GREEN GLOW IRIS (Matches the circular green eye in the image) ---
    const irisGeom = new THREE.TorusGeometry(1.4, 0.16, 24, 64);
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 4.2,
      roughness: 0.15,
      metalness: 0.7,
    });
    const irisMesh = new THREE.Mesh(irisGeom, irisMat);
    irisMesh.position.set(0.3, 0.1, 0.1);
    irisMesh.rotation.x = Math.PI / 4;
    masterGroup.add(irisMesh);

    // --- INNER ELECTRIC ROYAL BLUE FILAMENT ---
    // Radiates blue from the lower inner curve
    const innerKnotGeom2 = new THREE.TorusKnotGeometry(2.12, 0.16, 160, 24, 2, 3);
    const innerNeonMat2 = new THREE.MeshStandardMaterial({
      color: 0x0055ff,
      emissive: 0x0044ee,
      emissiveIntensity: 4.0,
      roughness: 0.15,
      metalness: 0.9,
    });
    const innerNeonMesh2 = new THREE.Mesh(innerKnotGeom2, innerNeonMat2);
    innerNeonMesh2.rotation.y = 0.2;
    innerNeonMesh2.rotation.z = 0.15;
    masterGroup.add(innerNeonMesh2);

    // --- OUTER SPECULAR ORBITAL HALO RING ---
    const haloGeom = new THREE.TorusGeometry(3.25, 0.02, 16, 120);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
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

    // 7. Render Animation Loop — Continuous 360° Fluid Rotation ("Gol Gol Ghumna")
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let lastTime = performance.now();

    let currentTiltX = 0;
    let currentTiltY = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = clock.getElapsedTime();
      const isScanning = auditStateRef.current;

      // Mouse Parallax Smooth Lerp
      currentTiltX += (mouseTargetRef.current.x * 0.45 - currentTiltX) * 0.06;
      currentTiltY += (mouseTargetRef.current.y * 0.35 - currentTiltY) * 0.06;

      // Continuous 360-degree organic rotation ("gol gol ghumna")
      const baseSpeed = isScanning ? 1.6 : 0.72;
      masterGroup.rotation.y += baseSpeed * delta;
      masterGroup.rotation.x = Math.sin(elapsed * 0.45) * 0.22 + currentTiltY * 0.4;
      masterGroup.rotation.z += (baseSpeed * 0.35) * delta;

      // Gentle floating levitation motion
      masterGroup.position.y = Math.sin(elapsed * 1.0) * 0.1;

      // Breathing Core Glow Effect (Intensifies during active audit)
      const basePulse = Math.sin(elapsed * (isScanning ? 5.0 : 2.0));
      const glowMult = isScanning ? 1.4 : 1.0;
      innerNeonMat1.emissiveIntensity = (4.8 + basePulse * 1.2) * glowMult;
      innerNeonMat2.emissiveIntensity = (4.0 + Math.cos(elapsed * 2.2) * 0.8) * glowMult;
      irisMat.emissiveIntensity = (4.2 + basePulse * 1.0) * glowMult;
      neonGreenCore.intensity = (6.5 + basePulse * 1.5) * glowMult;
      royalBlueLight.intensity = (6.0 + Math.sin(elapsed * 1.8) * 1.0) * glowMult;
      copperRimLight.intensity = (7.5 + Math.cos(elapsed * 1.5) * 1.0) * glowMult;
      haloMesh.rotation.z = elapsed * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      outerKnotGeom.dispose();
      outerGlassMat.dispose();
      innerKnotGeom1.dispose();
      innerNeonMat1.dispose();
      innerKnotGeom2.dispose();
      innerNeonMat2.dispose();
      irisGeom.dispose();
      irisMat.dispose();
      haloGeom.dispose();
      haloMat.dispose();
      envTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      {/* 3D WebGL Canvas Container with Ambient Glow matching reference photo */}
      <div className="relative w-full h-full min-h-[460px] sm:min-h-[560px] lg:min-h-[640px] flex items-center justify-center overflow-visible">
        {/* Soft atmospheric gradient glows behind the glass sculpture */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_65%_45%,rgba(245,158,11,0.10)_0%,rgba(34,197,94,0.07)_30%,rgba(37,99,235,0.09)_60%,transparent_75%)]" />

        {/* The Pure 3D Canvas — Clean, unobstructed, smoothly spinning */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />
      </div>
    </div>
  );
};

export default ThreeDPriceStack;
