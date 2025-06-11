import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Assessment, InsertAssessment, Unit, Question } from "@shared/schema";
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
import { Loader2, Pencil, Plus, Trash, Timer, Award, List } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Form validation schema
const assessmentFormSchema = z.object({
  title: z.string().min(2, {
    message: "Assessment title must be at least 2 characters.",
  }),
  unitId: z.coerce.number({
    required_error: "Please select a unit.",
  }),
  description: z.string().optional().nullable(),
  passingScore: z.coerce.number().min(0).max(100).default(70),
  timeLimit: z.coerce.number().min(0).default(30),
  xpPoints: z.coerce.number().min(0).default(50),
});

export default function AssessmentsManagement() {
  const { toast } = useToast();
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  
  // Fetch units for dropdown with cache invalidation to ensure we get the latest data
  const { data: units, isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/units");
      return await res.json();
    },
    // Add a short staleTime to ensure we get fresh data when the page loads
    staleTime: 0,
    // Force a refetch when the page is focused to get the latest unit names
    refetchOnWindowFocus: true,
  });
  
  // Set the first unit as selected by default if none is selected
  useEffect(() => {
    if (units && units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [units, selectedUnitId]);

  // Fetch assessments for the selected unit
  const { data: assessments, isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/units", selectedUnitId, "assessments"],
    queryFn: async () => {
      if (!selectedUnitId) return [];
      const res = await apiRequest("GET", `/api/units/${selectedUnitId}/assessments`);
      return await res.json();
    },
    enabled: !!selectedUnitId,
  });

  // Form setup
  const form = useForm<InsertAssessment>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      passingScore: 70,
      timeLimit: 30,
      xpPoints: 50,
    },
  });

  // Update form when editing an existing assessment
  useEffect(() => {
    if (editingAssessment) {
      form.reset({
        title: editingAssessment.title,
        unitId: editingAssessment.unitId,
        description: editingAssessment.description,
        passingScore: editingAssessment.passingScore,
        timeLimit: editingAssessment.timeLimit,
        xpPoints: editingAssessment.xpPoints,
      });
      // Make sure the selected unit matches the assessment's unit
      setSelectedUnitId(editingAssessment.unitId);
    }
  }, [editingAssessment, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertAssessment) => {
      const res = await apiRequest("POST", "/api/assessments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment created successfully.",
      });
      form.reset({
        title: "",
        description: "",
        passingScore: 70,
        timeLimit: 30,
        xpPoints: 50,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "assessments"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; assessment: Partial<Assessment> }) => {
      const res = await apiRequest("PATCH", `/api/assessments/${data.id}`, data.assessment);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment updated successfully.",
      });
      setEditingAssessment(null);
      form.reset({
        title: "",
        description: "",
        passingScore: 70,
        timeLimit: 30,
        xpPoints: 50,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "assessments"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/assessments/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assessment deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "assessments"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: InsertAssessment) => {
    if (editingAssessment) {
      updateMutation.mutate({ id: editingAssessment.id, assessment: data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Function to handle editing an assessment
  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
  };

  // Function to handle deleting an assessment
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Function to handle canceling edit
  const handleCancelEdit = () => {
    setEditingAssessment(null);
    form.reset({
      title: "",
      description: "",
      passingScore: 70,
      timeLimit: 30,
      xpPoints: 50,
    });
  };

  // Function to find unit name by ID
  const getUnitName = (unitId: number) => {
    const unit = units?.find((u) => u.id === unitId);
    return unit ? unit.name : `Unit ${unitId}`;
  };

  // Function to navigate to questions management
  const navigateToQuestions = (assessmentId: number) => {
    window.location.href = `/admin/questions?assessmentId=${assessmentId}`;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-abu-charcoal">Assessments Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessment Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingAssessment ? "Edit Assessment" : "Add New Assessment"}</CardTitle>
              <CardDescription>
                {editingAssessment
                  ? "Update assessment information"
                  : "Create assessments for units"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Final Quiz: Culture of Abu Dhabi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Also update the selected unit for filtering
                            if (!editingAssessment) {
                              setSelectedUnitId(parseInt(value));
                            }
                          }}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitsLoading ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              units?.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                  {unit.name}
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
                            placeholder="Provide a brief description of the assessment..."
                            className="min-h-[100px]"
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
                      name="passingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Score (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (min)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="flex justify-end space-x-2 pt-4">
                    {editingAssessment && (
                      <Button variant="outline" onClick={handleCancelEdit} type="button">
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingAssessment ? "Update Assessment" : "Create Assessment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Assessments List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                {selectedUnitId
                  ? `Assessments for ${getUnitName(selectedUnitId)}`
                  : "Select a unit to view its assessments"}
              </CardDescription>
              {!selectedUnitId && (
                <div className="mt-2">
                  <Select onValueChange={(value) => setSelectedUnitId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitsLoading ? (
                        <div className="flex justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-abu-primary" />
                </div>
              ) : assessments && assessments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Passing Score</TableHead>
                      <TableHead>Time Limit</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>{assessment.title}</TableCell>
                        <TableCell>{assessment.passingScore}%</TableCell>
                        <TableCell>{assessment.timeLimit} min</TableCell>
                        <TableCell>{assessment.xpPoints}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateToQuestions(assessment.id)}
                              title="Manage Questions"
                            >
                              <List className="h-4 w-4" />
                              <span className="sr-only">Questions</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(assessment)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(assessment.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash className="h-4 w-4 text-abu-primary" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-abu-charcoal/60">
                  {selectedUnitId
                    ? "No assessments found. Create your first assessment!"
                    : "Select a unit to view its assessments"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}