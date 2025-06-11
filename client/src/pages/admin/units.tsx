import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Course, Unit, InsertUnit } from "@shared/schema";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Plus, Trash, FileText, School, ChevronRight } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Form validation schema
const unitFormSchema = z.object({
  name: z.string().min(2, {
    message: "Unit name must be at least 2 characters.",
  }),
  courseId: z.coerce.number({
    required_error: "Please select a course.",
  }),
  description: z.string().optional(),
  order: z.coerce.number().default(1),
  duration: z.coerce.number().min(1).default(30),
  xpPoints: z.coerce.number().min(0).default(100),
});

export default function UnitsManagement() {
  const [location, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Get courseId from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("courseId");
    if (courseId) {
      setSelectedCourseId(parseInt(courseId));
    }
  }, []);
  
  // Fetch courses for dropdown
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/courses");
      return await res.json();
    },
  });
  
  // Fetch units for the selected course
  const { data: units, isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/units", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const res = await apiRequest("GET", `/api/units?courseId=${selectedCourseId}`);
      return await res.json();
    },
    enabled: !!selectedCourseId,
  });

  // Form setup
  const form = useForm<InsertUnit>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: "",
      description: "",
      courseId: selectedCourseId || undefined,
      order: 1,
      duration: 30,
      xpPoints: 100,
    },
  });

  // Reset form when editing a unit
  useEffect(() => {
    if (editingUnit) {
      form.reset({
        name: editingUnit.name,
        courseId: editingUnit.courseId,
        description: editingUnit.description || "",
        order: editingUnit.order,
        duration: editingUnit.duration,
        xpPoints: editingUnit.xpPoints,
      });
    }
  }, [editingUnit, form]);
  
  // Update form when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      form.setValue('courseId', selectedCourseId);
    }
  }, [selectedCourseId, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertUnit) => {
      const res = await apiRequest("POST", "/api/units", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Unit created successfully.",
      });
      form.reset({
        name: "",
        description: "",
        order: 1,
        duration: 30,
        xpPoints: 100,
      });
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedCourseId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; unit: Partial<Unit> }) => {
      const res = await apiRequest("PATCH", `/api/units/${data.id}`, data.unit);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Unit updated successfully.",
      });
      setEditingUnit(null);
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedCourseId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/units/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Unit deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedCourseId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: InsertUnit) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, unit: data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Function to handle editing a unit
  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsEditModalOpen(true);
  };

  // Function to handle deleting a unit
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      deleteMutation.mutate(id);
    }
  };

  // Function to find course name by ID
  const getCourseName = (courseId: number) => {
    const course = courses?.find((c) => c.id === courseId);
    return course ? course.name : `Course ${courseId}`;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-abu-charcoal">Units Management</h1>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
            disabled={!selectedCourseId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Course</CardTitle>
              <CardDescription>
                Choose a course to view and manage its units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Select
                      value={selectedCourseId?.toString() || ""}
                      onValueChange={(value) => setSelectedCourseId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {coursesLoading ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation("/admin/course-management")}
                    >
                      Manage Courses
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedCourseId && (
          <Card>
            <CardHeader>
              <CardTitle>Units for {getCourseName(selectedCourseId)}</CardTitle>
              <CardDescription>
                Manage learning units for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : units && units.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>XP Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.order}</TableCell>
                        <TableCell>
                          <div className="font-medium">{unit.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {unit.description && unit.description.substring(0, 60)}
                            {unit.description && unit.description.length > 60 ? "..." : ""}
                          </div>
                        </TableCell>
                        <TableCell>{unit.duration} min</TableCell>
                        <TableCell>{unit.xpPoints} XP</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/admin/learning-blocks?unitId=${unit.id}`)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Blocks
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/admin/assessments?unitId=${unit.id}`)}
                            >
                              <School className="h-4 w-4 mr-1" />
                              Assessments
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(unit.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No units found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first unit for this course to get started
                  </p>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Unit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Unit Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Create a learning unit for {selectedCourseId ? getCourseName(selectedCourseId) : "a course"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Introduction to Emirati Culture" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={selectedCourseId?.toString()}
                      value={selectedCourseId?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coursesLoading ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name}
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
                        placeholder="Enter a description for this unit"
                        className="min-h-[120px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>Order in the course</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>Estimated time to complete</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="xpPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>XP Points</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Points awarded on completion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Unit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>
              Update unit information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Introduction to Emirati Culture" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coursesLoading ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.name}
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
                        placeholder="Enter a description for this unit"
                        className="min-h-[120px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="xpPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>XP Points</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Unit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}