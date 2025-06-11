import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { UserBadge, Badge } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type UserBadgeWithDetails = UserBadge & { badge?: Badge };

export function AchievementsSection() {
  const { data: userBadges, isLoading } = useQuery<UserBadgeWithDetails[]>({
    queryKey: ["/api/user/badges"],
  });

  // Sort badges by most recently earned and prepare badge data
  const recentBadges = userBadges
    ? [...userBadges]
        .sort((a, b) => {
          const dateA = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
          const dateB = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 2)
        .map(userBadge => {
          // Ensure badge property is defined if it's undefined
          if (!userBadge.badge) {
            userBadge.badge = {
              id: userBadge.badgeId,
              name: "Achievement",
              description: "You earned an achievement",
              xpPoints: 50,
              imageUrl: null,
              type: "unknown",
              createdAt: null
            };
          }
          return userBadge;
        })
    : [];

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-semibold text-neutrals-800">Recent Achievements</h2>
        <Link href="/achievements">
          <a className="text-primary text-sm hover:underline">View all</a>
        </Link>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array(2).fill(0).map((_, index) => (
            <div key={index} className="flex items-center p-3 bg-neutrals-50 rounded-lg border border-neutrals-200">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))
        ) : recentBadges.length > 0 ? (
          // Badge items
          recentBadges.map((userBadge) => (
            <div key={userBadge.id} className="flex items-center p-3 bg-neutrals-50 rounded-lg border border-neutrals-200">
              <div className="bg-secondary-light bg-opacity-20 p-2 rounded-full mr-3">
                {userBadge.badge?.imageUrl && userBadge.badge.imageUrl.includes('http') ? (
                  <img 
                    src={userBadge.badge.imageUrl} 
                    alt={userBadge.badge?.name || "Badge"} 
                    className="w-8 h-8 object-contain" 
                  />
                ) : (
                  <span className="material-icons text-secondary">
                    emoji_events
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-neutrals-800">{userBadge.badge?.name || "Achievement"}</h3>
                <p className="text-sm text-neutrals-600">{userBadge.badge?.description || "You earned a new achievement"}</p>
              </div>
              <div className="text-accent text-sm font-medium">+{userBadge.badge?.xpPoints || 0} XP</div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center p-6 text-center bg-neutrals-50 rounded-lg shadow-inner">
            <span className="material-icons text-3xl text-neutrals-400 mb-2">emoji_events</span>
            <h3 className="font-medium text-neutrals-800 mb-1">No achievements yet</h3>
            <p className="text-sm text-neutrals-600">Complete courses and assessments to earn badges</p>
          </div>
        )}
      </div>
    </div>
  );
}
