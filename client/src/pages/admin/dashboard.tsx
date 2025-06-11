import { useQuery } from "@tanstack/react-query";
import { ApiResponse, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Users, BookOpen, GraduationCap, Award } from "lucide-react";

// Dashboard summary types
type AdminStats = {
  users: {
    total: number;
    byRole: { role: string; count: number }[];
  };
  courses: {
    total: number;
    byModule: { moduleName: string; count: number }[];
  };
  progress: {
    totalCompletions: number;
    completionRate: number;
    topCourses: { courseName: string; completions: number }[];
  };
  badges: {
    totalAwarded: number;
  };
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/stats");
        return await res.json();
      } catch (error) {
        // If the API is not implemented yet, return mock data for UI development
        return {
          users: {
            total: 0,
            byRole: []
          },
          courses: {
            total: 0,
            byModule: []
          },
          progress: {
            totalCompletions: 0,
            completionRate: 0,
            topCourses: []
          },
          badges: {
            totalAwarded: 0
          }
        };
      }
    },
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold text-abu-charcoal mb-8">Admin Dashboard</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SummaryCard
                title="Total Users"
                value={stats?.users.total || 0}
                description="Registered platform users"
                icon={<Users className="h-10 w-10 text-primary" />}
              />
              <SummaryCard
                title="Total Courses"
                value={stats?.courses.total || 0}
                description="Available training courses"
                icon={<BookOpen className="h-10 w-10 text-primary" />}
              />
              <SummaryCard
                title="Completions"
                value={stats?.progress.totalCompletions || 0}
                description="Course completions"
                icon={<GraduationCap className="h-10 w-10 text-primary" />}
              />
              <SummaryCard
                title="Badges Awarded"
                value={stats?.badges.totalAwarded || 0}
                description="Achievement badges earned"
                icon={<Award className="h-10 w-10 text-primary" />}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Users by Role</CardTitle>
                  <CardDescription>Distribution of users by role type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats?.users.byRole || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="role" angle={-45} textAnchor="end" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#009086" name="Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Courses</CardTitle>
                  <CardDescription>Most completed courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats?.progress.topCourses || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="courseName" angle={-45} textAnchor="end" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="completions" fill="#003451" name="Completions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Section */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickActionLink
                    href="/admin/course-management"
                    title="Manage Courses"
                    description="Add, edit, or delete courses"
                  />
                  <QuickActionLink
                    href="/admin/users"
                    title="Manage Users"
                    description="Review and manage user accounts"
                  />
                  <QuickActionLink
                    href="/admin/modules"
                    title="Manage Modules"
                    description="Create and organize training modules"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, description, icon }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-abu-charcoal mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionLinkProps {
  href: string;
  title: string;
  description: string;
}

function QuickActionLink({ href, title, description }: QuickActionLinkProps) {
  return (
    <a
      href={href}
      className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
    >
      <h3 className="font-medium text-abu-charcoal">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </a>
  );
}