import { Button } from "@/components/ui/button";
import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
}

interface SectionNavigationProps {
  sections: Section[];
  currentSection: number;
  onSectionSelect: (index: number) => void;
  completedSections: string[];
}

export function SectionNavigation({ 
  sections, 
  currentSection, 
  onSectionSelect, 
  completedSections 
}: SectionNavigationProps) {
  const getSectionStatus = (sectionId: string, index: number) => {
    console.log(`Checking section ${sectionId} (index ${index}):`, {
      isCompleted: completedSections.includes(sectionId),
      isCurrent: index === currentSection,
      isPastCurrent: index < currentSection,
      completedSections
    });
    
    if (completedSections.includes(sectionId)) return "completed";
    if (index === currentSection) return "current";
    if (index < currentSection) return "current";
    return "pending";
  };

  const getSectionIcon = (sectionId: string, index: number) => {
    const status = getSectionStatus(sectionId, index);
    
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4" />;
      case "current":
        return <Clock className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getSectionVariant = (sectionId: string, index: number) => {
    const status = getSectionStatus(sectionId, index);
    
    switch (status) {
      case "completed":
        return "default";
      case "current":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sections.map((section, index) => (
          <Button
            key={section.id}
            variant={getSectionVariant(section.id, index)}
            size="sm"
            className={cn(
              "flex items-center space-x-2 text-xs font-medium",
              index === currentSection && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={() => onSectionSelect(index)}
          >
            {getSectionIcon(section.id, index)}
            <span className="truncate">{section.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
