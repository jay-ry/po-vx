import { Link, useLocation } from "wouter";

export function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") {
      return true;
    }
    return path !== "/" && location.startsWith(path);
  };

  return (
    <nav className="md:hidden bg-white border-t border-neutrals-200 px-4 py-2 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center px-3 py-1 ${
            isActive("/") ? "text-primary" : "text-neutrals-500"
          }`}
        >
          <span className="material-icons">dashboard</span>
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link
          href="/courses"
          className={`flex flex-col items-center px-3 py-1 ${
            isActive("/courses") ? "text-primary" : "text-neutrals-500"
          }`}
        >
          <span className="material-icons">school</span>
          <span className="text-xs mt-1">Courses</span>
        </Link>
        <Link
          href="/achievements"
          className={`flex flex-col items-center px-3 py-1 ${
            isActive("/achievements") ? "text-primary" : "text-neutrals-500"
          }`}
        >
          <span className="material-icons">military_tech</span>
          <span className="text-xs mt-1">Achievements</span>
        </Link>
        <Link
          href="/ai-tutor"
          className={`flex flex-col items-center px-3 py-1 ${
            isActive("/ai-tutor") ? "text-primary" : "text-neutrals-500"
          }`}
        >
          <span className="material-icons">forum</span>
          <span className="text-xs mt-1">AI Tutor</span>
        </Link>
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center px-3 py-1 ${
            isActive("/leaderboard") ? "text-primary" : "text-neutrals-500"
          }`}
        >
          <span className="material-icons">leaderboard</span>
          <span className="text-xs mt-1">Leaderboard</span>
        </Link>
      </div>
    </nav>
  );
}
