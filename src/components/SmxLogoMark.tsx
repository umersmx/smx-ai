import React from "react";

interface SmxLogoMarkProps {
  className?: string;
  theme?: "dark" | "light";
}

export const SmxLogoMark: React.FC<SmxLogoMarkProps> = ({ 
  className = "w-5 h-5", 
  theme = "dark" 
}) => {
  const strokeColor = theme === "light" ? "#0d0d0d" : "#ffffff";
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <line x1="77" y1="23" x2="58" y2="42" stroke={strokeColor} strokeWidth="14" strokeLinecap="round"/>
      <line x1="23" y1="23" x2="42" y2="42" stroke={strokeColor} strokeWidth="14" strokeLinecap="round"/>
      <line x1="23" y1="77" x2="42" y2="58" stroke={strokeColor} strokeWidth="14" strokeLinecap="round"/>
      <line x1="77" y1="77" x2="58" y2="58" stroke={strokeColor} strokeWidth="14" strokeLinecap="round"/>
    </svg>
  );
};
