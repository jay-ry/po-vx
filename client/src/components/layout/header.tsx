import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [language, setLanguage] = useState("EN");
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } =
    useQuery<Notification[]>({
      queryKey: ["/api/notifications"],
      enabled: !!user,
    });

  // Fetch notification count
  const { data: notificationCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: !!user,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (!response.ok) throw new Error("Failed to mark notification as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok)
        throw new Error("Failed to mark all notifications as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
    // Navigation is now handled in the auth hook's onSuccess callback
  };

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "AR" : "EN");
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "course_assigned":
      case "course_reminder":
        return "school";
      case "badge_earned":
      case "achievement":
        return "emoji_events";
      case "leaderboard_update":
        return "leaderboard";
      default:
        return "notifications";
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - notificationDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center md:hidden">
          <button
            className="text-neutrals-700 focus:outline-none"
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="flex items-center ml-3">
            <span className="material-icons text-primary text-2xl mr-2">
              school
            </span>
            <span className="font-heading font-bold">VX Academy</span>
          </div>
        </div>

        <div className="flex ml-auto">
          {/* <div className="flex items-center mx-4">
            <div className="relative">
              <button
                className="flex items-center text-neutrals-700 focus:outline-none"
                onClick={toggleLanguage}
              >
                <span className="material-icons mr-1">language</span>
                <span>{language}</span>
                <span className="material-icons">arrow_drop_down</span>
              </button>
            </div>
          </div> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-neutrals-700 focus:outline-none mx-4">
                <span className="material-icons mr-1">notifications</span>
                <span className="hidden md:inline">Notifications</span>
                {notificationCount && notificationCount.count > 0 && (
                  <span className="ml-1 bg-accent text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                    {notificationCount.count}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs text-primary hover:underline"
                    disabled={markAllAsReadMutation.isPending}
                  >
                    Mark all read
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notificationsLoading ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`flex items-start gap-2 py-1 w-full ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className={`material-icons text-primary`}>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-neutral-500">
                          {notification.message}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatTimeAgo(notification.createdAt!)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}

              {notifications.length > 5 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer">
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-neutrals-700 focus:outline-none mx-4">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold mr-1">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <span className="material-icons text-sm">arrow_drop_down</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
              </Link>
              {/* <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
              </Link> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                <span className="material-icons mr-2 text-sm">logout</span>
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
