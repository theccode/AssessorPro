import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Shield, Users, BarChart3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import gredaLogo from "@assets/Greda-Green-Building-Logo.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      // Check if the server wants us to redirect to a different domain
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      
      // Otherwise, navigate to dashboard and refresh
      setLocation("/");
      window.location.reload(); // Refresh to update auth state
    },
    onError: (error: any) => {
      setError(error.message || "Login failed. Please check your credentials.");
    },
  });

  const onSubmit = (data: LoginForm) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-8">
          <div className="text-center">
            <img 
              src={gredaLogo} 
              alt="GREDA Green Building Certification" 
              className="h-24 w-auto mx-auto mb-6"
            />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              GREDA Green Building Certification
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Professional building assessment platform for sustainable construction evaluation
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Comprehensive Assessments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Detailed building sustainability evaluations
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Platform</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enterprise-grade security and compliance
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Role-Based Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Customized workflows for different user types
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Advanced Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Detailed reporting and performance insights
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white dark:bg-gray-800">
            <CardHeader className="text-center pb-6 bg-white dark:bg-gray-800">
              <div className="lg:hidden mb-4">
                <img 
                  src={gredaLogo} 
                  alt="GREDA" 
                  className="h-16 w-auto mx-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Sign in to access your assessment dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-800">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...form.register("email")}
                    className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...form.register("password")}
                    className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Don't have an account?{" "}
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Contact your administrator
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}