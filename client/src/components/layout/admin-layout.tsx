import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart,
  PuzzleIcon,
  GraduationCap,
  LogOut,
  FileText,
  ClipboardCheck,
  Award,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Redirect unauthorized users (should already be handled by ProtectedRoute)
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold text-abu-charcoal mb-6">
          Admin Access Required
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          You need administrator privileges to access this page.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Training Areas",
      path: "/admin/training-areas",
      icon: <PuzzleIcon className="h-5 w-5" />,
    },
    {
      name: "Modules",
      path: "/admin/modules",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      name: "Courses",
      path: "/admin/course-management",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Units",
      path: "/admin/units",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Learning Blocks",
      path: "/admin/learning-blocks",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Assessments",
      path: "/admin/assessments",
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      name: "SCORM Packages",
      path: "/admin/scorm",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Badges",
      path: "/admin/badges",
      icon: <Award className="h-5 w-5" />,
    },
    {
      name: "User Management",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-abu-charcoal text-white">
        <div className="p-4 border-b border-accent/20">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent" />
            <h1 className="text-lg font-bold text-accent">VX Academy</h1>
          </div>
          <p className="text-sm opacity-70 mt-1">Administration Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    location === item.path
                      ? "bg-primary text-white"
                      : "text-gray-300 hover:text-white hover:bg-primary/20"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent text-abu-charcoal font-bold flex items-center justify-center uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="ghost"
              className="flex-1 text-gray-300 hover:text-white hover:bg-primary/20"
            >
              <Link href="/">
                <div className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Main Site</span>
                </div>
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-primary/20"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden bg-abu-charcoal text-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-accent" />
              <h1 className="text-lg font-bold text-accent">VX Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="text-gray-300 hover:text-white"
              >
                <Link href="/">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <nav className="overflow-x-auto py-2 mt-2">
            <ul className="flex space-x-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      location === item.path
                        ? "bg-primary text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
