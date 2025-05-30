import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationType?: "fade" | "slide" | "bounce" | "typewriter";
  repeat?: boolean;
  repeatDelay?: number;
}

export function AnimatedText({ 
  text, 
  className = "", 
  delay = 50,
  animationType = "fade",
  repeat = false,
  repeatDelay = 2000
}: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<"revealing" | "bouncing" | "settling" | "waiting">("revealing");

  useEffect(() => {
    if (animationPhase === "revealing" && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (animationPhase === "revealing" && currentIndex >= text.length) {
      // Move to bounce phase after revealing is complete
      setAnimationPhase("bouncing");
    } else if (animationPhase === "bouncing") {
      // Bounce for a short time, then settle
      const timeout = setTimeout(() => {
        setAnimationPhase("settling");
      }, 1000);

      return () => clearTimeout(timeout);
    } else if (animationPhase === "settling") {
      // Settle animation, then wait
      const timeout = setTimeout(() => {
        setAnimationPhase("waiting");
      }, 500);

      return () => clearTimeout(timeout);
    } else if (animationPhase === "waiting" && repeat) {
      // Wait, then reset for next cycle
      const timeout = setTimeout(() => {
        setCurrentIndex(0);
        setDisplayedText("");
        setAnimationPhase("revealing");
      }, repeatDelay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay, repeat, repeatDelay, animationPhase]);

  const getAnimationClass = () => {
    if (animationPhase === "revealing") {
      return "character-bounce-in";
    }
    return "";
  };

  if (animationType === "typewriter") {
    return (
      <span className={cn(className, getAnimationClass())}>
        {displayedText}
        {currentIndex < text.length && <span className="animate-pulse">|</span>}
      </span>
    );
  }

  const getPhaseClass = () => {
    switch (animationPhase) {
      case "revealing":
        return "";
      case "bouncing":
        return "title-bounce";
      case "settling":
        return "title-settle";
      case "waiting":
        return "";
      default:
        return "";
    }
  };

  return (
    <span className={cn(className, getPhaseClass(), "whitespace-normal")}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={cn(
            "inline-block transition-all duration-300",
            index < currentIndex ? getAnimationClass() : "opacity-0 transform translate-y-4",
            char === " " ? "w-2 break-before-auto" : "break-inside-avoid",
            animationPhase === "bouncing" && index < currentIndex ? "animate-bounce" : "",
            animationPhase === "settling" && index < currentIndex ? "animate-pulse" : ""
          )}
          style={{
            animationDelay: animationPhase === "revealing" ? `${index * 50}ms` : "0ms",
            animationFillMode: "both",
            wordBreak: "keep-all"
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