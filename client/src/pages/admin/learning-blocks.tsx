import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LearningBlock, InsertLearningBlock, Unit } from "@shared/schema";
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
import { Loader2, Pencil, Plus, Trash, Video, FileText, FileCode, Package, Upload, Image as ImageIcon } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

// Form validation schema
const blockFormSchema = z.object({
  title: z.string().min(2, {
    message: "Block title must be at least 2 characters.",
  }),
  unitId: z.coerce.number({
    required_error: "Please select a unit.",
  }),
  type: z.string({
    required_error: "Please select a content type.",
  }),
  order: z.coerce.number().default(1),
  xpPoints: z.coerce.number().min(0).default(10),
  content: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  interactiveData: z.any().optional(),
  scormPackageId: z.coerce.number().optional().nullable(),
});

export default function LearningBlocksManagement() {
  const { toast } = useToast();
  const [editingBlock, setEditingBlock] = useState<LearningBlock | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  
  // Fetch units for dropdown
  const { data: units, isLoading: unitsLoading } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/units");
      return await res.json();
    },
  });
  
  // Set the first unit as selected by default if none is selected
  useEffect(() => {
    if (units && units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
    }
  }, [units, selectedUnitId]);

  // Fetch learning blocks for the selected unit
  const { data: blocks, isLoading: blocksLoading } = useQuery<LearningBlock[]>({
    queryKey: ["/api/units", selectedUnitId, "blocks"],
    queryFn: async () => {
      if (!selectedUnitId) return [];
      const res = await apiRequest("GET", `/api/units/${selectedUnitId}/blocks`);
      return await res.json();
    },
    enabled: !!selectedUnitId,
  });

  // Fetch SCORM packages for dropdown selection
  const { data: scormPackages, isLoading: scormPackagesLoading } = useQuery({
    queryKey: ["/api/scorm-packages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scorm-packages");
      return await res.json();
    },
  });

  // Form setup
  const form = useForm<InsertLearningBlock>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      title: "",
      type: "text",
      order: 1,
      xpPoints: 10,
      content: "",
      videoUrl: "",
      imageUrl: "",
      interactiveData: null,
    },
  });

  // Reset form when editing a block
  useEffect(() => {
    if (editingBlock) {
      form.reset({
        title: editingBlock.title,
        unitId: editingBlock.unitId,
        type: editingBlock.type,
        order: editingBlock.order,
        xpPoints: editingBlock.xpPoints,
        content: editingBlock.content,
        videoUrl: editingBlock.videoUrl,
        imageUrl: editingBlock.imageUrl,
        interactiveData: editingBlock.interactiveData as any,
      });
      setSelectedUnitId(editingBlock.unitId);
    }
  }, [editingBlock, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertLearningBlock) => {
      const res = await apiRequest("POST", "/api/learning-blocks", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning block created successfully.",
      });
      form.reset({
        title: "",
        type: "text",
        order: 1,
        xpPoints: 10,
        content: "",
        videoUrl: "",
        imageUrl: "",
        interactiveData: null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "blocks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create learning block. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; block: Partial<LearningBlock> }) => {
      const res = await apiRequest("PATCH", `/api/learning-blocks/${data.id}`, data.block);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning block updated successfully.",
      });
      setEditingBlock(null);
      form.reset({
        title: "",
        type: "text",
        order: 1,
        xpPoints: 10,
        content: "",
        videoUrl: "",
        imageUrl: "",
        interactiveData: null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "blocks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update learning block. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/learning-blocks/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning block deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedUnitId, "blocks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete learning block. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Image upload handler
  const handleImageUpload = async () => {
    if (!imageFileRef.current?.files?.[0]) {
      toast({
        title: "No image selected",
        description: "Please select an image file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append("imageFile", imageFileRef.current.files[0]);

      // Use apiRequest utility to handle authentication
      const response = await apiRequest("POST", "/api/images/upload", formData, null, null, true);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Set the image URL in the form
      form.setValue("imageUrl", result.imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "The image was uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  // Form submission handler
  const onSubmit = (data: InsertLearningBlock) => {
    // Create a copy of the data to manipulate
    const submissionData = { ...data };
    
    // Process interactive data if present
    if (data.type === "interactive" && data.interactiveData) {
      try {
        // If interactiveData is a string, parse it into a JSON object
        if (typeof data.interactiveData === 'string') {
          submissionData.interactiveData = JSON.parse(data.interactiveData);
        }
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "The interactive data is not valid JSON. Please check your syntax.",
          variant: "destructive",
        });
        return; // Exit early if invalid JSON
      }
    }
    
    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, block: submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  };

  // Function to handle editing a block
  const handleEdit = (block: LearningBlock) => {
    setEditingBlock(block);
  };

  // Function to handle deleting a block
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this learning block?")) {
      deleteMutation.mutate(id);
    }
  };

  // Function to handle canceling edit
  const handleCancelEdit = () => {
    setEditingBlock(null);
    form.reset({
      title: "",
      type: "text",
      order: 1,
      xpPoints: 10,
      content: "",
      videoUrl: "",
      imageUrl: "",
      interactiveData: null,
    });
  };

  // Function to find unit name by ID
  const getUnitName = (unitId: number) => {
    const unit = units?.find((u) => u.id === unitId);
    return unit ? unit.name : `Unit ${unitId}`;
  };

  // Get icon for block type
  const getBlockTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "interactive":
        return <FileCode className="h-4 w-4" />;
      case "scorm":
        return <Package className="h-4 w-4" />;
      case "text":
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-abu-charcoal">Learning Blocks Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Block Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{editingBlock ? "Edit Learning Block" : "Add New Learning Block"}</CardTitle>
              <CardDescription>
                {editingBlock
                  ? "Update learning block information"
                  : "Create learning content blocks for units"}
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
                        <FormLabel>Block Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Introduction to Abu Dhabi" {...field} />
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
                            // Make sure we have a valid number to parse
                            if (value) {
                              const unitId = parseInt(value);
                              if (!isNaN(unitId)) {
                                field.onChange(unitId);
                                // Also update the selected unit for filtering
                                if (!editingBlock) {
                                  setSelectedUnitId(unitId);
                                }
                              }
                            }
                          }}
                          defaultValue={field.value?.toString() || ""}
                          value={field.value?.toString() || ""}
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="interactive">Interactive</SelectItem>
                            <SelectItem value="scorm">SCORM Package</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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

                  {form.watch("type") === "text" && (
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter the learning content text here..."
                              className="min-h-[150px]"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("type") === "video" && (
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. https://www.youtube.com/watch?v=..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch("type") === "image" && (
                    <>
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image</FormLabel>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  ref={imageFileRef}
                                  onChange={(e) => {
                                    // Clear previous image URL when selecting a new file
                                    if (e.target.files && e.target.files.length > 0) {
                                      field.onChange("");
                                    }
                                  }}
                                />
                                <Button 
                                  type="button" 
                                  onClick={handleImageUpload}
                                  disabled={imageUploading}
                                  size="sm"
                                >
                                  {imageUploading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              <Input
                                placeholder="Image URL (will be set automatically after upload)"
                                {...field}
                                value={field.value || ""}
                                disabled
                              />
                              
                              {field.value && (
                                <div className="mt-2 border rounded-md overflow-hidden max-w-xs max-h-48">
                                  <img 
                                    src={field.value} 
                                    alt="Uploaded image preview" 
                                    className="w-full h-auto object-contain"
                                  />
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch("type") === "interactive" && (
                    <FormField
                      control={form.control}
                      name="interactiveData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interactive Content JSON Configuration</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{
  "type": "quiz",
  "title": "Interactive Quiz Example",
  "questions": [
    {
      "question": "What is the capital of the UAE?",
      "options": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
      "correctAnswer": 1
    }
  ]
}'
                              className="min-h-[250px] font-mono text-sm"
                              {...field}
                              value={field.value ? 
                                (typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)) 
                                : ''}
                              onChange={(e) => {
                                try {
                                  // Try to parse as JSON to validate, but keep as string in the form
                                  JSON.parse(e.target.value);
                                  field.onChange(e.target.value);
                                } catch (err) {
                                  // Still update the field even if invalid JSON
                                  field.onChange(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>Enter valid JSON configuration for the interactive element.</p>
                            <p>The JSON structure will vary based on the type of interactive content (quizzes, flashcards, etc).</p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("type") === "scorm" && (
                    <FormField
                      control={form.control}
                      name="scormPackageId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SCORM Package</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a SCORM package" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {scormPackagesLoading ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : scormPackages && scormPackages.length > 0 ? (
                                scormPackages.map((pkg: { id: number; title: string }) => (
                                  <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                    {pkg.title}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-xs text-muted-foreground">
                                  No SCORM packages available. Upload one first.
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>Select a SCORM package to embed in this learning block.</p>
                            <p>If no packages are available, go to the SCORM Management page to upload one first.</p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    {editingBlock && (
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
                      {editingBlock ? "Update Block" : "Create Block"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Learning Blocks List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Learning Blocks</CardTitle>
              <CardDescription>
                {selectedUnitId
                  ? `Learning blocks for ${getUnitName(selectedUnitId)}`
                  : "Select a unit to view its learning blocks"}
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
              {blocksLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : blocks && blocks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocks.map((block) => (
                      <TableRow key={block.id}>
                        <TableCell>{block.order}</TableCell>
                        <TableCell>
                          <div className="font-medium">{block.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getBlockTypeIcon(block.type)}
                            <span className="capitalize">{block.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{block.xpPoints}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(block)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(block.id)}
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
                    ? "No learning blocks found. Create your first block!"
                    : "Select a unit to view its learning blocks"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}