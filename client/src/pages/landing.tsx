import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Leaf, Zap, Droplets, Recycle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-medium text-gray-900">BuildAssess Pro</span>
            </div>
            <Button asChild>
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in slide-in-from-left duration-500">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Professional Building Assessment Platform
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Comprehensive green building certification tool following GREDA GBC framework standards
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <a href="/api/login">Start Assessment</a>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  View Demo
                </Button>
              </div>
            </div>
            <div className="relative animate-in slide-in-from-right duration-500">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 relative">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white/20 border-white/20">
                    <CardContent className="p-4 text-center">
                      <Leaf className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Green Certified</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/20 border-white/20">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Energy Efficient</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/20 border-white/20">
                    <CardContent className="p-4 text-center">
                      <Droplets className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Water Management</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/20 border-white/20">
                    <CardContent className="p-4 text-center">
                      <Recycle className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">Waste Reduction</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-gray-600">Buildings Assessed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">95%</div>
              <div className="text-gray-600">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">50+</div>
              <div className="text-gray-600">Certified Assessors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Platform Support</div>
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
