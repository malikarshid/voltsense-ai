import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
    }
    readAsArrayBuffer(blob) {
      if (blob && typeof blob.arrayBuffer === 'function') {
        blob
          .arrayBuffer()
          .then((buf) => {
            this.result = buf;
            if (this.onload) this.onload({ target: this });
            if (this.onloadend) this.onloadend({ target: this });
          })
          .catch((err) => {
            if (this.onerror) this.onerror(err);
          });
      }
    }
  };
}

console.log('Sculpting VoltSense AI Aerodynamic Metallic Sapphire Blue EV Model...');

const scene = new THREE.Scene();
scene.name = 'VoltSense_Blue_EV_Scene';

const rootGroup = new THREE.Group();
rootGroup.name = 'VoltSense_Blue_EV';
scene.add(rootGroup);

// Materials
const primaryPaintMat = new THREE.MeshPhysicalMaterial({
  color: 0x0756b8, // Deep Metallic Sapphire Blue
  roughness: 0.18,
  metalness: 0.84,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  name: 'Mat_Primary_Sapphire_Blue_Paint',
});

const secondaryPaintMat = new THREE.MeshPhysicalMaterial({
  color: 0x062c5c, // Accent Shadow Blue
  roughness: 0.24,
  metalness: 0.80,
  clearcoat: 0.8,
  name: 'Mat_Secondary_Blue_Paint',
});

const darkTrimMat = new THREE.MeshStandardMaterial({
  color: 0x171b20,
  roughness: 0.45,
  metalness: 0.4,
  name: 'Mat_Dark_Trim',
});

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x11171f,
  roughness: 0.06,
  metalness: 0.25,
  transparent: true,
  opacity: 0.82,
  name: 'Mat_Glass_Canopy',
});

const headlightMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.1,
  metalness: 0.9,
  emissive: 0xffffff,
  emissiveIntensity: 0.9,
  name: 'Mat_Headlight_LED',
});

const taillightMat = new THREE.MeshStandardMaterial({
  color: 0xff222d,
  roughness: 0.18,
  metalness: 0.5,
  emissive: 0xd90416,
  emissiveIntensity: 0.9,
  name: 'Mat_Taillight_Bar',
});

const alloyRimMat = new THREE.MeshStandardMaterial({
  color: 0xc8ced6,
  roughness: 0.22,
  metalness: 0.92,
  name: 'Mat_Alloy_Rim',
});

const darkAlloyMat = new THREE.MeshStandardMaterial({
  color: 0x262c34,
  roughness: 0.32,
  metalness: 0.82,
  name: 'Mat_Dark_Alloy',
});

const tireRubberMat = new THREE.MeshStandardMaterial({
  color: 0x16181b,
  roughness: 0.88,
  metalness: 0.05,
  name: 'Mat_Tire_Rubber',
});

const brakeRotorMat = new THREE.MeshStandardMaterial({
  color: 0x9da3aa,
  roughness: 0.25,
  metalness: 0.9,
  name: 'Mat_Brake_Rotor',
});

const brakeCaliperMat = new THREE.MeshStandardMaterial({
  color: 0xc92a2a,
  roughness: 0.28,
  metalness: 0.65,
  name: 'Mat_Brake_Caliper',
});

const batteryTrayMat = new THREE.MeshStandardMaterial({
  color: 0x1c232a,
  roughness: 0.45,
  metalness: 0.8,
  name: 'Mat_Battery_Tray',
});

const batteryCellHealthyMat = new THREE.MeshStandardMaterial({
  color: 0x247a52,
  roughness: 0.35,
  metalness: 0.65,
  name: 'Mat_Cell_Healthy',
});

const batteryCellWarningMat = new THREE.MeshStandardMaterial({
  color: 0xc58a27,
  roughness: 0.35,
  metalness: 0.65,
  name: 'Mat_Cell_Warning',
});

const copperBusbarMat = new THREE.MeshStandardMaterial({
  color: 0xb87333,
  roughness: 0.28,
  metalness: 0.92,
  name: 'Mat_Copper_Busbar',
});

const coolingTubeMat = new THREE.MeshStandardMaterial({
  color: 0x3978b8,
  roughness: 0.22,
  metalness: 0.55,
  emissive: 0x1d4ed8,
  emissiveIntensity: 0.25,
  name: 'Mat_Cooling_Tube',
});

const motorMetalMat = new THREE.MeshStandardMaterial({
  color: 0x47515e,
  roughness: 0.38,
  metalness: 0.82,
  name: 'Mat_Motor_Metal',
});

const bodyGroup = new THREE.Group();
bodyGroup.name = 'Body_Group';
rootGroup.add(bodyGroup);

const wheelsGroup = new THREE.Group();
wheelsGroup.name = 'Wheels_Group';
rootGroup.add(wheelsGroup);

const powertrainGroup = new THREE.Group();
powertrainGroup.name = 'Powertrain_Group';
rootGroup.add(powertrainGroup);

const batteryGroup = new THREE.Group();
batteryGroup.name = 'Battery_Group';
rootGroup.add(batteryGroup);

// ======================================================
// 1. SCULPTED AERODYNAMIC SEDAN SILHOUETTE (ExtrudeGeometry)
// X-axis in 2D shape = Z-axis along car (+2.35 front, -2.35 rear)
// Y-axis in 2D shape = Y-axis height
// ======================================================
const sideProfile = new THREE.Shape();
sideProfile.moveTo(-2.22, 0.26); // Rear lower bumper
sideProfile.lineTo(-1.82, 0.24);
// Rear wheel arch cutout (center at z = -1.42, radius = 0.42)
sideProfile.absarc(-1.42, 0.35, 0.42, Math.PI * 1.05, -0.05, true);
sideProfile.lineTo(-0.98, 0.22);
// Lower rocker sill between wheels
sideProfile.lineTo(1.02, 0.22);
// Front wheel arch cutout (center at z = +1.44, radius = 0.42)
sideProfile.absarc(1.44, 0.35, 0.42, Math.PI * 1.05, -0.05, true);
sideProfile.lineTo(2.15, 0.22);
// Front lower aero lip & nose curve
sideProfile.bezierCurveTo(2.36, 0.24, 2.40, 0.42, 2.34, 0.58);
// Sculpted Hood line
sideProfile.bezierCurveTo(2.05, 0.72, 1.45, 0.80, 0.96, 0.84);
// Raked Windshield
sideProfile.bezierCurveTo(0.65, 1.08, 0.38, 1.30, 0.05, 1.34);
// Sleek Fastback Roofline
sideProfile.bezierCurveTo(-0.42, 1.36, -0.82, 1.28, -1.35, 1.04);
// Rear Fastback Deck & Ducktail Spoiler
sideProfile.bezierCurveTo(-1.72, 0.90, -2.02, 0.86, -2.20, 0.84);
// Rear Fascia vertical drop
sideProfile.bezierCurveTo(-2.30, 0.68, -2.30, 0.42, -2.22, 0.26);

const bodyExtrudeSettings = {
  depth: 1.72,
  bevelEnabled: true,
  bevelThickness: 0.08,
  bevelSize: 0.07,
  bevelSegments: 5,
  curveSegments: 24,
};

const sculptedBodyGeo = new THREE.ExtrudeGeometry(sideProfile, bodyExtrudeSettings);
// Center along X (depth was along +Z before rotation)
sculptedBodyGeo.translate(0, 0, -1.72 / 2);
// Rotate so 2D X (+front) aligns with +Z (car forward)
sculptedBodyGeo.rotateY(-Math.PI / 2);

const sculptedBodyMesh = new THREE.Mesh(sculptedBodyGeo, primaryPaintMat);
sculptedBodyMesh.name = 'Body_Chassis_Sculpted';
bodyGroup.add(sculptedBodyMesh);

// Sculpted Greenhouse Glass Canopy (slightly narrower & raised for realistic pillars)
const glassShape = new THREE.Shape();
glassShape.moveTo(0.88, 0.85);
glassShape.bezierCurveTo(0.60, 1.08, 0.36, 1.28, 0.05, 1.32);
glassShape.bezierCurveTo(-0.40, 1.34, -0.80, 1.26, -1.32, 1.02);
glassShape.lineTo(-1.40, 0.90);
glassShape.lineTo(0.88, 0.85);

const glassExtrude = new THREE.ExtrudeGeometry(glassShape, {
  depth: 1.46,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.03,
  bevelSegments: 3,
  curveSegments: 18,
});
glassExtrude.translate(0, 0, -1.46 / 2);
glassExtrude.rotateY(-Math.PI / 2);

const canopyGlassMesh = new THREE.Mesh(glassExtrude, glassMat);
canopyGlassMesh.name = 'Body_Greenhouse_Canopy';
bodyGroup.add(canopyGlassMesh);

// Lower Aero Front Splitter & Side Skirts & Rear Diffuser
const splitterGeo = new THREE.BoxGeometry(1.86, 0.05, 0.36);
const splitterMesh = new THREE.Mesh(splitterGeo, darkTrimMat);
splitterMesh.name = 'Body_Front_Splitter';
splitterMesh.position.set(0, 0.19, 2.18);
bodyGroup.add(splitterMesh);

[-0.92, 0.92].forEach((x, i) => {
  const skirtGeo = new THREE.BoxGeometry(0.08, 0.07, 1.98);
  const skirtMesh = new THREE.Mesh(skirtGeo, darkTrimMat);
  skirtMesh.name = `Body_Aero_Skirt_${i === 0 ? 'Left' : 'Right'}`;
  skirtMesh.position.set(x, 0.21, 0.02);
  bodyGroup.add(skirtMesh);
});

const diffuserGeo = new THREE.BoxGeometry(1.76, 0.14, 0.30);
const diffuserMesh = new THREE.Mesh(diffuserGeo, darkTrimMat);
diffuserMesh.name = 'Body_Rear_Diffuser';
diffuserMesh.position.set(0, 0.25, -2.14);
bodyGroup.add(diffuserMesh);

// Sculpted Side Mirrors
[-0.96, 0.96].forEach((x, i) => {
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = `Body_Mirror_${i === 0 ? 'Left' : 'Right'}`;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.08), darkTrimMat);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.09, 0.13), secondaryPaintMat);
  cap.position.set(x > 0 ? 0.06 : -0.06, 0.03, -0.02);
  mirrorGroup.add(arm, cap);
  mirrorGroup.position.set(x, 0.87, 0.72);
  bodyGroup.add(mirrorGroup);
});

// Flush Aero Door Handles
[
  { x: -0.94, z: 0.32 },
  { x: -0.94, z: -0.46 },
  { x: 0.94, z: 0.32 },
  { x: 0.94, z: -0.46 },
].forEach((pos, idx) => {
  const handleGeo = new THREE.BoxGeometry(0.025, 0.035, 0.16);
  const handleMesh = new THREE.Mesh(handleGeo, darkTrimMat);
  handleMesh.name = `Body_DoorHandle_0${idx + 1}`;
  handleMesh.position.set(pos.x, 0.68, pos.z);
  bodyGroup.add(handleMesh);
});

// Sleek LED Matrix Headlights
[-0.64, 0.64].forEach((x, i) => {
  const lightGeo = new THREE.BoxGeometry(0.36, 0.06, 0.18);
  const lightMesh = new THREE.Mesh(lightGeo, headlightMat);
  lightMesh.name = `Body_Headlight_${i === 0 ? 'Left' : 'Right'}`;
  lightMesh.position.set(x, 0.58, 2.26);
  lightMesh.rotation.y = x > 0 ? -0.18 : 0.18;
  bodyGroup.add(lightMesh);
});

// Full-Width Rear LED Taillight Bar
const taillightGeo = new THREE.BoxGeometry(1.70, 0.06, 0.10);
const taillightMesh = new THREE.Mesh(taillightGeo, taillightMat);
taillightMesh.name = 'Body_Taillight_Bar';
taillightMesh.position.set(0, 0.74, -2.23);
bodyGroup.add(taillightMesh);

// ======================================================
// 2. MULTI-SPOKE ALLOY WHEELS, TIRES, ROTORS & CALIPERS
// ======================================================
const wheelPositions = [
  { name: 'FL', x: -0.89, z: 1.44 },
  { name: 'FR', x: 0.89, z: 1.44 },
  { name: 'RL', x: -0.89, z: -1.42 },
  { name: 'RR', x: 0.89, z: -1.42 },
];

wheelPositions.forEach((pos) => {
  const wheelSubgroup = new THREE.Group();
  wheelSubgroup.name = `Wheel_${pos.name}_Assembly`;
  wheelSubgroup.position.set(pos.x, 0.35, pos.z);

  // Tire rubber cylinder
  const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 32);
  const tireMesh = new THREE.Mesh(tireGeo, tireRubberMat);
  tireMesh.name = `Tire_${pos.name}`;
  tireMesh.rotation.z = Math.PI / 2;
  wheelSubgroup.add(tireMesh);

  // Inner dark wheel barrel
  const barrelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.255, 24);
  const barrelMesh = new THREE.Mesh(barrelGeo, darkAlloyMat);
  barrelMesh.rotation.z = Math.PI / 2;
  wheelSubgroup.add(barrelMesh);

  // Outer machined lip ring
  const lipGeo = new THREE.TorusGeometry(0.245, 0.014, 12, 32);
  const lipMesh = new THREE.Mesh(lipGeo, alloyRimMat);
  lipMesh.rotation.y = Math.PI / 2;
  lipMesh.position.x = pos.x > 0 ? 0.12 : -0.12;
  wheelSubgroup.add(lipMesh);

  // 5-Double-Spoke Alloy Pattern
  for (let s = 0; s < 5; s++) {
    const angle = (s * Math.PI * 2) / 5;
    [-0.08, 0.08].forEach((offsetAngle) => {
      const spokeGeo = new THREE.BoxGeometry(0.025, 0.23, 0.028);
      const spoke = new THREE.Mesh(spokeGeo, alloyRimMat);
      const totalAngle = angle + offsetAngle;
      spoke.position.set(
        pos.x > 0 ? 0.115 : -0.115,
        Math.cos(totalAngle) * 0.125,
        Math.sin(totalAngle) * 0.125
      );
      spoke.rotation.x = -totalAngle;
      wheelSubgroup.add(spoke);
    });
  }

  // Center Hub Cap
  const hubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.26, 16);
  const hubMesh = new THREE.Mesh(hubGeo, darkTrimMat);
  hubMesh.rotation.z = Math.PI / 2;
  wheelSubgroup.add(hubMesh);

  // Brake Rotor Disc
  const rotorGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.03, 24);
  const rotorMesh = new THREE.Mesh(rotorGeo, brakeRotorMat);
  rotorMesh.name = `BrakeRotor_${pos.name}`;
  rotorMesh.rotation.z = Math.PI / 2;
  rotorMesh.position.x = pos.x > 0 ? 0.04 : -0.04;
  wheelSubgroup.add(rotorMesh);

  // Sport Red Brembo Brake Caliper
  const caliperGeo = new THREE.BoxGeometry(0.055, 0.13, 0.08);
  const caliperMesh = new THREE.Mesh(caliperGeo, brakeCaliperMat);
  caliperMesh.name = `BrakeCaliper_${pos.name}`;
  caliperMesh.position.set(pos.x > 0 ? 0.05 : -0.05, 0.09, 0.11);
  wheelSubgroup.add(caliperMesh);

  wheelsGroup.add(wheelSubgroup);
});

// ======================================================
// 3. POWERTRAIN (Front & Rear Motors, Inverter, Charging Port)
// ======================================================
const frontMotorGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.58, 20);
const frontMotorMesh = new THREE.Mesh(frontMotorGeo, motorMetalMat);
frontMotorMesh.name = 'Powertrain_Front_Motor';
frontMotorMesh.rotation.z = Math.PI / 2;
frontMotorMesh.position.set(0, 0.35, 1.44);
powertrainGroup.add(frontMotorMesh);

const rearMotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.65, 20);
const rearMotorMesh = new THREE.Mesh(rearMotorGeo, motorMetalMat);
rearMotorMesh.name = 'Powertrain_Rear_Motor';
rearMotorMesh.rotation.z = Math.PI / 2;
rearMotorMesh.position.set(0, 0.35, -1.42);
powertrainGroup.add(rearMotorMesh);

const inverterGeo = new THREE.BoxGeometry(0.45, 0.16, 0.40);
const inverterMesh = new THREE.Mesh(inverterGeo, motorMetalMat);
inverterMesh.name = 'Powertrain_Inverter';
inverterMesh.position.set(0, 0.56, -1.35);
powertrainGroup.add(inverterMesh);

const chargePortGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16);
const chargePortMesh = new THREE.Mesh(chargePortGeo, headlightMat);
chargePortMesh.name = 'Powertrain_Charging_Port';
chargePortMesh.rotation.z = Math.PI / 2;
chargePortMesh.position.set(0.94, 0.72, -1.65);
powertrainGroup.add(chargePortMesh);

// ======================================================
// 4. EXPLODABLE MODULAR BATTERY PACK (7 Subsystems + 10 Cells)
// ======================================================
const trayGeo = new THREE.BoxGeometry(1.42, 0.10, 2.25);
const trayMesh = new THREE.Mesh(trayGeo, batteryTrayMat);
trayMesh.name = 'Battery_Enclosure_Tray';
trayMesh.position.set(0, 0.18, 0);
batteryGroup.add(trayMesh);

const coverGeo = new THREE.BoxGeometry(1.40, 0.04, 2.22);
const coverMesh = new THREE.Mesh(coverGeo, batteryTrayMat);
coverMesh.name = 'Battery_Enclosure_Cover';
coverMesh.position.set(0, 0.34, 0);
batteryGroup.add(coverMesh);

const bmsGeo = new THREE.BoxGeometry(0.48, 0.09, 0.28);
const bmsMesh = new THREE.Mesh(bmsGeo, darkTrimMat);
bmsMesh.name = 'Battery_BMS_Module';
bmsMesh.position.set(0, 0.26, 1.0);
batteryGroup.add(bmsMesh);

const coolingGeo = new THREE.BoxGeometry(1.36, 0.03, 1.95);
const coolingMesh = new THREE.Mesh(coolingGeo, coolingTubeMat);
coolingMesh.name = 'Battery_Cooling_System';
coolingMesh.position.set(0, 0.19, 0);
batteryGroup.add(coolingMesh);

const busbarGeo = new THREE.BoxGeometry(0.05, 0.02, 1.85);
[-0.28, 0.28].forEach((x, i) => {
  const busbarMesh = new THREE.Mesh(busbarGeo, copperBusbarMat);
  busbarMesh.name = `Battery_Busbar_${i === 0 ? 'Left' : 'Right'}`;
  busbarMesh.position.set(x, 0.3, 0);
  batteryGroup.add(busbarMesh);
});

for (let col = 0; col < 2; col++) {
  for (let row = 0; row < 5; row++) {
    const idx = col * 5 + row + 1;
    const xPos = col === 0 ? -0.42 : 0.42;
    const zPos = 0.72 - row * 0.36;

    const moduleGroup = new THREE.Group();
    moduleGroup.name = `Battery_Module_${String(idx).padStart(2, '0')}`;
    moduleGroup.position.set(xPos, 0.25, zPos);

    const modGeo = new THREE.BoxGeometry(0.55, 0.11, 0.30);
    const modMesh = new THREE.Mesh(
      modGeo,
      idx === 1 ? batteryCellWarningMat : batteryCellHealthyMat
    );
    modMesh.name = `Battery_Cell_${String(idx).padStart(2, '0')}`;
    moduleGroup.add(modMesh);

    [-0.18, 0.18].forEach((tx) => {
      const termGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.03, 8);
      const termMesh = new THREE.Mesh(termGeo, copperBusbarMat);
      termMesh.position.set(tx, 0.065, 0);
      moduleGroup.add(termMesh);
    });

    batteryGroup.add(moduleGroup);
  }
}

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (gltf) => {
    const outputPath = path.resolve('public/models/voltsense-blue-ev.glb');
    fs.writeFileSync(outputPath, Buffer.from(gltf));
    const legacyPath = path.resolve('public/models/voltsense-red-ev.glb');
    fs.writeFileSync(legacyPath, Buffer.from(gltf));
    const stats = fs.statSync(outputPath);
    console.log(`Successfully generated sculpted GLB model at: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  },
  (error) => {
    console.error('Error exporting sculpted GLB:', error);
  },
  { binary: true }
);
