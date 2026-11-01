import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDPriceStackProps {
  isAuditing?: boolean;
  activeLayer?: number;
  onLayerSelect?: (index: number) => void;
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

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 520;

    // 1. Scene & Perspective Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.4);
    camera.lookAt(0, 0, 0);

    // 2. High-Performance WebGL Renderer with Filmic Tone Mapping
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

    // Top-Right: Molten Copper / Amber Rim Light (Creates the fiery edge highlights)
    const copperRimLight = new THREE.DirectionalLight(0xf59e0b, 5.5);
    copperRimLight.position.set(5.5, 6.0, 3.5);
    scene.add(copperRimLight);

    // Bottom-Left: Electric Royal Blue Fill Light
    const blueFillLight = new THREE.PointLight(0x2563eb, 5.0, 18);
    blueFillLight.position.set(-5.0, -4.0, 3.0);
    scene.add(blueFillLight);

    // Center Core: Neon Green / Lime Glow (Shines from hollow interior of knot)
    const neonGreenLight = new THREE.PointLight(0x10b981, 4.5, 12);
    neonGreenLight.position.set(0.3, 0.2, 0.5);
    scene.add(neonGreenLight);

    // Deep Plum / Violet Backlight (Adds cinematic atmosphere)
    const plumBackLight = new THREE.PointLight(0x7c3aed, 4.0, 16);
    plumBackLight.position.set(0, 2.5, -4.5);
    scene.add(plumBackLight);

    // 5. 3D Master Sculpture Group (Torus Knot Organic Loop)
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- OUTER SHELL: Smoked Obsidian Glass Torus Knot ---
    const outerKnotGeom = new THREE.TorusKnotGeometry(2.2, 0.64, 240, 56, 2, 3);
    const outerGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x060814,
      emissive: 0x020308,
      roughness: 0.03,
      metalness: 0.08,
      transmission: 0.92, // Smoked glass transmission
      ior: 1.58, // High refractive index
      thickness: 2.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      specularIntensity: 1.8,
      specularColor: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const outerGlassMesh = new THREE.Mesh(outerKnotGeom, outerGlassMat);
    masterGroup.add(outerGlassMesh);

    // --- INNER LUMINOUS CORE 1: Neon Emerald / Lime Channel ---
    const innerKnotGeom1 = new THREE.TorusKnotGeometry(2.18, 0.24, 180, 32, 2, 3);
    const innerNeonMat1 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 3.5,
      roughness: 0.1,
      metalness: 0.85,
    });
    const innerNeonMesh1 = new THREE.Mesh(innerKnotGeom1, innerNeonMat1);
    masterGroup.add(innerNeonMesh1);

    // --- INNER LUMINOUS CORE 2: Electric Cyan / Royal Blue Accent Filament ---
    const innerKnotGeom2 = new THREE.TorusKnotGeometry(2.21, 0.14, 160, 24, 2, 3);
    const innerNeonMat2 = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0088ff,
      emissiveIntensity: 3.0,
      roughness: 0.15,
      metalness: 0.9,
    });
    const innerNeonMesh2 = new THREE.Mesh(innerKnotGeom2, innerNeonMat2);
    innerNeonMesh2.rotation.y = 0.15;
    innerNeonMesh2.rotation.z = 0.1;
    masterGroup.add(innerNeonMesh2);

    // --- OUTER SPECULAR ORBITAL RING (Subtle Halo) ---
    const haloGeom = new THREE.TorusGeometry(3.2, 0.022, 16, 120);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
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

    let currentTiltX = 0;
    let currentTiltY = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const isScanning = auditStateRef.current;

      // Mouse Parallax Smooth Lerp
      currentTiltX += (mouseTargetRef.current.x * 0.45 - currentTiltX) * 0.06;
      currentTiltY += (mouseTargetRef.current.y * 0.35 - currentTiltY) * 0.06;

      // Continuous 360-degree organic rotation ("gol gol ghumna")
      // Primary smooth Y-axis spin + secondary organic tumbling
      const rotSpeed = isScanning ? 1.5 : 0.65;
      masterGroup.rotation.y += rotSpeed * delta;
      masterGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.25 + currentTiltY * 0.4;
      masterGroup.rotation.z += (rotSpeed * 0.4) * delta;

      // Gentle floating levitation motion
      masterGroup.position.y = Math.sin(elapsed * 1.2) * 0.12;

      // Breathing Core Glow Effect (Intensifies during active audit)
      const basePulse = Math.sin(elapsed * (isScanning ? 5.0 : 2.0));
      const glowMult = isScanning ? 1.5 : 1.0;
      innerNeonMat1.emissiveIntensity = (3.5 + basePulse * 1.0) * glowMult;
      innerNeonMat2.emissiveIntensity = (3.0 + Math.cos(elapsed * 2.2) * 0.8) * glowMult;
      neonGreenLight.intensity = (4.5 + basePulse * 1.2) * glowMult;
      blueFillLight.intensity = (5.0 + Math.sin(elapsed * 1.8) * 0.8) * glowMult;
      copperRimLight.intensity = (5.5 + Math.cos(elapsed * 1.5) * 0.8) * glowMult;
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
      {/* 3D WebGL Canvas Container with Ambient Glow matching reference video */}
      <div className="relative w-full h-[400px] sm:h-[520px] lg:h-[600px] flex items-center justify-center overflow-visible">
        {/* Soft atmospheric gradient glows behind the glass sculpture */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_65%_45%,rgba(245,158,11,0.09)_0%,rgba(16,185,129,0.06)_30%,rgba(37,99,235,0.09)_60%,transparent_75%)]" />

        {/* The Pure 3D Canvas — Clean, unobstructed, smoothly spinning */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />
      </div>
    </div>
  );
};

export default ThreeDPriceStack;
