import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Leaf, Zap, Droplets, Recycle, BarChart3, FileText, Award, TrendingUp, Star, Shield, Users } from "lucide-react";
import heroImage from "@assets/image_1748623363109.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-medium text-foreground">BuildAssess Pro</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in slide-in-from-left duration-500">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leaf-float text-foreground">
                Green Building Assessment & Rating Platform
              </h1>
              <p className="text-xl mb-8 text-muted-foreground">
                Comprehensive sustainability evaluation, certification tracking, and environmental performance analytics for green building projects
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
                  <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
                  <div className="text-muted-foreground">Buildings Certified</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">85%</div>
                  <div className="text-muted-foreground">Energy Savings Average</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">50+</div>
                  <div className="text-muted-foreground">Sustainability Metrics</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                  <div className="text-muted-foreground">Platform Uptime</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">150+</div>
                  <div className="text-muted-foreground">Certified Assessors</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-muted-foreground">Support</div>
                </div>
              </div>
              {/* Duplicate set for seamless looping */}
              <div className="flex gap-16 min-w-max">
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
                  <div className="text-muted-foreground">Buildings Certified</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">85%</div>
                  <div className="text-muted-foreground">Energy Savings Average</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">50+</div>
                  <div className="text-muted-foreground">Sustainability Metrics</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                  <div className="text-muted-foreground">Platform Uptime</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">150+</div>
                  <div className="text-muted-foreground">Certified Assessors</div>
                </div>
                <div className="text-center min-w-[200px]">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-medium">BuildAssess Pro</span>
              </div>
              <p className="text-gray-400">
                Professional building assessment platform for green certification and sustainability evaluation.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Assessments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reports</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BuildAssess Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
