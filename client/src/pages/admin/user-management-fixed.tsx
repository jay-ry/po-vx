import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import type { Course } from "@shared/schema";
import type { roles as RoleType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Filter, MoreVertical } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Redirect } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

// User edit form schema
const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
  language: z.string().min(1, "Language is required"),
});

// New user form schema
const newUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
  language: z.string().min(1, "Language is required"),
  courseIds: z.array(z.string()).optional(),
});

// Bulk user creation schema
const bulkUserSchema = z.object({
  defaultRole: z.string().min(1, "Role is required"),
  defaultLanguage: z.string().min(1, "Language is required"),
  users: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email is required"),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
    })
  ).min(1, "At least one user is required"),
  courseIds: z.array(z.string()).optional(),
});

type BulkUserData = z.infer<typeof bulkUserSchema>;
type UserEditFormValues = z.infer<typeof userEditSchema>;
type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UserManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Add New User Form
  const addUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "frontliner",
      language: "en",
      courseIds: [],
    }
  });
  
  // Bulk Add Users Form
  const bulkUserForm = useForm<BulkUserData>({
    resolver: zodResolver(bulkUserSchema),
    defaultValues: {
      defaultRole: "frontliner",
      defaultLanguage: "en",
      users: [{ name: "", email: "", username: "", password: "" }],
      courseIds: [],
    }
  });
  
  // Setup field array for bulk user creation
  const { fields: userFields, append: appendUser, remove: removeUser } = useFieldArray({
    name: "users",
    control: bulkUserForm.control,
  });
  
  // Function to add a new user field in bulk creation
  const addUserField = () => {
    appendUser({ name: "", email: "", username: "", password: "" });
  };
  
  // Function to remove a user field
  const removeUserField = (index: number) => {
    removeUser(index);
  };
  
  // Handle bulk user submission
  const onBulkAddSubmit = (data: BulkUserData) => {
    createBulkUsersMutation.mutate(data);
  };
  
  // Handle single user submission
  const onAddUserSubmit = (data: NewUserFormValues) => {
    createUserMutation.mutate(data);
  };

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch courses for assigning to users
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  // Fetch available roles
  const { data: roles } = useQuery<typeof RoleType.$inferSelect[]>({
    queryKey: ["/api/roles"],
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: number }) => {
      const { id, ...data } = userData;
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUserFormValues) => {
      const res = await apiRequest("POST", `/api/admin/users`, userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "New user has been created successfully",
      });
      setIsAddDialogOpen(false);
      addUserForm.reset({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "frontliner",
        language: "en",
        courseIds: [],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create bulk users mutation
  const createBulkUsersMutation = useMutation({
    mutationFn: async (usersData: BulkUserData) => {
      const res = await apiRequest("POST", `/api/admin/users/bulk`, usersData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Users created in bulk",
        description: `${data.created || 0} users were created successfully`,
      });
      setIsBulkAddDialogOpen(false);
      bulkUserForm.reset({
        defaultRole: "frontliner",
        defaultLanguage: "en",
        users: [{ name: "", email: "", username: "", password: "" }],
        courseIds: [],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit user form
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: selectedUser?.name || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role || "frontliner",
      language: selectedUser?.language || "en",
    },
  });

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language || "en",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: UserEditFormValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        ...data,
      });
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users 
    ? users.filter(user => {
        const matchesSearch = 
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
      })
    : [];

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
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
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h1 className="font-heading text-2xl font-semibold text-neutrals-800 mb-4 md:mb-0">User Management</h1>
              
              <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-8 w-full md:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex-shrink-0">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Administrators</SelectItem>
                      <SelectItem value="supervisor">Supervisors</SelectItem>
                      <SelectItem value="content_creator">Content Creators</SelectItem>
                      <SelectItem value="frontliner">Frontliners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <span className="material-icons mr-2">add</span>
                    Add User
                  </Button>
                  <Button variant="outline" onClick={() => setIsBulkAddDialogOpen(true)}>
                    <span className="material-icons mr-2">group_add</span>
                    Bulk Add Users
                  </Button>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="rounded-md border">
                <div className="p-4">
                  <Skeleton className="h-8 w-full mb-4" />
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>XP Points</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold mr-2">
                                {user.name.charAt(0)}
                              </div>
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-primary bg-opacity-10 text-white' :
                              user.role === 'supervisor' ? 'bg-accent bg-opacity-10 text-white' :
                              user.role === 'content_creator' ? 'bg-secondary bg-opacity-10 text-white' :
                              'bg-neutrals-200 text-neutrals-700'
                            }`}>
                              {user.role === 'admin' ? 'Admin' :
                               user.role === 'supervisor' ? 'Supervisor' :
                               user.role === 'content_creator' ? 'Content Creator' :
                               'Frontliner'}
                            </span>
                          </TableCell>
                          <TableCell>{user.xpPoints.toLocaleString()}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                  <span className="material-icons text-sm mr-2">edit</span>
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <span className="material-icons text-sm mr-2">visibility</span>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-danger">
                                  <span className="material-icons text-sm mr-2">delete</span>
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles && roles.length > 0 ? (
                          roles.map(role => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name.charAt(0).toUpperCase() + role.name.slice(1).replace('_', ' ')}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="content_creator">Content Creator</SelectItem>
                            <SelectItem value="frontliner">Frontliner</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="ur">Urdu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign courses. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUserForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles && roles.length > 0 ? (
                            roles.map(role => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name.charAt(0).toUpperCase() + role.name.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="admin">Administrator</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addUserForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Course Assignment - only show if courses are available */}
              {courses && courses.length > 0 && (
                <FormField
                  control={addUserForm.control}
                  name="courseIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Assign Courses (Optional)</FormLabel>
                        <FormDescription>
                          Select courses that this user will have access to
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {courses.map((course) => (
                          <FormField
                            key={course.id}
                            control={addUserForm.control}
                            name="courseIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={course.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(course.id.toString())}
                                      onCheckedChange={(checked) => {
                                        const courseId = course.id.toString();
                                        return checked
                                          ? field.onChange([...(field.value || []), courseId])
                                          : field.onChange(
                                              field.value?.filter((id) => id !== courseId) || []
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                      {course.name}
                                    </FormLabel>
                                    {course.description && (
                                      <FormDescription className="text-xs">
                                        {course.description.substring(0, 80)}{course.description.length > 80 ? "..." : ""}
                                      </FormDescription>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Users Dialog */}
      <Dialog open={isBulkAddDialogOpen} onOpenChange={setIsBulkAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Bulk Add Users</DialogTitle>
            <DialogDescription>
              Add multiple users at once. Each user requires a name, email, and username.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bulkUserForm}>
            <form onSubmit={bulkUserForm.handleSubmit(onBulkAddSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Default Role */}
                <FormField
                  control={bulkUserForm.control}
                  name="defaultRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles?.map(role => (
                            <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Default Language */}
                <FormField
                  control={bulkUserForm.control}
                  name="defaultLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Course Assignment - only show if courses are available */}
              {courses && courses.length > 0 && (
                <FormField
                  control={bulkUserForm.control}
                  name="courseIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Assign Courses (Optional)</FormLabel>
                        <FormDescription>
                          Select courses to assign to all new users
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`bulk-course-${course.id}`}
                              checked={field.value?.includes(course.id.toString())}
                              onCheckedChange={(checked) => {
                                const courseId = course.id.toString();
                                return checked
                                  ? field.onChange([...(field.value || []), courseId])
                                  : field.onChange(
                                      field.value?.filter((id) => id !== courseId) || []
                                    );
                              }}
                            />
                            <label
                              htmlFor={`bulk-course-${course.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {course.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Users List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Users</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addUserField}
                  >
                    <span className="material-icons mr-1 text-sm">add</span>
                    Add Another User
                  </Button>
                </div>
                
                {userFields.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-4 relative">
                    <div className="absolute right-2 top-2">
                      {index > 0 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeUserField(index)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="material-icons text-red-500">close</span>
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <FormField
                        control={bulkUserForm.control}
                        name={`users.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Email */}
                      <FormField
                        control={bulkUserForm.control}
                        name={`users.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Username */}
                      <FormField
                        control={bulkUserForm.control}
                        name={`users.${index}.username`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Password */}
                      <FormField
                        control={bulkUserForm.control}
                        name={`users.${index}.password`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Leave blank for auto-generated"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Enter Password
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBulkAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBulkUsersMutation.isPending}>
                  {createBulkUsersMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Users
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}