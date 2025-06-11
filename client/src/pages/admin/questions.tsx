import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Assessment, Question, InsertQuestion } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Pencil, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Form validation schema
const questionFormSchema = z.object({
  questionText: z.string().min(5, {
    message: "Question content must be at least 5 characters.",
  }),
  questionType: z.enum(["mcq", "true_false"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  order: z.number().int().min(1).default(1),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function QuestionsManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get assessment ID from URL query params
  const params = new URLSearchParams(window.location.search);
  const assessmentId = parseInt(params.get("assessmentId") || "0");
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  
  // Fetch assessment details
  const { data: assessment } = useQuery<Assessment>({
    queryKey: ["/api/assessments", assessmentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments/${assessmentId}`);
      return await res.json();
    },
    enabled: assessmentId > 0,
  });
  
  // Fetch questions for this assessment
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/assessments", assessmentId, "questions"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments/${assessmentId}/questions`);
      return await res.json();
    },
    enabled: assessmentId > 0,
  });
  
  // Question form
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      questionType: "mcq",
      options: [],
      correctAnswer: "0",
      order: 1,
    },
  });
  
  const watchQuestionType = form.watch("questionType");
  
  useEffect(() => {
    if (editingQuestion) {
      const optionsArray = editingQuestion.options 
        ? (typeof editingQuestion.options === 'string' 
            ? JSON.parse(editingQuestion.options) 
            : editingQuestion.options) 
        : [];
        
      setOptions(optionsArray);
      
      // Convert True/False string values to "0" or "1" for the radio buttons
      let correctAnswerValue = editingQuestion.correctAnswer || "0";
      
      // For true/false questions, map "True" to "1" and "False" to "0"
      if (editingQuestion.questionType === "true_false") {
        if (editingQuestion.correctAnswer === "True") {
          correctAnswerValue = "1";
        } else if (editingQuestion.correctAnswer === "False") {
          correctAnswerValue = "0";
        }
        console.log("Setting True/False correctAnswer to:", correctAnswerValue);
      }
      
      form.reset({
        questionText: editingQuestion.questionText,
        questionType: editingQuestion.questionType as "mcq" | "true_false",
        options: optionsArray,
        correctAnswer: correctAnswerValue,
        order: editingQuestion.order,
      });
    } else {
      setOptions([]);
      form.reset({
        questionText: "",
        questionType: "mcq",
        options: [],
        correctAnswer: "0",
        order: questions ? questions.length + 1 : 1,
      });
    }
  }, [editingQuestion, form, questions]);
  
  // Create question mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question created successfully.",
      });
      form.reset();
      setOptions([]);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update question mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Question> }) => {
      const res = await apiRequest("PATCH", `/api/questions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully.",
      });
      setEditingQuestion(null);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete question mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete question: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: QuestionFormValues) => {
    if (values.questionType === "mcq" && options.length < 2) {
      toast({
        title: "Error",
        description: "Multiple choice questions need at least 2 options.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Form values before processing:", values);
    
    const optionsJson = values.questionType === "mcq" 
      ? JSON.stringify(options) 
      : JSON.stringify(["False", "True"]);
    
    // For true/false questions, convert "0" to "False" and "1" to "True"
    let correctAnswer;
    if (values.questionType === "mcq") {
      correctAnswer = values.correctAnswer;
    } else {
      // Handle true/false questions
      correctAnswer = values.correctAnswer === "1" ? "True" : "False";
      console.log("True/False question - converting value:", values.correctAnswer, "to:", correctAnswer);
    }
    
    const questionData = {
      assessmentId,
      questionText: values.questionText,
      questionType: values.questionType,
      options: optionsJson,
      correctAnswer: correctAnswer,
      order: values.order,
    };
    
    console.log("Submitting question data:", questionData);
    
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: questionData });
    } else {
      createMutation.mutate(questionData as InsertQuestion);
    }
  };
  
  // Add new option
  const handleAddOption = () => {
    if (newOption.trim() === "") return;
    
    setOptions([...options, newOption.trim()]);
    setNewOption("");
    setIsAddOptionOpen(false);
  };
  
  // Remove option
  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // If we're removing the correct option, reset correctAnswer
    const currentCorrectAnswer = form.getValues("correctAnswer");
    if (currentCorrectAnswer && currentCorrectAnswer === index.toString()) {
      form.setValue("correctAnswer", "0");
    } else if (currentCorrectAnswer && parseInt(currentCorrectAnswer) > index) {
      // If we're removing an option before the correct one, adjust the index
      form.setValue("correctAnswer", (parseInt(currentCorrectAnswer) - 1).toString());
    }
  };
  
  // Handle edit
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
  };
  
  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingQuestion(null);
    form.reset();
    setOptions([]);
  };
  
  // Go back to assessments
  const handleBack = () => {
    setLocation("/admin/assessments");
  };
  
  if (!assessmentId || assessmentId <= 0) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Assessment</h1>
            <p className="mb-4">No assessment ID specified.</p>
            <Button onClick={handleBack}>Go Back to Assessments</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-abu-charcoal">Questions Management</h1>
            {assessment && (
              <p className="text-muted-foreground">
                Assessment: {assessment.title}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</CardTitle>
              <CardDescription>
                {editingQuestion
                  ? "Update the selected question"
                  : "Create a new question for this assessment"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter question content"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="questionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset options if changing question type
                            if (value === "true_false") {
                              setOptions(["False", "True"]);
                            } else if (options.length < 2 || options.join() === "False,True") {
                              setOptions([]);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          The order in which this question appears in the assessment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchQuestionType === "mcq" && (
                    <>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Options</h3>
                        
                        {options.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {options.map((option, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <FormField
                                  control={form.control}
                                  name="correctAnswer"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <RadioGroup
                                          value={field.value}
                                          onValueChange={(value) => field.onChange(value)}
                                          className="flex"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="flex-1 border rounded p-2 text-sm">{option}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No options added yet</p>
                        )}
                        
                        <Dialog open={isAddOptionOpen} onOpenChange={setIsAddOptionOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Option</DialogTitle>
                              <DialogDescription>
                                Enter the text for the new answer option.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Enter option text"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddOptionOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddOption}>
                                Add
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {options.length > 0 && (
                        <FormField
                          control={form.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correct Answer</FormLabel>
                              <FormDescription>
                                Select the radio button next to the correct option above
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                  
                  {watchQuestionType === "true_false" && (
                    <FormField
                      control={form.control}
                      name="correctAnswer"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Correct Answer</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="0" id="false" />
                                <Label htmlFor="false">False</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="true" />
                                <Label htmlFor="true">True</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    {editingQuestion && (
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
                      {editingQuestion ? "Update Question" : "Create Question"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Questions List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                Questions
                {assessment && ` for ${assessment.title}`}
              </CardTitle>
              <CardDescription>
                {questions?.length 
                  ? `${questions.length} question(s) in this assessment` 
                  : "No questions yet - add your first one!"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingQuestions ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : questions && questions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Order</TableHead>
                      <TableHead>Question Text</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions
                      .sort((a, b) => a.order - b.order)
                      .map((question) => {
                        // Parse options for display
                        const optionsArray = question.options 
                          ? (typeof question.options === 'string' 
                              ? JSON.parse(question.options) 
                              : question.options) 
                          : [];
                          
                        return (
                          <TableRow key={question.id}>
                            <TableCell>{question.order}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {question.questionText}
                            </TableCell>
                            <TableCell>
                              {question.questionType === "mcq" 
                                ? "Multiple Choice" 
                                : "True/False"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {optionsArray.length > 0 
                                ? optionsArray.join(", ") 
                                : "No options"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(question)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(question.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-abu-charcoal/60">
                  No questions found. Create your first question!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}