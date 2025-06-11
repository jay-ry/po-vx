import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Achievements from "@/pages/achievements";
import Leaderboard from "@/pages/leaderboard";
import AiTutor from "@/pages/ai-tutor";
import Profile from "@/pages/profile";
// Existing Admin Pages
import UserManagement from "@/pages/admin/user-management";
import ContentManagement from "@/pages/admin/content-management";
import Analytics from "@/pages/admin/analytics";

// New Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import CourseManagement from "@/pages/admin/course-management";
import ModuleManagement from "@/pages/admin/modules";
import TrainingAreaManagement from "@/pages/admin/training-areas";
import UnitsManagement from "@/pages/admin/units";
import LearningBlocksManagement from "@/pages/admin/learning-blocks";
import AssessmentsManagement from "@/pages/admin/assessments";
import QuestionsManagement from "@/pages/admin/questions";
import BadgesManagement from "@/pages/admin/badges";
import ScormPackagesManagement from "@/pages/admin/scorm-packages";
import RolesManagement from "@/pages/admin/roles-management";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {(params) => {
          const isAuthenticated = !!queryClient.getQueryData(["/api/user"]);
          return isAuthenticated ? <Dashboard /> : <HomePage />;
        }}
      </Route>
      <Route path="/auth" component={AuthPage} />

      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/courses" component={Courses} />
      <ProtectedRoute path="/courses/:id" component={CourseDetail} />
      <ProtectedRoute path="/achievements" component={Achievements} />
      <ProtectedRoute path="/leaderboard" component={Leaderboard} />
      <ProtectedRoute path="/ai-tutor" component={AiTutor} />
      <ProtectedRoute path="/profile" component={Profile} />
      {/* Admin routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={UserManagement} />
      <ProtectedRoute path="/admin/roles" component={RolesManagement} />
      <ProtectedRoute path="/admin/content" component={ContentManagement} />
      <ProtectedRoute path="/admin/analytics" component={Analytics} />
      <ProtectedRoute
        path="/admin/course-management"
        component={CourseManagement}
      />
      <ProtectedRoute path="/admin/modules" component={ModuleManagement} />
      <ProtectedRoute
        path="/admin/training-areas"
        component={TrainingAreaManagement}
      />
      <ProtectedRoute path="/admin/units" component={UnitsManagement} />
      <ProtectedRoute
        path="/admin/learning-blocks"
        component={LearningBlocksManagement}
      />
      <ProtectedRoute
        path="/admin/assessments"
        component={AssessmentsManagement}
      />
      <ProtectedRoute path="/admin/questions" component={QuestionsManagement} />
      <ProtectedRoute path="/admin/badges" component={BadgesManagement} />
      <ProtectedRoute path="/admin/scorm" component={ScormPackagesManagement} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
