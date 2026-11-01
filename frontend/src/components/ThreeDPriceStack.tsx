import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeDPriceStackProps {
  isAuditing?: boolean;
  activeLayer?: number; // 0: base price, 1: handling, 2: service, 3: protection
  onLayerSelect?: (index: number) => void;
  className?: string;
}

export const LAYER_DATA = [
  {
    id: "base",
    title: "Product price",
    amount: "₹999",
    color: "#2251D9",
    type: "base",
  },
  {
    id: "handling",
    title: "Handling fee",
    amount: "+₹29",
    color: "#6355DC",
    type: "mandatory",
  },
  {
    id: "service",
    title: "Service fee",
    amount: "+₹49",
    color: "#9588F2",
    type: "mandatory",
  },
  {
    id: "protection",
    title: "Protection plan",
    amount: "+₹99",
    badge: "OPTIONAL",
    color: "#E6B566",
    type: "optional",
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
    const height = container.clientHeight || 460;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(5.8, 3.8, 7.2);
    camera.lookAt(0.2, 0.2, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(6, 10, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0xa5b4fc, 1.5, 20);
    fillLight.position.set(-6, 4, 3);
    scene.add(fillLight);

    const goldAccentLight = new THREE.PointLight(0xfde68a, 1.2, 15);
    goldAccentLight.position.set(3, 5, 4);
    scene.add(goldAccentLight);

    // Helper: Rounded Rectangle Shape for Extruded Slabs
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

    // 4. Create 4 Layer Slabs
    const slabShape = createRoundedRectShape(3.8, 2.5, 0.22);
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.36,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    };
    const slabGeometry = new THREE.ExtrudeGeometry(slabShape, extrudeSettings);
    slabGeometry.rotateX(-Math.PI / 2); // Make slab lie horizontally

    const slabColors = [0x1d4ed8, 0x6d28d9, 0x8b5cf6, 0xd99b3b]; // Blue, Purple, Lavender, Gold
    const slabMeshes: THREE.Mesh[] = [];
    const stackGroup = new THREE.Group();
    stackGroup.position.set(0, -0.6, 0);
    stackGroup.rotation.y = -Math.PI / 8; // Isometric angle
    scene.add(stackGroup);

    const basePositionsY = [-0.8, -0.25, 0.3, 0.85];

    for (let i = 0; i < 4; i++) {
      const isTopTranslucent = i === 3;
      const material = new THREE.MeshStandardMaterial({
        color: slabColors[i],
        roughness: isTopTranslucent ? 0.2 : 0.3,
        metalness: isTopTranslucent ? 0.05 : 0.1,
        transparent: isTopTranslucent,
        opacity: isTopTranslucent ? 0.88 : 1.0,
      });

      const mesh = new THREE.Mesh(slabGeometry, material);
      mesh.position.set(0, basePositionsY[i], 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      stackGroup.add(mesh);
      slabMeshes.push(mesh);
    }

    // 5. Create 3D Magnifying Glass
    const glassGroup = new THREE.Group();

    // Metallic deep-blue rim
    const rimGeom = new THREE.TorusGeometry(1.22, 0.16, 24, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x0f2a7a,
      roughness: 0.18,
      metalness: 0.75,
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.castShadow = true;
    glassGroup.add(rimMesh);

    // Convex glass lens
    const lensGeom = new THREE.CylinderGeometry(1.18, 1.18, 0.04, 48);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      roughness: 0.08,
      ior: 1.45,
      transparent: true,
      opacity: 0.45,
    });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.rotation.x = Math.PI / 2;
    glassGroup.add(lensMesh);

    // Handle
    const handleGeom = new THREE.CylinderGeometry(0.14, 0.14, 1.6, 24);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x0f2a7a,
      roughness: 0.2,
      metalness: 0.7,
    });
    const handleMesh = new THREE.Mesh(handleGeom, handleMat);
    handleMesh.position.set(-1.45, -1.45, 0);
    handleMesh.rotation.z = Math.PI / 4; // 45 degree tilt
    handleMesh.castShadow = true;
    glassGroup.add(handleMesh);

    // Handle tip cap
    const capGeom = new THREE.SphereGeometry(0.15, 16, 16);
    const capMesh = new THREE.Mesh(capGeom, handleMat);
    capMesh.position.set(-2.02, -2.02, 0);
    glassGroup.add(capMesh);

    // Initial position in front of layer stack
    glassGroup.position.set(1.4, 0.8, 2.2);
    glassGroup.rotation.y = -Math.PI / 10;
    glassGroup.rotation.x = Math.PI / 16;
    scene.add(glassGroup);

    // 6. Floating Polyhedral Spheres in Background
    const polyGroup = new THREE.Group();
    const polyGeom = new THREE.IcosahedronGeometry(0.42, 0);
    const polyMat = new THREE.MeshStandardMaterial({
      color: 0x254cd4,
      roughness: 0.3,
      metalness: 0.4,
      flatShading: true,
    });

    const polyData = [
      { pos: [-2.4, 2.4, -1.8], scale: 1.0, rotSpeed: 0.01 },
      { pos: [2.6, 2.9, -2.5], scale: 0.8, rotSpeed: -0.012 },
      { pos: [-1.9, -1.8, 1.2], scale: 0.65, rotSpeed: 0.015 },
      { pos: [3.4, -1.4, -1.0], scale: 0.75, rotSpeed: -0.009 },
    ];

    const polyMeshes: THREE.Mesh[] = [];
    polyData.forEach((p) => {
      const mesh = new THREE.Mesh(polyGeom, polyMat);
      mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
      mesh.scale.setScalar(p.scale);
      polyGroup.add(mesh);
      polyMeshes.push(mesh);
    });
    scene.add(polyGroup);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    // Magnifying glass target coordinates
    // Base layer: y ~ -0.2, Top layer: y ~ 1.3
    const layerTargetY = [-0.15, 0.35, 0.85, 1.35];

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Ambient bobbing of background polyhedra
      polyMeshes.forEach((mesh, idx) => {
        mesh.rotation.x += polyData[idx].rotSpeed;
        mesh.rotation.y += polyData[idx].rotSpeed * 1.3;
        mesh.position.y = polyData[idx].pos[1] + Math.sin(elapsedTime * 1.5 + idx) * 0.12;
      });

      // Ambient subtle breathing of stack
      stackGroup.rotation.y = -Math.PI / 8 + Math.sin(elapsedTime * 0.8) * 0.03;

      // Dynamic Magnifying Glass Motion
      if (auditStateRef.current) {
        // Active Audit scanning motion: sweeping smoothly up and down across the layers!
        const scanCycle = (Math.sin(elapsedTime * 3.5) + 1) / 2; // 0 to 1
        const targetY = -0.2 + scanCycle * 1.6;
        glassGroup.position.y += (targetY - glassGroup.position.y) * 0.15;
        glassGroup.position.x = 1.35 + Math.cos(elapsedTime * 2.5) * 0.2;
        glassGroup.position.z = 2.1 + Math.sin(elapsedTime * 2.0) * 0.15;
        glassGroup.rotation.z = Math.sin(elapsedTime * 3.0) * 0.08;

        // Animate slabs reacting to the scan
        slabMeshes.forEach((slab, idx) => {
          const dist = Math.abs(glassGroup.position.y - basePositionsY[idx]);
          if (dist < 0.45) {
            slab.scale.set(1.04, 1.04, 1.04);
          } else {
            slab.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          }
        });
      } else {
        // Idle / Layer-focused state
        const targetIdx = Math.max(0, Math.min(3, activeLayerRef.current));
        const targetY = layerTargetY[targetIdx] + Math.sin(elapsedTime * 1.8) * 0.05;
        const targetX = 1.45 + Math.cos(elapsedTime * 1.2) * 0.08;

        glassGroup.position.y += (targetY - glassGroup.position.y) * 0.08;
        glassGroup.position.x += (targetX - glassGroup.position.x) * 0.08;
        glassGroup.position.z += (2.2 - glassGroup.position.z) * 0.08;
        glassGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.03;

        // Highlight active layer slightly
        slabMeshes.forEach((slab, idx) => {
          if (idx === targetIdx) {
            slab.position.y = basePositionsY[idx] + 0.08;
            slab.scale.lerp(new THREE.Vector3(1.03, 1.03, 1.03), 0.1);
          } else {
            slab.position.y = basePositionsY[idx];
            slab.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
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
      rimGeom.dispose();
      lensGeom.dispose();
      handleGeom.dispose();
      polyGeom.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-[380px] sm:h-[460px] select-none ${className}`}>
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-pointer" />

      {/* Floating 3D Pills (Overlay Matching Screenshot) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-end pr-3 sm:pr-8 space-y-4 sm:space-y-6">
        {/* Layer 4: Protection plan */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(3)}
          className={`pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 sm:px-4 py-1 sm:py-1.5 shadow-md shadow-slate-900/5 backdrop-blur-xs transition transform hover:scale-105 cursor-pointer ${
            activeLayer === 3 ? "ring-2 ring-amber-400 bg-amber-50/90" : ""
          }`}
          style={{ transform: "translateY(-10px)" }}
        >
          <span className="text-xs sm:text-sm font-bold text-slate-800">+₹99 Protection plan</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-800 uppercase tracking-wider">
            OPTIONAL
          </span>
        </div>

        {/* Layer 3: Service fee */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(2)}
          className={`pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 sm:px-4 py-1 sm:py-1.5 shadow-md shadow-slate-900/5 backdrop-blur-xs transition transform hover:scale-105 cursor-pointer ${
            activeLayer === 2 ? "ring-2 ring-purple-400 bg-purple-50/90" : ""
          }`}
        >
          <span className="text-xs sm:text-sm font-bold text-slate-800">+₹49 Service fee</span>
        </div>

        {/* Layer 2: Handling fee */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(1)}
          className={`pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 sm:px-4 py-1 sm:py-1.5 shadow-md shadow-slate-900/5 backdrop-blur-xs transition transform hover:scale-105 cursor-pointer ${
            activeLayer === 1 ? "ring-2 ring-indigo-400 bg-indigo-50/90" : ""
          }`}
        >
          <span className="text-xs sm:text-sm font-bold text-slate-800">+₹29 Handling fee</span>
        </div>

        {/* Layer 1: Product base price */}
        <div
          onClick={() => onLayerSelect && onLayerSelect(0)}
          className={`pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3.5 sm:px-4.5 py-1 sm:py-1.5 shadow-md shadow-slate-900/5 backdrop-blur-xs transition transform hover:scale-105 cursor-pointer ${
            activeLayer === 0 ? "ring-2 ring-blue-500 bg-blue-50/90" : ""
          }`}
          style={{ transform: "translateY(10px)" }}
        >
          <span className="text-xs sm:text-sm font-bold text-slate-900">₹999 Product price</span>
        </div>
      </div>
    </div>
  );
};
export default ThreeDPriceStack;
