import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { User, Course, UserProgress } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download } from "lucide-react";

const CHART_COLORS = ["#003451", "#D4AF37", "#00d8cc", "#6C757D", "#343A40"];

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("month");
  const { user } = useAuth();

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch leaderboard for user data
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/leaderboard", 100],
  });

  // Fetch courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch user progress
  const { data: progress, isLoading: isLoadingProgress } = useQuery<
    UserProgress[]
  >({
    queryKey: ["/api/progress"],
  });

  // Loading state
  const isLoading = isLoadingUsers || isLoadingCourses || isLoadingProgress;

  // Calculate analytics data
  const totalUsers = users?.length || 0;
  const totalCourses = courses?.length || 0;

  // User role distribution data
  const roleDistribution = users ? calculateRoleDistribution(users) : [];

  // Course completion data
  const courseCompletionData =
    courses && progress ? calculateCourseCompletionData(courses, progress) : [];

  // Average course completion percentage
  const avgCompletionPercentage =
    calculateAverageCompletionPercentage(progress);

  // XP distribution by level
  const xpDistribution = users ? calculateXPDistribution(users) : [];

  // User engagement over time (mock data as we don't have real time series data)
  // In a real implementation, this would come from tracking user logins or activities over time
  const userEngagementData = generateMockTimeSeriesData(timeRange);

  // Course enrollment over time (mock data)
  const enrollmentData = generateMockTimeSeriesData(timeRange);

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile sidebar (shown when toggled) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-64 bg-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar (always visible on md+) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-neutrals-100 p-4 pb-16 md:pb-4">
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="font-heading text-2xl font-semibold text-neutrals-800 mb-4 md:mb-0">
                Analytics Dashboard
              </h1>

              <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <CardDescription>Active platform users</CardDescription>
                  </div>
                  <div className="w-10 h-10 bg-primary-light bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="material-icons text-primary">people</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold">{totalUsers}</div>
                  )}
                  <p className="text-xs text-neutrals-500 mt-1">
                    <span className="text-success">↑ 12%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Course Completion
                    </CardTitle>
                    <CardDescription>Average completion rate</CardDescription>
                  </div>
                  <div className="w-10 h-10 bg-secondary-light bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="material-icons text-secondary">
                      school
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {avgCompletionPercentage}%
                    </div>
                  )}
                  <p className="text-xs text-neutrals-500 mt-1">
                    <span className="text-success">↑ 5%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      Total Courses
                    </CardTitle>
                    <CardDescription>Available courses</CardDescription>
                  </div>
                  <div className="w-10 h-10 bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="material-icons text-accent">
                      menu_book
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCourses ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <div className="text-3xl font-bold">{totalCourses}</div>
                  )}
                  <p className="text-xs text-neutrals-500 mt-1">
                    <span className="text-success">↑ 3</span> new courses added
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">User Analytics</TabsTrigger>
                <TabsTrigger value="courses">Course Analytics</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  {/* Top Row - Role Distribution and Course Completion */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Role Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>User Role Distribution</CardTitle>
                        <CardDescription>
                          Breakdown of users by role
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[350px]">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center h-full">
                            <Skeleton className="h-[300px] w-full" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={roleDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={120}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent, value }) =>
                                  value > 0 && percent > 0
                                    ? `${name} (${(percent * 100).toFixed(0)}%)`
                                    : null
                                }
                                labelLine={false}
                              >
                                {roleDistribution.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      CHART_COLORS[index % CHART_COLORS.length]
                                    }
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  `${value} users`,
                                  "Count",
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Course Completion Rates */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Course Completion Rates</CardTitle>
                        <CardDescription>
                          Top 5 courses by completion percentage
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[350px]">
                        {isLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <Skeleton className="h-[300px] w-full" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={courseCompletionData.slice(0, 5)}
                              layout="vertical"
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" domain={[0, 100]} />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `${value}%`,
                                  "Completion Rate",
                                ]}
                              />
                              <Bar
                                dataKey="value"
                                fill="#00d8cc"
                                name="Completion Rate"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Middle Row - XP Distribution (Full Width) */}
                  <div className="grid grid-cols-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="material-icons text-primary">
                            emoji_events
                          </span>
                          XP Distribution Analysis
                        </CardTitle>
                        <CardDescription>
                          User achievement levels and experience point
                          distribution across the platform
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[450px]">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center h-full">
                            <Skeleton className="h-[400px] w-full" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={xpDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={160}
                                fill="#8884d8"
                                paddingAngle={8}
                                dataKey="value"
                                label={({ name, percent, value }) =>
                                  value > 0 && percent > 0
                                    ? `${name} (${(percent * 100).toFixed(0)}%)`
                                    : null
                                }
                                labelLine={false}
                              >
                                {xpDistribution.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      CHART_COLORS[index % CHART_COLORS.length]
                                    }
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [
                                  `${value} users`,
                                  "Count",
                                ]}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ paddingTop: "20px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bottom Row - User Activity */}
                  <div className="grid grid-cols-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity Over Time</CardTitle>
                        <CardDescription>
                          Active and new users trend analysis
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={userEngagementData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="activeUsers"
                              stroke="#003451"
                              strokeWidth={3}
                              activeDot={{ r: 8 }}
                              name="Active Users"
                            />
                            <Line
                              type="monotone"
                              dataKey="newUsers"
                              stroke="#D4AF37"
                              strokeWidth={3}
                              name="New Users"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* User Analytics Tab */}
              <TabsContent value="users" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>User Growth</CardTitle>
                      <CardDescription>
                        New user signups over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={generateMockTimeSeriesData(timeRange)}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="newUsers"
                            fill="#003451"
                            name="New Users"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Roles</CardTitle>
                      <CardDescription>
                        Detailed breakdown by role
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-[250px] w-full" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={roleDistribution}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#D4AF37" name="Users" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>XP Distribution</CardTitle>
                      <CardDescription>User achievement levels</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-[250px] w-full" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={xpDistribution}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#00d8cc" name="Users" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Course Analytics Tab */}
              <TabsContent value="courses" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Course Enrollment</CardTitle>
                      <CardDescription>
                        Course enrollments over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={enrollmentData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="enrollments"
                            stroke="#003451"
                            activeDot={{ r: 8 }}
                            name="Course Enrollments"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Course Completion Rates</CardTitle>
                      <CardDescription>
                        Completion percentages by course
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-[250px] w-full" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={courseCompletionData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                              formatter={(value) => [
                                `${value}%`,
                                "Completion Rate",
                              ]}
                            />
                            <Legend />
                            <Bar
                              dataKey="value"
                              fill="#00d8cc"
                              name="Completion Rate"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Courses by Difficulty</CardTitle>
                      <CardDescription>
                        Distribution of course levels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {isLoadingCourses ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-[250px] w-full" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={calculateCourseDifficultyDistribution(
                                courses
                              )}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent, value }) =>
                                value > 0 && percent > 0
                                  ? `${name} (${(percent * 100).toFixed(0)}%)`
                                  : null
                              }
                              labelLine={false}
                            >
                              {calculateCourseDifficultyDistribution(
                                courses
                              ).map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [
                                `${value} courses`,
                                "Count",
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Engagement Tab */}
              <TabsContent value="engagement" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Daily Active Users</CardTitle>
                      <CardDescription>User activity over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={userEngagementData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="activeUsers"
                            stroke="#003451"
                            activeDot={{ r: 8 }}
                            name="Active Users"
                          />
                          <Line
                            type="monotone"
                            dataKey="returningUsers"
                            stroke="#D4AF37"
                            name="Returning Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Assessment Completion</CardTitle>
                      <CardDescription>
                        Average assessment scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={generateMockAssessmentScores()}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            formatter={(value) => [
                              `${value}%`,
                              "Average Score",
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="score"
                            fill="#00d8cc"
                            name="Average Score"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>AI Tutor Usage</CardTitle>
                      <CardDescription>
                        AI assistant interaction statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={generateMockAITutorData()}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="interactions"
                            stroke="#003451"
                            name="User Interactions"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}

// Helper function to calculate role distribution
function calculateRoleDistribution(users: User[]) {
  const roleCount: Record<string, number> = {
    Admin: 0,
    Supervisor: 0,
    "Content Creator": 0,
    Frontliner: 0,
  };

  users.forEach((user) => {
    if (user.role === "admin") roleCount["Admin"]++;
    else if (user.role === "supervisor") roleCount["Supervisor"]++;
    else if (user.role === "content_creator") roleCount["Content Creator"]++;
    else roleCount["Frontliner"]++;
  });

  return Object.entries(roleCount).map(([name, value]) => ({ name, value }));
}

// Helper function to calculate course completion data
function calculateCourseCompletionData(
  courses: Course[],
  progress: UserProgress[]
) {
  const courseCompletionMap = new Map<
    number,
    { completionSum: number; userCount: number }
  >();

  // Initialize with all courses
  courses.forEach((course) => {
    courseCompletionMap.set(course.id, { completionSum: 0, userCount: 0 });
  });

  // Sum up completion percentages
  progress.forEach((p) => {
    const courseData = courseCompletionMap.get(p.courseId);
    if (courseData) {
      courseData.completionSum += p.percentComplete;
      courseData.userCount++;
    }
  });

  // Calculate averages and format data
  return courses
    .map((course) => {
      const data = courseCompletionMap.get(course.id);
      const avgCompletion =
        data && data.userCount > 0
          ? Math.round(data.completionSum / data.userCount)
          : 0;

      return {
        name: course.name,
        value: avgCompletion,
      };
    })
    .sort((a, b) => b.value - a.value); // Sort by completion percentage descending
}

// Helper function to calculate average completion percentage
function calculateAverageCompletionPercentage(
  progress: UserProgress[] | undefined
) {
  if (!progress || progress.length === 0) return 0;

  const totalPercentage = progress.reduce(
    (sum, p) => sum + p.percentComplete,
    0
  );
  return Math.round(totalPercentage / progress.length);
}

// Helper function to calculate XP distribution
function calculateXPDistribution(users: User[]) {
  const xpGroups: Record<string, number> = {
    "Beginner (0-500 XP)": 0,
    "Intermediate (501-1500 XP)": 0,
    "Advanced (1501-3000 XP)": 0,
    "Expert (3000+ XP)": 0,
  };

  users.forEach((user) => {
    const xp = user.xpPoints || 0;
    if (xp <= 500) xpGroups["Beginner (0-500 XP)"]++;
    else if (xp <= 1500) xpGroups["Intermediate (501-1500 XP)"]++;
    else if (xp <= 3000) xpGroups["Advanced (1501-3000 XP)"]++;
    else xpGroups["Expert (3000+ XP)"]++;
  });

  return Object.entries(xpGroups).map(([name, value]) => ({ name, value }));
}

// Helper function to calculate course difficulty distribution
function calculateCourseDifficultyDistribution(courses: Course[] | undefined) {
  if (!courses) return [];

  const levelCount: Record<string, number> = {
    Beginner: 0,
    Intermediate: 0,
    Advanced: 0,
  };

  courses.forEach((course) => {
    const level = course.level || "Beginner";
    if (levelCount[capitalize(level)] !== undefined) {
      levelCount[capitalize(level)]++;
    }
  });

  return Object.entries(levelCount).map(([name, value]) => ({ name, value }));
}

// Helper function to capitalize first letter
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate mock time series data for the charts
function generateMockTimeSeriesData(timeRange: string) {
  const data = [];
  let count: number;

  switch (timeRange) {
    case "week":
      count = 7;
      for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (count - i - 1));
        data.push({
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          activeUsers: Math.floor(Math.random() * 50) + 150,
          newUsers: Math.floor(Math.random() * 10) + 5,
          returningUsers: Math.floor(Math.random() * 30) + 100,
          enrollments: Math.floor(Math.random() * 15) + 10,
        });
      }
      break;
    case "month":
      count = 30;
      for (let i = 0; i < count; i += 2) {
        const date = new Date();
        date.setDate(date.getDate() - (count - i - 1));
        data.push({
          name: `${date.getMonth() + 1}/${date.getDate()}`,
          activeUsers: Math.floor(Math.random() * 80) + 120,
          newUsers: Math.floor(Math.random() * 15) + 10,
          returningUsers: Math.floor(Math.random() * 40) + 80,
          enrollments: Math.floor(Math.random() * 25) + 15,
        });
      }
      break;
    case "quarter":
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (12 - i - 1));
        data.push({
          name: date
            .toLocaleDateString("en-US", { month: "short" })
            .substring(0, 3),
          activeUsers: Math.floor(Math.random() * 200) + 300,
          newUsers: Math.floor(Math.random() * 50) + 30,
          returningUsers: Math.floor(Math.random() * 150) + 200,
          enrollments: Math.floor(Math.random() * 60) + 40,
        });
      }
      break;
    case "year":
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(i);
        data.push({
          name: date
            .toLocaleDateString("en-US", { month: "short" })
            .substring(0, 3),
          activeUsers: Math.floor(Math.random() * 300) + 500,
          newUsers: Math.floor(Math.random() * 100) + 50,
          returningUsers: Math.floor(Math.random() * 200) + 350,
          enrollments: Math.floor(Math.random() * 120) + 80,
        });
      }
      break;
  }

  return data;
}

// Generate mock assessment scores
function generateMockAssessmentScores() {
  return [
    { name: "Cultural Heritage", score: 87 },
    { name: "Customer Service", score: 92 },
    { name: "De-Escalation", score: 78 },
    { name: "Multilingual Comm.", score: 65 },
    { name: "Tourism Trends", score: 81 },
  ];
}

// Generate mock AI tutor data
function generateMockAITutorData() {
  const data = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (7 - i - 1));
    data.push({
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      interactions: Math.floor(Math.random() * 30) + 40,
    });
  }
  return data;
}
