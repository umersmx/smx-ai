import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "motion/react";
import { AndroidModel } from "./AndroidModel";
import { AIState } from "../types";

interface ThreeCanvasContainerProps {
  aiState: AIState;
  viewMode: "landing" | "chat";
  scrollProgress: number;
  hasMessages: boolean;
}

export const ThreeCanvasContainer: React.FC<ThreeCanvasContainerProps> = ({ 
  aiState, 
  viewMode, 
  scrollProgress,
  hasMessages 
}) => {
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // WebGL Support Detection
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const isSupported = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      setWebglSupported(isSupported);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Track mouse coordinates for the pure CSS/SVG fallback light glare
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Determine ambient backdrop glow class based on AI State
  const glowClass = {
    idle: "ambient-glow opacity-80",
    thinking: "ambient-glow-thinking opacity-100 scale-110",
    typing: "ambient-glow-typing opacity-90 scale-105",
  };

  const cssBlobColors = {
    idle: "from-white/10 via-zinc-800/20 to-transparent shadow-[0_0_80px_rgba(255,255,255,0.08)]",
    thinking: "from-white/20 via-zinc-700/30 to-transparent shadow-[0_0_100px_rgba(255,255,255,0.15)]",
    typing: "from-white/15 via-zinc-800/20 to-transparent shadow-[0_0_80px_rgba(255,255,255,0.1)]",
  };

  // Determine fallback container translate based on scroll / viewMode
  const getFallbackTransform = () => {
    const isMobileOrTablet = typeof window !== "undefined" && window.innerWidth < 1024;
    const effectiveScrollProgress = isMobileOrTablet ? 0 : scrollProgress;
    if (viewMode === "landing") {
      const xOffset = effectiveScrollProgress * 150; // shift rightwards
      const yOffset = effectiveScrollProgress * -50; // shift downwards
      return `translate(${xOffset}px, ${yOffset}px) scale(${1 - effectiveScrollProgress * 0.15})`;
    } else {
      if (!hasMessages) {
        return `translate(0px, 0px) scale(${isMobileOrTablet ? 0.95 : 1.35})`;
      }
      const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
      const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      
      const chatWidth = Math.min(windowWidth, 768);
      const rightOffset = isMobileOrTablet ? 25 : 30;
      const targetPixelXFromCenter = (chatWidth / 2) - rightOffset;
      
      const bottomOffset = isMobileOrTablet ? 140 : 170;
      // Convert to translate Y from center: positive is down, so:
      // bottom of screen is +(windowHeight/2).
      // bottomOffset above bottom is +(windowHeight/2) - bottomOffset.
      const targetPixelYFromCenter = (windowHeight / 2) - bottomOffset;
      
      const scaleVal = isMobileOrTablet ? 0.65 : 0.9;
      return `translate(${targetPixelXFromCenter}px, ${targetPixelYFromCenter}px) scale(${scaleVal})`;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-dark-bg z-0">
      {/* 1. Ambient Background Glow (Aura behind the model) */}
      <div 
        className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out ${glowClass[aiState]} z-[1]`}
        style={{ transform: "translateZ(0)" }}
      />

      {/* Responsive mobile & tablet readability scrim to dim the 3D model slightly */}
      <div className="absolute inset-0 bg-black/60 md:hidden pointer-events-none z-[3]" />

      {/* Grid Overlay for subtle Technical/Cyber vibe */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Radial shade on edges for cinematic vignette */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,#050507_95%] pointer-events-none" />

      {/* 2. Interactive Canvas Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[2]">
        {webglSupported ? (
          <div className="w-full h-full relative flex items-center justify-center">
            <Canvas
              camera={{ position: [0, 0.4, 4.2], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              style={{ background: "transparent" }}
            >
              <Suspense fallback={null}>
                <AndroidModel 
                  aiState={aiState} 
                  viewMode={viewMode} 
                  scrollProgress={scrollProgress} 
                  hasMessages={hasMessages}
                />
              </Suspense>
            </Canvas>
          </div>
        ) : (
          /* High-Fidelity 2D Liquid Blob Fallback */
          <div 
            className="relative w-[300px] h-[300px] flex items-center justify-center transition-all duration-700 ease-out"
            style={{ transform: getFallbackTransform() }}
          >
            {/* Dynamic CSS Spotlight glare behind fallback */}
            <div 
              className="absolute w-[450px] h-[450px] rounded-full blur-[120px] transition-all duration-1000 ease-out"
              style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                background: aiState === "idle" 
                  ? "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)" 
                  : aiState === "thinking" 
                  ? "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)" 
                  : "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)"
              }}
            />

            {/* Simulated Glass/Metal Liquid Blob using organic Framer Motion Keyframes */}
            <motion.div
              className={`w-[220px] h-[220px] bg-gradient-to-tr ${cssBlobColors[aiState]} backdrop-blur-[4px] border border-white/10 transition-colors duration-1000`}
              animate={{
                borderRadius: [
                  "42% 58% 70% 30% / 45% 45% 55% 55%",
                  "70% 30% 52% 48% / 60% 40% 60% 40%",
                  "50% 50% 35% 65% / 50% 60% 40% 50%",
                  "42% 58% 70% 30% / 45% 45% 55% 55%"
                ],
                rotate: 360,
                scale: aiState === "thinking" ? 1.12 : aiState === "typing" ? [1.02, 0.98, 1.02] : 1
              }}
              transition={{
                borderRadius: {
                  duration: aiState === "thinking" ? 3 : aiState === "typing" ? 4 : 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotate: {
                  duration: aiState === "thinking" ? 6 : aiState === "typing" ? 10 : 20,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: aiState === "typing" ? {
                  duration: 0.15,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            />

            {/* Fallback complete */}
          </div>
        )}
      </div>
    </div>
  );
};
