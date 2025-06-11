import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Book, CheckCircle, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Redirect } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  name: string;
  description: string;
  moduleId: number;
  imageUrl: string | null;
  duration: number;
  level: string;
  createdAt: string;
}

interface MandatoryCourse {
  id: number;
  roleId: number;
  courseId: number;
  course?: Course;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, any>;
  createdAt: string;
}

export default function RolesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mandatoryCoursesDialogOpen, setMandatoryCoursesDialogOpen] = useState(false);
  const [selectedRoleForCourses, setSelectedRoleForCourses] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {}
  });
  
  const systemRoles = ["admin", "supervisor", "content_creator", "frontliner"];

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: () => fetch("/api/roles").then(res => res.json()),
  });
  
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: () => fetch("/api/courses").then(res => res.json()),
  });
  
  const { data: mandatoryCourses, isLoading: isLoadingMandatoryCourses } = useQuery<MandatoryCourse[]>({
    queryKey: ["/api/admin/roles", selectedRoleForCourses?.id, "mandatory-courses"],
    queryFn: () => {
      if (!selectedRoleForCourses) return Promise.resolve([]);
      return fetch(`/api/admin/roles/${selectedRoleForCourses.id}/mandatory-courses`).then(res => res.json());
    },
    enabled: !!selectedRoleForCourses,
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/roles", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create role");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Role created successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number, roleData: Partial<typeof formData> }) => {
      const res = await apiRequest("PATCH", `/api/admin/roles/${data.id}`, data.roleData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update role");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/roles/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete role");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Role deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting role",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const addMandatoryCourseMutation = useMutation({
    mutationFn: async ({ roleId, courseId }: { roleId: number, courseId: number }) => {
      const res = await apiRequest("POST", `/api/admin/roles/${roleId}/mandatory-courses`, { courseId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add mandatory course");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course added successfully",
        description: "The course has been added to the mandatory list for this role.",
        variant: "default",
      });
      if (selectedRoleForCourses) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/admin/roles", selectedRoleForCourses.id, "mandatory-courses"] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding mandatory course",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const removeMandatoryCourseMutation = useMutation({
    mutationFn: async ({ roleId, courseId }: { roleId: number, courseId: number }) => {
      const res = await apiRequest("DELETE", `/api/admin/roles/${roleId}/mandatory-courses/${courseId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove mandatory course");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Course removed successfully",
        description: "The course has been removed from the mandatory list for this role.",
        variant: "default",
      });
      if (selectedRoleForCourses) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/admin/roles", selectedRoleForCourses.id, "mandatory-courses"] 
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing mandatory course",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        roleData: formData
      });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const openDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions || {}
      });
    } else {
      setEditingRole(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: {}
    });
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: number) => {
    if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      deleteRoleMutation.mutate(roleId);
    }
  };
  
  const openMandatoryCoursesDialog = (role: Role) => {
    setSelectedRoleForCourses(role);
    setMandatoryCoursesDialogOpen(true);
  };
  
  const handleAddMandatoryCourse = (courseId: number) => {
    if (!selectedRoleForCourses) return;
    
    addMandatoryCourseMutation.mutate({
      roleId: selectedRoleForCourses.id,
      courseId
    });
  };
  
  const handleRemoveMandatoryCourse = (courseId: number) => {
    if (!selectedRoleForCourses) return;
    
    removeMandatoryCourseMutation.mutate({
      roleId: selectedRoleForCourses.id,
      courseId
    });
  };

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  // Loading state
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Role Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage roles in the system
            </p>
          </div>
          <Button onClick={() => openDialog()}>
            Create New Role
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(roles) && roles.map((role) => (
            <Card key={role.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle>{role.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {systemRoles.includes(role.name) ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      System Role
                    </span>
                  ) : (
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                      Custom Role
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {role.description}
                </p>
                
                <div className="space-y-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openMandatoryCoursesDialog(role)}
                  >
                    <Book className="h-4 w-4 mr-2" />
                    Mandatory Courses
                  </Button>
                  
                  {!systemRoles.includes(role.name) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openDialog(role)}
                    >
                      Edit Role
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!Array.isArray(roles) || roles.length === 0) && (
          <Alert className="mt-6">
            <AlertTitle>No custom roles found</AlertTitle>
            <AlertDescription>
              Click the "Create New Role" button to add a new role to the system.
            </AlertDescription>
          </Alert>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Role"}
              </DialogTitle>
              <DialogDescription>
                {editingRole 
                  ? "Update the details for this role" 
                  : "Add a new role to the system with specific permissions"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Manager, Trainer"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the role's responsibilities and access level"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                >
                  {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingRole ? "Save Changes" : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={mandatoryCoursesDialogOpen} onOpenChange={setMandatoryCoursesDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Mandatory Courses for {selectedRoleForCourses?.name}
              </DialogTitle>
              <DialogDescription>
                Assign courses that are mandatory for users with this role. These courses will appear in users' dashboards as required learning.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {isLoadingMandatoryCourses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {Array.isArray(mandatoryCourses) && mandatoryCourses.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Current Mandatory Courses</h3>
                      <div className="grid gap-2">
                        {mandatoryCourses.map((mandatoryCourse) => {
                          return (
                            <div 
                              key={mandatoryCourse.id || `${mandatoryCourse.courseId}`} 
                              className="flex items-center justify-between p-3 bg-secondary/10 rounded-md"
                            >
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <p className="font-medium">{mandatoryCourse.name || `Course #${mandatoryCourse.courseId}`}</p>
                                  <p className="text-sm text-muted-foreground">{mandatoryCourse.description || 'No description available'}</p>
                                  {mandatoryCourse.level && mandatoryCourse.duration && (
                                    <div className="flex mt-1 space-x-2">
                                      <Badge variant="outline">{mandatoryCourse.level}</Badge>
                                      <Badge variant="outline">{mandatoryCourse.duration} minutes</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMandatoryCourse(mandatoryCourse.courseId)}
                                disabled={removeMandatoryCourseMutation.isPending}
                              >
                                {removeMandatoryCourseMutation.isPending && mandatoryCourse.courseId === removeMandatoryCourseMutation.variables?.courseId && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <Alert className="mb-4">
                      <AlertTitle>No mandatory courses assigned</AlertTitle>
                      <AlertDescription>
                        This role doesn't have any mandatory courses assigned yet. Add courses from the list below.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Available Courses</h3>
                    
                    {!Array.isArray(courses) || courses.length === 0 ? (
                      <Alert>
                        <AlertTitle>No courses available</AlertTitle>
                        <AlertDescription>
                          There are no courses in the system yet. Create courses first to assign them as mandatory.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-2">
                        {courses
                          .filter(course => {
                            // Only show courses that are not already mandatory
                            return !mandatoryCourses?.some(mc => mc.courseId === course.id);
                          })
                          .map(course => (
                            <div 
                              key={course.id} 
                              className="flex items-center justify-between p-3 bg-accent/5 rounded-md"
                            >
                              <div className="flex items-center">
                                <Book className="h-5 w-5 text-muted-foreground mr-2" />
                                <div>
                                  <p className="font-medium">{course.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {course.description?.substring(0, 100) || 'No description available'}
                                    {course.description && course.description.length > 100 ? '...' : ''}
                                  </p>
                                  <div className="flex mt-1 space-x-2">
                                    <Badge variant="outline">{course.level || 'No level'}</Badge>
                                    <Badge variant="outline">{course.duration} minutes</Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddMandatoryCourse(course.id)}
                                disabled={addMandatoryCourseMutation.isPending}
                              >
                                {addMandatoryCourseMutation.isPending && course.id === addMandatoryCourseMutation.variables?.courseId && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setMandatoryCoursesDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}