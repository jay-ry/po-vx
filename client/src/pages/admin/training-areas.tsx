import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TrainingArea, InsertTrainingArea } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Form validation schema
const trainingAreaFormSchema = z.object({
  name: z.string().min(2, {
    message: "Area name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
});

export default function TrainingAreaManagement() {
  const { toast } = useToast();
  const [editingArea, setEditingArea] = useState<TrainingArea | null>(null);

  // Fetch existing training areas
  const { data: trainingAreas, isLoading } = useQuery<TrainingArea[]>({
    queryKey: ["/api/training-areas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/training-areas");
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<InsertTrainingArea>({
    resolver: zodResolver(trainingAreaFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  // Create training area mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertTrainingArea) => {
      const res = await apiRequest("POST", "/api/training-areas", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Training area created",
        description: "The training area has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/training-areas"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating training area",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update training area mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TrainingArea> }) => {
      const res = await apiRequest("PATCH", `/api/training-areas/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Training area updated",
        description: "The training area has been updated successfully.",
      });
      setEditingArea(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/training-areas"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating training area",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete training area mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/training-areas/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Training area deleted",
        description: "The training area has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training-areas"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting training area",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: InsertTrainingArea) {
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  // Set form values when editing
  function handleEdit(area: TrainingArea) {
    setEditingArea(area);
    form.reset({
      name: area.name,
      description: area.description || "",
      imageUrl: area.imageUrl,
    });
  }

  function handleCancel() {
    setEditingArea(null);
    form.reset();
  }

  const isSubmitting = form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-abu-charcoal">Training Area Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Area Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingArea ? "Edit Training Area" : "Add New Training Area"}</CardTitle>
              <CardDescription>
                {editingArea
                  ? "Update the training area information"
                  : "Create a new training area for the VX Academy"}
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
                        <FormLabel>Area Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Abu Dhabi Information" {...field} />
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
                            placeholder="Training area description..."
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
                    {editingArea && (
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
                      {editingArea ? "Update Training Area" : "Create Training Area"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Training Area List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Existing Training Areas</CardTitle>
              <CardDescription>Manage your existing training areas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : trainingAreas && trainingAreas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainingAreas.map((area) => (
                        <TableRow key={area.id}>
                          <TableCell className="font-medium">{area.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {area.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(area)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this training area? This will also affect any associated modules.")) {
                                    deleteMutation.mutate(area.id);
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
                  <p className="text-muted-foreground">No training areas found. Create your first training area to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}