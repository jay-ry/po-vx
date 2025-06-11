import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#009086]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#00d8cc]/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#003451]/3 rounded-full blur-2xl"></div>

      {/* Auth Form Section */}
      <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center items-center relative z-10">
        <div className="w-full max-w-lg">
          {/* Logo and Brand */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center group">
              <div className="h-16 w-auto transition-transform group-hover:scale-105">
                <img src="/images/Logo-EHC-1.svg" alt="EHC Logo" className="h-full" />
              </div>
              <span className="font-heading text-4xl font-bold text-[#003451] tracking-wider ml-4 transition-colors group-hover:text-[#009086]">
                VX Academy
              </span>
            </div>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full justify-center mb-6 rounded-2xl bg-abu-sand shadow-md">
              <TabsTrigger value="login" className="flex-1 rounded-l-2xl py-3 text-center transition-all duration-300 hover:bg-abu-sand/80 hover:scale-105">Login</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-r-2xl py-3 text-center transition-all duration-300 hover:bg-abu-sand/80 hover:scale-105">Register</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]">
              <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader className="pb-6 pt-8 px-8">
                  <CardTitle className="text-abu-charcoal text-2xl font-bold">Login to your account</CardTitle>
                  <CardDescription className="text-neutral-600 text-base leading-relaxed">
                    Enter your credentials to access your VX Academy dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-abu-charcoal font-semibold text-sm">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                {...field} 
                                className="rounded-xl py-6 px-4 border-2 border-gray-200 focus:border-[#009086] transition-all duration-300 bg-white/50 backdrop-blur-sm" 
                                type="email" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-abu-charcoal font-semibold text-sm">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                className="rounded-xl py-6 px-4 border-2 border-gray-200 focus:border-[#009086] transition-all duration-300 bg-white/50 backdrop-blur-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-[#009086] hover:bg-[#009086]/90 text-white rounded-xl py-7 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Logging in...
                          </>
                        ) : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center pb-8 px-8">
                  <p className="text-sm text-neutral-600">
                    Don't have an account?{" "}
                    <button 
                      className="text-[#009086] font-semibold hover:underline transition-all duration-300 hover:text-[#007a73]"
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]">
              <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader className="pb-6 pt-8 px-8">
                  <CardTitle className="text-abu-charcoal text-2xl font-bold">Create an account</CardTitle>
                  <CardDescription className="text-neutral-600 text-base leading-relaxed">
                    Join VX Academy to start your journey as a hospitality professional
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-abu-charcoal font-semibold text-sm">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                {...field} 
                                className="rounded-xl py-6 px-4 border-2 border-gray-200 focus:border-[#009086] transition-all duration-300 bg-white/50 backdrop-blur-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-abu-charcoal font-semibold text-sm">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field} 
                                className="rounded-xl py-6 px-4 border-2 border-gray-200 focus:border-[#009086] transition-all duration-300 bg-white/50 backdrop-blur-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-abu-charcoal font-semibold text-sm">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                className="rounded-xl py-6 px-4 border-2 border-gray-200 focus:border-[#009086] transition-all duration-300 bg-white/50 backdrop-blur-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-abu-charcoal font-semibold text-sm">Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your password" 
                                {...field} 
                                className="rounded-xl py-6 px-4 border-2 border-gray-200 focus:border-[#009086] transition-all duration-300 bg-white/50 backdrop-blur-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-[#009086] hover:bg-[#009086]/90 text-white rounded-xl py-7 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] mt-6"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center pb-8 px-8">
                  <p className="text-sm text-neutral-600">
                    Already have an account?{" "}
                    <button 
                      className="text-[#009086] font-semibold hover:underline transition-all duration-300 hover:text-[#007a73]"
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Section with VX branding - Enhanced modern design */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#009086] to-[#003451] text-white p-16 flex-col justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-32 h-32 bg-[#00d8cc] rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full blur-lg animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-[#00d8cc] rounded-full blur-md animate-bounce"></div>
        </div>

        <div className="max-w-xl relative z-10">
          <h1 className="font-heading text-5xl font-bold mb-8 tracking-wide leading-tight opacity-0 animate-[slideInUp_0.8s_ease-out_0.2s_forwards]">
            Become an exceptional <span className="text-[#00d8cc] bg-clip-text ">Abu Dhabi</span> ambassador
          </h1>
          <p className="text-xl opacity-90 mb-12 leading-relaxed opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
            VX Academy provides frontliners with the skills, knowledge, and cultural awareness to deliver outstanding visitor experiences across Abu Dhabi.
          </p>
          <div className="space-y-6 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
            <div className="flex items-start group">
              <div className="w-8 h-8 bg-[#00d8cc]/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#00d8cc]/40 transition-all duration-300">
                <svg className="w-5 h-5 text-[#00d8cc]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg leading-relaxed group-hover:text-[#00d8cc] transition-colors duration-300">Master Abu Dhabi's cultural heritage and visitor attractions</p>
            </div>
            <div className="flex items-start group">
              <div className="w-8 h-8 bg-[#00d8cc]/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#00d8cc]/40 transition-all duration-300">
                <svg className="w-5 h-5 text-[#00d8cc]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg leading-relaxed group-hover:text-[#00d8cc] transition-colors duration-300">Develop essential soft skills for exceptional customer service</p>
            </div>
            <div className="flex items-start group">
              <div className="w-8 h-8 bg-[#00d8cc]/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#00d8cc]/40 transition-all duration-300">
                <svg className="w-5 h-5 text-[#00d8cc]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg leading-relaxed group-hover:text-[#00d8cc] transition-colors duration-300">Earn badges, track progress, and rise in the leaderboard rankings</p>
            </div>
            <div className="flex items-start group">
              <div className="w-8 h-8 bg-[#00d8cc]/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-[#00d8cc]/40 transition-all duration-300">
                <svg className="w-5 h-5 text-[#00d8cc]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg leading-relaxed group-hover:text-[#00d8cc] transition-colors duration-300">Access AI-powered assistance to enhance your learning journey</p>
            </div>
          </div>
        

       
          
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
