import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Leaf, Zap, Droplets, Recycle, BarChart3, FileText, Award, TrendingUp, Star, Shield, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Leaf className="h-10 w-10 text-primary" />
              <span className="ml-3 text-2xl font-bold text-primary">EcoAssess</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary transition-colors font-medium">Features</a>
              <a href="#about" className="text-gray-700 hover:text-primary transition-colors font-medium">About</a>
              <a href="#gallery" className="text-gray-700 hover:text-primary transition-colors font-medium">Gallery</a>
              <a href="#contact" className="text-gray-700 hover:text-primary transition-colors font-medium">Contact</a>
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <a href="/api/login">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with nature imagery effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80"></div>
        <div className="absolute inset-0 bg-eco-pattern opacity-10"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="animate-in fade-in duration-1000">
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
              Sustainable Building
              <span className="block text-gradient-green bg-white bg-clip-text text-transparent">Assessment Platform</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed opacity-90">
              Professional environmental certification and green building evaluation system 
              for sustainable construction projects worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold rounded-full eco-bounce" asChild>
                <a href="/api/login">Start Assessment</a>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full leaf-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full leaf-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/10 rounded-full leaf-float" style={{animationDelay: '2s'}}></div>
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

      {/* Stats Section */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of professionals using our platform for comprehensive green building assessments
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 animate-in slide-in-from-right duration-700">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-gray-600 font-medium">Buildings Certified</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">85%</div>
              <div className="text-gray-600 font-medium">Energy Savings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600 font-medium">Green Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-600 font-medium">Platform Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">150+</div>
              <div className="text-gray-600 font-medium">Expert Assessors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gray-50" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-in slide-in-from-left duration-700">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                Leading the Future of
                <span className="block text-primary">Sustainable Buildings</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our comprehensive assessment platform evaluates buildings across all major sustainability dimensions, 
                providing detailed insights and certification support for green building projects worldwide.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-gray-700 font-medium">LEED Certification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-gray-700 font-medium">Energy Analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-gray-700 font-medium">Water Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-gray-700 font-medium">Material Assessment</span>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg rounded-full">
                Learn More About Our Process
              </Button>
            </div>
            <div className="relative animate-in slide-in-from-right duration-700">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-primary/5 rounded-xl">
                    <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Energy Efficiency</h3>
                    <p className="text-sm text-gray-600">Advanced energy analysis</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <Droplets className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Water Systems</h3>
                    <p className="text-sm text-gray-600">Conservation tracking</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <Recycle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Materials</h3>
                    <p className="text-sm text-gray-600">Sustainable sourcing</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-xl">
                    <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Indoor Quality</h3>
                    <p className="text-sm text-gray-600">Comfort & health</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-24 bg-white" id="gallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Project Gallery</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our portfolio of certified sustainable buildings and green construction projects
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Green Office Complex</h3>
                  <p className="text-sm opacity-90">LEED Platinum Certified</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Eco Residential Tower</h3>
                  <p className="text-sm opacity-90">Energy Star Certified</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Sustainable Campus</h3>
                  <p className="text-sm opacity-90">BREEAM Outstanding</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Smart Factory</h3>
                  <p className="text-sm opacity-90">Zero Carbon Certified</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Green Hospital</h3>
                  <p className="text-sm opacity-90">LEED Gold Certified</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                <Building className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Eco Retail Center</h3>
                  <p className="text-sm opacity-90">Green Building Certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-primary text-white" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Join leading organizations in creating more sustainable, efficient, and certified green buildings
            </p>
          </div>
          <div className="text-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-12 py-4 text-lg font-semibold rounded-full mr-4">
              Start Your Assessment
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-12 py-4 text-lg font-semibold rounded-full">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <Leaf className="h-10 w-10 text-primary" />
                <span className="ml-3 text-2xl font-bold">EcoAssess</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Professional environmental certification and green building evaluation system for sustainable construction projects worldwide.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:border-primary hover:text-primary">
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:border-primary hover:text-primary">
                  Twitter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:border-primary hover:text-primary">
                  GitHub
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Assessment Tools</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Certification Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Analytics Dashboard</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Reporting</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Training</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EcoAssess. All rights reserved. Building a sustainable future, one assessment at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
