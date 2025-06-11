import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Course, InsertCourse, Module } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Form validation schema
const courseFormSchema = z.object({
  name: z.string().min(2, {
    message: "Course name must be at least 2 characters.",
  }),
  moduleId: z.coerce.number({
    required_error: "Please select a module.",
  }),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  duration: z.coerce.number({
    required_error: "Please specify the duration in hours.",
    invalid_type_error: "Duration must be a number.",
  }),
  level: z.string({
    required_error: "Please select a difficulty level.",
  }),
});

export default function CourseManagement() {
  const { toast } = useToast();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Fetch modules for dropdown
  const { data: modules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/modules");
      return await res.json();
    },
  });

  // Fetch existing courses
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/courses");
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<InsertCourse>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      duration: 0,
      level: "beginner",
    },
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      const res = await apiRequest("POST", "/api/courses", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course created",
        description: "The course has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Course> }) => {
      const res = await apiRequest("PATCH", `/api/courses/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course updated",
        description: "The course has been updated successfully.",
      });
      setEditingCourse(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: InsertCourse) {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  // Set form values when editing
  function handleEdit(course: Course) {
    setEditingCourse(course);
    form.reset({
      name: course.name,
      moduleId: course.moduleId,
      description: course.description || "",
      imageUrl: course.imageUrl,
      duration: course.duration,
      level: course.level,
    });
  }

  function handleCancel() {
    setEditingCourse(null);
    form.reset();
  }

  const isSubmitting = form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending;
  const isLoading = modulesLoading || coursesLoading;

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-abu-charcoal">Course Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingCourse ? "Edit Course" : "Add New Course"}</CardTitle>
              <CardDescription>
                {editingCourse
                  ? "Update the course information"
                  : "Create a new course for the VX Academy"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Cultural Heritage of Abu Dhabi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moduleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modulesLoading ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                              </div>
                            ) : (
                              modules?.map((module) => (
                                <SelectItem
                                  key={module.id}
                                  value={module.id.toString()}
                                >
                                  {module.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Course description..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    {editingCourse && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingCourse ? "Update Course" : "Create Course"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Course List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Existing Courses</CardTitle>
              <CardDescription>Manage your existing courses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-abu-primary" />
                </div>
              ) : courses && courses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>
                            {modules?.find((m) => m.id === course.moduleId)?.name || course.moduleId}
                          </TableCell>
                          <TableCell className="capitalize">{course.level}</TableCell>
                          <TableCell>{course.duration} hours</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(course)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this course?")) {
                                    deleteMutation.mutate(course.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4 text-abu-primary" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No courses found. Create your first course to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}