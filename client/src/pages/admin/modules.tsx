import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Module, InsertModule, TrainingArea } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Form validation schema
const moduleFormSchema = z.object({
  name: z.string().min(2, {
    message: "Module name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  trainingAreaId: z.coerce.number({
    required_error: "Please select a training area.",
  }),
});

export default function ModuleManagement() {
  const { toast } = useToast();
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Fetch existing modules
  const { data: modules, isLoading: isLoadingModules } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/modules");
      return await res.json();
    },
  });

  // Fetch training areas for dropdown
  const { data: trainingAreas, isLoading: isLoadingAreas } = useQuery<TrainingArea[]>({
    queryKey: ["/api/training-areas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/training-areas");
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<InsertModule>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      trainingAreaId: undefined,
    },
  });

  // Create module mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertModule) => {
      const res = await apiRequest("POST", "/api/modules", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module created",
        description: "The module has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update module mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Module> }) => {
      const res = await apiRequest("PATCH", `/api/modules/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module updated",
        description: "The module has been updated successfully.",
      });
      setEditingModule(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete module mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/modules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Module deleted",
        description: "The module has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: InsertModule) {
    if (editingModule) {
      updateMutation.mutate({ id: editingModule.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  // Set form values when editing
  function handleEdit(module: Module) {
    setEditingModule(module);
    form.reset({
      name: module.name,
      description: module.description || "",
      imageUrl: module.imageUrl,
      trainingAreaId: module.trainingAreaId,
    });
  }

  function handleCancel() {
    setEditingModule(null);
    form.reset();
  }

  const isSubmitting = form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending;
  const isLoading = isLoadingModules || isLoadingAreas;

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-abu-charcoal">Module Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingModule ? "Edit Module" : "Add New Module"}</CardTitle>
              <CardDescription>
                {editingModule
                  ? "Update the module information"
                  : "Create a new module for a training area"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="trainingAreaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Area</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={(value) => {
                            // Ensure we're converting the string value to a number
                            const numericValue = parseInt(value, 10);
                            if (!isNaN(numericValue)) {
                              field.onChange(numericValue);
                            }
                          }}
                          defaultValue={field.value ? field.value.toString() : undefined}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a training area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {trainingAreas?.map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Customer Service Fundamentals" {...field} />
                        </FormControl>
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
                            placeholder="Module description..."
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

                  <div className="flex justify-end space-x-2 pt-4">
                    {editingModule && (
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
                      disabled={isSubmitting || isLoading}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingModule ? "Update Module" : "Create Module"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Module List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Existing Modules</CardTitle>
              <CardDescription>Manage your existing training modules</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : modules && modules.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Training Area</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell>
                            {trainingAreas?.find(area => area.id === module.trainingAreaId)?.name || 
                            `Area ${module.trainingAreaId}`}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {module.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(module)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this module? This will also affect any associated courses.")) {
                                    deleteMutation.mutate(module.id);
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
                  <p className="text-muted-foreground">No modules found. Create your first module to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}