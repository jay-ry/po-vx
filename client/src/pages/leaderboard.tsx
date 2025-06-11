import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Leaderboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("week");
  const { user: currentUser } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // In a real app, the API would support different timeframes
  // For this mock, we'll use the same data for all timeframes
  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

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
          <div className="max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="font-heading text-2xl font-semibold text-neutrals-800 mb-4 md:mb-0">Leaderboard</h1>
                
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="alltime">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Tabs defaultValue="global" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="global">Global Ranking</TabsTrigger>
                  <TabsTrigger value="department">By Department</TabsTrigger>
                  <TabsTrigger value="location">By Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="global">
                  <div className="overflow-hidden rounded-xl border border-neutrals-200 shadow-md">
                    <div className="bg-primary text-white grid grid-cols-12 gap-4 py-3 px-4">
                      <div className="col-span-1 text-center font-medium">Rank</div>
                      <div className="col-span-8 md:col-span-6 font-medium">Name</div>
                      <div className="hidden md:block md:col-span-3 font-medium">Achievement Level</div>
                      <div className="col-span-3 md:col-span-2 text-right font-medium">XP Points</div>
                    </div>
                    
                    {isLoading ? (
                      // Loading skeletons
                      Array(10).fill(0).map((_, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 py-4 px-4 border-b border-neutrals-200">
                          <div className="col-span-1 text-center"><Skeleton className="h-5 w-5 mx-auto" /></div>
                          <div className="col-span-8 md:col-span-6 flex items-center">
                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                          <div className="hidden md:flex md:col-span-3 items-center">
                            <Skeleton className="h-5 w-24" />
                          </div>
                          <div className="col-span-3 md:col-span-2 text-right">
                            <Skeleton className="h-5 w-16 ml-auto" />
                          </div>
                        </div>
                      ))
                    ) : leaderboard && leaderboard.length > 0 ? (
                      leaderboard.map((user, index) => {
                        const isCurrentUser = user.id === currentUser?.id;
                        const rankColor = 
                          index === 0 ? "text-secondary" :
                          index === 1 ? "text-abu-charcoal" :
                          index === 2 ? "text-amber-700" : "";
                        
                        const achievementLevel = 
                          user.xpPoints >= 3000 ? "Expert" :
                          user.xpPoints >= 1500 ? "Advanced" :
                          user.xpPoints >= 500 ? "Intermediate" : "Beginner";
                        
                        const achievementIcon = 
                          user.xpPoints >= 3000 ? "workspace_premium" :
                          user.xpPoints >= 1500 ? "emoji_events" :
                          user.xpPoints >= 500 ? "military_tech" : "person";
                        
                        return (
                          <div 
                            key={user.id} 
                            className={`grid grid-cols-12 gap-4 py-4 px-4 border-b border-neutrals-200 hover:bg-neutrals-50 transition-colors duration-200 ${
                              isCurrentUser ? "bg-primary-light bg-opacity-10 border-l-4 border-l-primary" : ""
                            }`}
                          >
                            <div className={`col-span-1 text-center font-bold ${rankColor}`}>
                              {index < 3 ? (
                                <div className="flex items-center justify-center">
                                  <span className="material-icons">
                                    {index === 0 ? "looks_one" : index === 1 ? "looks_two" : "looks_3"}
                                  </span>
                                </div>
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="col-span-8 md:col-span-6 flex items-center">
                              <div className="relative">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                                    {user.name.charAt(0)}
                                  </div>
                                )}
                                {index < 3 && (
                                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white `}>
                                    <span className={`material-icons text-[10px] ${
                                      index === 0 ? "text-secondary" : index === 1 ? "text-abu-charcoal" : "text-amber-700"
                                    }`}>emoji_events</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <span className={`font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                                  {user.name}
                                  {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                                </span>
                              </div>
                            </div>
                            <div className="hidden md:flex md:col-span-3 items-center">
                              <span className={`material-icons text-sm mr-2 ${
                                user.xpPoints >= 3000 ? "text-secondary" :
                                user.xpPoints >= 1500 ? "text-neutrals-500" :
                                user.xpPoints >= 500 ? "text-amber-700" : "text-abu-charcoal"
                              }`}>
                                {achievementIcon}
                              </span>
                              <span>{achievementLevel}</span>
                            </div>
                            <div className="col-span-3 md:col-span-2 text-right font-semibold text-primary">
                              {user.xpPoints?.toLocaleString() || 0} XP
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center">
                        <div className="flex flex-col items-center">
                          <span className="material-icons text-4xl text-abu-charcoal mb-2">leaderboard</span>
                          <h3 className="text-lg font-semibold mb-2">No data available</h3>
                          <p className="text-neutrals-600">The leaderboard is currently empty.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="department">
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-neutrals-50 to-neutrals-100 rounded-xl shadow-inner">
                    <span className="material-icons text-4xl text-abu-charcoal mb-2">business</span>
                    <h3 className="text-lg font-semibold mb-2">Department Leaderboard</h3>
                    <p className="text-neutrals-600 text-center max-w-md">
                      Department-based leaderboards will be available soon. Track your progress against colleagues in your department.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="location">
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-neutrals-50 to-neutrals-100 rounded-xl shadow-inner">
                    <span className="material-icons text-4xl text-abu-charcoal mb-2">location_on</span>
                    <h3 className="text-lg font-semibold mb-2">Location Leaderboard</h3>
                    <p className="text-neutrals-600 text-center max-w-md">
                      Location-based leaderboards will be available soon. Compare your progress with others at your location.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Leaderboard Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mr-3 shadow-sm">
                    <span className="material-icons text-primary">star</span>
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Your Rank</h2>
                  </div>
                </div>
                
                {isLoading ? (
                  <Skeleton className="h-12 w-24" />
                ) : leaderboard && currentUser ? (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-primary">
                        {leaderboard.findIndex(u => u.id === currentUser.id) + 1}
                      </span>
                      <span className="text-neutrals-500 ml-2">of {leaderboard.length}</span>
                    </div>
                    <p className="text-sm text-neutrals-600 mt-2">
                      {leaderboard.findIndex(u => u.id === currentUser.id) === 0 ? (
                        "You're at the top! Keep up the great work."
                      ) : leaderboard.findIndex(u => u.id === currentUser.id) < 3 ? (
                        "You're in the top 3! Almost at the top."
                      ) : leaderboard.findIndex(u => u.id === currentUser.id) < 10 ? (
                        "You're in the top 10! Keep pushing forward."
                      ) : (
                        "Keep learning to climb the leaderboard."
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-neutrals-600">Not available</p>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center mr-3 shadow-sm">
                    <span className="material-icons text-accent">trending_up</span>
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Points to Next Rank</h2>
                  </div>
                </div>
                
                {isLoading ? (
                  <Skeleton className="h-12 w-24" />
                ) : leaderboard && currentUser ? (
                  (() => {
                    const userIndex = leaderboard.findIndex(u => u.id === currentUser.id);
                    if (userIndex <= 0) {
                      return (
                        <>
                          <div className="flex items-baseline">
                            <span className="text-3xl font-bold text-accent">0</span>
                            <span className="text-neutrals-500 ml-2">XP</span>
                          </div>
                          <p className="text-sm text-neutrals-600 mt-2">
                            You're already at the top of the leaderboard!
                          </p>
                        </>
                      );
                    }
                    
                    const pointsNeeded = (leaderboard[userIndex - 1]?.xpPoints || 0) - (currentUser.xpPoints || 0) + 1;
                    
                    return (
                      <>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-accent">{pointsNeeded}</span>
                          <span className="text-neutrals-500 ml-2">XP</span>
                        </div>
                        <p className="text-sm text-neutrals-600 mt-2">
                          {pointsNeeded <= 100 ? (
                            "You're very close to the next rank!"
                          ) : pointsNeeded <= 500 ? (
                            "Keep going, you're making progress!"
                          ) : (
                            "Stay committed to your learning journey."
                          )}
                        </p>
                      </>
                    );
                  })()
                ) : (
                  <p className="text-neutrals-600">Not available</p>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary/10 to-secondary/20 flex items-center justify-center mr-3 shadow-sm">
                    <span className="material-icons text-secondary">emoji_events</span>
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Top Achiever</h2>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="flex items-center">
                    {leaderboard[0].avatar ? (
                      <img src={leaderboard[0].avatar} alt={leaderboard[0].name} className="w-10 h-10 rounded-full mr-3" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold mr-3">
                        {leaderboard[0].name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{leaderboard[0].name}</div>
                      <div className="text-sm text-primary font-medium">{leaderboard[0].xpPoints?.toLocaleString() || 0} XP</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutrals-600">Not available</p>
                )}
              </div>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
