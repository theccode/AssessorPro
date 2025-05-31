import { useState, useEffect } from "react";
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
import { Building, ChevronLeft, ChevronRight, Save, ArrowLeft } from "lucide-react";
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
  
  // Get assessment ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const assessmentId = urlParams.get('id') ? parseInt(urlParams.get('id')!) : (params?.id ? parseInt(params.id) : null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [locationData, setLocationData] = useState<Record<string, Record<string, { lat: number; lng: number; address: string } | null>>>({});

  // Fetch assessment if editing
  const { data: assessment, isLoading: assessmentLoading, error: assessmentError } = useQuery({
    queryKey: [`/api/assessments/${assessmentId}`],
    enabled: !!assessmentId,
  });



  // Fetch sections
  const { data: sections = [] } = useQuery({
    queryKey: ["/api/assessments", assessmentId, "sections"],
    enabled: !!assessmentId,
  });

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/assessments", data);
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
      const response = await apiRequest("PATCH", `/api/assessments/${assessmentId}`, data);
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
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "sections"] });
    },
  });

  useEffect(() => {
    if (assessment) {
      setFormData({
        buildingName: assessment.buildingName || "",
        publisherName: assessment.publisherName || "",
        buildingLocation: assessment.buildingLocation || "",
        digitalAddress: assessment.digitalAddress || assessment.detailedAddress || "",
        phoneNumber: assessment.phoneNumber || "",
        additionalNotes: assessment.additionalNotes || "",
      });
    }
  }, [assessment]);

  useEffect(() => {
    // Initialize section data from fetched sections
    if (sections && sections.length > 0) {
      const initialSectionData: Record<string, any> = {};
      const initialLocationData: Record<string, any> = {};
      sections.forEach((section: AssessmentSection) => {
        initialSectionData[section.sectionType] = section.variables || {};
        initialLocationData[section.sectionType] = section.locationData || {};
      });
      setSectionData(initialSectionData);
      setLocationData(initialLocationData);
    }
  }, [sections?.length]);

  const currentSection = assessmentSections[currentSectionIndex];
  const progress = ((currentSectionIndex + 1) / assessmentSections.length) * 100;

  const handleBuildingInfoSubmit = () => {
    if (!assessmentId) {
      createAssessmentMutation.mutate(formData);
    } else {
      updateAssessmentMutation.mutate(formData);
      setCurrentSectionIndex(1);
    }
  };

  const handleSectionSubmit = () => {
    if (!assessmentId || currentSectionIndex === 0) return;

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
      isCompleted: true,
    });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto" />
              <span className="ml-3 text-xl font-medium text-gray-900">GREDA-GBC Assessor Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Section {currentSectionIndex + 1} of {assessmentSections.length}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">GREDA Green Building Assessment Form</h1>
          <p className="text-gray-600">Complete all sections to generate comprehensive GREDA-GBC sustainability evaluation</p>
        </div>

        {/* Client and Building Information */}
        {assessment && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-primary">
                <Building className="w-6 h-6" />
                Assessment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Building Name</p>
                  <p className="text-lg font-semibold">{assessment.buildingName || "Building Assessment"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                  <p className="text-lg font-semibold">{assessment.publisherName || "Client"}</p>
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
          completedSections={sections.filter((s: AssessmentSection) => s.isCompleted).map(s => s.sectionType)}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, buildingName: e.target.value }))}
                      placeholder="Enter building name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publisherName">Publisher Name</Label>
                    <Input
                      id="publisherName"
                      value={formData.publisherName || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, publisherName: e.target.value }))}
                      placeholder="Enter publisher name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buildingLocation">Building Location</Label>
                    <Input
                      id="buildingLocation"
                      value={formData.buildingLocation || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, buildingLocation: e.target.value }))}
                      placeholder="Enter building location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="digitalAddress">Digital Address</Label>
                    <Input
                      id="digitalAddress"
                      value={formData.digitalAddress || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, digitalAddress: e.target.value }))}
                      placeholder="e.g. GA-543-0125"
                      pattern="[A-Z]{2}-\d{3}-\d{4}"
                      title="Format: Two letters, hyphen, 3 digits, hyphen, 4 digits (e.g. GA-543-0125)"
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
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="Enter any additional notes"
                    rows={4}
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
                      />
                      
                      {/* Media Upload Section - Only for specific variables */}
                      {variable.requiresImages && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Supporting Evidence (Images Required)</Label>
                          <MediaUpload
                            assessmentId={assessmentId}
                            sectionType={currentSection.id}
                            fieldName={variable.id}
                            className="mt-2"
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
                        <h4 className="text-lg font-medium text-gray-900">{currentSection.name} Section Total</h4>
                        <p className="text-sm text-gray-600">
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
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                disabled={currentSectionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Section
              </Button>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={currentSectionIndex === 0 ? handleBuildingInfoSubmit : handleSectionSubmit}>
                  {currentSectionIndex === assessmentSections.length - 1 ? "Complete Assessment" : "Next Section"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
