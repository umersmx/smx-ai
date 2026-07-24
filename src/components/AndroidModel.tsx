import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { AIState } from "../types";

interface AndroidModelProps {
  aiState: AIState;
  viewMode: "landing" | "chat";
  scrollProgress: number; // 0 (top of landing) to 1 (bottom/chat ready)
  hasMessages: boolean;
  theme?: "dark" | "light";
}

export const AndroidModel: React.FC<AndroidModelProps> = ({ aiState, viewMode, scrollProgress, hasMessages, theme = "dark" }) => {
  const modelGroup = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const collarRef = useRef<THREE.Mesh>(null);
  const particlesGroupRef = useRef<THREE.Group>(null);
  const spotlightRef = useRef<THREE.PointLight>(null);
  const headPartsRef = useRef<{ object: THREE.Object3D; initialPos: THREE.Vector3 }[]>([]);

  // Interaction States
  const [nodTrigger, setNodTrigger] = useState(0);
  const [scaled, setScaled] = useState(false);

  // Mouse tracking ref
  const mouseRef = useRef({ x: 0, y: 0 });

  // Load GLTF Model from public directory
  const { scene, animations } = useGLTF("/futuristic_flying_animated_robot_-_low_poly.glb");
  const { actions } = useAnimations(animations, scene);

  // Store references to emissive materials to animate colors/intensity dynamically
  const emissiveMaterialsRef = useRef<THREE.Material[]>([]);

  // Pointer event listener for mouse look tracking
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

  // Animatable parameters interpolation
  const currentParams = useRef({
    x: 0,
    y: 0,
    z: 0,
    scale: 1.6,
    rotationY: 0,
    nodAngle: 0,
    particleSpeed: 1,
    particleRadius: 1.5,
  });

  // Particle positions seed
  const particleSeeds = useRef(
    Array.from({ length: 26 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      height: (Math.random() - 0.5) * 1.8,
      speed: 0.5 + Math.random() * 1.5,
      radiusOffset: 0.8 + Math.random() * 0.9,
      size: 0.015 + Math.random() * 0.025,
    }))
  );

  // Auto-scale, auto-center and configure materials on load
  useEffect(() => {
    if (scene) {
      // Reset first to avoid double-run caching bugs in development strict-mode vs production
      scene.scale.set(1, 1, 1);
      scene.position.set(0, 0, 0);

      // 1. Calculate bounding box of the imported robot model
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // S is the auto-scale factor (1.3 / maxDim)
      const S = 1.3 / (maxDim || 1);
      
      // Set the scale to 1.0 (reproducing the localhost state exactly, where double-mount reset it to 1.0)
      scene.scale.setScalar(1.0);

      // 2. Center the geometry relative to its own bounding box using the calculated scale S
      const center = new THREE.Vector3();
      box.getCenter(center);
      scene.position.copy(center).multiplyScalar(-S);
      
      // Position slightly higher to sit perfectly in the floating frame
      scene.position.y += 0.15;

      // 3. Traverse materials to optimize highlights, shadows and collect emissive layers
      const collectedEmissives: THREE.Material[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if ("roughness" in mat) {
                (mat as any).roughness = Math.min((mat as any).roughness, 0.35);
              }
              if ("metalness" in mat) {
                (mat as any).metalness = Math.max((mat as any).metalness, 0.45);
              }
              if ("clearcoat" in mat) {
                (mat as any).clearcoat = 0.5;
                (mat as any).clearcoatRoughness = 0.05;
              }

              // ONLY collect materials that are actually glowing accents (non-black emissive)
              if ("emissive" in mat) {
                const eColor = (mat as any).emissive;
                if (eColor && (eColor.r > 0.05 || eColor.g > 0.05 || eColor.b > 0.05)) {
                  collectedEmissives.push(mat);
                }
              }
            });
          }
        }
      });
      emissiveMaterialsRef.current = collectedEmissives;

      // Identify and store head parts for isolated mouse rotation & bobbing
      let robotOrigin: THREE.Object3D | null = null;
      scene.traverse((child) => {
        if (child.name === "Robot Origin") {
          robotOrigin = child;
        }
      });

      if (robotOrigin) {
        const headParts: { object: THREE.Object3D; initialPos: THREE.Vector3 }[] = [];
        (robotOrigin as THREE.Object3D).children.forEach((child) => {
          if (child.name !== "Hand origin" && child.name !== "Hand origin.002") {
            headParts.push({
              object: child,
              initialPos: child.position.clone()
            });
          }
        });
        headPartsRef.current = headParts;
      }

      setScaled(true);
    }
  }, [scene]);

  // Play flying/hovering animations
  useEffect(() => {
    if (actions) {
      const clipNames = Object.keys(actions);
      if (clipNames.length > 0) {
        // Try to find idle or flight animations first, fallback to first action
        const clipName = clipNames.find(name => 
          name.toLowerCase().includes("idle") || 
          name.toLowerCase().includes("fly") || 
          name.toLowerCase().includes("scene")
        ) || clipNames[0];

        const action = actions[clipName];
        if (action) {
          action.reset().fadeIn(0.4).play();
        }
      }
    }
    return () => {
      if (actions) {
        Object.values(actions).forEach(action => action?.stop());
      }
    };
  }, [actions]);

  // Click interaction - Trigger a quick nod
  const handleModelClick = () => {
    setNodTrigger(prev => prev + 1);
  };

  const { size, viewport } = useThree();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Calculate Target Position, Scale and Rotation based on Scroll Progress
    let targetX = 0;
    let targetY = 0.1;
    let targetZ = 0;
    let targetScale = 1.6;
    let targetRotY = 0;

    const isMobileOrTablet = typeof window !== "undefined" && window.innerWidth < 1024;
    const effectiveScrollProgress = isMobileOrTablet ? 0 : scrollProgress;

    // Accelerated transition that completes by the start of Section 2 (around 30% scroll progress)
    const tProgress = Math.min(1.0, effectiveScrollProgress * 3.3);

    // Transition values based on scroll progress
    if (viewMode === "landing") {
      const rightPxFromCenter = (size.width / 2) - (isMobileOrTablet ? 70 : 110);
      const scrolledTargetX = rightPxFromCenter * (viewport.width / size.width);
      
      const bottomPxFromBottom = isMobileOrTablet ? 150 : 180;
      const scrolledTargetY = -(viewport.height / 2) + (bottomPxFromBottom * (viewport.height / size.height));

      targetX = tProgress * scrolledTargetX; 
      targetY = 0.1 + tProgress * (scrolledTargetY - 0.1);
      targetZ = tProgress * 0.1;
      targetScale = 2.35 - (tProgress * 1.3);
      targetRotY = -tProgress * 0.45; // Face slightly leftwards towards text
    } else {
      if (!hasMessages) {
        // Centered position initially
        targetX = 0;
        targetY = isMobileOrTablet ? 0.35 : 0.45;
        targetZ = 0.5;
        targetScale = isMobileOrTablet ? 1.0 : 1.45;
        targetRotY = 0; // Face forward
      } else {
        // Active Chat Mode (after one prompt): Position exactly on the right side of the centered chat container, just above the submit area
        const chatWidth = Math.min(size.width, 768);
        const rightOffset = isMobileOrTablet ? 25 : 30; // in pixels
        const targetPixelXFromCenter = (chatWidth / 2) - rightOffset;
        targetX = targetPixelXFromCenter * (viewport.width / size.width);
        
        const bottomOffset = isMobileOrTablet ? 140 : 170; // in pixels from bottom
        targetY = -(viewport.height / 2) + (bottomOffset * (viewport.height / size.height));
        
        targetZ = 0.1;
        targetScale = isMobileOrTablet ? 0.65 : 0.9;
        targetRotY = -0.45; // Turn slightly leftward
      }
    }

    // Smooth position/scale lerps
    const lerpFactor = 5 * delta;
    const p = currentParams.current;
    p.x += (targetX - p.x) * lerpFactor;
    p.y += (targetY - p.y) * lerpFactor;
    p.z += (targetZ - p.z) * lerpFactor;
    p.scale += (targetScale - p.scale) * lerpFactor;
    p.rotationY += (targetRotY - p.rotationY) * lerpFactor;

    // State-based particle speed & radius
    const targetParticleSpeed = aiState === "thinking" ? 3.5 : aiState === "typing" ? 2.5 : (1.0 + tProgress * 1.5);
    const targetParticleRadius = aiState === "thinking" ? 1.0 : (1.5 - tProgress * 0.3);
    p.particleSpeed += (targetParticleSpeed - p.particleSpeed) * 4 * delta;
    p.particleRadius += (targetParticleRadius - p.particleRadius) * 4 * delta;

    // Apply translation to main group
    if (modelGroup.current) {
      modelGroup.current.position.set(p.x, p.y, p.z);
      modelGroup.current.scale.setScalar(p.scale);
      modelGroup.current.rotation.y = p.rotationY;
    }

    // 2. High-Fidelity Mouse Look-At Tracking
    if (headGroupRef.current) {
      const targetHeadRotY = mouseRef.current.x * 0.45;
      const targetHeadRotX = -mouseRef.current.y * 0.3;
      
      headGroupRef.current.rotation.y += (targetHeadRotY - headGroupRef.current.rotation.y) * 5 * delta;
      headGroupRef.current.rotation.x += (targetHeadRotX - headGroupRef.current.rotation.x) * 5 * delta;

      // Premium Floating Hover Bobbing
      const hoverSpeed = aiState === "thinking" ? 2.5 : 1.2;
      const hoverHeight = aiState === "thinking" ? 0.04 : 0.025;
      const hoverBob = Math.sin(time * hoverSpeed) * hoverHeight;
      headGroupRef.current.position.y = hoverBob;

      // Gentle drift out of sync
      headGroupRef.current.position.x = Math.cos(time * 0.6) * 0.015;

      // Handle Quick Nod click animation
      if (nodTrigger > 0) {
        const nodTime = (time * 10) % Math.PI;
        const nodAngle = Math.sin(nodTime) * 0.25;
        headGroupRef.current.rotation.x += nodAngle;
      }
    }

    // 3. Floating Neck Collar (Bobbing out of sync for anti-gravity feel)
    if (collarRef.current) {
      const collarBob = Math.sin(time * 1.2 - 0.8) * 0.018;
      collarRef.current.position.y = -0.7 + collarBob;
      
      if (headGroupRef.current) {
        collarRef.current.rotation.y += (headGroupRef.current.rotation.y - collarRef.current.rotation.y) * 3 * delta;
        collarRef.current.rotation.x += (headGroupRef.current.rotation.x * 0.3 - collarRef.current.rotation.x) * 3 * delta;
      }
    }

    // 4. Orbiting Particles Ring (swirling neural particles)
    if (particlesGroupRef.current) {
      const particles = particlesGroupRef.current.children;
      particleSeeds.current.forEach((seed, index) => {
        const mesh = particles[index] as THREE.Mesh;
        if (mesh) {
          seed.angle += delta * seed.speed * p.particleSpeed * 0.6;
          const radius = seed.radiusOffset * p.particleRadius;
          const targetX = Math.cos(seed.angle) * radius;
          const targetZ = Math.sin(seed.angle) * radius;
          const targetY = seed.height + Math.sin(time * seed.speed + seed.angle) * 0.15;

          mesh.position.set(targetX, targetY, targetZ);
          
          const mat = mesh.material as THREE.MeshBasicMaterial;
          if (mat) {
            const baseOpacity = 0.2 + tProgress * 0.7;
            mat.opacity = baseOpacity * (0.6 + Math.sin(time * 2 + index) * 0.4);
          }
        }
      });
      particlesGroupRef.current.rotation.y += delta * 0.08;
    }

    // 5. Spotlight Tracking Mouse (gives model high dynamic glints)
    if (spotlightRef.current) {
      const targetLightX = mouseRef.current.x * 3.5;
      const targetLightY = mouseRef.current.y * 2.5 + 0.5;
      spotlightRef.current.position.x += (targetLightX - spotlightRef.current.position.x) * 5 * delta;
      spotlightRef.current.position.y += (targetLightY - spotlightRef.current.position.y) * 5 * delta;

      const baseIntensity = 3.0 + (tProgress * 2.0);
      if (aiState === "thinking") {
        spotlightRef.current.intensity = baseIntensity * (1.3 + Math.sin(time * 16) * 0.4);
      } else if (aiState === "typing") {
        spotlightRef.current.intensity = baseIntensity * (1.1 + Math.sin(time * 26) * 0.15);
      } else {
        spotlightRef.current.intensity = baseIntensity * (1.0 + Math.sin(time * 1.5) * 0.05);
      }
    }

    // 6. Dynamic Emissive Materials Animation
    const brandColorObj = new THREE.Color(getBrandColor());
    emissiveMaterialsRef.current.forEach((mat) => {
      if ("emissive" in mat) {
        (mat as any).emissive.lerp(brandColorObj, 4 * delta);
        
        const emissionTarget = aiState === "thinking" 
          ? 1.8 + Math.sin(time * 14) * 0.4 
          : aiState === "typing" 
          ? 1.5 + Math.sin(time * 22) * 0.3
          : (1.0 + tProgress * 0.4);
          
        if ("emissiveIntensity" in mat) {
          (mat as any).emissiveIntensity = emissionTarget;
        }
      }
    });
  });

  // Color mapping based on AI Activity state & Theme
  const getBrandColor = () => {
    if (theme === "light") {
      switch (aiState) {
        case "thinking": return "#0284c7"; // Sky Blue accent in Light Mode
        case "typing": return "#0f172a"; // Dark Slate
        default: return "#0284c7"; // Bright Sapphire accent
      }
    }
    switch (aiState) {
      case "thinking": return "#38bdf8"; // Ice Cyan
      case "typing": return "#f8fafc"; // Soft Electric White
      default: return "#38bdf8"; // Vibrant Ice Cyan Accent
    }
  };

  return (
    <group>
      {/* Studio Lights with Depth & Shading */}
      <pointLight
        ref={spotlightRef}
        position={[0, 0.5, 2.5]}
        intensity={theme === "light" ? 2.5 : 1.8}
        distance={9}
        color={getBrandColor()}
        decay={1.6}
      />

      <ambientLight intensity={theme === "light" ? 0.65 : 0.3} />
      {/* High-Key studio rim lighting for sleek body definition */}
      <directionalLight position={[-4, 4, 3]} intensity={theme === "light" ? 2.0 : 1.5} color="#ffffff" />
      <directionalLight position={[4, 2, -2]} intensity={theme === "light" ? 1.2 : 0.8} color={theme === "light" ? "#e2e8f0" : "#94a3b8"} />
      <directionalLight position={[0, -3, 2]} intensity={0.4} color={getBrandColor()} />

      <group ref={modelGroup}>
        
        {/* INTERACTIVE LOADED MODEL & ROTATION TRACKING GROUP */}
        <group ref={headGroupRef} onClick={handleModelClick}>
          {scaled && <primitive object={scene} />}
        </group>

        {/* Orbiting Particles Ring (swirling neural particles) */}
        <group ref={particlesGroupRef}>
          {particleSeeds.current.map((seed, index) => (
            <mesh key={index} position={[0, 0, 0]}>
              <sphereGeometry args={[seed.size, 8, 8]} />
              <meshBasicMaterial
                color={index % 3 === 0 ? "#ffffff" : getBrandColor()}
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>

      </group>
    </group>
  );
};
