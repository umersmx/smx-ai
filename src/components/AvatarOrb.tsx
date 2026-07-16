import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "../types";

interface AvatarOrbProps {
  aiState: AIState;
}

export const AvatarOrb: React.FC<AvatarOrbProps> = ({ aiState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<any>(null);

  // Mouse tracking ref (normalized -1 to 1) - no state re-renders!
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  // Track target configurations based on AI State
  const stateConfig = {
    idle: {
      distort: 0.25,
      speed: 1.2,
      rotationSpeed: 0.15,
      color: "#4f46e5", // Indigo
      emissiveIntensity: 0.2,
      scale: 1.6,
    },
    thinking: {
      distort: 0.55,
      speed: 3.5,
      rotationSpeed: 0.6,
      color: "#ec4899", // Pink
      emissiveIntensity: 0.8,
      scale: 1.8,
    },
    typing: {
      distort: 0.35,
      speed: 5.0,
      rotationSpeed: 0.35,
      color: "#10b981", // Emerald
      emissiveIntensity: 0.4,
      scale: 1.65,
    },
  };

  // Keep track of animated parameters to smoothly lerp them
  const currentConfig = useRef({
    distort: 0.25,
    speed: 1.2,
    rotationSpeed: 0.15,
    emissiveIntensity: 0.2,
    scale: 1.6,
  });

  useFrame((state, delta) => {
    const target = stateConfig[aiState];
    const cur = currentConfig.current;

    // Smoothly lerp material & physics parameters towards target state
    const lerpFactor = 5 * delta; // Adjust speed of transition
    cur.distort += (target.distort - cur.distort) * lerpFactor;
    cur.speed += (target.speed - cur.speed) * lerpFactor;
    cur.rotationSpeed += (target.rotationSpeed - cur.rotationSpeed) * lerpFactor;
    cur.emissiveIntensity += (target.emissiveIntensity - cur.emissiveIntensity) * lerpFactor;
    cur.scale += (target.scale - cur.scale) * lerpFactor;

    // Apply animation parameters to meshes
    if (meshRef.current) {
      // Slow constant rotation + state rotation speed
      meshRef.current.rotation.y += cur.rotationSpeed * delta;
      meshRef.current.rotation.x += (cur.rotationSpeed * 0.5) * delta;

      // Handle custom state response micro-vibrations
      let scaleOffset = 0;
      if (aiState === "typing") {
        // High frequency micro-jitter to represent dynamic data delivery
        scaleOffset = Math.sin(state.clock.getElapsedTime() * 75) * 0.02;
      } else if (aiState === "thinking") {
        // Broad expansion waves
        scaleOffset = Math.sin(state.clock.getElapsedTime() * 12) * 0.05;
      } else {
        // Quiet organic breathing
        scaleOffset = Math.sin(state.clock.getElapsedTime() * 2) * 0.03;
      }

      meshRef.current.scale.setScalar(cur.scale + scaleOffset);
    }

    if (wireRef.current) {
      // Wireframe spins opposite way for a cool multi-layered look
      wireRef.current.rotation.y -= (cur.rotationSpeed * 0.8) * delta;
      wireRef.current.rotation.z += (cur.rotationSpeed * 0.4) * delta;
      
      const scaleOffset = Math.sin(state.clock.getElapsedTime() * 3) * 0.04;
      wireRef.current.scale.setScalar((cur.scale * 1.15) + scaleOffset);
    }

    // Smoothly animate the spotlight following the cursor
    if (lightRef.current) {
      const targetX = mouseRef.current.x * 5;
      const targetY = mouseRef.current.y * 5;
      lightRef.current.position.x += (targetX - lightRef.current.position.x) * 6 * delta;
      lightRef.current.position.y += (targetY - lightRef.current.position.y) * 6 * delta;
    }

    // Dynamically modulate material emission and colors
    if (materialRef.current) {
      materialRef.current.distort = cur.distort;
      materialRef.current.speed = cur.speed;
      
      // Update color and emissive properties smoothly
      const targetColor = new THREE.Color(target.color);
      materialRef.current.color.lerp(targetColor, lerpFactor);
      materialRef.current.emissive.lerp(targetColor, lerpFactor);
      materialRef.current.emissiveIntensity = cur.emissiveIntensity;
    }
  });

  return (
    <group>
      {/* Dynamic Cursor Spotlight */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 5]}
        intensity={2.5}
        color={stateConfig[aiState].color}
        distance={15}
        decay={1.8}
      />

      {/* Ambient background light */}
      <ambientLight intensity={0.15} />
      
      {/* Direct specular backlight */}
      <directionalLight position={[-5, 5, -5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[5, -5, 2]} intensity={0.5} color={stateConfig[aiState].color} />

      {/* Core Mesh: Liquid Obsidian / Glassmorphic Morphing Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          ref={materialRef}
          color="#4f46e5"
          roughness={0.15}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          bumpScale={0.05}
          distort={0.25}
          speed={1.2}
          emissive="#4f46e5"
          emissiveIntensity={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Outer Technical Mesh: Frosted Wireframe Orbit Sphere */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={stateConfig[aiState].color}
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.12}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};
