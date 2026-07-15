import { useState } from "react";
import { ThreeCanvasContainer } from "./components/ThreeCanvasContainer";
import { ChatInterface } from "./components/ChatInterface";
import { LandingPage } from "./components/LandingPage";
import { AIState } from "./types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [aiState, setAiState] = useState<AIState>("idle");
  const [viewMode, setViewMode] = useState<"landing" | "chat">("landing");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [hasMessages, setHasMessages] = useState<boolean>(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-dark-bg font-sans selection:bg-brand-cyan/30">
      {/* 1. 3D WebGL Canvas Background Layer (Always mounted to preserve WebGL context) */}
      <ThreeCanvasContainer 
        aiState={aiState} 
        viewMode={viewMode} 
        scrollProgress={scrollProgress} 
        hasMessages={hasMessages}
      />

      {/* 2. Foreground UI Layer overlays */}
      <div className="absolute inset-0 w-full h-full flex flex-col z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {viewMode === "landing" ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <LandingPage 
                onLaunchApp={() => setViewMode("chat")} 
                onScrollChange={setScrollProgress} 
                aiState={aiState}
                setAiState={setAiState}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <ChatInterface 
                aiState={aiState} 
                setAiState={setAiState} 
                onBackToLanding={() => setViewMode("landing")}
                setHasMessages={setHasMessages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
