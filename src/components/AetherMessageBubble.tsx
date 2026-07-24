import React, { useState } from "react";
import { Copy, Check, Terminal, User, Cpu, Sparkles } from "lucide-react";
import { Message } from "../types";
import { SmxLogoMark } from "./SmxLogoMark";

interface AetherMessageBubbleProps {
  message: Message;
  theme?: "dark" | "light";
}

export const AetherMessageBubble: React.FC<AetherMessageBubbleProps> = ({ message, theme = "dark" }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyCode = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(blockId);
    setTimeout(() => setCopied(null), 2000);
  };

  // Ultra-precise custom parser to parse text & code blocks perfectly during stream
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // Split text by code blocks: ```language \n code ```
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        // Parse language and code content
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] || "code" : "code";
        const code = match ? match[2] : part.slice(3, -3);
        const blockId = `block-${index}`;

        // Simple syntax highlighting simulator for TypeScript/JS/Python
        const highlightCode = (rawCode: string) => {
          const lines = rawCode.split("\n");
          return lines.map((line, lineIdx) => {
            // Very fast regex token replacement for standard keywords
            let safeLine = line
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");

            // Highlight keywords: const, let, function, class, import, return, etc.
            safeLine = safeLine.replace(
              /\b(const|let|var|function|return|import|export|from|class|extends|interface|type|public|private|async|await|as|new|if|else|for|while|of|in|try|catch)\b/g,
              `<span class="text-pink-400 font-semibold">$1</span>`
            );

            // Highlight strings: "string", 'string', `string`
            safeLine = safeLine.replace(
              (/(["'`])(.*?)\1/g),
              `<span class="text-emerald-300">$&</span>`
            );

            // Highlight comments
            if (line.trim().startsWith("//")) {
              return `<span class="text-gray-500 italic">${line}</span>`;
            }

            return `<span key="${lineIdx}">${safeLine}</span>`;
          });
        };

        return (
          <div key={index} className="my-4 overflow-hidden rounded-lg border border-white/10 bg-black/60 shadow-lg">
            {/* Code Block Header */}
            <div className="flex items-center justify-between bg-white/5 px-4 py-2 text-xs font-mono text-gray-400 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="uppercase text-[10px] tracking-wider font-semibold">{language}</span>
              </div>
              <button
                id={`btn-copy-${blockId}`}
                onClick={() => handleCopyCode(code, blockId)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white hover:text-brand-cyan transition-all pointer-events-auto cursor-pointer"
              >
                {copied === blockId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {/* Pre/Code Box */}
            <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-gray-200 custom-scrollbar select-text selection:bg-brand-cyan/30">
              <code className="block">
                {highlightCode(code).map((htmlLine, i) => (
                  <span
                    key={i}
                    className="block min-h-[1.2rem]"
                    dangerouslySetInnerHTML={{ __html: htmlLine }}
                  />
                ))}
              </code>
            </pre>
          </div>
        );
      } else {
        // Format standard markdown (inline bold **, links [], lists)
        const parseInlineMarkdown = (txt: string) => {
          let html = txt.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-cyan hover:underline font-semibold pointer-events-auto cursor-pointer">$1</a>');
          return html;
        };

        const lines = part.split("\n");
        return lines.map((line, lIdx) => {
          // Render bullet points nicely
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const listText = line.trim().substring(2);
            return (
              <ul key={lIdx} className="list-disc pl-5 my-1.5 text-gray-300 leading-relaxed font-sans text-[14px]">
                <li dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(listText) }} />
              </ul>
            );
          }

          return (
            <p
              key={lIdx}
              className={`text-[14px] leading-relaxed font-sans text-gray-300 ${line.trim() === "" ? "h-3" : "mb-2"}`}
              dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }}
            />
          );
        });
      }
    });
  };

  return (
    <div
      id={`msg-container-${message.id}`}
      className={`flex w-full items-start gap-4 py-4 md:px-4 transition-all ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Assistant Avatar Icon */}
        {!isUser && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-inner p-1.5 ${
            theme === "light" ? "bg-slate-100 border-slate-200" : "bg-black/80 border-white/15"
          }`}>
            <SmxLogoMark theme={theme} className="w-full h-full" />
          </div>
        )}

      {/* Message Box */}
      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? "text-right" : "text-left"}`}>
        {isUser ? (
          <div className="inline-block px-4 py-3 rounded-2xl glass-panel text-gray-200 shadow-md">
            <div className="flex items-center gap-1.5 mb-1 justify-end">
              <span className="text-[10px] tracking-wider text-gray-400 font-mono">USER</span>
              <User className="w-3 h-3 text-brand-cyan" />
            </div>
            <p className="text-[14px] font-sans text-left leading-relaxed">{message.content}</p>
          </div>
        ) : (
          <div className="pl-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-brand-cyan font-semibold uppercase">SMX AI</span>
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-[9px] font-mono text-gray-500">{message.timestamp}</span>
            </div>
            
            {/* Styled response text with a high-contrast dark glass container for maximum legibility */}
            <div className="bg-black/50 backdrop-blur-md border border-white/5 px-4.5 py-3.5 rounded-2xl space-y-1.5 leading-relaxed selection:bg-brand-cyan/30 text-gray-200">
              {renderMessageContent(message.content)}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar Icon */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 shadow-inner">
          <User className="w-4 h-4 text-brand-cyan" />
        </div>
      )}
    </div>
  );
};
