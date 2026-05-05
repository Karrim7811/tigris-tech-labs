"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

/* ─────────── Tower geometry ─────────── */

const TOWER_W = 4.0;
const TOWER_D = 2.8;
const TOWER_H = 18.0;
const FOUNDATION_H = 0.5;
const FOUNDATION_W = TOWER_W * 1.25;
const FOUNDATION_D = TOWER_D * 1.25;

/* ─────────── Procedural window-grid texture ─────────── */

function createFacadeTexture(faceWide: boolean) {
  const cols = faceWide ? 8 : 6;
  const rows = 32;
  const cellW = 64;
  const cellH = 64;
  const w = cols * cellW;
  const h = rows * cellH;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Base — dark glass
  ctx.fillStyle = "#0c1326";
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical gradient (top a touch lighter for sky reflection)
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(60, 110, 180, 0.18)");
  grad.addColorStop(0.55, "rgba(20, 40, 80, 0.08)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.18)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Window panels — lit/unlit pseudo-random
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + 6;
      const y = r * cellH + 6;
      const ww = cellW - 12;
      const hh = cellH - 12;

      // Deterministic but varied
      const seed = (r * 13 + c * 7 + (r % 5) * 3) % 100;
      const lit = seed > 62;
      const dim = seed > 35 && seed <= 62;

      if (lit) {
        // Warm interior glow
        ctx.fillStyle = `rgba(255, 220, 160, ${0.22 + (seed % 7) / 60})`;
      } else if (dim) {
        // Cool reflected sky
        ctx.fillStyle = `rgba(80, 140, 200, ${0.12 + (seed % 9) / 90})`;
      } else {
        // Dark / unoccupied
        ctx.fillStyle = "rgba(20, 35, 60, 0.6)";
      }
      ctx.fillRect(x, y, ww, hh);

      // Window frame inner edge — subtle highlight
      ctx.strokeStyle = "rgba(180, 190, 210, 0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, ww - 1, hh - 1);
    }
  }

  // Vertical mullions — strong dark lines between window columns
  ctx.fillStyle = "#04081a";
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * cellW - 3, 0, 6, h);
  }

  // Horizontal floor slabs — thin lines
  ctx.fillStyle = "rgba(8, 14, 30, 0.9)";
  for (let r = 0; r <= rows; r++) {
    ctx.fillRect(0, r * cellH - 1, w, 3);
  }

  // Crown band at very top — a darker architectural cap
  ctx.fillStyle = "#06091a";
  ctx.fillRect(0, 0, w, cellH * 0.6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ─────────── Tower scene ─────────── */

function TowerScene() {
  const groupRef = useRef<THREE.Group>(null);
  const towerRef = useRef<THREE.Group>(null);
  const [t, setT] = useState(0);

  // Build textures once
  const wideTex = useMemo(() => createFacadeTexture(true), []);
  const narrowTex = useMemo(() => createFacadeTexture(false), []);

  useFrame((_, delta) => {
    setT((prev) => prev + delta);
  });

  // Build sequence:
  //   0.0 → 0.5   foundation slab rises
  //   0.5 → 4.0   tower extrudes upward (3.5s, cubic ease-out)
  //   4.0 → 4.8   facade glass material transitions in
  //   4.8 → 5.4   penthouse + antenna appear
  //   5.4 → ∞     slow rotation
  const foundationPhase = clamp01(t / 0.5);
  const buildRaw = clamp01((t - 0.5) / 3.5);
  const buildEased = 1 - Math.pow(1 - buildRaw, 3);
  const glassPhase = clamp01((t - 4.0) / 0.8);
  const crownPhase = clamp01((t - 4.8) / 0.6);
  const rotation = Math.max(0, t - 5.4) * 0.13; // ~48s per full turn

  if (groupRef.current) {
    groupRef.current.rotation.y = rotation;
  }
  if (towerRef.current) {
    towerRef.current.scale.y = Math.max(0.001, buildEased);
  }

  const facadeOpacity = clamp01(buildRaw * 1.2);

  return (
    <group ref={groupRef}>
      {/* Foundation slab */}
      <mesh
        position={[
          0,
          (foundationPhase - 1) * 0.6 + FOUNDATION_H / 2,
          0,
        ]}
        receiveShadow
        castShadow
      >
        <boxGeometry
          args={[FOUNDATION_W, FOUNDATION_H, FOUNDATION_D]}
        />
        <meshStandardMaterial
          color="#3a4150"
          metalness={0.2}
          roughness={0.85}
        />
      </mesh>

      {/* Tower group — scales up from base */}
      <group ref={towerRef} position={[0, FOUNDATION_H, 0]}>
        {/* Tower core: solid mass with facade textures on each face.
            Origin at bottom so scale.y grows upward. */}
        <group position={[0, TOWER_H / 2, 0]}>
          {/* Long faces (front/back) — wide window grid */}
          {[1, -1].map((side) => (
            <mesh
              key={`wide-${side}`}
              position={[0, 0, side * (TOWER_D / 2)]}
              rotation={[0, side === 1 ? 0 : Math.PI, 0]}
              castShadow
              receiveShadow
            >
              <planeGeometry args={[TOWER_W, TOWER_H]} />
              <meshPhysicalMaterial
                map={wideTex}
                metalness={0.65}
                roughness={0.18}
                transparent
                opacity={facadeOpacity}
                clearcoat={0.35 + 0.4 * glassPhase}
                clearcoatRoughness={0.12}
                envMapIntensity={1.0 + 0.6 * glassPhase}
                emissive="#0a1326"
                emissiveIntensity={0.15 + 0.25 * glassPhase}
              />
            </mesh>
          ))}
          {/* Short faces (sides) — narrower grid */}
          {[1, -1].map((side) => (
            <mesh
              key={`narrow-${side}`}
              position={[side * (TOWER_W / 2), 0, 0]}
              rotation={[0, side === 1 ? Math.PI / 2 : -Math.PI / 2, 0]}
              castShadow
              receiveShadow
            >
              <planeGeometry args={[TOWER_D, TOWER_H]} />
              <meshPhysicalMaterial
                map={narrowTex}
                metalness={0.65}
                roughness={0.18}
                transparent
                opacity={facadeOpacity}
                clearcoat={0.35 + 0.4 * glassPhase}
                clearcoatRoughness={0.12}
                envMapIntensity={1.0 + 0.6 * glassPhase}
                emissive="#0a1326"
                emissiveIntensity={0.15 + 0.25 * glassPhase}
              />
            </mesh>
          ))}
          {/* Solid inner core — fills behind the facade so the tower
              never looks transparent during build-up */}
          <mesh castShadow receiveShadow>
            <boxGeometry
              args={[TOWER_W * 0.985, TOWER_H * 0.998, TOWER_D * 0.985]}
            />
            <meshStandardMaterial
              color="#1a2238"
              metalness={0.4}
              roughness={0.55}
            />
          </mesh>
          {/* Top cap (parapet) */}
          <mesh position={[0, TOWER_H / 2 - 0.1, 0]} castShadow>
            <boxGeometry args={[TOWER_W * 1.02, 0.18, TOWER_D * 1.02]} />
            <meshStandardMaterial
              color="#2a3145"
              metalness={0.5}
              roughness={0.55}
            />
          </mesh>
        </group>
      </group>

      {/* Architectural crown — penthouse + antenna, only after build */}
      {crownPhase > 0 && (
        <group
          position={[0, FOUNDATION_H + TOWER_H * buildEased, 0]}
          scale={[crownPhase, crownPhase, crownPhase]}
        >
          {/* Mechanical penthouse — smaller footprint */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[TOWER_W * 0.55, 1.1, TOWER_D * 0.6]} />
            <meshStandardMaterial
              color="#373d50"
              metalness={0.4}
              roughness={0.55}
            />
          </mesh>
          {/* Antenna mast */}
          <mesh
            position={[TOWER_W * 0.18, 2.0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.025, 0.025, 1.6, 10]} />
            <meshStandardMaterial
              color="#dadfe6"
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
          {/* Aviation beacon — Aon red */}
          <mesh position={[TOWER_W * 0.18, 2.85, 0]}>
            <sphereGeometry args={[0.07, 14, 14]} />
            <meshStandardMaterial
              color="#EB0017"
              emissive="#EB0017"
              emissiveIntensity={2.0}
            />
          </mesh>
          <pointLight
            position={[TOWER_W * 0.18, 2.85, 0]}
            color="#EB0017"
            intensity={0.4}
            distance={6}
          />
        </group>
      )}
    </group>
  );
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/* ─────────── Public component ─────────── */

export default function CondoTower() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [13, 9, 13], fov: 32 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Architectural rendering lighting */}
      <ambientLight intensity={0.35} color="#9bb0d0" />

      {/* Key — warm directional from upper-right (sunset / golden hour) */}
      <directionalLight
        position={[10, 16, 6]}
        intensity={1.8}
        color="#fff1d8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={25}
        shadow-camera-bottom={-3}
      />

      {/* Aon red rim from left */}
      <pointLight
        position={[-9, 9, 5]}
        intensity={0.9}
        color="#ff3a55"
        distance={28}
      />

      {/* Cool fill from behind */}
      <pointLight
        position={[6, 5, -10]}
        intensity={0.55}
        color="#3d80ff"
        distance={26}
      />

      <Environment preset="night" />

      {/* Ground shadow catcher */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <shadowMaterial opacity={0.5} />
      </mesh>

      <TowerScene />
    </Canvas>
  );
}
