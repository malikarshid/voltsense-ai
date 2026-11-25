'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/context/ThemeContext';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  Sparkles,
  Eye,
  Camera,
  Sliders,
  Play,
  Pause,
  Filter,
  Check,
} from 'lucide-react';

export type ExplorationMode = 'complete' | 'transparent' | 'battery_focus' | 'exploded' | 'cell_inspect';
export type CameraPreset = 'perspective' | 'front' | 'side' | 'rear' | 'top';

export interface ComponentVisibility {
  body: boolean;
  glass: boolean;
  chassis: boolean;
  battery: boolean;
  powertrain: boolean;
  wheels: boolean;
  cooling: boolean;
}

export interface CellTelemetryItem {
  cell_index: number;
  voltage: number;
  temperature: number;
  status: string;
}

interface ElectricVehicle3DProps {
  explorationMode?: ExplorationMode;
  showLabels?: boolean;
  selectedComponent?: string | null;
  selectedCellIndex?: number | null;
  selectedModuleIndex?: number | null;
  explodePercentage?: number;
  animationSpeed?: number;
  visibility?: ComponentVisibility;
  onSelectComponent?: (name: string) => void;
  onSelectCell?: (cellIndex: number) => void;
  onSelectModule?: (moduleIndex: number) => void;
  onExplorationModeChange?: (mode: ExplorationMode) => void;
  onExplodePercentageChange?: (pct: number) => void;
  cellTelemetry?: CellTelemetryItem[];
}

export const ElectricVehicle3D: React.FC<ElectricVehicle3DProps> = ({
  explorationMode = 'complete',
  showLabels = true,
  selectedComponent,
  selectedCellIndex,
  selectedModuleIndex,
  explodePercentage = 0,
  animationSpeed = 1.0,
  visibility = {
    body: true,
    glass: true,
    chassis: true,
    battery: true,
    powertrain: true,
    wheels: true,
    cooling: true,
  },
  onSelectComponent,
  onSelectCell,
  onSelectModule,
  onExplorationModeChange,
  onExplodePercentageChange,
  cellTelemetry = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const flowParticlesRef = useRef<THREE.Points | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Subsystem and mesh references
  const meshRefs = useRef<{ [key: string]: THREE.Object3D }>({});
  const moduleRefs = useRef<{ [key: number]: THREE.Mesh }>({});
  const cellCylinderRefs = useRef<{ [key: string]: THREE.Mesh }>({});
  const bodyMeshesRef = useRef<THREE.Mesh[]>([]);
  const glassMeshesRef = useRef<THREE.Mesh[]>([]);

  // Subsystem groups for visibility and explosion
  const groupRefs = useRef<{
    bodyGroup?: THREE.Group;
    glassGroup?: THREE.Group;
    chassisGroup?: THREE.Group;
    batteryGroup?: THREE.Group;
    powertrainGroup?: THREE.Group;
    wheelsGroup?: THREE.Group;
    coolingGroup?: THREE.Group;
    hvCablesGroup?: THREE.Group;
    cellsMatrixGroup?: THREE.Group;
  }>({});

  // Animated individual parts for exploded view
  const animatedPartsRef = useRef<{
    bodyShell?: THREE.Object3D;
    glassCanopy?: THREE.Object3D;
    chassisFrame?: THREE.Object3D;
    tray?: THREE.Object3D;
    cover?: THREE.Object3D;
    bms?: THREE.Object3D;
    cooling?: THREE.Object3D;
    frontMotor?: THREE.Object3D;
    rearMotor?: THREE.Object3D;
    inverter?: THREE.Object3D;
    hvCables?: THREE.Object3D;
    frontLeftWheel?: THREE.Object3D;
    frontRightWheel?: THREE.Object3D;
    rearLeftWheel?: THREE.Object3D;
    rearRightWheel?: THREE.Object3D;
    busbars?: THREE.Object3D[];
    leftModules?: THREE.Object3D[];
    rightModules?: THREE.Object3D[];
  }>({});

  const cameraTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(7.2, 3.2, 7.8));
  const cameraTargetLookRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.35, 0));
  const cameraLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.35, 0));

  // Explode lerp tracking
  const currentExplodeRef = useRef<number>(0);
  const targetExplodeRef = useRef<number>(0);

  // Store callback props in stable refs
  const onSelectComponentRef = useRef(onSelectComponent);
  onSelectComponentRef.current = onSelectComponent;
  const onSelectCellRef = useRef(onSelectCell);
  onSelectCellRef.current = onSelectCell;
  const onSelectModuleRef = useRef(onSelectModule);
  onSelectModuleRef.current = onSelectModule;
  const onExplodePercentageChangeRef = useRef(onExplodePercentageChange);
  onExplodePercentageChangeRef.current = onExplodePercentageChange;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('perspective');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  const { theme } = useTheme();

  // Camera preset transitions
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
    if (!cameraRef.current) return;
    switch (preset) {
      case 'perspective':
        cameraTargetPosRef.current.set(7.2, 3.2, 7.8);
        cameraTargetLookRef.current.set(0, 0.35, 0);
        break;
      case 'front':
        cameraTargetPosRef.current.set(0, 1.2, 8.8);
        cameraTargetLookRef.current.set(0, 0.45, 0);
        break;
      case 'side':
        cameraTargetPosRef.current.set(8.8, 1.2, 0);
        cameraTargetLookRef.current.set(0, 0.35, 0);
        break;
      case 'rear':
        cameraTargetPosRef.current.set(0, 1.2, -8.8);
        cameraTargetLookRef.current.set(0, 0.45, 0);
        break;
      case 'top':
        cameraTargetPosRef.current.set(0.01, 10.5, 0);
        cameraTargetLookRef.current.set(0, 0, 0);
        break;
    }
  }, []);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.82 : 1.18;
    cameraTargetPosRef.current.multiplyScalar(factor);
    cameraTargetPosRef.current.clampLength(3.5, 20.0);
  };

  const handleReset = () => {
    applyCameraPreset('perspective');
    if (carGroupRef.current) {
      carGroupRef.current.rotation.set(0, 0, 0);
    }
    if (onExplodePercentageChangeRef.current) {
      onExplodePercentageChangeRef.current(0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ============================================================
  // 1. PRIMARY MOUNT EFFECT (Initializes Three.js engine & builds car ONCE)
  // ============================================================
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const initialBgColor = new THREE.Color(
      theme === 'dark' ? 0x171c22 : theme === 'eye' ? 0xf3efe5 : 0xffffff
    );
    scene.background = initialBgColor;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.copy(cameraTargetPosRef.current);
    camera.lookAt(cameraTargetLookRef.current);
    cameraRef.current = camera;

    // WebGL Renderer with anti-aliasing & PBR tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme === 'dark' ? 1.12 : 1.20;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting rig: Studio Key, Fill, Rim, Top & Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 1.6 : 2.1);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Key Light (warm studio white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(7, 12, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Fill Light (soft electric-blue reflection)
    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 1.4);
    fillLight.position.set(-7, 6, -6);
    scene.add(fillLight);

    // Rim Light (sharp contour definition)
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.8);
    rimLight.position.set(-5, 7, 9);
    scene.add(rimLight);

    // Underbody Uplight (illuminates battery pack in underfloor views)
    const underLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    underLight.position.set(0, -6, 0);
    scene.add(underLight);

    // Ground Grid Helper
    const grid = new THREE.GridHelper(24, 32, 0x94a3b8, 0xe2e8f0);
    grid.position.y = -0.95;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Soft Radial Ground Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(6.6, 3.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const gradient = sCtx.createRadialGradient(64, 64, 20, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(6, 44, 92, 0.45)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.20)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = gradient;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: theme === 'dark' ? 0.75 : 0.48,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.945;
    scene.add(shadowPlane);

    // Car Root Group
    const carGroup = new THREE.Group();
    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // Subsystem Groups for Independent Controls
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'Group_Body';
    carGroup.add(bodyGroup);
    groupRefs.current.bodyGroup = bodyGroup;

    const glassGroup = new THREE.Group();
    glassGroup.name = 'Group_Glass';
    carGroup.add(glassGroup);
    groupRefs.current.glassGroup = glassGroup;

    const chassisGroup = new THREE.Group();
    chassisGroup.name = 'Group_Chassis';
    carGroup.add(chassisGroup);
    groupRefs.current.chassisGroup = chassisGroup;

    const batteryGroup = new THREE.Group();
    batteryGroup.name = 'Group_Battery';
    carGroup.add(batteryGroup);
    groupRefs.current.batteryGroup = batteryGroup;

    const powertrainGroup = new THREE.Group();
    powertrainGroup.name = 'Group_Powertrain';
    carGroup.add(powertrainGroup);
    groupRefs.current.powertrainGroup = powertrainGroup;

    const wheelsGroup = new THREE.Group();
    wheelsGroup.name = 'Group_Wheels';
    carGroup.add(wheelsGroup);
    groupRefs.current.wheelsGroup = wheelsGroup;

    const coolingGroup = new THREE.Group();
    coolingGroup.name = 'Group_Cooling';
    carGroup.add(coolingGroup);
    groupRefs.current.coolingGroup = coolingGroup;

    const hvCablesGroup = new THREE.Group();
    hvCablesGroup.name = 'Group_HVCables';
    carGroup.add(hvCablesGroup);
    groupRefs.current.hvCablesGroup = hvCablesGroup;

    // ============================================================
    // PBR AUTOMOTIVE MATERIALS — METALLIC SAPPHIRE BLUE PALETTE
    // ============================================================
    // Main Body: Deep Metallic Sapphire Blue (#0756B8)
    const sapphireBluePaintMat = new THREE.MeshPhysicalMaterial({
      color: 0x0756b8,
      metalness: 0.84,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x8bc8ff),
      specularColor: new THREE.Color(0x43a5ff),
      name: 'Mat_Metallic_Sapphire_Blue',
    });

    // Shadow Blue Accent (#062C5C)
    const shadowBlueAccentMat = new THREE.MeshPhysicalMaterial({
      color: 0x062c5c,
      metalness: 0.80,
      roughness: 0.24,
      clearcoat: 0.8,
      name: 'Mat_Shadow_Blue_Accent',
    });

    // Dark Trim & Aerodynamic Diffuser
    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x11161d,
      metalness: 0.50,
      roughness: 0.45,
      name: 'Mat_Dark_Trim',
    });

    // Tinted Automotive Glass Canopy
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1017,
      metalness: 0.30,
      roughness: 0.03,
      transmission: 0.70,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
      name: 'Mat_Glass_Canopy',
    });

    // Dual Projector Cool-White Headlights
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.90,
      roughness: 0.10,
      emissive: 0xecfeff,
      emissiveIntensity: 1.1,
      name: 'Mat_Headlight_LED',
    });

    // Daytime Running Lights (DRL) Accent Strip
    const drlMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.4,
      name: 'Mat_DRL_Strip',
    });

    // Rear Full-Width Red LED Light Bar
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff1e28,
      metalness: 0.50,
      roughness: 0.15,
      emissive: 0xd90416,
      emissiveIntensity: 1.2,
      name: 'Mat_Taillight_LED',
    });

    // Brushed Silver Alloy Wheels
    const alloyRimMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.94,
      roughness: 0.18,
      name: 'Mat_Alloy_Rim',
    });

    // Dark Turbine Spokes
    const darkSpokesMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.85,
      roughness: 0.30,
      name: 'Mat_Dark_Spokes',
    });

    // Matte Black Rubber Tires
    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x121417,
      metalness: 0.05,
      roughness: 0.90,
      name: 'Mat_Tire_Rubber',
    });

    // Performance Red Brembo Calipers
    const brakeCaliperMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.65,
      roughness: 0.22,
      name: 'Mat_Brake_Caliper',
    });

    // Structural Aluminum Chassis Spaceframe
    const spaceframeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.32,
      name: 'Mat_Chassis_Spaceframe',
    });

    // High Voltage Cables (Industrial Orange #F97316)
    const hvCableMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      metalness: 0.60,
      roughness: 0.35,
      emissive: 0xc2410c,
      emissiveIntensity: 0.45,
      name: 'Mat_HV_Cable',
    });

    // Liquid Cooling Loop (Vibrant Blue #2563EB)
    const coolingPipeMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.75,
      roughness: 0.25,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.50,
      name: 'Mat_Cooling_Pipe',
    });

    // Electric Motors (High-Voltage Purple #8B5CF6)
    const motorMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.80,
      roughness: 0.28,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.30,
      name: 'Mat_Powertrain_Motor',
    });

    // Silicon-Carbide Traction Inverter (Yellow #EAB308)
    const inverterMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.78,
      roughness: 0.25,
      emissive: 0xca8a04,
      emissiveIntensity: 0.35,
      name: 'Mat_Inverter_Unit',
    });

    // ============================================================
    // 1. SCULPTED AERODYNAMIC EXTERIOR BODY (Sapphire Blue Fastback)
    // ============================================================
    const bodyProfile = new THREE.Shape();
    bodyProfile.moveTo(-2.30, 0.28); // Rear bumper bottom
    bodyProfile.lineTo(-1.88, 0.26);
    // Rear wheel arch cutout (z = -1.42, r = 0.45)
    bodyProfile.absarc(-1.42, 0.36, 0.45, Math.PI, 0, true);
    bodyProfile.lineTo(-0.95, 0.25);
    // Rocker panel
    bodyProfile.lineTo(0.95, 0.25);
    // Front wheel arch cutout (z = 1.44, r = 0.45)
    bodyProfile.absarc(1.44, 0.36, 0.45, Math.PI, 0, true);
    bodyProfile.lineTo(2.18, 0.25);
    // Front nose & aerodynamic splitter
    bodyProfile.bezierCurveTo(2.42, 0.28, 2.48, 0.46, 2.38, 0.62);
    // Sleek Sculpted Hood
    bodyProfile.bezierCurveTo(2.08, 0.76, 1.48, 0.83, 0.96, 0.86);
    // Fastback Windshield Base
    bodyProfile.bezierCurveTo(0.66, 1.12, 0.38, 1.34, 0.05, 1.36);
    // Aerodynamic Coupe Roofline
    bodyProfile.bezierCurveTo(-0.46, 1.38, -0.88, 1.29, -1.40, 1.06);
    // Integrated Rear Spoiler Decklid
    bodyProfile.bezierCurveTo(-1.78, 0.94, -2.10, 0.90, -2.26, 0.86);
    // Rear Aero Fascia
    bodyProfile.bezierCurveTo(-2.36, 0.72, -2.36, 0.46, -2.30, 0.28);

    const bodyExtrude = new THREE.ExtrudeGeometry(bodyProfile, {
      depth: 1.76,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.07,
      bevelSegments: 6,
      curveSegments: 26,
    });
    bodyExtrude.translate(0, 0, -0.88);
    bodyExtrude.rotateY(-Math.PI / 2);

    const bodyMesh = new THREE.Mesh(bodyExtrude, sapphireBluePaintMat);
    bodyMesh.name = 'Chassis_Body_Main';
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyGroup.add(bodyMesh);
    bodyMeshesRef.current.push(bodyMesh);
    animatedPartsRef.current.bodyShell = bodyMesh;
    meshRefs.current['Chassis'] = bodyMesh;

    // Recessed Side Door Handle Accents
    for (const side of [-0.91, 0.91]) {
      const handleGeo = new THREE.BoxGeometry(0.02, 0.04, 0.16);
      const handleMesh = new THREE.Mesh(handleGeo, alloyRimMat);
      handleMesh.position.set(side, 0.74, 0.45);
      bodyGroup.add(handleMesh);

      const rearHandle = new THREE.Mesh(handleGeo, alloyRimMat);
      rearHandle.position.set(side, 0.75, -0.45);
      bodyGroup.add(rearHandle);
    }

    // Front Aerodynamic Splitter Lip
    const splitterGeo = new THREE.BoxGeometry(1.68, 0.04, 0.22);
    const splitterMesh = new THREE.Mesh(splitterGeo, darkTrimMat);
    splitterMesh.position.set(0, 0.26, 2.32);
    bodyGroup.add(splitterMesh);

    // Rear Aero Diffuser with Vertical Fins
    const diffuserGeo = new THREE.BoxGeometry(1.64, 0.08, 0.24);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, darkTrimMat);
    diffuserMesh.position.set(0, 0.27, -2.28);
    bodyGroup.add(diffuserMesh);

    // ============================================================
    // 2. PANORAMIC TINTED GLASS CANOPY
    // ============================================================
    const glassProfile = new THREE.Shape();
    glassProfile.moveTo(0.86, 0.87);
    glassProfile.bezierCurveTo(0.60, 1.11, 0.36, 1.31, 0.04, 1.34);
    glassProfile.bezierCurveTo(-0.43, 1.36, -0.84, 1.28, -1.36, 1.04);
    glassProfile.lineTo(-1.40, 0.91);
    glassProfile.lineTo(0.86, 0.87);

    const glassExtrude = new THREE.ExtrudeGeometry(glassProfile, {
      depth: 1.48,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 18,
    });
    glassExtrude.translate(0, 0, -0.74);
    glassExtrude.rotateY(-Math.PI / 2);

    const glassMesh = new THREE.Mesh(glassExtrude, glassMat);
    glassMesh.name = 'Glass_Canopy';
    glassGroup.add(glassMesh);
    glassMeshesRef.current.push(glassMesh);
    animatedPartsRef.current.glassCanopy = glassMesh;
    meshRefs.current['Glass Canopy'] = glassMesh;

    // ============================================================
    // 3. PROJECTOR HEADLIGHTS, DRL STRIPS & REAR LIGHT BAR
    // ============================================================
    const headlightGeo = new THREE.BoxGeometry(0.36, 0.11, 0.20);
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.63, 0.65, 2.26);
    leftHeadlight.rotation.y = -0.22;
    bodyGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.63, 0.65, 2.26);
    rightHeadlight.rotation.y = 0.22;
    bodyGroup.add(rightHeadlight);

    // Sweeping LED DRL Eyebrows
    const drlGeo = new THREE.BoxGeometry(0.38, 0.025, 0.12);
    const leftDrl = new THREE.Mesh(drlGeo, drlMat);
    leftDrl.position.set(-0.64, 0.72, 2.28);
    leftDrl.rotation.y = -0.22;
    bodyGroup.add(leftDrl);

    const rightDrl = new THREE.Mesh(drlGeo, drlMat);
    rightDrl.position.set(0.64, 0.72, 2.28);
    rightDrl.rotation.y = 0.22;
    bodyGroup.add(rightDrl);

    // Front Closed EV Grille Trim with Micro Texture
    const grilleGeo = new THREE.BoxGeometry(0.86, 0.22, 0.05);
    const grilleMesh = new THREE.Mesh(grilleGeo, darkTrimMat);
    grilleMesh.position.set(0, 0.44, 2.37);
    bodyGroup.add(grilleMesh);

    // Rear Continuous LED Taillight Bar
    const taillightGeo = new THREE.BoxGeometry(1.62, 0.08, 0.06);
    const taillightMesh = new THREE.Mesh(taillightGeo, taillightMat);
    taillightMesh.position.set(0, 0.83, -2.28);
    bodyGroup.add(taillightMesh);

    // Aerodynamic Side Mirrors with Indicator Repeater
    for (const [xPos, rotY] of [[-0.98, -0.1], [0.98, 0.1]]) {
      const mirrorGroup = new THREE.Group();
      mirrorGroup.position.set(xPos, 0.92, 0.82);

      const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.16);
      const mirrorBody = new THREE.Mesh(mirrorGeo, sapphireBluePaintMat);
      mirrorGroup.add(mirrorBody);
      bodyMeshesRef.current.push(mirrorBody);

      const repeaterGeo = new THREE.BoxGeometry(0.02, 0.03, 0.14);
      const repeaterMesh = new THREE.Mesh(repeaterGeo, drlMat);
      repeaterMesh.position.set(xPos > 0 ? 0.12 : -0.12, 0, 0);
      mirrorGroup.add(repeaterMesh);

      bodyGroup.add(mirrorGroup);
    }

    // ============================================================
    // 4. DETAILED 5-SPOKE TURBINE ALLOY WHEELS & BRAKE ASSEMBLY
    // ============================================================
    const createWheelAssembly = (x: number, y: number, z: number, isRightSide: boolean) => {
      const wheelSubgroup = new THREE.Group();
      wheelSubgroup.position.set(x, y, z);

      // Treaded Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 32);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, tireRubberMat);
      tireMesh.castShadow = true;
      wheelSubgroup.add(tireMesh);

      // Outer Brushed Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.27, 24);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, alloyRimMat);
      wheelSubgroup.add(rimMesh);

      // 5-Spoke Aerodynamic Turbine Blade Center
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.24, 0.05);
        const spokeMesh = new THREE.Mesh(spokeGeo, darkSpokesMat);
        spokeMesh.rotation.x = (s * Math.PI * 2) / 5;
        spokeMesh.position.x = isRightSide ? 0.08 : -0.08;
        wheelSubgroup.add(spokeMesh);
      }

      // Center Wheel Cap (Sapphire Blue Accent)
      const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16);
      capGeo.rotateZ(Math.PI / 2);
      const capMesh = new THREE.Mesh(capGeo, sapphireBluePaintMat);
      capMesh.position.x = isRightSide ? 0.14 : -0.14;
      wheelSubgroup.add(capMesh);

      // Ventilated Brake Disc
      const discGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24);
      discGeo.rotateZ(Math.PI / 2);
      const discMesh = new THREE.Mesh(discGeo, alloyRimMat);
      wheelSubgroup.add(discMesh);

      // Performance Red Brembo Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.10);
      const caliperMesh = new THREE.Mesh(caliperGeo, brakeCaliperMat);
      caliperMesh.position.set(0, 0.16, 0.06);
      wheelSubgroup.add(caliperMesh);

      return wheelSubgroup;
    };

    const frontLeftWheel = createWheelAssembly(-0.92, 0.36, 1.44, false);
    wheelsGroup.add(frontLeftWheel);
    animatedPartsRef.current.frontLeftWheel = frontLeftWheel;

    const frontRightWheel = createWheelAssembly(0.92, 0.36, 1.44, true);
    wheelsGroup.add(frontRightWheel);
    animatedPartsRef.current.frontRightWheel = frontRightWheel;

    const rearLeftWheel = createWheelAssembly(-0.92, 0.36, -1.42, false);
    wheelsGroup.add(rearLeftWheel);
    animatedPartsRef.current.rearLeftWheel = rearLeftWheel;

    const rearRightWheel = createWheelAssembly(0.92, 0.36, -1.42, true);
    wheelsGroup.add(rearRightWheel);
    animatedPartsRef.current.rearRightWheel = rearRightWheel;

    // ============================================================
    // 5. INTERNAL CHASSIS SPACEFRAME & STRUCTURAL RAILS (X-Ray Visible)
    // ============================================================
    const chassisFrameGroup = new THREE.Group();
    chassisGroup.add(chassisFrameGroup);
    animatedPartsRef.current.chassisFrame = chassisFrameGroup;

    // Left and Right Longitudinal Chassis Frame Rails
    for (const xRail of [-0.68, 0.68]) {
      const railGeo = new THREE.BoxGeometry(0.08, 0.12, 3.8);
      const railMesh = new THREE.Mesh(railGeo, spaceframeMat);
      railMesh.position.set(xRail, 0.42, 0);
      chassisFrameGroup.add(railMesh);
    }

    // Cross-member structural bulkheads
    for (const zCross of [-1.4, -0.6, 0.2, 1.0, 1.8]) {
      const crossGeo = new THREE.BoxGeometry(1.36, 0.08, 0.08);
      const crossMesh = new THREE.Mesh(crossGeo, spaceframeMat);
      crossMesh.position.set(0, 0.42, zCross);
      chassisFrameGroup.add(crossMesh);
    }

    // Suspension strut towers (Front & Rear)
    for (const xStrut of [-0.75, 0.75]) {
      for (const zStrut of [-1.42, 1.44]) {
        const towerGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 12);
        const towerMesh = new THREE.Mesh(towerGeo, spaceframeMat);
        towerMesh.position.set(xStrut, 0.55, zStrut);
        chassisFrameGroup.add(towerMesh);
      }
    }

    // ============================================================
    // 6. UNDERFLOOR MODULAR BATTERY PACK (Dissectable & Cell-Level)
    // ============================================================
    animatedPartsRef.current.busbars = [];
    animatedPartsRef.current.leftModules = [];
    animatedPartsRef.current.rightModules = [];

    // Structural Ballistic Aluminum Tray (Bottom enclosure)
    const trayGeo = new THREE.BoxGeometry(1.38, 0.12, 2.48);
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35,
      name: 'Mat_Battery_Structural_Tray',
    });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.position.set(0, 0.14, 0);
    trayMesh.name = 'Battery_Tray';
    batteryGroup.add(trayMesh);
    animatedPartsRef.current.tray = trayMesh;
    meshRefs.current['Battery Pack'] = trayMesh;

    // Top Protective Seal Enclosure Cover Shield
    const coverGeo = new THREE.BoxGeometry(1.40, 0.04, 2.50);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.30,
      name: 'Mat_Battery_Top_Cover',
    });
    const coverMesh = new THREE.Mesh(coverGeo, coverMat);
    coverMesh.position.set(0, 0.33, 0);
    coverMesh.name = 'Battery_Cover';
    batteryGroup.add(coverMesh);
    animatedPartsRef.current.cover = coverMesh;

    // Active Liquid Cooling Cold-Plate & Dual Longitudinal Coolant Pipes
    const coolingSubgroup = new THREE.Group();
    coolingSubgroup.position.set(0, 0.18, 0);

    const plateGeo = new THREE.BoxGeometry(1.34, 0.02, 2.42);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.65,
      roughness: 0.25,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.40,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    coolingSubgroup.add(plateMesh);

    // 2 Coolant Manifold Distribution Pipes
    const pipeGeo = new THREE.CylinderGeometry(0.024, 0.024, 2.38, 16);
    pipeGeo.rotateX(Math.PI / 2);
    const leftPipe = new THREE.Mesh(pipeGeo, coolingPipeMat);
    leftPipe.position.set(-0.46, 0.025, 0);
    coolingSubgroup.add(leftPipe);

    const rightPipe = new THREE.Mesh(pipeGeo, coolingPipeMat);
    rightPipe.position.set(0.46, 0.025, 0);
    coolingSubgroup.add(rightPipe);

    batteryGroup.add(coolingSubgroup);
    animatedPartsRef.current.cooling = coolingSubgroup;
    meshRefs.current['Cooling System'] = coolingSubgroup;

    // ============================================================
    // 7. 10 DISCRETE BATTERY MODULES WITH DETAILED INDIVIDUAL CELLS
    // ============================================================
    const cellModuleGeo = new THREE.BoxGeometry(0.54, 0.12, 0.43);

    for (let c = 1; c <= 10; c++) {
      const isRightRow = c > 5;
      const rowIdx = (c - 1) % 5;
      const xPos = isRightRow ? 0.37 : -0.37;
      const zPos = 0.88 - rowIdx * 0.45;

      const moduleGroup = new THREE.Group();
      moduleGroup.position.set(xPos, 0.25, zPos);
      batteryGroup.add(moduleGroup);

      // Module Casing Mesh (Electric Cyan #06B6D4)
      const moduleMat = new THREE.MeshStandardMaterial({
        color: c === 1 ? 0xeab308 : 0x06b6d4, // Cell 1 warning color vs nominal cyan
        metalness: 0.70,
        roughness: 0.30,
        emissive: c === 1 ? 0xca8a04 : 0x0891b2,
        emissiveIntensity: 0.30,
        name: `Mat_Module_${String(c).padStart(2, '0')}`,
      });

      const moduleMesh = new THREE.Mesh(cellModuleGeo, moduleMat);
      moduleMesh.name = `Cell_${String(c).padStart(2, '0')}`;
      moduleMesh.castShadow = true;
      moduleMesh.receiveShadow = true;
      moduleGroup.add(moduleMesh);

      moduleRefs.current[c] = moduleMesh;

      // Internal Cylindrical Micro-Cells inside each module brick
      // 8 Individual Cells per Module (arranged 2x4)
      const cellCylGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.09, 16);
      for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 4; col++) {
          const cellX = (r - 0.5) * 0.20;
          const cellZ = (col - 1.5) * 0.095;
          const cylMat = new THREE.MeshStandardMaterial({
            color: 0x16a34a, // Nominal healthy green
            metalness: 0.80,
            roughness: 0.20,
            emissive: 0x15803d,
            emissiveIntensity: 0.30,
          });
          const cylMesh = new THREE.Mesh(cellCylGeo, cylMat);
          cylMesh.position.set(cellX, 0.02, cellZ);
          cylMesh.name = `CylCell_M${c}_R${r}C${col}`;
          moduleGroup.add(cylMesh);
          cellCylinderRefs.current[`${c}_${r}_${col}`] = cylMesh;
        }
      }

      if (!isRightRow) {
        animatedPartsRef.current.leftModules?.push(moduleGroup);
      } else {
        animatedPartsRef.current.rightModules?.push(moduleGroup);
      }

      // Copper interconnecting busbar between adjacent modules
      if (rowIdx < 4) {
        const busbarGeo = new THREE.BoxGeometry(0.12, 0.02, 0.16);
        const busbarMat = new THREE.MeshStandardMaterial({
          color: 0xb87333,
          metalness: 0.95,
          roughness: 0.18,
        });
        const busbarMesh = new THREE.Mesh(busbarGeo, busbarMat);
        busbarMesh.position.set(xPos, 0.32, zPos - 0.22);
        batteryGroup.add(busbarMesh);
        animatedPartsRef.current.busbars?.push(busbarMesh);
      }
    }

    // Master BMS Enclosure at front of pack
    const bmsGeo = new THREE.BoxGeometry(0.74, 0.10, 0.28);
    const bmsMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.75,
      roughness: 0.28,
    });
    const bmsMesh = new THREE.Mesh(bmsGeo, bmsMat);
    bmsMesh.position.set(0, 0.27, 1.26);
    bmsMesh.name = 'BMS_Master_Unit';
    batteryGroup.add(bmsMesh);
    animatedPartsRef.current.bms = bmsMesh;
    meshRefs.current['BMS'] = bmsMesh;

    // ============================================================
    // 8. FRONT & REAR MOTORS, SIC INVERTER & HIGH-VOLTAGE HARNESS
    // ============================================================
    // Front Motor (Purple PMSM #8B5CF6)
    const motorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.46, 24);
    motorGeo.rotateZ(Math.PI / 2);
    const frontMotor = new THREE.Mesh(motorGeo, motorMat);
    frontMotor.position.set(0, 0.38, 1.44);
    frontMotor.name = 'Front_Motor_Assembly';
    powertrainGroup.add(frontMotor);
    animatedPartsRef.current.frontMotor = frontMotor;
    meshRefs.current['Front Motor'] = frontMotor;

    // Rear Dual-Drive Motor (Purple #8B5CF6)
    const rearMotor = new THREE.Mesh(motorGeo, motorMat);
    rearMotor.position.set(0, 0.38, -1.42);
    rearMotor.name = 'Rear_Motor_Assembly';
    powertrainGroup.add(rearMotor);
    animatedPartsRef.current.rearMotor = rearMotor;
    meshRefs.current['Rear Motor'] = rearMotor;

    // Silicon-Carbide Traction Inverter (Yellow #EAB308)
    const inverterGeo = new THREE.BoxGeometry(0.48, 0.18, 0.34);
    const inverterMesh = new THREE.Mesh(inverterGeo, inverterMat);
    inverterMesh.position.set(0, 0.59, -1.42);
    inverterMesh.name = 'Inverter_SiC_Unit';
    powertrainGroup.add(inverterMesh);
    animatedPartsRef.current.inverter = inverterMesh;
    meshRefs.current['Inverter'] = inverterMesh;

    // High-Voltage Orange Cables Harness (Routing front to rear)
    const cableCurvePoints = [
      new THREE.Vector3(0, 0.30, 1.15),
      new THREE.Vector3(0, 0.35, 1.35),
      new THREE.Vector3(0, 0.38, 1.44),
    ];
    const frontCableCurve = new THREE.CatmullRomCurve3(cableCurvePoints);
    const frontCableGeo = new THREE.TubeGeometry(frontCableCurve, 20, 0.024, 8, false);
    const frontCableMesh = new THREE.Mesh(frontCableGeo, hvCableMat);
    hvCablesGroup.add(frontCableMesh);

    const rearCableCurvePoints = [
      new THREE.Vector3(0, 0.30, -1.05),
      new THREE.Vector3(0, 0.42, -1.25),
      new THREE.Vector3(0, 0.58, -1.42),
    ];
    const rearCableCurve = new THREE.CatmullRomCurve3(rearCableCurvePoints);
    const rearCableGeo = new THREE.TubeGeometry(rearCableCurve, 20, 0.024, 8, false);
    const rearCableMesh = new THREE.Mesh(rearCableGeo, hvCableMat);
    hvCablesGroup.add(rearCableMesh);
    animatedPartsRef.current.hvCables = hvCablesGroup;

    // ============================================================
    // 9. ANIMATED ENERGY FLOW PARTICLES STREAM
    // ============================================================
    const particleCount = 90;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.8;
      positions[i * 3 + 1] = 0.25 + (Math.random() - 0.5) * 0.08;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.11,
      transparent: true,
      opacity: 0.80,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    carGroup.add(particles);
    flowParticlesRef.current = particles;

    // ============================================================
    // 10. INTERACTIVE DRAG, ROTATION, TOUCH & RAYCAST HANDLING
    // ============================================================
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !carGroupRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;
      carGroupRef.current.rotation.y += deltaX * 0.007;
      carGroupRef.current.rotation.x = Math.max(
        -0.35,
        Math.min(0.35, carGroupRef.current.rotation.x + deltaY * 0.004)
      );
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      e.preventDefault();
      const delta = e.deltaY * 0.005;
      cameraTargetPosRef.current.multiplyScalar(1 + delta);
      cameraTargetPosRef.current.clampLength(3.5, 20.0);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !carGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseRef.current.x;
      const deltaY = e.touches[0].clientY - prevMouseRef.current.y;
      carGroupRef.current.rotation.y += deltaX * 0.008;
      carGroupRef.current.rotation.x = Math.max(
        -0.35,
        Math.min(0.35, carGroupRef.current.rotation.x + deltaY * 0.005)
      );
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Raycast Click Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check module selection first
      const moduleTargets = Object.values(moduleRefs.current);
      const moduleHits = raycaster.intersectObjects(moduleTargets, true);
      if (moduleHits.length > 0) {
        const hit = moduleHits[0].object;
        for (const [idxStr, obj] of Object.entries(moduleRefs.current)) {
          if (obj === hit || obj.children.includes(hit)) {
            const modIdx = Number(idxStr);
            if (onSelectCellRef.current) onSelectCellRef.current(modIdx);
            if (onSelectModuleRef.current) onSelectModuleRef.current(modIdx);
            if (onSelectComponentRef.current) {
              onSelectComponentRef.current(`Battery Cell ${String(modIdx).padStart(2, '0')}`);
            }
            return;
          }
        }
      }

      // Check major named subsystems
      const targets = Object.values(meshRefs.current);
      const intersects = raycaster.intersectObjects(targets, true);
      if (intersects.length > 0 && onSelectComponentRef.current) {
        const hit = intersects[0].object;
        for (const [name, obj] of Object.entries(meshRefs.current)) {
          if (obj === hit || obj.children.includes(hit)) {
            onSelectComponentRef.current(name);
            break;
          }
        }
      }
    };
    container.addEventListener('click', onClick);

    // ============================================================
    // 11. DELTA-TIME RENDER LOOP (Target 60 FPS Smooth Interpolation)
    // ============================================================
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera position & lookAt lerp
      camera.position.lerp(cameraTargetPosRef.current, delta * 4.5);
      cameraLookAtRef.current.lerp(cameraTargetLookRef.current, delta * 4.5);
      camera.lookAt(cameraLookAtRef.current);

      // Idle vehicle rotation when not dragging & not exploded
      if (!isDraggingRef.current && carGroupRef.current && isAutoRotating) {
        carGroupRef.current.rotation.y += delta * 0.12 * animationSpeed;
      }

      // Smooth explode lerp
      currentExplodeRef.current = THREE.MathUtils.lerp(
        currentExplodeRef.current,
        targetExplodeRef.current,
        delta * 5.0 * animationSpeed
      );
      const ef = currentExplodeRef.current;
      const parts = animatedPartsRef.current;

      // 10-Axis Component Spatial Separation
      if (parts.bodyShell) parts.bodyShell.position.y = ef * 1.25;
      if (parts.glassCanopy) parts.glassCanopy.position.y = ef * 1.65;
      if (parts.cover) parts.cover.position.y = 0.33 + ef * 0.85;
      if (parts.tray) parts.tray.position.y = 0.14 - ef * 0.55;
      if (parts.cooling) parts.cooling.position.y = 0.18 - ef * 0.30;
      if (parts.bms) parts.bms.position.z = 1.26 + ef * 0.70;
      if (parts.frontMotor) parts.frontMotor.position.z = 1.44 + ef * 0.65;
      if (parts.rearMotor) parts.rearMotor.position.z = -1.42 - ef * 0.65;
      if (parts.inverter) {
        parts.inverter.position.y = 0.59 + ef * 0.70;
        parts.inverter.position.z = -1.42 - ef * 0.35;
      }
      if (parts.frontLeftWheel) parts.frontLeftWheel.position.x = -0.92 - ef * 0.75;
      if (parts.frontRightWheel) parts.frontRightWheel.position.x = 0.92 + ef * 0.75;
      if (parts.rearLeftWheel) parts.rearLeftWheel.position.x = -0.92 - ef * 0.75;
      if (parts.rearRightWheel) parts.rearRightWheel.position.x = 0.92 + ef * 0.75;

      if (parts.busbars) {
        parts.busbars.forEach((b) => (b.position.y = 0.32 + ef * 0.55));
      }
      if (parts.leftModules) {
        parts.leftModules.forEach((m) => (m.position.x = -0.37 - ef * 0.50));
      }
      if (parts.rightModules) {
        parts.rightModules.forEach((m) => (m.position.x = 0.37 + ef * 0.50));
      }

      // Energy flow stream animation
      if (flowParticlesRef.current) {
        const posAttr = flowParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          arr[i * 3] += (i % 2 === 0 ? 1 : -1) * delta * 2.2 * animationSpeed;
          if (arr[i * 3] > 1.9) arr[i * 3] = -0.2;
          if (arr[i * 3] < -1.9) arr[i * 3] = -0.2;
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

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
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // 2. THEME EFFECT: Non-destructive background and ambient lighting
  // ============================================================
  useEffect(() => {
    if (!sceneRef.current) return;
    const bgCol = new THREE.Color(
      theme === 'dark' ? 0x171c22 : theme === 'eye' ? 0xf3efe5 : 0xffffff
    );
    sceneRef.current.background = bgCol;

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = theme === 'dark' ? 1.6 : 2.1;
    }
  }, [theme]);

  // ============================================================
  // 3. EXPLORATION MODE & TRANSPARENCY EFFECT
  // ============================================================
  useEffect(() => {
    const isXray = explorationMode === 'transparent';
    const isBatteryFocus = explorationMode === 'battery_focus';
    const isCellInspect = explorationMode === 'cell_inspect';
    const isExploded = explorationMode === 'exploded';

    // Set explode target factor (0.0 to 1.0)
    targetExplodeRef.current = isExploded ? (explodePercentage > 0 ? explodePercentage / 100 : 1.0) : 0.0;

    // Body transparency configuration
    bodyMeshesRef.current.forEach((mesh) => {
      if (mesh.material instanceof THREE.Material) {
        if (isXray) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.18;
          mesh.material.depthWrite = false;
        } else if (isBatteryFocus) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.06;
          mesh.material.depthWrite = false;
        } else if (isCellInspect) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.08;
          mesh.material.depthWrite = false;
        } else if (isExploded) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.depthWrite = true;
        } else {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.depthWrite = true;
        }
        mesh.material.needsUpdate = true;
      }
    });

    // Glass transparency configuration
    glassMeshesRef.current.forEach((mesh) => {
      if (mesh.material instanceof THREE.Material) {
        mesh.material.transparent = true;
        mesh.material.opacity = isXray || isBatteryFocus || isCellInspect ? 0.05 : 0.85;
        mesh.material.needsUpdate = true;
      }
    });

    // Camera preset transitions per mode
    if (isBatteryFocus) {
      cameraTargetPosRef.current.set(3.5, 4.2, 4.5);
      cameraTargetLookRef.current.set(0, 0.22, 0);
      setActivePreset('top');
    } else if (isCellInspect) {
      cameraTargetPosRef.current.set(0.01, 5.8, 0.1);
      cameraTargetLookRef.current.set(0, 0.24, 0);
      setActivePreset('top');
    } else if (isExploded) {
      cameraTargetPosRef.current.set(8.5, 4.5, 8.5);
      cameraTargetLookRef.current.set(0, 0.50, 0);
      setActivePreset('perspective');
    } else if (isXray) {
      cameraTargetPosRef.current.set(6.8, 2.8, 6.8);
      cameraTargetLookRef.current.set(0, 0.35, 0);
      setActivePreset('perspective');
    }
  }, [explorationMode, explodePercentage]);

  // ============================================================
  // 4. COMPONENT VISIBILITY CONTROLS EFFECT
  // ============================================================
  useEffect(() => {
    const grps = groupRefs.current;
    if (grps.bodyGroup) grps.bodyGroup.visible = visibility.body;
    if (grps.glassGroup) grps.glassGroup.visible = visibility.glass;
    if (grps.chassisGroup) grps.chassisGroup.visible = visibility.chassis;
    if (grps.batteryGroup) grps.batteryGroup.visible = visibility.battery;
    if (grps.powertrainGroup) grps.powertrainGroup.visible = visibility.powertrain;
    if (grps.wheelsGroup) grps.wheelsGroup.visible = visibility.wheels;
    if (grps.coolingGroup) grps.coolingGroup.visible = visibility.cooling;
  }, [visibility]);

  // ============================================================
  // 5. CELL STATUS TELEMETRY & COLOR MAPPING EFFECT
  // ============================================================
  useEffect(() => {
    // Helper to determine status color
    const getStatusColor = (status: string, temp: number, volt: number) => {
      if (temp >= 55) return { color: 0xdc2626, emissive: 0xb91c1c }; // Critical Red
      if (temp >= 45 || status === 'WARNING') return { color: 0xea580c, emissive: 0xc2410c }; // High Temp Orange
      if (status === 'CHARGING') return { color: 0x06b6d4, emissive: 0x0891b2 }; // Cyan
      if (status === 'DISCHARGING') return { color: 0x2563eb, emissive: 0x1d4ed8 }; // Blue
      if (status === 'UNBALANCED' || Math.abs(volt - 3.65) > 0.15) return { color: 0xca8a04, emissive: 0xa16207 }; // Yellow
      if (status === 'OFFLINE' || status === 'UNAVAILABLE') return { color: 0x64748b, emissive: 0x475569 }; // Grey
      return { color: 0x16a34a, emissive: 0x15803d }; // Normal Green
    };

    if (cellTelemetry && cellTelemetry.length > 0) {
      cellTelemetry.forEach((item) => {
        const modMesh = moduleRefs.current[item.cell_index];
        if (modMesh && modMesh.material instanceof THREE.MeshStandardMaterial) {
          const cfg = getStatusColor(item.status, item.temperature, item.voltage);
          modMesh.material.color.setHex(cfg.color);
          modMesh.material.emissive.setHex(cfg.emissive);
          modMesh.material.emissiveIntensity = 0.35;
        }
      });
    }

    // Highlight selected cell/module
    if (selectedCellIndex && moduleRefs.current[selectedCellIndex]) {
      const activeMesh = moduleRefs.current[selectedCellIndex];
      if (activeMesh.material instanceof THREE.MeshStandardMaterial) {
        activeMesh.material.emissive.setHex(0x38bdf8);
        activeMesh.material.emissiveIntensity = 0.75;
      }
    }
  }, [cellTelemetry, selectedCellIndex]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[560px] relative rounded-[10px] overflow-hidden cursor-grab active:cursor-grabbing select-none border border-border ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-background' : ''
      }`}
    >
      {/* Top Left: Model Spec Badge & Dynamic Mode Indicator */}
      <div className="absolute top-3 left-3 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 pointer-events-none">
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-[4px] bg-surface-primary/95 text-primary-text border border-border backdrop-blur-xs shadow-subtle flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          VoltSense GT (Metallic Sapphire Blue)
        </span>
        <span className="text-[10px] font-mono px-2 py-1 rounded-[4px] bg-surface-secondary/95 text-accent-primary border border-border backdrop-blur-xs font-semibold uppercase">
          {explorationMode === 'complete' && 'Normal View'}
          {explorationMode === 'transparent' && 'Engineering X-Ray'}
          {explorationMode === 'battery_focus' && 'Battery Architecture'}
          {explorationMode === 'cell_inspect' && 'Cell Matrix HUD'}
          {explorationMode === 'exploded' && `Exploded View (${Math.round(currentExplodeRef.current * 100)}%)`}
        </span>
      </div>

      {/* Top Right: 5 Visual Exploration Mode Tabs */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-surface-primary/95 p-1 rounded-[6px] border border-border backdrop-blur-xs shadow-subtle flex-wrap justify-end">
        {[
          { id: 'complete', label: 'Normal' },
          { id: 'transparent', label: 'X-Ray' },
          { id: 'battery_focus', label: 'Battery Focus' },
          { id: 'cell_inspect', label: 'Cell Inspection' },
          { id: 'exploded', label: 'Exploded View' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => onExplorationModeChange && onExplorationModeChange(mode.id as ExplorationMode)}
            className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors font-medium ${
              explorationMode === mode.id
                ? 'bg-surface-secondary text-accent-primary border border-border font-semibold shadow-xs'
                : 'text-text-muted hover:text-primary-text'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* In-Canvas Exploded View Control Bar (Only visible when Exploded Mode is active) */}
      {explorationMode === 'exploded' && (
        <div className="absolute top-14 right-3 z-20 flex items-center gap-3 bg-surface-primary/95 px-3 py-1.5 rounded-[6px] border border-border backdrop-blur-xs shadow-subtle text-xs font-mono">
          <span className="text-text-muted flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-accent-primary" />
            Explode:
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={explodePercentage}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (onExplodePercentageChangeRef.current) {
                onExplodePercentageChangeRef.current(val);
              }
            }}
            className="w-24 sm:w-32 accent-accent-primary cursor-pointer"
          />
          <span className="text-primary-text font-bold w-9 text-right">{explodePercentage}%</span>
          <button
            onClick={() => onExplodePercentageChangeRef.current && onExplodePercentageChangeRef.current(0)}
            className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-text-muted hover:text-primary-text border border-border text-[11px]"
          >
            Reset
          </button>
        </div>
      )}

      {/* Mode-Specific Technical Legend (Floating Sub-HUD) */}
      <div className="absolute bottom-12 left-3 z-20 hidden md:flex items-center gap-2 bg-surface-primary/90 px-2.5 py-1 rounded-[6px] border border-border backdrop-blur-xs text-[10px] font-mono shadow-subtle">
        {explorationMode === 'transparent' && (
          <>
            <span className="text-text-muted">X-Ray Subsystems:</span>
            <span className="flex items-center gap-1 text-[#06b6d4] font-semibold"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> Battery</span>
            <span className="flex items-center gap-1 text-[#8b5cf6] font-semibold"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> Motor</span>
            <span className="flex items-center gap-1 text-[#eab308] font-semibold"><span className="w-2 h-2 rounded-full bg-[#eab308]" /> Inverter</span>
            <span className="flex items-center gap-1 text-[#f97316] font-semibold"><span className="w-2 h-2 rounded-full bg-[#f97316]" /> HV Cables</span>
            <span className="flex items-center gap-1 text-[#2563eb] font-semibold"><span className="w-2 h-2 rounded-full bg-[#2563eb]" /> Cooling</span>
          </>
        )}
        {explorationMode === 'cell_inspect' && (
          <>
            <span className="text-text-muted">Cell Status:</span>
            <span className="flex items-center gap-1 text-[#16a34a] font-semibold"><span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Nominal</span>
            <span className="flex items-center gap-1 text-[#06b6d4] font-semibold"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> Charge</span>
            <span className="flex items-center gap-1 text-[#2563eb] font-semibold"><span className="w-2 h-2 rounded-full bg-[#2563eb]" /> Discharge</span>
            <span className="flex items-center gap-1 text-[#ea580c] font-semibold"><span className="w-2 h-2 rounded-full bg-[#ea580c]" /> High Temp</span>
            <span className="flex items-center gap-1 text-[#dc2626] font-semibold"><span className="w-2 h-2 rounded-full bg-[#dc2626]" /> Critical</span>
          </>
        )}
        {explorationMode === 'battery_focus' && (
          <>
            <span className="text-text-muted">Pack Architecture:</span>
            <span className="flex items-center gap-1 text-[#06b6d4] font-semibold"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> 10 Modules</span>
            <span className="flex items-center gap-1 text-[#2563eb] font-semibold"><span className="w-2 h-2 rounded-full bg-[#2563eb]" /> Liquid Loop</span>
            <span className="flex items-center gap-1 text-[#b87333] font-semibold"><span className="w-2 h-2 rounded-full bg-[#b87333]" /> Cu Busbars</span>
            <span className="flex items-center gap-1 text-primary-text font-semibold"><span className="w-2 h-2 rounded-full bg-[#1e293b]" /> Al Tray</span>
          </>
        )}
        {explorationMode === 'complete' && (
          <>
            <span className="text-text-muted">PBR Finish:</span>
            <span className="flex items-center gap-1 text-[#43a5ff] font-semibold"><span className="w-2 h-2 rounded-full bg-[#0756b8]" /> Sapphire Blue Paint (Clearcoat 1.0)</span>
          </>
        )}
        {explorationMode === 'exploded' && (
          <>
            <span className="text-text-muted">Exploded Subsystems:</span>
            <span className="flex items-center gap-1 text-primary-text font-semibold">10-Axis Separation</span>
          </>
        )}
      </div>

      {/* Bottom Left: Camera Presets */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-surface-primary/95 p-1 rounded-[6px] border border-border backdrop-blur-xs shadow-subtle">
        <span className="text-[10px] font-mono text-text-muted px-1.5 hidden sm:inline-block">
          <Camera className="w-3.5 h-3.5 inline mr-1 text-accent-primary" />
          Camera:
        </span>
        {[
          { id: 'perspective', label: '3D Orbit' },
          { id: 'front', label: 'Front' },
          { id: 'side', label: 'Side' },
          { id: 'rear', label: 'Rear' },
          { id: 'top', label: 'Top' },
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyCameraPreset(preset.id as CameraPreset)}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono transition-colors ${
              activePreset === preset.id
                ? 'bg-surface-secondary text-accent-primary font-bold border border-border'
                : 'text-text-muted hover:text-primary-text'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleReset}
          className="p-1 rounded-[4px] text-text-muted hover:text-primary-text hover:bg-surface-secondary transition-colors"
          title="Reset Camera & Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Right: Zoom, Rotation & Fullscreen Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-surface-primary/95 p-1 rounded-[6px] border border-border backdrop-blur-xs shadow-subtle">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-1 rounded-[4px] transition-colors ${
            isAutoRotating ? 'text-accent-primary bg-surface-secondary' : 'text-text-muted hover:text-primary-text'
          }`}
          title={isAutoRotating ? 'Pause Orbit' : 'Resume Orbit'}
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => handleZoom('in')}
          className="p-1 rounded-[4px] text-text-muted hover:text-primary-text hover:bg-surface-secondary transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1 rounded-[4px] text-text-muted hover:text-primary-text hover:bg-surface-secondary transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded-[4px] text-text-muted hover:text-primary-text hover:bg-surface-secondary transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
