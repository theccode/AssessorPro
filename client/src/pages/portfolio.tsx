import { useQuery } from "@tanstack/react-query";
import { Building, Star, Calendar, MapPin, Award, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Portfolio() {
  const { data: galleryAssessments, isLoading } = useQuery({
    queryKey: ['/api/public/gallery'],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Link href="/" className="flex items-center text-primary-foreground/80 hover:text-primary-foreground mr-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4">Complete Assessment Portfolio</h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl">
            Explore our comprehensive collection of certified green building assessments showcasing sustainable construction across various projects.
          </p>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg border border-border animate-pulse">
                <div className="h-48 bg-muted"></div>
                <div className="p-6">
                  <div className="h-6 bg-muted rounded mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-24 bg-muted rounded"></div>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : galleryAssessments && galleryAssessments.length > 0 ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {galleryAssessments.length} Certified Green Buildings
              </h2>
              <p className="text-muted-foreground text-lg">
                Each building represents excellence in sustainable design and construction practices
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {galleryAssessments.map((assessment: any) => (
                <div key={assessment.id} className="bg-card rounded-lg overflow-hidden shadow-lg border border-border transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="h-64 relative overflow-hidden">
                    {assessment.featuredImage ? (
                      <img 
                        src={assessment.featuredImage} 
                        alt={assessment.buildingName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${assessment.featuredImage ? 'hidden' : ''}`}>
                      <Building className="h-20 w-20 text-primary" />
                    </div>
                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < assessment.starRating ? 'text-primary fill-current' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-foreground">{assessment.buildingName}</h3>
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {assessment.certificationLevel}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{assessment.location}</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Sustainability Score</span>
                        <span className="text-sm font-bold text-primary">{assessment.scorePercentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${assessment.scorePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-primary" />
                        <span>{assessment.score} Credits</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span>{assessment.completedAt ? new Date(assessment.completedAt).getFullYear() : 'Recent'}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground mb-4">
                      Comprehensive assessment across {assessment.sectionCount} categories with {assessment.mediaCount} supporting documents.
                      {assessment.energySavings > 0 && ` Achieving ${assessment.energySavings}% efficiency rating.`}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Assessment ID: {assessment.id}
                      </span>
                      <span className="text-xs text-primary font-medium">
                        Certified Green Building
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Assessments Available</h3>
            <p className="text-muted-foreground">
              There are currently no completed assessments to display in the portfolio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}