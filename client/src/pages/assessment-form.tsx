import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SectionNavigation } from "@/components/assessment/section-navigation";
import { ScoreInput } from "@/components/assessment/score-input";
import { MediaUpload } from "@/components/assessment/media-upload";
import { LocationPicker } from "@/components/assessment/location-picker";
import { Building, ChevronLeft, ChevronRight, Save, ArrowLeft, Lock } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { assessmentSections, sectionVariables } from "@/lib/assessment-data";
import type { Assessment, AssessmentSection } from "@shared/schema";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

interface AssessmentFormProps {
  assessmentId?: string;
}

export default function AssessmentForm({ params }: { params: { id?: string } }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Get assessment ID from URL query parameter (now using UUID)
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id') || params?.id || null;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [hasSetInitialSection, setHasSetInitialSection] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [locationData, setLocationData] = useState<Record<string, Record<string, { lat: number; lng: number; address: string } | null>>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSavedState, setShowSavedState] = useState(true);
  const [hasLoggedView, setHasLoggedView] = useState(false);
  const [hasLoggedEdit, setHasLoggedEdit] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Fetch assessment if editing
  const { data: assessment, isLoading: assessmentLoading, error: assessmentError } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId,
  });

  // Check if assessment is locked
  const isAssessmentLocked = assessment?.isLocked || false;



  // Fetch sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}/sections`],
    enabled: !!assessmentId,
  });

  console.log("Sections data:", sections, "Loading:", sectionsLoading);

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/assessments", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      navigate(`/assessments/${data.id}/form`);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  // Update assessment mutation
  const updateAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/assessments/${assessmentId}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  // Save section mutation
  const saveSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/assessments/${assessmentId}/sections`, "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessmentId}/sections`] });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/assessments/${assessmentId}`, "PATCH", { 
        status: "completed",
        conductedAt: new Date()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      // Navigate to preview page after successful submission
      navigate(`/assessments/${assessmentId}/preview`);
    },
  });

  // Simple auto-save with debounce
  const autoSave = useCallback(async () => {
    if (!assessmentId || isAssessmentLocked || !dataLoaded) return;
    
    try {
      // Only save building information section for section 0
      if (currentSectionIndex === 0) {
        // Update main assessment data
        await updateAssessmentMutation.mutateAsync(formData);
        
        // Save building information section
        const buildingInfoSection = {
          sectionType: "building-information",
          sectionName: "Building Information",
          score: 0,
          maxScore: 0,
          variables: formData,
          locationData: {},
          isCompleted: true,
        };
        await saveSectionMutation.mutateAsync(buildingInfoSection);
        
        setShowSavedState(true);
        setTimeout(() => setShowSavedState(false), 2000);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [assessmentId, formData, currentSectionIndex, updateAssessmentMutation, saveSectionMutation, isAssessmentLocked, dataLoaded]);

  // Debounced version of auto-save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 3000); // 3 second delay
  }, [autoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (assessment && assessmentId) {
      // Only prefill if we're editing an existing assessment
      setFormData({
        buildingName: assessment.buildingName || "",
        clientName: assessment.clientName || "",
        publisherName: assessment.publisherName || "",
        buildingLocation: assessment.buildingLocation || "",
        digitalAddress: assessment.digitalAddress || assessment.detailedAddress || "",
        phoneNumber: assessment.phoneNumber || "",
        additionalNotes: assessment.additionalNotes || "",
        buildingFootprint: "",
        roomHeight: "",
        numberOfBedrooms: "",
        siteArea: "",
        numberOfWindows: "",
        numberOfDoors: "",
        averageWindowSize: "",
        numberOfFloors: "",
        totalGreenArea: "",
      });

      // Log assessment view if user didn't create it
      if (user && assessment.userId !== user.id && !hasLoggedView) {
        const userName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || user.id;
        
        apiRequest("/api/audit/log", "POST", {
          action: `viewed assessment "${assessment.buildingName || 'Untitled'}"`,
          details: {
            assessmentId: assessment.id,
            buildingName: assessment.buildingName,
            originalCreator: assessment.userId,
            viewerName: userName,
            viewerRole: user.role
          }
        }).catch(error => console.error("Failed to log assessment view:", error));
        
        setHasLoggedView(true);
      }
    } else if (!assessmentId) {
      // For new assessments, initialize with empty form
      setFormData({
        buildingName: "",
        clientName: "",
        publisherName: "",
        buildingLocation: "",
        digitalAddress: "",
        phoneNumber: "",
        additionalNotes: "",
        buildingFootprint: "",
        roomHeight: "",
        numberOfBedrooms: "",
        siteArea: "",
        numberOfWindows: "",
        numberOfDoors: "",
        averageWindowSize: "",
        numberOfFloors: "",
        totalGreenArea: "",
      });
    }
  }, [assessment, assessmentId, user, hasLoggedView]);

  useEffect(() => {
    // Initialize section data from fetched sections
    if (sections && sections.length > 0) {
      const initialSectionData: Record<string, any> = {};
      const initialLocationData: Record<string, any> = {};
      sections.forEach((section: AssessmentSection) => {
        initialSectionData[section.sectionType] = section.variables || {};
        initialLocationData[section.sectionType] = section.locationData || {};
      });
      console.log("Setting section data:", initialSectionData);
      console.log("Setting location data:", initialLocationData);
      setSectionData(initialSectionData);
      setLocationData(initialLocationData);
      
      // Update formData with building information section data if it exists
      const buildingInfoSection = initialSectionData['building-information'];
      if (buildingInfoSection) {
        setFormData(prev => ({
          ...prev,
          buildingName: buildingInfoSection.buildingName || prev.buildingName,
          clientName: buildingInfoSection.clientName || prev.clientName,
          publisherName: buildingInfoSection.publisherName || prev.publisherName,
          buildingLocation: buildingInfoSection.buildingLocation || prev.buildingLocation,
          digitalAddress: buildingInfoSection.digitalAddress || prev.digitalAddress,
          phoneNumber: buildingInfoSection.phoneNumber || prev.phoneNumber,
          additionalNotes: buildingInfoSection.additionalNotes || prev.additionalNotes,
          buildingFootprint: buildingInfoSection.buildingFootprint === "0" ? "" : (buildingInfoSection.buildingFootprint || ""),
          roomHeight: buildingInfoSection.roomHeight === "0" ? "" : (buildingInfoSection.roomHeight || ""),
          numberOfBedrooms: buildingInfoSection.numberOfBedrooms === "0" ? "" : (buildingInfoSection.numberOfBedrooms || ""),
          siteArea: buildingInfoSection.siteArea === "0" ? "" : (buildingInfoSection.siteArea || ""),
          numberOfWindows: buildingInfoSection.numberOfWindows === "0" ? "" : (buildingInfoSection.numberOfWindows || ""),
          numberOfDoors: buildingInfoSection.numberOfDoors === "0" ? "" : (buildingInfoSection.numberOfDoors || ""),
          averageWindowSize: buildingInfoSection.averageWindowSize === "0" ? "" : (buildingInfoSection.averageWindowSize || ""),
          numberOfFloors: buildingInfoSection.numberOfFloors === "0" ? "" : (buildingInfoSection.numberOfFloors || ""),
          totalGreenArea: buildingInfoSection.totalGreenArea === "0" ? "" : (buildingInfoSection.totalGreenArea || ""),
        }));
      }

      // Auto-navigate to the first incomplete section when loading
      if (!hasSetInitialSection) {
        let targetSectionIndex = 0;
        
        // Find the first incomplete section, or the last section if all are complete
        for (let i = 0; i < assessmentSections.length; i++) {
          const sectionId = assessmentSections[i].id;
          const sectionFromDb = sections.find((s: any) => s.sectionType === sectionId);
          
          if (!sectionFromDb || !sectionFromDb.isCompleted) {
            targetSectionIndex = i;
            break;
          }
          
          // If this is the last section and it's complete, stay on it
          if (i === assessmentSections.length - 1 && sectionFromDb?.isCompleted) {
            targetSectionIndex = i;
          }
        }
        
        setCurrentSectionIndex(targetSectionIndex);
        setHasSetInitialSection(true);
        
        // Mark data as loaded after initial setup
        setTimeout(() => {
          setDataLoaded(true);
        }, 500);
      }
    }
  }, [sections, hasSetInitialSection]);



  // Note: Auto-save is now triggered only by explicit user actions, not by useEffect hooks

  const currentSection = assessmentSections[currentSectionIndex];
  const progress = ((currentSectionIndex + 1) / assessmentSections.length) * 100;

  // Check if all sections are completed
  const allSectionsCompleted = useMemo(() => {
    if (!sections || sections.length === 0) return false;
    return assessmentSections.every(section => {
      const sectionFromDb = sections.find((s: any) => s.sectionType === section.id);
      return sectionFromDb && sectionFromDb.isCompleted;
    });
  }, [sections, assessmentSections]);

  const handleBuildingInfoSubmit = () => {
    if (!assessmentId) {
      createAssessmentMutation.mutate(formData);
    } else {
      updateAssessmentMutation.mutate(formData);
      
      // Mark building information section as completed
      saveSectionMutation.mutate({
        sectionType: "building-information",
        sectionName: "Building Information",
        score: 0,
        maxScore: 0,
        variables: formData,
        locationData: {},
        isCompleted: true,
      });
      
      setCurrentSectionIndex(1);
    }
  };

  const handleSectionSubmit = () => {
    if (!assessmentId || currentSectionIndex === 0) return;

    const variables = sectionData[currentSection.id] || {};
    const score = Object.values(variables).reduce((sum: number, val: any) => sum + (val || 0), 0);
    const maxScore = sectionVariables[currentSection.id]?.reduce((sum, v) => sum + v.maxScore, 0) || 0;

    const sectionPayload = {
      sectionType: currentSection.id,
      sectionName: currentSection.name,
      score,
      maxScore,
      variables,
      locationData: locationData[currentSection.id] || {},
      isCompleted: true,
    };
    
    console.log("Submitting section with isCompleted=true:", sectionPayload);
    saveSectionMutation.mutate(sectionPayload);

    if (currentSectionIndex < assessmentSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      navigate(`/assessments/${assessmentId}/preview`);
    }
  };

  const handleVariableChange = (variableId: string, value: number) => {
    setSectionData(prev => ({
      ...prev,
      [currentSection.id]: {
        ...prev[currentSection.id],
        [variableId]: value,
      }
    }));
  };

  const handleLocationChange = (variableId: string, location: { lat: number; lng: number; address: string } | null) => {
    console.log("Location changed for", variableId, ":", location);
    setLocationData(prev => ({
      ...prev,
      [currentSection.id]: {
        ...prev[currentSection.id],
        [variableId]: location,
      }
    }));
  };

  const handleSaveDraft = () => {
    if (currentSectionIndex === 0) {
      if (!assessmentId) {
        createAssessmentMutation.mutate({ ...formData, status: "draft" });
      } else {
        updateAssessmentMutation.mutate(formData);
      }
    } else {
      const variables = sectionData[currentSection.id] || {};
      const score = Object.values(variables).reduce((sum: number, val: any) => sum + (val || 0), 0);
      const maxScore = sectionVariables[currentSection.id]?.reduce((sum, v) => sum + v.maxScore, 0) || 0;

      saveSectionMutation.mutate({
        sectionType: currentSection.id,
        sectionName: currentSection.name,
        score,
        maxScore,
        variables,
        locationData: locationData[currentSection.id] || {},
        isCompleted: false,
      });
    }
  };

  const handleSubmitAssessment = async () => {
    try {
      // First save the current section if we're not on building info
      if (currentSectionIndex !== 0) {
        const variables = sectionData[currentSection.id] || {};
        const score = Object.values(variables).reduce((sum: number, val: any) => sum + (val || 0), 0);
        const maxScore = sectionVariables[currentSection.id]?.reduce((sum, v) => sum + v.maxScore, 0) || 0;

        await saveSectionMutation.mutateAsync({
          sectionType: currentSection.id,
          sectionName: currentSection.name,
          score,
          maxScore,
          variables,
          locationData: locationData[currentSection.id] || {},
          isCompleted: true,
        });
      }

      // Then submit the assessment
      submitAssessmentMutation.mutate();
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-6 sm:h-8 w-auto flex-shrink-0" />
              <span className="ml-2 sm:ml-3 text-sm sm:text-lg md:text-xl font-medium text-foreground truncate">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Section {currentSectionIndex + 1} of {assessmentSections.length}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Link>
              </Button>
              <div className="flex items-center text-sm text-muted-foreground">
                {(updateAssessmentMutation.isPending || saveSectionMutation.isPending) ? (
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-secondary rounded-full mr-2 overflow-hidden">
                      <div className="h-full bg-primary animate-pulse"></div>
                    </div>
                    <span>Saving...</span>
                  </div>
                ) : showSavedState ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    Auto-saved
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 px-2">GREDA Green Building Assessment Form</h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">Complete all sections to generate comprehensive GREDA-GBC sustainability evaluation</p>
        </div>

        {/* Lock Status Warning */}
        {isAssessmentLocked && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-amber-800">
                <Lock className="w-5 h-5" />
                <div>
                  <p className="font-medium">Assessment Locked</p>
                  <p className="text-sm">This assessment has been submitted and is locked for editing. Contact an administrator to unlock it.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client and Building Information */}
        {assessment && (
          <Card className="mb-6 sm:mb-8 border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-primary text-lg sm:text-xl">
                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
                Assessment Information
                {isAssessmentLocked && <Lock className="w-4 h-4 text-amber-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Building Name</p>
                  <p className="text-base sm:text-lg font-semibold break-words">{assessment.buildingName || "Building Assessment"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                  <p className="text-base sm:text-lg font-semibold break-words">{assessment.clientName || "Client"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {currentSectionIndex + 1} of {assessmentSections.length} sections
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Section Navigation */}
        <SectionNavigation
          sections={assessmentSections}
          currentSection={currentSectionIndex}
          onSectionSelect={setCurrentSectionIndex}
          completedSections={sections.filter((s: any) => s.isCompleted).map((s: any) => s.sectionType)}
        />

        {/* Current Section Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentSection.name}</span>
              <span className="text-sm font-normal text-gray-500">
                Section {currentSectionIndex + 1} of {assessmentSections.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSectionIndex === 0 ? (
              // Building Information Section
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="buildingName">Building Name</Label>
                    <Input
                      id="buildingName"
                      value={formData.buildingName || ""}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, buildingName: e.target.value }));
                        if (dataLoaded) debouncedSave();
                      }}
                      placeholder="Enter building name"
                      disabled={isAssessmentLocked}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientName">Client's Name</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName || ""}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, clientName: e.target.value }));
                        if (dataLoaded) debouncedSave();
                      }}
                      placeholder="Enter client's name"
                      disabled={isAssessmentLocked}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buildingLocation">Building Location</Label>
                    <Input
                      id="buildingLocation"
                      value={formData.buildingLocation || ""}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, buildingLocation: e.target.value }));
                        if (dataLoaded) debouncedSave();
                      }}
                      placeholder="Enter building location"
                      disabled={isAssessmentLocked}
                    />
                  </div>
                  <div>
                    <Label htmlFor="digitalAddress">Digital Address</Label>
                    <Input
                      id="digitalAddress"
                      value={formData.digitalAddress || ""}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, digitalAddress: e.target.value }));
                        if (dataLoaded) debouncedSave();
                      }}
                      placeholder="e.g. GA-543-0125"
                      pattern="[A-Z]{2}-\d{3}-\d{4}"
                      title="Format: Two letters, hyphen, 3 digits, hyphen, 4 digits (e.g. GA-543-0125)"
                      disabled={isAssessmentLocked}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: Two letters, hyphen, 3 digits, hyphen, 4 digits
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber || ""}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, phoneNumber: e.target.value }));
                        if (dataLoaded) debouncedSave();
                      }}
                      placeholder="Enter phone number"
                      disabled={isAssessmentLocked}
                    />
                  </div>
                </div>

                {/* Building Specifications Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Building Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="buildingFootprint">Building Footprint (m²)</Label>
                      <Input
                        id="buildingFootprint"
                        type="number"
                        value={formData.buildingFootprint || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, buildingFootprint: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter building footprint"
                        min="0"
                        step="0.01"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="roomHeight">Room Height (m)</Label>
                      <Input
                        id="roomHeight"
                        type="number"
                        value={formData.roomHeight || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, roomHeight: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter average room height"
                        min="0"
                        step="0.01"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numberOfBedrooms">Number of Bedrooms</Label>
                      <Input
                        id="numberOfBedrooms"
                        type="number"
                        value={formData.numberOfBedrooms || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, numberOfBedrooms: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter number of bedrooms"
                        min="0"
                        step="1"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="siteArea">Site Area (m²)</Label>
                      <Input
                        id="siteArea"
                        type="number"
                        value={formData.siteArea || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, siteArea: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter total site area"
                        min="0"
                        step="0.01"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numberOfWindows">Number of Windows</Label>
                      <Input
                        id="numberOfWindows"
                        type="number"
                        value={formData.numberOfWindows || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, numberOfWindows: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter number of windows"
                        min="0"
                        step="1"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numberOfDoors">Number of Doors</Label>
                      <Input
                        id="numberOfDoors"
                        type="number"
                        value={formData.numberOfDoors || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, numberOfDoors: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter number of doors"
                        min="0"
                        step="1"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="averageWindowSize">Average Size of Windows (m²)</Label>
                      <Input
                        id="averageWindowSize"
                        type="number"
                        value={formData.averageWindowSize || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, averageWindowSize: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter average window size"
                        min="0"
                        step="0.01"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numberOfFloors">Number of Floors</Label>
                      <Input
                        id="numberOfFloors"
                        type="number"
                        value={formData.numberOfFloors || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, numberOfFloors: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Enter number of floors"
                        min="1"
                        step="1"
                        disabled={isAssessmentLocked}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalGreenArea">Total Size of Green Area (m²)</Label>
                      <Input
                        id="totalGreenArea"
                        type="number"
                        value={formData.totalGreenArea || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, totalGreenArea: e.target.value }));
                          if (dataLoaded) debouncedSave();
                        }}
                        placeholder="Green area vs hard landscaping"
                        min="0"
                        step="0.01"
                        disabled={isAssessmentLocked}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        To be measured against hard landscaping left
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes || ""}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, additionalNotes: e.target.value }));
                      if (dataLoaded) debouncedSave();
                    }}
                    placeholder="Enter any additional notes"
                    rows={4}
                    disabled={isAssessmentLocked}
                  />
                </div>
              </div>
            ) : (
              // Scoring Sections
              <div className="space-y-6">
                {sectionVariables[currentSection.id]?.map((variable) => (
                  <div key={variable.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 border rounded-lg">
                    <div className="lg:col-span-2">
                      <Label className="text-base font-medium">{variable.name}</Label>
                      <ScoreInput
                        value={sectionData[currentSection.id]?.[variable.id] || 0}
                        maxValue={variable.maxScore}
                        onChange={(value) => handleVariableChange(variable.id, value)}
                        className="mt-2"
                        disabled={isAssessmentLocked}
                      />
                      
                      {/* Media Upload Section - For variables that require images or videos */}
                      {variable.requiresImages && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Supporting Evidence (Images Required)</Label>
                          <MediaUpload
                            assessmentId={assessmentId}
                            sectionType={currentSection.id}
                            fieldName={variable.id}
                            mediaType="images"
                            className="mt-2"
                            disabled={isAssessmentLocked}
                          />
                        </div>
                      )}
                      
                      {variable.requiresVideos && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Supporting Evidence (Videos Required)</Label>
                          <MediaUpload
                            assessmentId={assessmentId}
                            sectionType={currentSection.id}
                            fieldName={variable.id}
                            mediaType="videos"
                            className="mt-2"
                            disabled={isAssessmentLocked}
                          />
                        </div>
                      )}
                      
                      {variable.requiresAudio && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Supporting Evidence (Audio Required)</Label>
                          <MediaUpload
                            assessmentId={assessmentId}
                            sectionType={currentSection.id}
                            fieldName={variable.id}
                            mediaType="audio"
                            className="mt-2"
                            disabled={isAssessmentLocked}
                          />
                        </div>
                      )}

                      {/* Location Picker Section - Only for variables that require location */}
                      {variable.requiresLocation && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Location Selection (Required for Transport Assessment)</Label>
                          <LocationPicker
                            value={locationData[currentSection.id]?.[variable.id]}
                            onChange={(location) => handleLocationChange(variable.id, location)}
                            placeholder="Search for a location (e.g., Accra, Ghana)"
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {sectionData[currentSection.id]?.[variable.id] || 0}
                        </div>
                        <div className="text-sm text-gray-500">/ {variable.maxScore} max</div>
                        <Progress 
                          value={((sectionData[currentSection.id]?.[variable.id] || 0) / variable.maxScore) * 100}
                          className="mt-2"
                        />
                      </div>
                      <div className="flex justify-center mt-4">
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }, (_, i) => {
                            const percentage = ((sectionData[currentSection.id]?.[variable.id] || 0) / variable.maxScore) * 100;
                            const stars = Math.ceil(percentage / 20);
                            return (
                              <span key={i} className={`text-lg ${i < stars ? "text-accent" : "text-gray-300"}`}>
                                ★
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Section Summary */}
                <Card className="bg-muted">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-green-800 dark:text-green-200">{currentSection.name} Section Total</h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          {sectionVariables[currentSection.id]?.length || 0} variables
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Object.values(sectionData[currentSection.id] || {}).reduce((sum: number, val: any) => sum + (val || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          / {sectionVariables[currentSection.id]?.reduce((sum, v) => sum + v.maxScore, 0) || 0} maximum points
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                disabled={currentSectionIndex === 0}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Previous Section</span>
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-3">
                <Button variant="outline" onClick={handleSaveDraft} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save Draft</span>
                </Button>
                <Button onClick={currentSectionIndex === 0 ? handleBuildingInfoSubmit : handleSectionSubmit} className="w-full sm:w-auto">
                  <span className="hidden sm:inline">{currentSectionIndex === assessmentSections.length - 1 ? "Complete Assessment" : "Next Section"}</span>
                  <span className="sm:hidden">{currentSectionIndex === assessmentSections.length - 1 ? "Complete" : "Next"}</span>
                  <ChevronRight className="h-4 w-4 sm:ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
