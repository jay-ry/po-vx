import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {
  UserProgress,
  UserBadge,
  Badge as BadgeType,
  Course,
} from "@shared/schema";

type UserBadgeWithDetails = UserBadge & { badge?: BadgeType };
type UserProgressWithCourse = UserProgress & { course?: Course };

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    language: user?.language || "en",
  });

  // Password Change State (moved from settings.tsx)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch user progress
  const { data: userProgress, isLoading: progressLoading } = useQuery<
    UserProgressWithCourse[]
  >({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });

  // Fetch user badges
  const { data: userBadges, isLoading: badgesLoading } = useQuery<
    UserBadgeWithDetails[]
  >({
    queryKey: ["/api/user/badges"],
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation (moved from settings.tsx)
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      console.log("Making password change request...");
      const response = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("Password change response status:", response.status);
      console.log(
        "Password change response headers:",
        response.headers.get("content-type")
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update password");
        } else {
          // Server returned HTML instead of JSON
          const text = await response.text();
          console.error(
            "Server returned non-JSON response:",
            text.substring(0, 200)
          );
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }
      }

      return response.json();
    },
    onSuccess: () => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Password update error:", error);
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || "",
      language: user?.language || "en",
    });
    setIsEditing(false);
  };

  // Handle password change (moved from settings.tsx)
  const handlePasswordChange = () => {
    // Validate all fields are filled
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate new password length
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Validate password confirmation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    // Validate new password is different from current
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast({
        title: "Same password",
        description:
          "New password must be different from your current password.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate(passwordForm);
  };

  const handleDeleteAccount = () => {
    // This would typically call an API to delete the account
    toast({
      title: "Account deletion",
      description: "Account deletion feature will be implemented soon.",
      variant: "destructive",
    });
  };

  // Calculate statistics
  const completedCourses = userProgress?.filter((p) => p.completed).length || 0;
  const totalCourses = userProgress?.length || 0;
  const averageProgress =
    totalCourses > 0
      ? Math.round(
          userProgress!.reduce((sum, p) => sum + p.percentComplete, 0) /
            totalCourses
        )
      : 0;
  const totalBadges = userBadges?.length || 0;

  // Get achievement level
  const getAchievementLevel = (xp: number) => {
    if (xp >= 3000)
      return {
        level: "Expert",
        icon: "workspace_premium",
        color: "text-purple-600",
      };
    if (xp >= 1500)
      return {
        level: "Advanced",
        icon: "emoji_events",
        color: "text-yellow-600",
      };
    if (xp >= 500)
      return {
        level: "Intermediate",
        icon: "military_tech",
        color: "text-blue-600",
      };
    return { level: "Beginner", icon: "person", color: "text-green-600" };
  };

  const achievement = getAchievementLevel(user?.xpPoints || 0);

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile sidebar */}
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

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-neutrals-100 p-2 sm:p-4 pb-16 md:pb-4">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Profile Header */}
            <Card className="shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                      <AvatarImage
                        src={user?.avatar || undefined}
                        alt={user?.name}
                      />
                      <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary text-white">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-neutrals-800 truncate">
                        {user?.name}
                      </h1>
                      <p className="text-sm sm:text-base text-neutrals-600 truncate">
                        {user?.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className="capitalize text-xs sm:text-sm"
                        >
                          {user?.role === "admin"
                            ? "Administrator"
                            : user?.role === "supervisor"
                            ? "Supervisor"
                            : user?.role === "content_creator"
                            ? "Content Creator"
                            : "Staff"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${achievement.color} text-xs sm:text-sm`}
                        >
                          <span className="material-icons text-sm mr-1">
                            {achievement.icon}
                          </span>
                          {achievement.level}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 sm:gap-6 w-full lg:w-auto lg:ml-auto">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-primary">
                        {user?.xpPoints?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-neutrals-600">
                        XP Points
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-8 sm:h-12" />
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-secondary">
                        {totalBadges}
                      </div>
                      <div className="text-xs sm:text-sm text-neutrals-600">
                        Badges
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-8 sm:h-12" />
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-accent">
                        {completedCourses}
                      </div>
                      <div className="text-xs sm:text-sm text-neutrals-600">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Tabs */}
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 rounded-2xl bg-primary/10 shadow-md h-auto">
                <TabsTrigger
                  value="overview"
                  className="rounded-l-2xl lg:rounded-l-2xl lg:rounded-r-none py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-center transition-all duration-300 hover:bg-abu-sand/80 hover:scale-105"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="rounded-r-2xl lg:rounded-none py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-center transition-all duration-300 hover:bg-abu-sand/80 hover:scale-105"
                >
                  <span className="hidden sm:inline">Achievements</span>
                  <span className="sm:hidden">Awards</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-l-2xl lg:rounded-none py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-center transition-all duration-300 hover:bg-abu-sand/80 hover:scale-105"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="rounded-r-2xl py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-center transition-all duration-300 hover:bg-abu-sand/80 hover:scale-105"
                >
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Learning Progress */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <span className="material-icons text-primary text-lg sm:text-xl">
                          trending_up
                        </span>
                        Learning Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs sm:text-sm mb-2">
                            <span>Overall Progress</span>
                            <span>{averageProgress}%</span>
                          </div>
                          <Progress value={averageProgress} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-base sm:text-lg font-bold text-primary">
                              {completedCourses}
                            </div>
                            <div className="text-xs text-neutrals-600">
                              Completed
                            </div>
                          </div>
                          <div>
                            <div className="text-base sm:text-lg font-bold text-neutrals-600">
                              {totalCourses - completedCourses}
                            </div>
                            <div className="text-xs text-neutrals-600">
                              In Progress
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <span className="material-icons text-secondary text-lg sm:text-xl">
                          history
                        </span>
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {progressLoading ? (
                        <div className="space-y-3">
                          {Array(3)
                            .fill(0)
                            .map((_, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                                <div className="space-y-1 flex-1">
                                  <Skeleton className="h-3 sm:h-4 w-full max-w-32" />
                                  <Skeleton className="h-2 sm:h-3 w-full max-w-20" />
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : userProgress && userProgress.length > 0 ? (
                        <div className="space-y-3">
                          {userProgress
                            .sort(
                              (a, b) =>
                                new Date(b.lastAccessed!).getTime() -
                                new Date(a.lastAccessed!).getTime()
                            )
                            .slice(0, 3)
                            .map((progress) => (
                              <div
                                key={progress.id}
                                className="flex items-center gap-3"
                              >
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="material-icons text-primary text-sm">
                                    school
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium truncate">
                                    {progress.course?.name || "Course"}
                                  </div>
                                  <div className="text-xs text-neutrals-600">
                                    {progress.percentComplete}% complete
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="material-icons text-neutrals-400 text-xl sm:text-2xl mb-2">
                            school
                          </span>
                          <p className="text-xs sm:text-sm text-neutrals-600">
                            No courses started yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Latest Achievements */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <span className="material-icons text-accent text-lg sm:text-xl">
                          emoji_events
                        </span>
                        Latest Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      {badgesLoading ? (
                        <div className="space-y-3">
                          {Array(2)
                            .fill(0)
                            .map((_, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                                <div className="space-y-1 flex-1">
                                  <Skeleton className="h-3 sm:h-4 w-full max-w-24" />
                                  <Skeleton className="h-2 sm:h-3 w-full max-w-16" />
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : userBadges && userBadges.length > 0 ? (
                        <div className="space-y-3">
                          {userBadges
                            .sort(
                              (a, b) =>
                                new Date(b.earnedAt!).getTime() -
                                new Date(a.earnedAt!).getTime()
                            )
                            .slice(0, 2)
                            .map((userBadge) => (
                              <div
                                key={userBadge.id}
                                className="flex items-center gap-3"
                              >
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                  {userBadge.badge?.imageUrl ? (
                                    <img
                                      src={userBadge.badge.imageUrl}
                                      alt={userBadge.badge.name}
                                      className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                                    />
                                  ) : (
                                    <span className="material-icons text-secondary text-sm">
                                      emoji_events
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium truncate">
                                    {userBadge.badge?.name || "Achievement"}
                                  </div>
                                  <div className="text-xs text-neutrals-600">
                                    +{userBadge.badge?.xpPoints || 0} XP
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="material-icons text-neutrals-400 text-xl sm:text-2xl mb-2">
                            emoji_events
                          </span>
                          <p className="text-xs sm:text-sm text-neutrals-600">
                            No achievements yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent
                value="achievements"
                className="space-y-4 sm:space-y-6"
              >
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      Your Achievements
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Badges and certifications you've earned
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {badgesLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                        {Array(6)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full mb-3" />
                              <Skeleton className="h-4 sm:h-5 w-20 sm:w-24 mb-2" />
                              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                            </div>
                          ))}
                      </div>
                    ) : userBadges && userBadges.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                        {userBadges.map((userBadge) => (
                          <div
                            key={userBadge.id}
                            className="flex flex-col items-center group p-3 sm:p-4 rounded-lg hover:bg-neutrals-50 transition-all duration-200"
                          >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                              {userBadge.badge?.imageUrl ? (
                                <img
                                  src={userBadge.badge.imageUrl}
                                  alt={userBadge.badge.name}
                                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-200"
                                />
                              ) : (
                                <span className="material-icons text-2xl sm:text-3xl text-secondary">
                                  emoji_events
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-center mb-2 text-xs sm:text-base text-neutrals-800 group-hover:text-primary transition-colors duration-200 leading-tight">
                              {userBadge.badge?.name || "Achievement"}
                            </h3>
                            <p className="text-xs sm:text-sm text-neutrals-600 text-center mb-2 sm:mb-3 px-1 leading-relaxed min-h-[2rem] sm:min-h-[2.5rem] flex items-center">
                              {userBadge.badge?.description ||
                                "You earned this achievement"}
                            </p>
                            <div className="flex items-center text-accent text-xs sm:text-sm bg-accent/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">
                              <span className="material-icons text-xs sm:text-sm mr-1 sm:mr-1.5">
                                stars
                              </span>
                              <span>{userBadge.badge?.xpPoints || 0} XP</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <span className="material-icons text-neutrals-400 text-3xl sm:text-4xl mb-4">
                          emoji_events
                        </span>
                        <h3 className="font-medium text-neutrals-800 mb-2 text-sm sm:text-base">
                          No achievements yet
                        </h3>
                        <p className="text-neutrals-600 mb-4 text-xs sm:text-sm">
                          Complete courses and assessments to earn badges
                        </p>
                        <Button className="w-full sm:w-auto">
                          Start Learning
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      Profile Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Manage your account information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="name"
                            className="text-sm sm:text-base"
                          >
                            Full Name
                          </Label>
                          {isEditing ? (
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-neutrals-50 rounded-md text-sm sm:text-base">
                              {user?.name}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="email"
                            className="text-sm sm:text-base"
                          >
                            Email Address
                          </Label>
                          {isEditing ? (
                            <Input
                              id="email"
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                              className="mt-1"
                            />
                          ) : (
                            <div className="mt-1 p-2 bg-neutrals-50 rounded-md text-sm sm:text-base">
                              {user?.email}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="username"
                            className="text-sm sm:text-base"
                          >
                            Username
                          </Label>
                          <div className="mt-1 p-2 bg-neutrals-50 rounded-md text-neutrals-600 text-sm sm:text-base">
                            {user?.username}
                          </div>
                          <p className="text-xs text-neutrals-500 mt-1">
                            Username cannot be changed
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="role"
                            className="text-sm sm:text-base"
                          >
                            Role
                          </Label>
                          <div className="mt-1 p-2 bg-neutrals-50 rounded-md text-neutrals-600 capitalize text-sm sm:text-base">
                            {user?.role === "admin"
                              ? "Administrator"
                              : user?.role === "supervisor"
                              ? "Supervisor"
                              : user?.role === "content_creator"
                              ? "Content Creator"
                              : "Staff"}
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="language"
                            className="text-sm sm:text-base"
                          >
                            Preferred Language
                          </Label>
                          {isEditing ? (
                            <Select
                              value={editForm.language}
                              onValueChange={(value) =>
                                setEditForm({ ...editForm, language: value })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1 p-2 bg-neutrals-50 rounded-md text-sm sm:text-base">
                              {user?.language === "ar" ? "العربية" : "English"}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm sm:text-base">
                            Member Since
                          </Label>
                          <div className="mt-1 p-2 bg-neutrals-50 rounded-md text-neutrals-600 text-sm sm:text-base">
                            {user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            {updateProfileMutation.isPending
                              ? "Saving..."
                              : "Save Changes"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="w-full sm:w-auto"
                        >
                          <span className="material-icons mr-2 text-sm">
                            edit
                          </span>
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <span className="material-icons text-primary text-xl sm:text-2xl">
                        security
                      </span>
                      Security Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Manage your account security and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-medium">
                        Change Password
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="lg:col-span-2">
                          <Label
                            htmlFor="currentPassword"
                            className="text-sm sm:text-base"
                          >
                            Current Password
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="newPassword"
                            className="text-sm sm:text-base"
                          >
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="confirmPassword"
                            className="text-sm sm:text-base"
                          >
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handlePasswordChange}
                        disabled={updatePasswordMutation.isPending}
                        className="w-full lg:w-auto"
                      >
                        {updatePasswordMutation.isPending
                          ? "Updating..."
                          : "Update Password"}
                      </Button>
                    </div>

                    
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
