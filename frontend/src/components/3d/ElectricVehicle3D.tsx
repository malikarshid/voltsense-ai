'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ElectricVehicle3DProps {
  isTransparent?: boolean;
  highlightBattery?: boolean;
  animateFlow?: boolean;
  selectedComponent?: string | null;
  onSelectComponent?: (name: string) => void;
}

export const ElectricVehicle3D: React.FC<ElectricVehicle3DProps> = ({
  isTransparent = true,
  highlightBattery = false,
  animateFlow = true,
  selectedComponent,
  onSelectComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const flowParticlesRef = useRef<THREE.Points | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const meshRefs = useRef<{ [key: string]: THREE.Mesh }>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080d18);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7, 4.5, 9);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Lighting (Sleek Automotive Studio Lighting)
    const ambientLight = new THREE.AmbientLight(0x263449, 1.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.DirectionalLight(0x4c9fff, 2.5);
    cyanLight.position.set(5, 8, 5);
    scene.add(cyanLight);

    const greenLight = new THREE.DirectionalLight(0x55d889, 1.8);
    greenLight.position.set(-5, 6, -5);
    scene.add(greenLight);

    const bottomGlow = new THREE.PointLight(0x4c9fff, 3.0, 15);
    bottomGlow.position.set(0, -0.5, 0);
    scene.add(bottomGlow);

    // 3. Grid Platform Ground
    const grid = new THREE.GridHelper(20, 30, 0x3b506d, 0x172337);
    grid.position.y = -1.2;
    scene.add(grid);

    // 4. Car Group
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // Materials
    const chassisMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4c9fff,
      wireframe: isTransparent,
      transparent: true,
      opacity: isTransparent ? 0.35 : 0.85,
      roughness: 0.2,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const batteryMaterial = new THREE.MeshStandardMaterial({
      color: highlightBattery ? 0x55d889 : 0x32b96f,
      emissive: highlightBattery ? 0x55d889 : 0x172337,
      emissiveIntensity: highlightBattery ? 0.8 : 0.2,
      roughness: 0.3,
      metalness: 0.7,
    });

    const motorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4c9fff,
      emissive: 0x2b6cb0,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.2,
    });

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x111b2b,
      roughness: 0.8,
      metalness: 0.3,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x55d889,
      metalness: 0.9,
      roughness: 0.2,
    });

    // 4a. Chassis Body Shell
    const bodyGeom = new THREE.BoxGeometry(4.8, 1.1, 2.2);
    const bodyMesh = new THREE.Mesh(bodyGeom, chassisMaterial);
    bodyMesh.position.y = 0.3;
    carGroup.add(bodyMesh);
    meshRefs.current['Chassis'] = bodyMesh;

    // Cabin / Roof Canopy
    const cabinGeom = new THREE.BoxGeometry(2.6, 0.9, 1.9);
    const cabinMesh = new THREE.Mesh(cabinGeom, chassisMaterial);
    cabinMesh.position.set(-0.2, 1.1, 0);
    carGroup.add(cabinMesh);

    // 4b. Underslung Battery Pack (Center Floor)
    const packGeom = new THREE.BoxGeometry(3.0, 0.35, 1.8);
    const packMesh = new THREE.Mesh(packGeom, batteryMaterial);
    packMesh.position.set(-0.1, -0.3, 0);
    carGroup.add(packMesh);
    meshRefs.current['Battery Pack'] = packMesh;

    // Cell Modules inside pack (grid of glowing cells)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const cellGeom = new THREE.BoxGeometry(0.5, 0.15, 0.7);
        const cellMat = new THREE.MeshStandardMaterial({
          color: 0x55d889,
          emissive: 0x55d889,
          emissiveIntensity: 0.6,
        });
        const cellMesh = new THREE.Mesh(cellGeom, cellMat);
        cellMesh.position.set(-1.1 + c * 0.55, -0.15, -0.45 + r * 0.9);
        carGroup.add(cellMesh);
      }
    }

    // 4c. Front Powertrain & Electric Motor
    const frontMotorGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
    frontMotorGeom.rotateZ(Math.PI / 2);
    const frontMotor = new THREE.Mesh(frontMotorGeom, motorMaterial);
    frontMotor.position.set(1.6, -0.2, 0);
    carGroup.add(frontMotor);
    meshRefs.current['Front Motor'] = frontMotor;

    // Front Axle
    const frontAxleGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
    frontAxleGeom.rotateX(Math.PI / 2);
    const frontAxle = new THREE.Mesh(frontAxleGeom, motorMaterial);
    frontAxle.position.set(1.6, -0.2, 0);
    carGroup.add(frontAxle);

    // 4d. Rear Powertrain & Electric Motor
    const rearMotorGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 16);
    rearMotorGeom.rotateZ(Math.PI / 2);
    const rearMotor = new THREE.Mesh(rearMotorGeom, motorMaterial);
    rearMotor.position.set(-1.8, -0.2, 0);
    carGroup.add(rearMotor);
    meshRefs.current['Rear Motor'] = rearMotor;

    // Rear Axle
    const rearAxle = new THREE.Mesh(frontAxleGeom, motorMaterial);
    rearAxle.position.set(-1.8, -0.2, 0);
    carGroup.add(rearAxle);

    // 4e. Wheels (4 Corners)
    const wheelPositions = [
      { x: 1.6, y: -0.2, z: 1.15 },
      { x: 1.6, y: -0.2, z: -1.15 },
      { x: -1.8, y: -0.2, z: 1.15 },
      { x: -1.8, y: -0.2, z: -1.15 },
    ];

    wheelPositions.forEach((pos) => {
      const tireGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 24);
      tireGeom.rotateX(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeom, wheelMaterial);
      tire.position.set(pos.x, pos.y, pos.z);
      carGroup.add(tire);

      const rimGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.36, 12);
      rimGeom.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeom, rimMaterial);
      rim.position.set(pos.x, pos.y, pos.z);
      carGroup.add(rim);
    });

    // 5. Animated Energy Flow Particles (Battery to Motors)
    const particleCount = 80;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 1] = -0.25 + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x4c9fff,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    carGroup.add(particles);
    flowParticlesRef.current = particles;

    // 6. Mouse Interaction & Orbit Drag
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !carGroupRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;
      carGroupRef.current.rotation.y += deltaX * 0.008;
      carGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.4, carGroupRef.current.rotation.x + deltaY * 0.005));
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      e.preventDefault();
      cameraRef.current.position.z = Math.max(5, Math.min(16, cameraRef.current.position.z + e.deltaY * 0.008));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 7. Click raycasting for component selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const targets = Object.values(meshRefs.current);
      const intersects = raycaster.intersectObjects(targets);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        for (const [name, mesh] of Object.entries(meshRefs.current)) {
          if (mesh === hit && onSelectComponent) {
            onSelectComponent(name);
            break;
          }
        }
      }
    };
    container.addEventListener('click', onClick);

    // 8. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Gentle auto-rotation when idle
      if (!isDraggingRef.current && carGroupRef.current) {
        carGroupRef.current.rotation.y += delta * 0.2;
      }

      // Energy flow animation
      if (animateFlow && flowParticlesRef.current) {
        const posAttr = flowParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          arr[i * 3] += (i % 2 === 0 ? 1 : -1) * delta * 2.5;
          if (arr[i * 3] > 1.8) arr[i * 3] = -0.2;
          if (arr[i * 3] < -1.8) arr[i * 3] = -0.2;
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isTransparent, highlightBattery, animateFlow]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
    />
  );
};
