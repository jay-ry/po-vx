import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    // Special case for dashboard
    if (path === "/dashboard" && (location === "/dashboard" || location === "/")) {
      return true;
    }
    // For other routes, check if the location starts with the path
    return location.startsWith(path);
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-primary text-white shadow-lg">
      <div className="p-4 flex items-center justify-center border-b border-primary-light">
        <span className="material-icons text-3xl mr-2">school</span>
        <span className="font-heading font-bold text-xl">VX Academy</span>
      </div>
      <div className="overflow-y-auto flex-grow">
        <nav className="mt-4">
          <div className="px-4 py-2 text-neutrals-300 uppercase text-xs font-semibold">Main</div>
          <Link href="/dashboard">
            <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/dashboard") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
              <span className="material-icons mr-3">dashboard</span>
              <span>Dashboard</span>
            </div>
          </Link>
          <Link href="/courses">
            <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/courses") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
              <span className="material-icons mr-3">school</span>
              <span>My Courses</span>
            </div>
          </Link>
          <Link href="/achievements">
            <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/achievements") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
              <span className="material-icons mr-3">military_tech</span>
              <span>Achievements</span>
            </div>
          </Link>
          <Link href="/leaderboard">
            <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/leaderboard") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
              <span className="material-icons mr-3">leaderboard</span>
              <span>Leaderboard</span>
            </div>
          </Link>
          <Link href="/ai-tutor">
            <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/ai-tutor") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
              <span className="material-icons mr-3">forum</span>
              <span>AI Tutor</span>
            </div>
          </Link>
          
          {/* Admin-specific menu items */}
          {user?.role === "admin" && (
            <>
              <div className="px-4 py-2 mt-6 text-neutrals-300 uppercase text-xs font-semibold">Admin</div>
              <Link href="/admin/users">
                <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/admin/users") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
                  <span className="material-icons mr-3">verified_user</span>
                  <span>User Management</span>
                </div>
              </Link>
              <Link href="/admin/roles">
                <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/admin/roles") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
                  <span className="material-icons mr-3">admin_panel_settings</span>
                  <span>Role Management</span>
                </div>
              </Link>
              <Link href="/admin/course-management">
                <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/admin/course-management") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
                  <span className="material-icons mr-3">category</span>
                  <span>Content Management</span>
                </div>
              </Link>
              <Link href="/admin/analytics">
                <div className={`flex items-center px-4 py-3 cursor-pointer ${isActive("/admin/analytics") ? "bg-primary-light rounded-r-lg" : "hover:bg-primary-light rounded-r-lg"}`}>
                  <span className="material-icons mr-3">analytics</span>
                  <span>Analytics</span>
                </div>
              </Link>

            </>
          )}
        </nav>
      </div>
      <div className="p-4 border-t border-primary-light">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-lg font-semibold mr-3 border">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <div className="font-medium">{user?.name || "User"}</div>
            <div className="text-xs text-neutrals-300">
              {user?.role === "admin" ? "Administrator" : 
               user?.role === "supervisor" ? "Supervisor" : 
               user?.role === "content_creator" ? "Content Creator" : 
               "Staff"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
