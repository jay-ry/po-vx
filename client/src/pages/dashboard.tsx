import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { ProgressSection } from "@/components/dashboard/progress-section";
import { AchievementsSection } from "@/components/dashboard/achievements-section";
import { LeaderboardSection } from "@/components/dashboard/leaderboard-section";
import { RecommendedCourses } from "@/components/dashboard/recommended-courses";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile sidebar (shown when toggled) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar}>
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-primary" onClick={(e) => e.stopPropagation()}>
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
          <WelcomeCard />
          <ProgressSection />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AchievementsSection />
            <LeaderboardSection />
          </div>
          
          <RecommendedCourses />
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
