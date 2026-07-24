import React, { useRef, useEffect, useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Terminal, 
  Database, 
  Layers, 
  Activity, 
  Sliders, 
  Zap, 
  MessageSquare,
  Compass,
  ArrowUpRight,
  ChevronDown,
  Eye,
  Workflow,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, AIState } from "../types";

interface LandingPageProps {
  onLaunchApp: () => void;
  onScrollChange: (progress: number) => void;
  aiState?: AIState;
  setAiState?: (state: AIState) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLaunchApp, 
  onScrollChange,
  aiState = "idle",
  setAiState
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [miniMessages, setMiniMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am SMX. Ask me anything here, or click to open the full dashboard.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [miniInput, setMiniInput] = useState("");
  const miniMessagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMiniMessage = async () => {
    const prompt = miniInput.trim();
    if (!prompt) return;

    setMiniInput("");
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `mini-u-${Date.now()}`;
    const assistantMsgId = `mini-a-${Date.now()}`;

    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp
    };

    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "...",
      timestamp
    };

    const updated = [...miniMessages, userMsg];
    setMiniMessages([...updated, assistantPlaceholder]);
    
    if (setAiState) setAiState("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated })
      });

      if (!response.body) throw new Error();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedText = "";
      let isFirstChunk = true;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (done) break;

        const chunkValue = decoder.decode(value);
        const lines = chunkValue.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              done = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                if (isFirstChunk) {
                  if (setAiState) setAiState("typing");
                  isFirstChunk = false;
                }
                streamedText += parsed.text;

                setMiniMessages(prev => prev.map(m => {
                  if (m.id === assistantMsgId) {
                    return { ...m, content: streamedText };
                  }
                  return m;
                }));
              }
            } catch (err) {}
          }
        }
      }
      if (setAiState) setAiState("idle");
    } catch (e) {
      if (setAiState) setAiState("idle");
      setMiniMessages(prev => prev.map(m => {
        if (m.id === assistantMsgId) {
          return { ...m, content: "Error communicating with my neural core." };
        }
        return m;
      }));
    }
  };

  useEffect(() => {
    if (isChatExpanded) {
      miniMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [miniMessages, isChatExpanded]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
    onScrollChange(progress);

    if (scrollTop > 50) {
      setIsChatExpanded(false);
    } else if (scrollTop <= 10) {
      setIsChatExpanded(true);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div 
      ref={scrollContainerRef}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar scroll-smooth snap-y snap-mandatory z-20 pointer-events-auto"
    >
      {/* 1. HEADER NAV BAR */}
      <header className="fixed top-6 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <img src="/logo.svg" alt="smx.ai logo" className="w-5 h-5 object-contain" />
            <span className="font-display font-semibold tracking-widest text-white text-base">smx.ai</span>
          </div>
        </div>
      </header>

      {/* 2. SECTION 1: HERO CONTAINER (Snap Section) */}
      <section className="min-h-screen w-full flex flex-col justify-center px-6 md:px-16 pt-24 relative snap-start">
        <div className="max-w-3xl space-y-6 select-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-cyan/20 bg-brand-cyan/5 text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-semibold"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Digital Intelligence Re-imagined</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="space-y-4"
          >
            <h1 className="font-display text-4xl md:text-6xl font-semibold text-white tracking-tight leading-tight select-text">
              Meet <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-slate to-brand-deep">
                SMX AI
              </span>
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-300 font-display font-medium max-w-xl select-text">
              The AI that thinks before it speaks.
            </h2>
            <p className="font-sans text-sm text-gray-400 leading-relaxed max-w-lg select-text">
              Instead of generic text containers or static dashboards, meet your digital signature guide. A highly polished 3D avatar built to follow your cursor, pulse to incoming tokens, and represent physical cognitive intelligence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button
              id="btn-hero-launch"
              onClick={onLaunchApp}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-white/90 text-black font-mono font-medium text-xs transition duration-200 flex items-center gap-2 pointer-events-auto cursor-pointer shadow-lg hover:shadow-brand-cyan/10"
            >
              <span>CONNECT CHATSTREAM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#avatar-concept"
              className="px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition duration-200 flex items-center gap-1.5 pointer-events-auto"
            >
              <span>THE AVATAR PROTOCOL</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </a>
          </motion.div>
        </div>

        {/* Floating Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-500 text-[10px] font-mono animate-bounce select-none">
          <span>SCROLL TO AWAKEN CORE METRIC</span>
          <ChevronDown className="w-4 h-4 text-brand-cyan" />
        </div>
      </section>

      {/* 3. SECTION 2: THE DIGITAL AVATAR CONCEPT (Snap Section) */}
      <section id="avatar-concept" className="min-h-screen w-full flex flex-col justify-center px-6 md:px-16 py-16 relative snap-start">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>01 // Cinematic Humanoid Identity</span>
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-semibold text-white tracking-tight select-text">
            Premium White Robot Head. Minimalist Luxury.
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed font-sans select-text">
            Avoid the classic "uncanny valley." SMX features a floating white ceramic robot head with gloss back covers and obsidian glass visors, reminiscent of premium Apple or Figure AI hardware designs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 select-text">
            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <div className="h-8 w-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                <Compass className="w-4 h-4 text-brand-cyan" />
              </div>
              <h3 className="font-display font-medium text-sm text-white">Interactive Focus Tracking</h3>
              <p className="text-[11px] text-gray-400 leading-normal font-sans">
                The head smoothly turns to look directly at your mouse cursor. Spotlight updates reveal beautiful clearcoat glints.
              </p>
            </div>
            
            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <div className="h-8 w-8 rounded-lg bg-brand-deep/15 border border-brand-deep/25 flex items-center justify-center">
                <Eye className="w-4 h-4 text-brand-cyan" />
              </div>
              <h3 className="font-display font-medium text-sm text-white">Active Wake-up Eyes</h3>
              <p className="text-[11px] text-gray-400 leading-normal font-sans">
                As you scroll down, the model zooms closer, eyes transition into a bright glow, and 26 neural particles begin floating around it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 3: SYSTEM PROTOCOL DIAGNOSTICS (Snap Section) */}
      <section id="diagnostics" className="min-h-screen w-full flex flex-col justify-center px-6 md:px-16 py-16 relative snap-start">
        <div className="max-w-3xl mx-auto w-full space-y-8 select-text">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>02 // Telemetry & Calibration</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Synchronized cognitive metrics.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Graph Panel */}
            <div className="p-6 rounded-2xl border border-white/5 bg-black/40 space-y-6">
              <p className="text-[10px] font-mono text-gray-400 tracking-wider">NEURAL NETWORK PERFORMANCE</p>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Rendering Thread (60 FPS)</span>
                    <span className="text-brand-cyan">1.2ms</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-cyan h-full w-[96%]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Avatar Synchronicity Level</span>
                    <span className="text-brand-cyan">99.8%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-deep h-full w-[99.8%]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Particle Core Gravity</span>
                    <span className="text-brand-white/80">9.81 m/s²</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-white h-full w-[88%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Diagnostic Text */}
            <div className="p-6 rounded-2xl border border-white/5 bg-black/40 flex flex-col justify-between">
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-brand-cyan tracking-widest uppercase">CONVERGENCE ALGORITHM</p>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  By blending Three.js high-gloss physical standard materials with optimized canvas scaling, SMX loads without freezing active input loops. Click on the 3D model at any time to request a physical nod response.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>MODEL TEMPERATURE: OPTIMAL</span>
                <span>STATUS: STABLE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 4: BENTO GRID OF CAPABILITIES (Snap Section) */}
      <section id="features" className="min-h-screen w-full flex flex-col justify-center px-6 md:px-16 py-16 relative snap-start">
        <div className="max-w-5xl mx-auto w-full space-y-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>03 // Core App Capabilities</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-white tracking-tight">
              A premium suite for high-end chatting.
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-auto select-text">
            {/* Box 1 (Large) */}
            <div className="md:col-span-2 p-6 rounded-2xl glass-panel space-y-4 hover:border-brand-cyan/25 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
                <Terminal className="w-40 h-40 text-white" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
                <Terminal className="w-5 h-5 text-brand-cyan" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-white">Full Syntax Highlighter</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Flawless rendering of raw code fragments. Embedded blocks highlight commands, syntax tokens, and feature one-click clipboard copying.
                </p>
              </div>
            </div>

            {/* Box 2 (Small) */}
            <div className="p-6 rounded-2xl glass-panel space-y-4 hover:border-brand-cyan/25 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-deep/15 border border-brand-deep/25">
                <Sliders className="w-5 h-5 text-brand-cyan" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-white">Entropy Modulation</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Fine-tune AI temperature and max tokens. Fully calibrated sliders update real-time request configurations.
                </p>
              </div>
            </div>

            {/* Box 3 (Small) */}
            <div className="p-6 rounded-2xl glass-panel space-y-4 hover:border-brand-cyan/25 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-white/10 border border-brand-white/20">
                <Workflow className="w-5 h-5 text-brand-white" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-white">Adaptive Prompts</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Four high-end preconfigured templates to instantly prompt SMX in code diagnostics, formatting, and creative tasks.
                </p>
              </div>
            </div>

            {/* Box 4 (Large) */}
            <div className="md:col-span-2 p-6 rounded-2xl glass-panel space-y-4 hover:border-brand-cyan/25 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
                <MessageSquare className="w-40 h-40 text-white" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
                <MessageSquare className="w-5 h-5 text-brand-cyan" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-semibold text-base text-white">Chronology History Database</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Manage persistent local chat threads. Click the sidebar drawer to rename, duplicate, switch, or permanently delete communication databases.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="pt-8 flex flex-col items-center gap-6">
            <h3 className="font-display font-medium text-lg text-white text-center">Ready to experience cinematic intelligence?</h3>
            <button
              id="btn-bottom-cta"
              onClick={onLaunchApp}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-xs font-mono font-medium text-white transition hover:scale-105 shadow-[0_0_40px_rgba(26,130,164,0.35)] pointer-events-auto cursor-pointer"
            >
              <span>DEEP CONNECT SMX.AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5 text-center text-[10px] font-mono text-gray-500 snap-end">
        <p>© 2026 SMX.AI CONVERGENCE INC. ALL RIGHTS RESERVED.</p>
      </footer>

      {/* 6. COMPACT COLLAPSED/EXPANDED CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto flex flex-col items-end">
        <AnimatePresence mode="wait">
          {!isChatExpanded ? (
            <motion.button
              key="collapsed-bubble"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={() => {
                if (window.innerWidth < 768) {
                  onLaunchApp();
                } else {
                  setIsChatExpanded(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-3 md:px-4 md:py-3 rounded-full border border-brand-cyan/30 bg-black/85 backdrop-blur-xl shadow-[0_0_20px_rgba(26,130,164,0.2)] hover:border-brand-cyan/60 hover:shadow-[0_0_25px_rgba(26,130,164,0.35)] transition cursor-pointer select-none group"
            >
              <div className="relative">
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <MessageSquare className="w-4 h-4 text-brand-cyan group-hover:text-brand-cyan/80 transition" />
              </div>
              <span className="font-mono text-[11px] text-gray-300 tracking-wider font-semibold hidden md:inline">
                ASK SMX AI
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="expanded-box"
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="w-80 h-96 border border-white/10 bg-black/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col hidden md:flex"
            >
              {/* Header */}
              <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-display font-medium text-xs tracking-wider text-white">SMX AI COMPACT COGNITION</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={onLaunchApp}
                    className="p-1 rounded text-[10px] font-mono font-medium text-brand-cyan hover:text-brand-cyan/80 hover:bg-white/5 transition"
                    title="Open Full Dashboard"
                  >
                    FULL VIEW
                  </button>
                  <button 
                    onClick={() => setIsChatExpanded(false)} 
                    className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                {miniMessages.map((m) => {
                  const isAssistant = m.role === "assistant";
                  return (
                    <div 
                      key={m.id}
                      className={`flex flex-col max-w-[85%] ${isAssistant ? "self-start" : "self-end ml-auto"}`}
                    >
                      <div className={`p-2.5 rounded-xl text-xs font-sans leading-relaxed ${
                        isAssistant 
                          ? "bg-white/5 text-gray-200 border border-white/5" 
                          : "bg-brand-cyan text-white ml-auto"
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 mt-1 self-end">{m.timestamp}</span>
                    </div>
                  );
                })}
                <div ref={miniMessagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-2 border-t border-white/5 bg-white/5 flex items-center gap-1.5">
                <input 
                  type="text"
                  value={miniInput}
                  onChange={(e) => setMiniInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMiniMessage();
                    }
                  }}
                  placeholder="Ask a quick query..."
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                />
                <button 
                  onClick={handleSendMiniMessage}
                  disabled={!miniInput.trim()}
                  className="p-2 rounded-lg bg-brand-cyan hover:bg-brand-cyan/90 disabled:opacity-40 text-white transition flex items-center justify-center shrink-0"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
