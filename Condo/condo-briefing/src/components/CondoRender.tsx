"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ─────────── Tower massing ─────────── */

const FLOORS = 18;
const FLOOR_H = 0.9;
const TOWER_W = 3.2;
const TOWER_D = 2.1;
const PODIUM_H = 1.6;
const PODIUM_W = TOWER_W + 1.4;
const PODIUM_D = TOWER_D + 1.0;
const TOWER_H = FLOORS * FLOOR_H;
const BALCONY_OVERHANG = 0.32;

/* ─────────── Materials (memoize via refs) ─────────── */

function ConcreteMat(props: { color?: string }) {
  return (
    <meshStandardMaterial
      color={props.color ?? "#f4f1ea"}
      roughness={0.82}
      metalness={0.02}
    />
  );
}

function GlassMat({ tint = "#bcd6dc" }: { tint?: string }) {
  return (
    <meshPhysicalMaterial
      color={tint}
      roughness={0.08}
      metalness={0.1}
      transmission={0.55}
      thickness={0.4}
      ior={1.45}
      transparent
      opacity={0.85}
      clearcoat={0.9}
      clearcoatRoughness={0.08}
    />
  );
}

function MetalMat() {
  return (
    <meshStandardMaterial
      color="#aab2bb"
      roughness={0.35}
      metalness={0.75}
    />
  );
}

/* ─────────── One residential floor with balcony ─────────── */

function Floor({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      {/* Floor slab — white concrete, slightly cantilevered */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry
          args={[TOWER_W + BALCONY_OVERHANG * 2, 0.12, TOWER_D + BALCONY_OVERHANG * 2]}
        />
        <ConcreteMat />
      </mesh>

      {/* Floor-to-ceiling glass on long faces (front/back) */}
      {[1, -1].map((side) => (
        <mesh
          key={`glass-long-${side}`}
          position={[0, FLOOR_H / 2, side * (TOWER_D / 2)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[TOWER_W - 0.05, FLOOR_H - 0.18, 0.04]} />
          <GlassMat />
        </mesh>
      ))}

      {/* Glass on short sides (narrow faces) */}
      {[1, -1].map((side) => (
        <mesh
          key={`glass-short-${side}`}
          position={[side * (TOWER_W / 2), FLOOR_H / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.04, FLOOR_H - 0.18, TOWER_D - 0.05]} />
          <GlassMat />
        </mesh>
      ))}

      {/* Glass balcony rails on front + back */}
      {[1, -1].map((side) => (
        <mesh
          key={`rail-${side}`}
          position={[
            0,
            0.55,
            side * (TOWER_D / 2 + BALCONY_OVERHANG - 0.02),
          ]}
          castShadow
        >
          <boxGeometry args={[TOWER_W + BALCONY_OVERHANG * 2 - 0.1, 1.0, 0.04]} />
          <GlassMat tint="#cee4e8" />
        </mesh>
      ))}

      {/* Top rail caps — brushed metal */}
      {[1, -1].map((side) => (
        <mesh
          key={`cap-${side}`}
          position={[
            0,
            1.05,
            side * (TOWER_D / 2 + BALCONY_OVERHANG - 0.02),
          ]}
        >
          <boxGeometry args={[TOWER_W + BALCONY_OVERHANG * 2 - 0.1, 0.04, 0.06]} />
          <MetalMat />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────── Tower scene ─────────── */

function Tower() {
  const groupRef = useRef<THREE.Group>(null);
  const fadeRef = useRef(0);

  useFrame((_, delta) => {
    fadeRef.current = Math.min(1, fadeRef.current + delta * 0.6);
    if (groupRef.current) {
      // Very slow drift rotation
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.scale.setScalar(0.92 + 0.08 * fadeRef.current);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Podium — wider 2-floor base */}
      <group position={[0, PODIUM_H / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[PODIUM_W, PODIUM_H, PODIUM_D]} />
          <ConcreteMat color="#ebe7de" />
        </mesh>
        {/* Horizontal slot window band on podium */}
        {[-0.25, 0.35].map((y, i) => (
          <mesh
            key={`pod-win-${i}`}
            position={[0, y, PODIUM_D / 2 + 0.001]}
          >
            <planeGeometry args={[PODIUM_W * 0.85, 0.18]} />
            <meshStandardMaterial
              color="#3a4a55"
              metalness={0.4}
              roughness={0.25}
            />
          </mesh>
        ))}
        {[-0.25, 0.35].map((y, i) => (
          <mesh
            key={`pod-win-back-${i}`}
            position={[0, y, -PODIUM_D / 2 - 0.001]}
            rotation={[0, Math.PI, 0]}
          >
            <planeGeometry args={[PODIUM_W * 0.85, 0.18]} />
            <meshStandardMaterial
              color="#3a4a55"
              metalness={0.4}
              roughness={0.25}
            />
          </mesh>
        ))}
        {/* Podium cap line */}
        <mesh position={[0, PODIUM_H / 2 + 0.06, 0]} castShadow>
          <boxGeometry args={[PODIUM_W + 0.1, 0.12, PODIUM_D + 0.1]} />
          <ConcreteMat color="#dcd7cc" />
        </mesh>
      </group>

      {/* Vertical structural fins at the four corners — white concrete */}
      {[
        [TOWER_W / 2 + BALCONY_OVERHANG - 0.12, TOWER_D / 2 + BALCONY_OVERHANG - 0.12],
        [-TOWER_W / 2 - BALCONY_OVERHANG + 0.12, TOWER_D / 2 + BALCONY_OVERHANG - 0.12],
        [TOWER_W / 2 + BALCONY_OVERHANG - 0.12, -TOWER_D / 2 - BALCONY_OVERHANG + 0.12],
        [-TOWER_W / 2 - BALCONY_OVERHANG + 0.12, -TOWER_D / 2 - BALCONY_OVERHANG + 0.12],
      ].map(([x, z], i) => (
        <mesh
          key={`fin-${i}`}
          position={[x, PODIUM_H + TOWER_H / 2, z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.22, TOWER_H + 0.4, 0.22]} />
          <ConcreteMat />
        </mesh>
      ))}

      {/* Center vertical fin running full height on the long faces */}
      {[1, -1].map((side) => (
        <mesh
          key={`center-fin-${side}`}
          position={[0, PODIUM_H + TOWER_H / 2, side * (TOWER_D / 2 + BALCONY_OVERHANG - 0.02)]}
          castShadow
        >
          <boxGeometry args={[0.18, TOWER_H, 0.05]} />
          <ConcreteMat />
        </mesh>
      ))}

      {/* Residential floors */}
      <group position={[0, PODIUM_H, 0]}>
        {Array.from({ length: FLOORS }).map((_, i) => (
          <Floor key={`f-${i}`} y={i * FLOOR_H} />
        ))}
      </group>

      {/* Crown — rooftop pavilion */}
      <group position={[0, PODIUM_H + TOWER_H + 0.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[TOWER_W * 0.7, 0.8, TOWER_D * 0.7]} />
          <ConcreteMat color="#e8e3d8" />
        </mesh>
        {/* Parapet wall */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[TOWER_W + BALCONY_OVERHANG * 2, 0.1, TOWER_D + BALCONY_OVERHANG * 2]} />
          <ConcreteMat />
        </mesh>
        {/* Antenna mast */}
        <mesh position={[TOWER_W * 0.22, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.4, 10]} />
          <meshStandardMaterial color="#c8ccd1" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Aviation beacon — Aon red */}
        <mesh position={[TOWER_W * 0.22, 1.95, 0]}>
          <sphereGeometry args={[0.05, 14, 14]} />
          <meshStandardMaterial
            color="#EB0017"
            emissive="#EB0017"
            emissiveIntensity={2.5}
          />
        </mesh>
        <pointLight
          position={[TOWER_W * 0.22, 1.95, 0]}
          color="#EB0017"
          intensity={0.35}
          distance={5}
        />
      </group>
    </group>
  );
}

/* ─────────── Public component ─────────── */

export default function CondoRender() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [11, 6, 11], fov: 26 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Soft daytime ambient */}
      <ambientLight intensity={0.55} color="#dde6f0" />

      {/* Key — soft warm sun from upper right */}
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.6}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={25}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />

      {/* Cool sky fill from opposite side */}
      <directionalLight
        position={[-8, 10, -6]}
        intensity={0.4}
        color="#a8c4e0"
      />

      {/* Subtle Aon red rim from below-left for brand accent */}
      <pointLight
        position={[-7, 3, 4]}
        intensity={0.35}
        color="#ff6080"
        distance={20}
      />

      {/* HDRI environment for realistic glass + metal reflections */}
      <Environment preset="city" />

      {/* Soft contact shadow grounding the tower */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.55}
        scale={18}
        blur={2.4}
        far={10}
        color="#0a1530"
      />

      <Tower />
    </Canvas>
  );
}
