import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Course, TrainingArea, Module, Unit, LearningBlock, Assessment, Question } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Filter, FileEdit, Plus, Trash, Pencil, ChevronRight } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Course form schema
const courseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  moduleId: z.coerce.number().min(1, "Module is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  duration: z.number().min(1, "Duration is required"),
  level: z.string().min(1, "Level is required"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// Module form schema
const moduleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  trainingAreaId: z.coerce.number().min(1, "Training area is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ModuleFormValues = z.infer<typeof moduleFormSchema>;

// Training area form schema
const trainingAreaFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

type TrainingAreaFormValues = z.infer<typeof trainingAreaFormSchema>;

// Unit form schema
const unitFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  courseId: z.coerce.number().min(1, "Course is required"),
  description: z.string().optional(),
  order: z.coerce.number().min(1, "Order is required"),
  duration: z.coerce.number().min(1, "Duration is required"),
  xpPoints: z.coerce.number().min(1, "XP Points are required"),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

// Learning block form schema
const learningBlockFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  unitId: z.coerce.number().min(1, "Unit is required"),
  type: z.string().min(1, "Type is required"),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  interactiveData: z.any().optional(),
  order: z.number().min(1, "Order is required"),
  xpPoints: z.number().min(1, "XP points are required"),
});

type LearningBlockFormValues = z.infer<typeof learningBlockFormSchema>;

export default function ContentManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [isEditModuleModalOpen, setIsEditModuleModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedArea, setSelectedArea] = useState<TrainingArea | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect if not admin
  if (user && user.role !== "admin" && user.role !== "content_creator") {
    return <Redirect to="/" />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch data
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: trainingAreas, isLoading: isLoadingAreas } = useQuery<TrainingArea[]>({
    queryKey: ["/api/training-areas"],
  });

  const { data: modules, isLoading: isLoadingModules } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });
  
  // Fetch units
  const { data: units, isLoading: isLoadingUnits } = useQuery<Unit[]>({
    queryKey: ["/api/units", selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse?.id) throw new Error("Course ID is required");
      const res = await fetch(`/api/units?courseId=${selectedCourse.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch units");
      }
      return res.json();
    },
    enabled: !!selectedCourse,
  });

  // Course form
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      moduleId: 0,
      description: "",
      imageUrl: "",
      duration: 60,
      level: "beginner",
    },
  });

  // Module form
  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      name: "",
      trainingAreaId: 0,
      description: "",
      imageUrl: "",
    },
  });

  // Training area form
  const areaForm = useForm<TrainingAreaFormValues>({
    resolver: zodResolver(trainingAreaFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });
  
  // Unit form
  const unitForm = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: "",
      courseId: 0,
      description: "",
      order: 1,
      duration: 30,
      xpPoints: 100,
    },
  });

  // Create training area mutation
  const createAreaMutation = useMutation({
    mutationFn: async (data: TrainingAreaFormValues) => {
      const res = await apiRequest("POST", "/api/training-areas", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Training area created",
        description: "New training area has been created successfully",
      });
      setIsAddAreaModalOpen(false);
      areaForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/training-areas"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create training area",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update training area mutation
  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TrainingArea> }) => {
      const res = await apiRequest("PATCH", `/api/training-areas/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Training area updated",
        description: "Training area has been updated successfully",
      });
      setIsEditAreaModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/training-areas"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update training area",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete training area mutation
  const deleteAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/training-areas/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Training area deleted",
        description: "Training area has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training-areas"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete training area",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddArea = (data: TrainingAreaFormValues) => {
    createAreaMutation.mutate(data);
  };

  const handleEditArea = (data: TrainingAreaFormValues) => {
    if (selectedArea) {
      updateAreaMutation.mutate({
        id: selectedArea.id,
        data,
      });
    }
  };

  const handleDeleteArea = (id: number) => {
    if (confirm("Are you sure you want to delete this training area? This action cannot be undone.")) {
      deleteAreaMutation.mutate(id);
    }
  };
  
  const openEditAreaModal = (area: TrainingArea) => {
    setSelectedArea(area);
    areaForm.reset({
      name: area.name,
      description: area.description || "",
      imageUrl: area.imageUrl || "",
    });
    setIsEditAreaModalOpen(true);
  };

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const res = await apiRequest("POST", "/api/admin/courses", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course created",
        description: "New course has been created successfully",
      });
      setIsAddModalOpen(false);
      courseForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Course> }) => {
      const res = await apiRequest("PUT", `/api/admin/courses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course updated",
        description: "Course has been updated successfully",
      });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/courses/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course deleted",
        description: "Course has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete course",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const res = await apiRequest("POST", "/api/modules", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module created",
        description: "New module has been created successfully",
      });
      setIsAddModuleModalOpen(false);
      moduleForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create module",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Module> }) => {
      const res = await apiRequest("PATCH", `/api/modules/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Module updated",
        description: "Module has been updated successfully",
      });
      setIsEditModuleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update module",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/modules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Module deleted",
        description: "Module has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCourse = (data: CourseFormValues) => {
    createCourseMutation.mutate(data);
  };

  const handleEditCourse = (data: CourseFormValues) => {
    if (selectedCourse) {
      updateCourseMutation.mutate({
        id: selectedCourse.id,
        data,
      });
    }
  };

  const handleDeleteCourse = (id: number) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      deleteCourseMutation.mutate(id);
    }
  };

  const openEditCourseModal = (course: Course) => {
    setSelectedCourse(course);
    courseForm.reset({
      name: course.name,
      moduleId: course.moduleId,
      description: course.description || "",
      imageUrl: course.imageUrl || "",
      duration: course.duration || 60,
      level: course.level || "beginner",
    });
    setIsEditModalOpen(true);
  };
  
  // Module handlers
  const handleAddModule = (data: ModuleFormValues) => {
    createModuleMutation.mutate(data);
  };

  const handleEditModule = (data: ModuleFormValues) => {
    if (selectedModule) {
      updateModuleMutation.mutate({
        id: selectedModule.id,
        data,
      });
    }
  };

  const handleDeleteModule = (id: number) => {
    if (confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      deleteModuleMutation.mutate(id);
    }
  };
  
  const openEditModuleModal = (module: Module) => {
    setSelectedModule(module);
    moduleForm.reset({
      name: module.name,
      trainingAreaId: module.trainingAreaId,
      description: module.description || "",
      imageUrl: module.imageUrl || "",
    });
    setIsEditModuleModalOpen(true);
  };
  
  // Unit mutations
  const createUnitMutation = useMutation({
    mutationFn: async (data: UnitFormValues) => {
      const res = await apiRequest("POST", "/api/units", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Unit created",
        description: "New unit has been created successfully",
      });
      setIsAddUnitModalOpen(false);
      unitForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedCourse?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create unit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Unit> }) => {
      const res = await apiRequest("PATCH", `/api/units/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Unit updated",
        description: "Unit has been updated successfully",
      });
      setIsEditUnitModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedCourse?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update unit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/units/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Unit deleted",
        description: "Unit has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/units", selectedCourse?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete unit",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Unit handlers
  const handleAddUnit = (data: UnitFormValues) => {
    createUnitMutation.mutate(data);
  };
  
  const handleEditUnit = (data: UnitFormValues) => {
    if (selectedUnit) {
      updateUnitMutation.mutate({
        id: selectedUnit.id,
        data,
      });
    }
  };
  
  const handleDeleteUnit = (id: number) => {
    if (confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      deleteUnitMutation.mutate(id);
    }
  };
  
  const openEditUnitModal = (unit: Unit) => {
    setSelectedUnit(unit);
    unitForm.reset({
      name: unit.name,
      courseId: unit.courseId,
      description: unit.description || "",
      order: unit.order,
      duration: unit.duration || 30,
      xpPoints: unit.xpPoints || 100,
    });
    setIsEditUnitModalOpen(true);
  };

  // Filter courses based on search
  const filteredCourses = courses
    ? courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Filter modules based on search
  const filteredModules = modules
    ? modules.filter(module =>
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (module.description && module.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Filter training areas based on search
  const filteredAreas = trainingAreas
    ? trainingAreas.filter(area =>
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (area.description && area.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

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
              <h1 className="font-heading text-2xl font-semibold text-neutrals-800 mb-4 md:mb-0">Content Management</h1>
              
              <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search content..."
                    className="pl-8 w-full md:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button onClick={() => {
                  courseForm.reset();
                  setIsAddModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="areas" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="areas">Training Areas</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="units">Units</TabsTrigger>
                <TabsTrigger value="blocks">Learning Blocks</TabsTrigger>
                <TabsTrigger value="assessments">Assessments</TabsTrigger>
              </TabsList>
              
              {/* Courses Tab */}
              <TabsContent value="courses">
                {isLoadingCourses ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-64" />
                          <Skeleton className="h-4 w-40" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-16 w-full" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-9 w-24" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCourses.map((course) => (
                      <Card key={course.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>{course.name}</CardTitle>
                              <CardDescription>{getModuleName(course.moduleId, modules)} • {course.level}</CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openEditCourseModal(course)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Course
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)}>
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Course
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutrals-600">{course.description || "No description provided."}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-neutrals-500">
                            <div className="flex items-center">
                              <span className="material-icons text-xs mr-1">schedule</span>
                              <span>{formatDuration(course.duration || 0)}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="material-icons text-xs mr-1">stars</span>
                              <span>XP: Various</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedCourse(course);
                              setActiveTab("units");
                            }}
                          >
                            <span className="material-icons text-xs mr-2">view_module</span>
                            Manage Units
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-neutrals-100 p-3 mb-4">
                      <span className="material-icons text-4xl text-neutrals-400">school</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                    <p className="text-neutrals-600 mb-6">Get started by creating your first course.</p>
                    <Button onClick={() => {
                      courseForm.reset();
                      setIsAddModalOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Course
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Modules Tab */}
              <TabsContent value="modules">
                {isLoadingModules ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-64" />
                          <Skeleton className="h-4 w-40" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-12 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredModules.length > 0 ? (
                  <div className="space-y-4">
                    {filteredModules.map((module) => (
                      <Card key={module.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>{module.name}</CardTitle>
                              <CardDescription>
                                {getTrainingAreaName(module.trainingAreaId, trainingAreas)}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openEditModuleModal(module)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Module
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteModule(module.id)}>
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Module
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutrals-600">{module.description || "No description provided."}</p>
                          <div className="mt-4">
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Course to this Module
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-neutrals-100 p-3 mb-4">
                      <span className="material-icons text-4xl text-neutrals-400">folder</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No modules found</h3>
                    <p className="text-neutrals-600 mb-6">Get started by creating your first module.</p>
                    <Button onClick={() => {
                      moduleForm.reset({
                        name: "",
                        trainingAreaId: trainingAreas && trainingAreas.length > 0 ? trainingAreas[0].id : 0,
                        description: "",
                        imageUrl: "",
                      });
                      setIsAddModuleModalOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Module
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Training Areas Tab */}
              <TabsContent value="areas">
                {isLoadingAreas ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-12 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredAreas.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAreas.map((area) => (
                      <Card key={area.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle>{area.name}</CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openEditAreaModal(area)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Area
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteArea(area.id)}>
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Area
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutrals-600">{area.description || "No description provided."}</p>
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                moduleForm.reset({
                                  name: "",
                                  trainingAreaId: area.id,
                                  description: "",
                                  imageUrl: "",
                                });
                                setActiveTab("modules");
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Module to this Area
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-neutrals-100 p-3 mb-4">
                      <span className="material-icons text-4xl text-neutrals-400">category</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No training areas found</h3>
                    <p className="text-neutrals-600 mb-6">Get started by creating your first training area.</p>
                    <Button onClick={() => {
                      areaForm.reset();
                      setIsAddAreaModalOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Training Area
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Units Tab */}
              <TabsContent value="units">
                {!selectedCourse ? (
                  <div className="text-center p-12">
                    <div className="rounded-full bg-neutrals-100 p-3 inline-flex mb-4">
                      <span className="material-icons text-4xl text-neutrals-400">menu_book</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Units Management</h3>
                    <p className="text-neutrals-600 mb-6 max-w-md mx-auto">
                      To manage units, please select a course first. Units are organized within courses.
                    </p>
                    <Button onClick={() => setActiveTab("courses")}>
                      <span className="material-icons mr-2">arrow_back</span>
                      Go to Courses
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold flex items-center">
                          <span className="material-icons mr-2">menu_book</span>
                          Units for {selectedCourse.name}
                        </h2>
                        <p className="text-sm text-neutrals-600">Manage units for this course</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => {
                          setSelectedCourse(null);
                          setActiveTab("courses");
                        }}>
                          <span className="material-icons mr-2">arrow_back</span>
                          Back to Courses
                        </Button>
                        <Button onClick={() => {
                          unitForm.reset({
                            name: "",
                            courseId: selectedCourse.id,
                            description: "",
                            order: 1
                          });
                          setIsAddUnitModalOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Unit
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingUnits ? (
                      <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                          <Card key={i}>
                            <CardHeader className="pb-2">
                              <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent>
                              <Skeleton className="h-12 w-full" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : units && units.length > 0 ? (
                      <div className="space-y-4">
                        {units.map((unit) => (
                          <Card key={unit.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="bg-neutrals-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-lg font-semibold">{unit.order}</span>
                                  </div>
                                  <div>
                                    <CardTitle>{unit.name}</CardTitle>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <FileEdit className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => openEditUnitModal(unit)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Unit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteUnit(unit.id)}>
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete Unit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-neutrals-600">{unit.description || "No description provided."}</p>
                              <div className="mt-4 flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUnit(unit);
                                    setActiveTab("blocks");
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Manage Learning Blocks
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUnit(unit);
                                    setActiveTab("assessments");
                                  }}
                                >
                                  <span className="material-icons text-xs mr-2">quiz</span>
                                  Manage Assessments
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="rounded-full bg-neutrals-100 p-3 mb-4">
                          <span className="material-icons text-4xl text-neutrals-400">menu_book</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No units found</h3>
                        <p className="text-neutrals-600 mb-6">Get started by creating your first unit for this course.</p>
                        <Button onClick={() => {
                          unitForm.reset({
                            name: "",
                            courseId: selectedCourse.id,
                            description: "",
                            order: 1
                          });
                          setIsAddUnitModalOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Unit
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Learning Blocks Tab */}
              <TabsContent value="blocks">
                {!selectedUnit ? (
                  <div className="text-center p-12">
                    <div className="rounded-full bg-neutrals-100 p-3 inline-flex mb-4">
                      <span className="material-icons text-4xl text-neutrals-400">widgets</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Learning Blocks Management</h3>
                    <p className="text-neutrals-600 mb-6 max-w-md mx-auto">
                      To manage learning blocks, please select a unit first. Learning blocks are organized within units.
                    </p>
                    <Button onClick={() => setActiveTab("units")}>
                      <span className="material-icons mr-2">arrow_back</span>
                      Go to Units
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold flex items-center">
                          <span className="material-icons mr-2">widgets</span>
                          Learning Blocks for {selectedUnit.name}
                        </h2>
                        <p className="text-sm text-neutrals-600">Manage learning blocks for this unit</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => {
                          setSelectedUnit(null);
                          setActiveTab("units");
                        }}>
                          <span className="material-icons mr-2">arrow_back</span>
                          Back to Units
                        </Button>
                        <Button onClick={() => {
                          // Redirect to the learning blocks management page with query parameter for unitId
                          window.location.href = `/admin/learning-blocks?unitId=${selectedUnit.id}`;
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Learning Block
                        </Button>
                      </div>
                    </div>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center py-12">
                          <span className="material-icons text-5xl text-abu-gold mb-4">school</span>
                          <h3 className="text-lg font-semibold mb-2">Manage Learning Blocks</h3>
                          <p className="text-neutrals-600 mb-6 max-w-md mx-auto">
                            You'll be redirected to the dedicated Learning Blocks management interface.
                          </p>
                          <Button onClick={() => {
                            window.location.href = `/admin/learning-blocks?unitId=${selectedUnit.id}`;
                          }}>
                            <span className="material-icons mr-2">open_in_new</span>
                            Open Learning Blocks Manager
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              {/* Assessments Tab */}
              <TabsContent value="assessments">
                {!selectedUnit ? (
                  <div className="text-center p-12">
                    <div className="rounded-full bg-neutrals-100 p-3 inline-flex mb-4">
                      <span className="material-icons text-4xl text-neutrals-400">quiz</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Assessments Management</h3>
                    <p className="text-neutrals-600 mb-6 max-w-md mx-auto">
                      To manage assessments, please select a unit first. Assessments are organized within units.
                    </p>
                    <Button onClick={() => setActiveTab("units")}>
                      <span className="material-icons mr-2">arrow_back</span>
                      Go to Units
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold flex items-center">
                          <span className="material-icons mr-2">quiz</span>
                          Assessments for {selectedUnit.name}
                        </h2>
                        <p className="text-sm text-neutrals-600">Manage assessments for this unit</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => {
                          setSelectedUnit(null);
                          setActiveTab("units");
                        }}>
                          <span className="material-icons mr-2">arrow_back</span>
                          Back to Units
                        </Button>
                        <Button onClick={() => {
                          // Redirect to the assessments management page with query parameter for unitId
                          window.location.href = `/admin/assessments?unitId=${selectedUnit.id}`;
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Assessment
                        </Button>
                      </div>
                    </div>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center py-12">
                          <span className="material-icons text-5xl text-abu-gold mb-4">quiz</span>
                          <h3 className="text-lg font-semibold mb-2">Manage Assessments</h3>
                          <p className="text-neutrals-600 mb-6 max-w-md mx-auto">
                            You'll be redirected to the dedicated Assessments management interface.
                          </p>
                          <Button onClick={() => {
                            window.location.href = `/admin/assessments?unitId=${selectedUnit.id}`;
                          }}>
                            <span className="material-icons mr-2">open_in_new</span>
                            Open Assessments Manager
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <MobileNav />
      </div>

      {/* Add Course Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course by filling out the information below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(handleAddCourse)} className="space-y-4">
              <FormField
                control={courseForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter course name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules?.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter course description" 
                        {...field} 
                        className="min-h-[100px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to the course cover image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={courseForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter duration" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={courseForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level" />
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
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createCourseMutation.isPending}
                >
                  {createCourseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Modify the course information below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(handleEditCourse)} className="space-y-4">
              <FormField
                control={courseForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter course name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules?.map((module) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter course description" 
                        {...field} 
                        className="min-h-[100px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to the course cover image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={courseForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter duration" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={courseForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level" />
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
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateCourseMutation.isPending}
                >
                  {updateCourseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Training Area Dialog */}
      <AddEditTrainingAreaDialog
        open={isAddAreaModalOpen}
        onOpenChange={setIsAddAreaModalOpen}
        isEditing={false}
        onSubmit={handleAddArea}
        form={areaForm}
        isPending={createAreaMutation.isPending}
      />

      {/* Edit Training Area Dialog */}
      <AddEditTrainingAreaDialog
        open={isEditAreaModalOpen}
        onOpenChange={setIsEditAreaModalOpen}
        isEditing={true}
        onSubmit={handleEditArea}
        form={areaForm}
        isPending={updateAreaMutation.isPending}
      />

      {/* Add Module Dialog */}
      <Dialog open={isAddModuleModalOpen} onOpenChange={setIsAddModuleModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Module</DialogTitle>
            <DialogDescription>
              Create a new module by filling out the information below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...moduleForm}>
            <form onSubmit={moduleForm.handleSubmit(handleAddModule)} className="space-y-4">
              <FormField
                control={moduleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter module name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={moduleForm.control}
                name="trainingAreaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Area</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
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
                control={moduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter module description" 
                        {...field} 
                        className="min-h-[100px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={moduleForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to the module cover image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createModuleMutation.isPending}
                >
                  {createModuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : "Create Module"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={isEditModuleModalOpen} onOpenChange={setIsEditModuleModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>
              Modify the module information below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...moduleForm}>
            <form onSubmit={moduleForm.handleSubmit(handleEditModule)} className="space-y-4">
              <FormField
                control={moduleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter module name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={moduleForm.control}
                name="trainingAreaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Area</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
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
                control={moduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter module description" 
                        {...field} 
                        className="min-h-[100px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={moduleForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to the module cover image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateModuleMutation.isPending}
                >
                  {updateModuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Module"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <AddEditUnitDialog
        open={isAddUnitModalOpen}
        onOpenChange={setIsAddUnitModalOpen}
        isEditing={false}
        onSubmit={handleAddUnit}
        form={unitForm}
        isPending={createUnitMutation.isPending}
      />

      {/* Edit Unit Dialog */}
      <AddEditUnitDialog
        open={isEditUnitModalOpen}
        onOpenChange={setIsEditUnitModalOpen}
        isEditing={true}
        onSubmit={handleEditUnit}
        form={unitForm}
        isPending={updateUnitMutation.isPending}
      />
    </div>
  );
}

// Helper function to format duration
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
}

// Helper function to get module name by ID
function getModuleName(moduleId: number, modules: Module[] | undefined) {
  if (!modules) return "Unknown Module";
  const module = modules.find(m => m.id === moduleId);
  return module ? module.name : "Unknown Module";
}

// Helper function to get training area name by ID
function getTrainingAreaName(areaId: number, areas: TrainingArea[] | undefined) {
  if (!areas) return "Unknown Area";
  const area = areas.find(a => a.id === areaId);
  return area ? area.name : "Unknown Area";
}

// Add the Training Area Dialog components to the end of the file
// Add at the end of the ContentManagement component
export function AddEditTrainingAreaDialog({
  open,
  onOpenChange,
  isEditing,
  onSubmit,
  form,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  onSubmit: (data: TrainingAreaFormValues) => void;
  form: UseFormReturn<TrainingAreaFormValues>;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Training Area" : "Add New Training Area"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the training area information" 
              : "Create a new training area for the VX Academy"}
          </DialogDescription>
        </DialogHeader>
        
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
                      className="min-h-[100px]"
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
                  <FormDescription>
                    URL to an image representing this training area
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? "Update Training Area" : "Create Training Area"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add/Edit Unit Dialog Component
export function AddEditUnitDialog({
  open,
  onOpenChange,
  isEditing,
  onSubmit,
  form,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  onSubmit: (data: UnitFormValues) => void;
  form: UseFormReturn<UnitFormValues>;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Unit" : "Add New Unit"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the unit information" 
              : "Create a new unit for this course"}
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
                    <Input placeholder="e.g. Introduction to Abu Dhabi Culture" {...field} />
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
                      placeholder="Unit description..." 
                      {...field} 
                      className="min-h-[100px]"
                      value={field.value || ""}
                    />
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
                    <Input
                      type="number"
                      placeholder="60"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Estimated time to complete this unit in minutes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Order in which this unit appears in the course
                  </FormDescription>
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
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Experience points earned for completing this unit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? "Update Unit" : "Create Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
