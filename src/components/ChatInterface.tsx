import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Sparkles, 
  X, 
  ChevronRight,
  Sliders,
  Volume2,
  VolumeX,
  RefreshCw,
  FileText,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, ChatThread, AIState } from "../types";
import { AetherMessageBubble } from "./AetherMessageBubble";

interface ChatInterfaceProps {
  aiState: AIState;
  setAiState: (state: AIState) => void;
  onBackToLanding?: () => void;
  setHasMessages?: (hasMessages: boolean) => void;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    title: "New Conversation",
    created_at: "Just now",
    messages: []
  }
];

const PRESETS = [
  { label: "State Response Explanation", prompt: "Explain SMX's state response system and how the 3D model reacts." },
  { label: "Mathematical Harmony Construct", prompt: "Give me an advanced TypeScript code sample calculating high-order resonance." },
  { label: "Sentient Cognitive Greeting", prompt: "Conduct an energetic diagnostic scan on SMX and introduce yourself." }
];

const getSimulatedResponse = (userPrompt: string): string[] => {
  const promptLower = userPrompt.toLowerCase();
  
  if (promptLower.includes("who are you") || promptLower.includes("what are you") || promptLower.includes("who are")) {
    return [
      "I am **SMX AI**, a custom AI assistant developed by Umer Farooq as an AI project.",
      "\n\nYou can learn more or connect with him here:",
      "\n*   **LinkedIn:** [Umer Farooq's Profile](https://linkedin.com/in/umersmx)",
      "\n*   **Portfolio:** [Umer Farooq's Portfolio](https://umerfarooq.dev)"
    ];
  }
  
  if (promptLower.includes("owner") || promptLower.includes("creator") || promptLower.includes("developer") || promptLower.includes("create")) {
    return [
      "I am owned and developed by **Umer Farooq**, a 5th-semester computer science student from Pakistan.",
      "\n\nHere are his social links:",
      "\n*   **LinkedIn:** [Umer Farooq's Profile](https://linkedin.com/in/umersmx)",
      "\n*   **GitHub:** [Umer Farooq's GitHub](https://github.com/umersmx)"
    ];
  }
  
  if (promptLower.includes("hello") || promptLower.includes("hi") || promptLower.includes("hey")) {
    return [
      "Hello! I am **SMX AI**. How can I help you today?"
    ];
  }

  // General default fallback
  return [
    "I am doing great! How can I help you today? Please feel free to ask me any questions."
  ];
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  aiState, 
  setAiState,
  onBackToLanding,
  setHasMessages,
  theme = "dark",
  toggleTheme
}) => {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-1");
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Custom dialog toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Settings Configuration states
  const [modelTemp, setModelTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [systemCore, setSystemCore] = useState("SMX Sentient");
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("GEMINI_API_KEY") || import.meta.env.VITE_GEMINI_API_KEY || "";
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    if (setHasMessages) {
      setHasMessages(activeThread ? activeThread.messages.length > 0 : false);
    }
  }, [activeThread?.messages?.length, setHasMessages]);

  // Auto-scroll logic triggered by new messages or streaming expansion
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, activeThread?.messages[activeThread.messages.length - 1]?.content]);

  // Handle stream client reading
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputValue).trim();
    if (!prompt) return;

    if (!textToSend) {
      setInputValue("");
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now()}`;

    // Create user message object
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: prompt,
      timestamp
    };

    // Prepare assistant placeholder message
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "...", // Initial thinking placeholder
      timestamp
    };

    // Update state with user message and empty assistant response
    const updatedMessages = [...activeThread.messages, userMessage];
    const updatedThreads = threads.map(t => {
      if (t.id === activeThreadId) {
        // Auto-update thread title if it's currently a placeholder or short
        const newTitle = t.title === "New Conversation" || t.messages.length === 0 
          ? prompt.slice(0, 32) + (prompt.length > 32 ? "..." : "")
          : t.title;

        return {
          ...t,
          title: newTitle,
          messages: [...updatedMessages, assistantPlaceholder]
        };
      }
      return t;
    });

    setThreads(updatedThreads);
    setAiState("thinking");

    const activeKey = apiKey || localStorage.getItem("GEMINI_API_KEY") || "";

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (activeKey && activeKey.trim() !== "" && activeKey !== "MY_GEMINI_API_KEY") {
        headers["x-gemini-api-key"] = activeKey;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: updatedMessages,
          temperature: modelTemp,
          maxTokens: maxTokens,
          systemCore: systemCore
        })
      });

      if (!response.body) throw new Error("No response body");

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
                  setAiState("typing");
                  isFirstChunk = false;
                }
                streamedText += parsed.text;

                setThreads(prevThreads => prevThreads.map(t => {
                  if (t.id === activeThreadId) {
                    const cleanMsgs = t.messages.map(m => {
                      if (m.id === assistantMsgId) {
                        return { ...m, content: streamedText };
                      }
                      return m;
                    });
                    return { ...t, messages: cleanMsgs };
                  }
                  return t;
                }));
              }
            } catch (err) {}
          }
        }
      }

      setAiState("idle");
    } catch (error: any) {
      console.error("Communication error:", error);
      
      // Fallback to simulated response
      setAiState("typing");
      const responseChunks = getSimulatedResponse(prompt);
      let chunkIndex = 0;
      let accumulatedText = "*(SMX AI is operating in local cognitive reserve mode - Connection to backend failed)*\n\n";

      const sendNextChunk = () => {
        if (chunkIndex < responseChunks.length) {
          accumulatedText += responseChunks[chunkIndex];
          
          setThreads(prevThreads => prevThreads.map(t => {
            if (t.id === activeThreadId) {
              const cleanMsgs = t.messages.map(m => {
                if (m.id === assistantMsgId) {
                  return { ...m, content: accumulatedText };
                }
                return m;
              });
              return { ...t, messages: cleanMsgs };
            }
            return t;
          }));
          
          chunkIndex++;
          setTimeout(sendNextChunk, 800);
        } else {
          setAiState("idle");
        }
      };

      setTimeout(sendNextChunk, 500);
    }
  };

  // Helper actions
  const handleAddNewThread = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: "New Conversation",
      created_at: "Just now",
      messages: []
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
  };

  const handleDeleteThread = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter(t => t.id !== idToDelete);
    if (filtered.length === 0) {
      const fallbackId = `thread-${Date.now()}`;
      setThreads([{
        id: fallbackId,
        title: "New Conversation",
        created_at: "Just now",
        messages: []
      }]);
      setActiveThreadId(fallbackId);
    } else {
      setThreads(filtered);
      if (activeThreadId === idToDelete) {
        setActiveThreadId(filtered[0].id);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const list = Array.from(files).map(f => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB"
      }));
      setAttachedFiles([...attachedFiles, ...list]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeAttachedFile = (idx: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== idx));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderChatInput = () => {
    return (
      <motion.div 
        layoutId="chat-input-wrapper" 
        className="max-w-3xl mx-auto w-full"
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      >
        {/* Attached files preview shelf */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((f, idx) => (
              <div key={idx} className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-white/10 bg-white/5 text-[10px]">
                <FileText className="w-3 h-3 text-brand-cyan" />
                <span className="font-sans font-medium text-gray-300 truncate max-w-[120px]">{f.name}</span>
                <button onClick={() => removeAttachedFile(idx)} className="hover:text-red-400 transition ml-1 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box Row */}
        <div className="relative flex items-center rounded-2xl border border-white/10 focus-within:border-brand-cyan/50 bg-black/40 px-3.5 py-2 transition duration-200">
          {/* Attachment trigger */}
          <button
            id="btn-attach"
            onClick={triggerFileSelect}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Attach Data Matrix"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple
          />

          {/* Text Input area */}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={aiState === "typing" ? "Stream is compiling..." : "Interface query input..."}
            disabled={aiState === "thinking" || aiState === "typing"}
            rows={1}
            className="flex-1 max-h-24 min-h-[2.5rem] bg-transparent border-0 focus:outline-none text-sm text-white placeholder-gray-500 px-3 py-2.5 resize-none custom-scrollbar"
            style={{ scrollbarWidth: "none" }}
          />

          {/* Action operations */}
          <div className="flex items-center gap-1">
            {/* Voice mode toggle */}
            <button
              id="btn-voice"
              onClick={() => setIsVoiceActive(true)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isVoiceActive 
                  ? "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 animate-pulse" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title="Acoustic Voice Matrix"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              id="btn-send-message"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || aiState === "thinking" || aiState === "typing"}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                inputValue.trim() && aiState === "idle"
                  ? (theme === "light" ? "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105" : "bg-white text-black hover:bg-slate-100 hover:scale-105 font-semibold")
                  : "text-gray-500 bg-transparent cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Disclaimer subtitle */}
        <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 px-1.5 mt-2">
          <span>SHIFT + ENTER for line break</span>
          <span>SECURE AI ENGINE ENDPOINT ACTIVE</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 flex w-full h-full max-w-7xl mx-auto overflow-hidden text-gray-200 z-20 pointer-events-auto">
      {/* 1. ELEGANT COLLAPSIBLE SIDEBAR */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            id="sidebar-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="hidden md:flex flex-col shrink-0 h-full border-r border-white/10 glass-panel overflow-hidden relative z-20 pointer-events-auto"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="smx.ai" className="w-5 h-5" />
                <span className="font-display font-medium text-sm tracking-widest text-white uppercase">smx.ai</span>
              </div>
              <button 
                id="btn-close-sidebar"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Thread Button */}
            <div className="p-3">
              <button
                id="btn-new-thread"
                onClick={handleAddNewThread}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-brand-cyan/50 bg-white/5 hover:bg-brand-cyan/10 text-xs text-brand-cyan/90 hover:text-white font-medium transition duration-200 cursor-pointer pointer-events-auto"
              >
                <Plus className="w-4 h-4" />
                <span>New Coordinate</span>
              </button>
            </div>

            {/* Threads History Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
              {threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? "bg-brand-cyan/10 border-brand-cyan/30 text-white" 
                        : "border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-brand-cyan" : "text-gray-500"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-sans font-medium truncate leading-tight">{thread.title}</p>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">{thread.created_at}</p>
                      </div>
                    </div>
                    
                    {/* Delete thread action */}
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 hover:text-rose-400 transition text-gray-500 cursor-pointer"
                      title="Erase Memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer / System status */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between text-[10px] font-mono text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                SMX AI CORE v3.5
              </span>
              <span>UTC-07</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN CENTRAL CHAT WORKSPACE */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden z-10 pointer-events-auto">
        
        {/* Floating Toggle Sidebar on top for Mobile/Collapsed states */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 glass-panel relative z-10 pointer-events-auto">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                id="btn-open-sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                title="Expand Chronology"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="font-display font-medium text-sm tracking-widest text-white uppercase flex items-center gap-2.5">
                <img src="/logo.svg" alt="smx.ai" className="w-4.5 h-4.5 inline-block" />
                SMX AI // SENTIENT CORE
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-white border border-white/20">
                  {aiState.toUpperCase()}
                </span>
              </h1>
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">HIGH-DIMENSIONAL CONVERGENCE INTERFACE</p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              id="btn-new-chat-top"
              onClick={handleAddNewThread}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-xs text-brand-cyan hover:text-white transition cursor-pointer pointer-events-auto font-mono font-medium"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">NEW CHAT</span>
              <span className="sm:hidden">NEW</span>
            </button>
            {onBackToLanding && (
              <button
                id="btn-back-to-landing"
                onClick={onBackToLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-300 hover:text-white transition cursor-pointer pointer-events-auto mr-1 font-mono font-medium"
                title="Return to specifications screen"
              >
                <span>SPECIFICATIONS</span>
              </button>
            )}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer pointer-events-auto"
                title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-800" />}
              </button>
            )}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer pointer-events-auto"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer pointer-events-auto"
              title="Aether Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MESSAGES CONTAINER FEED */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-2 relative pointer-events-auto w-full"
        >
          {activeThread.messages.length === 0 ? (
            /* EMPTY STATE WITH PRESETS */
            <div className="h-full flex flex-col justify-center items-center max-w-xl mx-auto px-4 text-center mt-4 w-full">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6 w-full flex flex-col items-center"
              >
                <div className="relative inline-flex items-center justify-center p-4 rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
                  <Sparkles className="w-8 h-8 text-brand-cyan animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-display text-lg font-medium text-white tracking-wide">Establish Cognitive Resonance</h2>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    SMX AI is a custom AI assistant powered by Gemini. Initiate communications below to monitor active 3D state mutations.
                  </p>
                </div>

                {/* Centered Input Box */}
                <div className="w-full py-2 pointer-events-auto">
                  {renderChatInput()}
                </div>

                {/* Suggestions Preset Chips */}
                <div className="grid gap-2.5 text-left pt-2 pointer-events-auto w-full">
                  <p className="text-[10px] font-mono font-semibold text-brand-cyan uppercase tracking-widest pl-1 mb-1">RECOMMENDED CHANNELS</p>
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(preset.prompt)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 hover:border-brand-cyan/30 bg-white/5 hover:bg-brand-cyan/5 text-xs text-gray-300 hover:text-white transition duration-200 cursor-pointer"
                    >
                      <span className="font-sans font-medium line-clamp-1">{preset.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* CONVERSATION STREAM FEED */
            <div className="max-w-3xl mx-auto space-y-2 select-text selection:bg-brand-cyan/30">
              {activeThread.messages.map((message) => (
                <AetherMessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* FLOATING CHAT INPUT GROUND */}
        {activeThread.messages.length > 0 && (
          <div className="p-4 border-t border-white/10 glass-panel relative z-10 pointer-events-auto">
            {renderChatInput()}
          </div>
        )}
      </div>

      {/* 3. SETTINGS OVERLAY PANEL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-white/10 rounded-2xl bg-[#0e0e11] shadow-2xl p-6 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-cyan" />
                  <h3 className="font-display font-medium text-white tracking-wide">SMX Core Parameters</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Temp setting */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Entropy Level (Temperature)</span>
                    <span className="text-brand-cyan font-semibold">{modelTemp}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={modelTemp} 
                    onChange={(e) => setModelTemp(parseFloat(e.target.value))}
                    className="w-full accent-brand-cyan bg-white/5 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>Deterministic</span>
                    <span>Highly Creative</span>
                  </div>
                </div>

                {/* Token range */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Memory Matrix (Max Tokens)</span>
                    <span className="text-brand-cyan font-semibold">{maxTokens}</span>
                  </div>
                  <input 
                    type="range" 
                    min="256" 
                    max="4096" 
                    step="256" 
                    value={maxTokens} 
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full accent-brand-cyan bg-white/5 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>256 (Brief)</span>
                    <span>4096 (Deep)</span>
                  </div>
                </div>

                {/* System Core Setting */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-gray-400">Cognitive Persona Identity</label>
                  <select 
                    value={systemCore} 
                    onChange={(e) => setSystemCore(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan/50"
                  >
                    <option value="SMX Sentient">SMX - Sentient Digital Companion (Recommended)</option>
                    <option value="SMX Code">SMX - Specialized Code Engineer</option>
                    <option value="SMX Academic">SMX - Deep Academic Theorist</option>
                  </select>
                </div>

                {/* API Key Setting */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-gray-400">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="Enter your Gemini API Key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan/50 font-mono"
                  />
                  <p className="text-[9px] font-mono text-gray-500">
                    Your key is saved locally in your browser's localStorage and is never sent to any server except the direct Google Gemini endpoint.
                  </p>
                </div>
              </div>

              {/* Footer Save */}
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-2">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="py-2 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem("GEMINI_API_KEY", apiKey);
                    setIsSettingsOpen(false);
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    theme === "light" ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-white hover:bg-slate-100 text-black shadow-md"
                  }`}
                >
                  Save Coordinates
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. VOICE MODE INTERACTION SIMULATOR */}
      <AnimatePresence>
        {isVoiceActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center max-w-sm text-center p-8 rounded-3xl border border-white/10 bg-black/80 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsVoiceActive(false)} 
                className="absolute top-4 right-4 p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Pulsing Voice Sphere */}
              <div className="relative flex items-center justify-center w-28 h-28 my-6">
                <div className="absolute w-28 h-28 rounded-full bg-rose-500/10 animate-ping duration-1000" />
                <div className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-pulse duration-750" />
                <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                  <Mic className="w-6 h-6 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-medium text-lg text-white">Neural Voice Matrix</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans px-4">
                  SMX is listening. Speak clearly into your vocal receptor. State mutations will morph to Emerald as transcription processes.
                </p>
              </div>

              {/* Simulated Oscilloscope lines */}
              <div className="flex gap-1.5 items-center justify-center h-8 my-6 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => {
                  const delay = (item * 0.1) + "s";
                  return (
                    <motion.div
                      key={item}
                      className="w-1 bg-rose-400 rounded-full"
                      animate={{ height: [12, 36, 12] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: item * 0.05 }}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setIsVoiceActive(false);
                  handleSendMessage("Scan voice metrics and diagnostic complete.");
                }}
                className="py-2.5 px-6 rounded-2xl bg-rose-500 hover:bg-rose-400 text-xs text-white font-medium transition cursor-pointer"
              >
                Complete Transmission
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
