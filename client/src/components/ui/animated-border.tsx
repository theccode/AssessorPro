import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  active?: boolean;
}

export function AnimatedBorder({ 
  children, 
  className = "", 
  delay = 1500,
  active = false
}: AnimatedBorderProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (active) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [active]);

  return (
    <div className={cn(
      "relative inline-block",
      "px-6 py-4 border-2 border-transparent rounded-lg",
      isActive ? "title-border-race" : "",
      className
    )}>
      {children}
    </div>
  );
}