import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedText, AnimatedWords, GlowingText } from "@/components/ui/animated-text";
import { AnimatedBorder } from "@/components/ui/animated-border";
import { Building, Leaf, Zap, Droplets, Recycle, BarChart3, FileText, Award, TrendingUp, Star, Shield, Users } from "lucide-react";
import heroImage from "@assets/image_1748623363109.png";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface PlatformStats {
  totalAssessments: number;
  completedAssessments: number;
  totalUsers: number;
  assessorCount: number;
  averageScore: number;
  averageEnergySavings: number;
  uptime: number;
  supportHours: string;
}

export default function Landing() {
  const [isRacing, setIsRacing] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<PlatformStats>({
    queryKey: ['/api/public/stats'],
    retry: false,
  });

  const { data: galleryAssessments, isLoading: galleryLoading } = useQuery({
    queryKey: ['/api/public/gallery'],
    retry: false,
  });

  // Fallback data when API fails or returns no data
  const fallbackStats = {
    totalAssessments: 2500,
    completedAssessments: 2100,
    totalUsers: 850,
    assessorCount: 150,
    averageScore: 78,
    averageEnergySavings: 85,
    uptime: 99.9,
    supportHours: "24/7"
  };

  // Use real data if available, otherwise fallback to hardcoded values
  const displayStats = stats || fallbackStats;

  const handlePhaseChange = (phase: "revealing" | "racing" | "settling" | "waiting") => {
    setIsRacing(phase === "racing");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={gredaLogo} alt="GREDA Green Building" className="h-10 w-auto" />
              <span className="ml-3 text-xl font-medium text-foreground">GREDA-GBC Assessor Pro</span>
            </div>
            <Button asChild>
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative py-20 overflow-hidden min-h-[600px]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 25, 18, 0.85), rgba(15, 25, 18, 0.75)), url(${heroImage})`,
          }}
        ></div>
        <div className="absolute inset-0 bg-eco-pattern opacity-10"></div>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-8xl mx-auto">
            <div className="animate-in slide-in-from-left duration-500 lg:pr-8">
              <div className="mb-6">
                <AnimatedBorder active={isRacing} className="inline-block">
                  <h1 className="text-3xl lg:text-5xl xl:text-6xl font-bold text-foreground animated-title leading-tight">
                    <GlowingText className="text-glow">
                      <AnimatedText 
                        text="GREDA Green Building Checklist (GREDA-GBC) Certification Tool"
                        delay={80}
                        animationType="bounce"
                        repeat={true}
                        repeatDelay={3000}
                        onPhaseChange={handlePhaseChange}
                      />
                    </GlowingText>
                  </h1>
                </AnimatedBorder>
              </div>
              <p className="text-xl mb-8 text-muted-foreground">
                Comprehensive sustainability evaluation, certification tracking, and environmental performance analytics for green building projects. Applicable to Residential Buildings and for the Design, Construction, Operation and Maintenance Phases.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="default" className="eco-bounce" asChild>
                  <a href="/api/login">Start Assessment</a>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  View Analytics Demo
                </Button>
              </div>
            </div>
            <div className="relative animate-in slide-in-from-right duration-500">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 relative pulse-green">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white/20 border-white/20 grow-in">
                    <CardContent className="p-4 text-center">
                      <Award className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">LEED Certified</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/20 border-white/20 grow-in">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Real-time Analytics</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/20 border-white/20 grow-in">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Automated Reports</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/20 border-white/20 grow-in">
                    <CardContent className="p-4 text-center">
                      <Star className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Star Ratings</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Complete Green Building Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From initial assessment to certification tracking, our platform provides comprehensive tools for sustainable building evaluation and environmental performance monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="transition-material hover:shadow-material-lg border-eco">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Advanced Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Real-time performance dashboards, energy efficiency tracking, and predictive sustainability metrics for data-driven decisions.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><TrendingUp className="h-4 w-4 text-primary mr-2" /> Energy consumption analysis</li>
                  <li className="flex items-center"><BarChart3 className="h-4 w-4 text-primary mr-2" /> Carbon footprint tracking</li>
                  <li className="flex items-center"><TrendingUp className="h-4 w-4 text-primary mr-2" /> ROI performance metrics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="transition-material hover:shadow-material-lg border-eco">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Automated Reporting System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Generate comprehensive sustainability reports, compliance documentation, and certification submissions automatically.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><FileText className="h-4 w-4 text-primary mr-2" /> LEED documentation</li>
                  <li className="flex items-center"><Shield className="h-4 w-4 text-primary mr-2" /> Compliance tracking</li>
                  <li className="flex items-center"><FileText className="h-4 w-4 text-primary mr-2" /> Custom report templates</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="transition-material hover:shadow-material-lg border-eco">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Certification & Rating Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Track multiple green building certifications, manage renewal dates, and monitor rating improvements over time.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><Star className="h-4 w-4 text-primary mr-2" /> GREDA GBC framework</li>
                  <li className="flex items-center"><Award className="h-4 w-4 text-primary mr-2" /> Multi-standard support</li>
                  <li className="flex items-center"><Users className="h-4 w-4 text-primary mr-2" /> Assessor collaboration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section - Auto-scrolling Carousel */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="carousel-container">
            <div className="carousel-track scroll-right-to-left">
              <div className="flex gap-16 min-w-max">
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.completedAssessments || 0}
                  </div>
                  <div className="text-muted-foreground">Buildings Certified</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : `${stats?.averageEnergySavings || 0}%`}
                  </div>
                  <div className="text-muted-foreground">Energy Savings Average</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.totalAssessments || 0}
                  </div>
                  <div className="text-muted-foreground">Total Assessments</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : `${stats?.uptime || 99.9}%`}
                  </div>
                  <div className="text-muted-foreground">Platform Uptime</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.assessorCount || 0}
                  </div>
                  <div className="text-muted-foreground">Certified Assessors</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.supportHours || "24/7"}
                  </div>
                  <div className="text-muted-foreground">Support</div>
                </div>
              </div>
              {/* Duplicate set for seamless looping */}
              <div className="flex gap-16 min-w-max">
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.completedAssessments || 0}
                  </div>
                  <div className="text-muted-foreground">Buildings Certified</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : `${stats?.averageEnergySavings || 0}%`}
                  </div>
                  <div className="text-muted-foreground">Energy Savings Average</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.totalAssessments || 0}
                  </div>
                  <div className="text-muted-foreground">Total Assessments</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : `${stats?.uptime || 99.9}%`}
                  </div>
                  <div className="text-muted-foreground">Platform Uptime</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.assessorCount || 0}
                  </div>
                  <div className="text-muted-foreground">Certified Assessors</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {statsLoading ? "..." : stats?.supportHours || "24/7"}
                  </div>
                  <div className="text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Categories Section */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              GREDA Green Building Assessment Framework
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive evaluation across 7 core sustainability criteria with 130 total credits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Site and Transport</h3>
              <p className="text-sm text-muted-foreground mb-2">Habitat protection, heat island reduction, public transport access</p>
              <div className="text-xs text-primary font-medium">20 Credits</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplets className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Water Efficiency</h3>
              <p className="text-sm text-muted-foreground mb-2">Water quality, fixtures, rainwater management, recycling</p>
              <div className="text-xs text-primary font-medium">16 Credits</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Energy Efficiency & Carbon</h3>
              <p className="text-sm text-muted-foreground mb-2">Renewable energy, efficient equipment, emissions reduction</p>
              <div className="text-xs text-primary font-medium">34 Credits</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Indoor Environmental Quality</h3>
              <p className="text-sm text-muted-foreground mb-2">Air quality, lighting, acoustics, thermal comfort</p>
              <div className="text-xs text-primary font-medium">20 Credits</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Materials & Resources</h3>
              <p className="text-sm text-muted-foreground mb-2">Sustainable sourcing, recycled content, local materials</p>
              <div className="text-xs text-primary font-medium">18 Credits</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Waste & Pollution</h3>
              <p className="text-sm text-muted-foreground mb-2">Construction waste, operational waste, emissions control</p>
              <div className="text-xs text-primary font-medium">14 Credits</div>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Innovation</h3>
              <p className="text-sm text-muted-foreground mb-2">Innovative technologies, materials, and design solutions</p>
              <div className="text-xs text-primary font-medium">8 Credits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessed Buildings Gallery */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Certified Green Buildings Gallery
            </h2>
            <p className="text-xl text-muted-foreground">
              Explore our portfolio of successfully assessed and certified sustainable buildings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg border border-border">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Building className="h-16 w-16 text-primary animate-pulse" />
                  </div>
                  <div className="p-6">
                    <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded mb-3 animate-pulse"></div>
                    <div className="h-2 bg-muted rounded mb-4 animate-pulse"></div>
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : galleryAssessments && galleryAssessments.length > 0 ? (
              galleryAssessments.slice(0, 6).map((assessment: any) => {
                return (
                  <div key={assessment.id} className="bg-card rounded-lg overflow-hidden shadow-lg border border-border transition-all duration-300 hover:shadow-xl hover:scale-105">
                    <div className="h-48 relative overflow-hidden">
                      {assessment.featuredImage ? (
                        <img 
                          src={assessment.featuredImage} 
                          alt={assessment.buildingName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${assessment.featuredImage ? 'hidden' : ''}`}>
                        <Building className="h-16 w-16 text-primary" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{assessment.buildingName}</h3>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < assessment.starRating ? 'text-primary fill-current' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {assessment.location} • {assessment.score} Credits ({assessment.scorePercentage}%)
                      </p>
                      <p className="text-sm text-foreground mb-4">
                        Comprehensive assessment across {assessment.sectionCount} categories with {assessment.mediaCount} supporting documents.
                        {assessment.energySavings > 0 && ` Achieving ${assessment.energySavings}% efficiency rating.`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {assessment.certificationLevel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assessment.completedAt ? new Date(assessment.completedAt).getFullYear() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback when no real data is available
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg border border-border">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Building className="h-16 w-16 text-primary" />
                  </div>
                  <div className="p-6">
                    <div className="text-center text-muted-foreground">
                      <Building className="h-8 w-8 mx-auto mb-2" />
                      <p>Assessment gallery will display completed projects</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View Complete Portfolio
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={gredaLogo} alt="GREDA Green Building" className="h-8 w-auto" />
              </div>
              <p className="text-muted-foreground">
                Professional building assessment platform for green certification and sustainability evaluation using GREDA standards.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-foreground">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">GREDA Assessments</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Certification Reports</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Performance Analytics</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Access</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-foreground">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">System Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About GREDA</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Sustainability Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Green Building Guide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 BuildAssess Pro - GREDA Green Building Assessment Platform. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Professional Network</span>
                <Users className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Building Community</span>
                <Building className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Certification</span>
                <Shield className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
