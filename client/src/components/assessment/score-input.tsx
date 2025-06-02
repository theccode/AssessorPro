import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ScoreInputProps {
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export function ScoreInput({ value, maxValue, onChange, className, disabled = false }: ScoreInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(0, Math.min(maxValue, newValue));
    onChange(clampedValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="number"
        min="0"
        max={maxValue}
        value={value}
        onChange={handleChange}
        placeholder={`Enter score (0-${maxValue})`}
        className="text-center text-lg font-semibold"
        disabled={disabled}
      />
      <div className="text-xs text-gray-500 text-center">
        Maximum score: {maxValue}
      </div>
    </div>
  );
}
