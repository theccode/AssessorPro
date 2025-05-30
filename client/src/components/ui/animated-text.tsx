import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationType?: "fade" | "slide" | "bounce" | "typewriter";
}

export function AnimatedText({ 
  text, 
  className = "", 
  delay = 50,
  animationType = "fade"
}: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  const getAnimationClass = () => {
    switch (animationType) {
      case "slide":
        return "word-slide-up";
      case "bounce":
        return "character-reveal";
      case "typewriter":
        return "typewriter-cursor";
      default:
        return "character-reveal";
    }
  };

  if (animationType === "typewriter") {
    return (
      <span className={cn(className, getAnimationClass())}>
        {displayedText}
        {currentIndex < text.length && <span className="animate-pulse">|</span>}
      </span>
    );
  }

  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={cn(
            "inline-block transition-all duration-300",
            index < currentIndex ? getAnimationClass() : "opacity-0 transform translate-y-4",
            char === " " ? "w-2" : ""
          )}
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "both"
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

interface AnimatedWordProps {
  words: string[];
  className?: string;
  delay?: number;
  wordDelay?: number;
}

export function AnimatedWords({ 
  words, 
  className = "", 
  delay = 100,
  wordDelay = 300
}: AnimatedWordProps) {
  const [visibleWords, setVisibleWords] = useState(0);

  useEffect(() => {
    if (visibleWords < words.length) {
      const timeout = setTimeout(() => {
        setVisibleWords(visibleWords + 1);
      }, wordDelay);

      return () => clearTimeout(timeout);
    }
  }, [visibleWords, words.length, wordDelay]);

  return (
    <div className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className={cn(
            "inline-block mr-3 transition-all duration-500",
            index < visibleWords 
              ? "animate-in slide-in-from-bottom opacity-100 translate-y-0" 
              : "opacity-0 translate-y-8"
          )}
          style={{
            animationDelay: `${index * delay}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export function GlowingText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative", className)}>
      <span className="absolute inset-0 text-primary/20 blur-sm">{children}</span>
      <span className="relative z-10">{children}</span>
    </span>
  );
}