import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { BadgesManagement } from "@/components/admin/badges-management";
import AdminLayout from "@/components/layout/admin-layout";

export default function AdminBadgesPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Redirect if not logged in or not an admin
  if (!user) {
    return <Redirect to="/auth" />;
  } else if (user.role !== "admin" && user.role !== "instructor") {
    return <Redirect to="/" />;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Badges Management</h1>
        <BadgesManagement />
      </div>
    </AdminLayout>
  );
}