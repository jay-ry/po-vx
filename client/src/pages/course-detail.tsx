import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Course, Unit, LearningBlock, Assessment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function CourseDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [match, params] = useRoute("/courses/:id");
  const courseId = match ? parseInt(params.id) : 0;
  const [activeUnitId, setActiveUnitId] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch course units
  const { data: units, isLoading: isLoadingUnits } = useQuery<Unit[]>({
    queryKey: [`/api/courses/${courseId}/units`],
    enabled: !!courseId,
  });

  // Fetch learning blocks for the active unit
  const { data: blocks, isLoading: isLoadingBlocks } = useQuery<LearningBlock[]>({
    queryKey: [`/api/units/${activeUnitId}/blocks`],
    enabled: !!activeUnitId,
  });

  // Fetch assessments for the active unit with improved query settings
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: [`/api/units/${activeUnitId}/assessments`],
    enabled: !!activeUnitId,
    // Make sure we always get fresh data when switching units
    staleTime: 0,
    // Force refetch when the component is mounted or when the activeUnitId changes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch questions for the active assessment
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<any[]>({
    queryKey: [`/api/assessments/${activeAssessmentId}/questions`],
    enabled: !!activeAssessmentId,
  });

  // Fetch user progress
  const { data: progress, isLoading: isLoadingProgress } = useQuery<any>({
    queryKey: [`/api/progress`],
  });

  // Complete block mutation
  const completeBlockMutation = useMutation({
    mutationFn: async (blockId: number) => {
      const res = await apiRequest("POST", `/api/blocks/${blockId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async ({ assessmentId, answers, score }: { assessmentId: number; answers: any; score: number }) => {
      const res = await apiRequest("POST", `/api/assessments/${assessmentId}/submit`, { answers, score });
      return res.json();
    },
    onSuccess: (data) => {
      setAssessmentResult(data);
      setAssessmentSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  // Progress update mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ courseId, percentComplete, completed }: { courseId: number; percentComplete: number; completed: boolean }) => {
      const res = await apiRequest("POST", `/api/progress`, { courseId, percentComplete, completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  // Set first unit as active and handle direct unit navigation
  useEffect(() => {
    if (units && units.length > 0) {
      // If no unit is selected, set the first one
      if (!activeUnitId) {
        setActiveUnitId(units[0].id);
      }
      
      // Check if the active unit exists in the units array
      const unitExists = units.some(unit => unit.id === activeUnitId);
      if (!unitExists && activeUnitId) {
        setActiveUnitId(units[0].id);
      }
    }
  }, [units, activeUnitId]);

  // Set first block as active when blocks load
  useEffect(() => {
    if (blocks && blocks.length > 0 && !activeBlockId) {
      setActiveBlockId(blocks[0].id);
    }
  }, [blocks, activeBlockId]);

  // Calculate course progress
  const courseProgress = progress && Array.isArray(progress)
    ? progress.find((p: any) => p.courseId === courseId)
    : null;
    
  // Certificate generation mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest("POST", `/api/certificates/generate`, { courseId });
      return res.json();
    },
    onSuccess: (data) => {
      // After successfully generating a certificate, navigate to achievements page
      window.location.href = "/achievements";
    }
  });

  // Function to generate a certificate
  const generateCertificate = (courseId: number) => {
    generateCertificateMutation.mutate(courseId);
  };

  // Handle block completion
  const handleCompleteBlock = (blockId: number) => {
    completeBlockMutation.mutate(blockId);
    
    // Find and set the next block as active
    if (blocks) {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex < blocks.length - 1) {
        setActiveBlockId(blocks[currentIndex + 1].id);
      } else if (assessments && assessments.length > 0) {
        // If no more blocks, open assessment if available
        setActiveAssessmentId(assessments[0].id);
        setAssessmentDialogOpen(true);
      }
    }

    // Update course progress
    if (course && blocks) {
      // Simple calculation: percentage of blocks completed
      const percentComplete = Math.round(((currentIndex + 1) / blocks.length) * 100);
      updateProgressMutation.mutate({
        courseId: course.id,
        percentComplete,
        completed: false
      });
    }
  };

  // Handle starting an assessment
  const handleStartAssessment = (assessmentId: number) => {
    setActiveAssessmentId(assessmentId);
    setSelectedAnswers({});
    setAssessmentSubmitted(false);
    setAssessmentResult(null);
    setAssessmentDialogOpen(true);
  };

  // Handle submitting an assessment
  const handleSubmitAssessment = () => {
    if (!questions || !activeAssessmentId) return;
    
    // Calculate score
    let correctAnswers = 0;
    questions.forEach(question => {
      let userAnswer = selectedAnswers[question.id];
      let correctAnswer = question.correctAnswer;
      
      // Convert true/false answers for comparison
      if (question.questionType === 'true_false') {
        // In the database, correct answers are stored as "True" or "False"
        // In the UI, we use "0" for True and "1" for False
        const dbValueToUiValue: Record<string, string> = {
          "True": "0",
          "False": "1"
        };
        
        // Convert database answer format to UI format for comparison
        if (correctAnswer === "True" || correctAnswer === "False") {
          correctAnswer = dbValueToUiValue[correctAnswer as keyof typeof dbValueToUiValue];
        }
        
        console.log(`Question ${question.id}: User selected ${userAnswer}, correct answer is ${correctAnswer}`);
      }
      
      if (userAnswer === correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    submitAssessmentMutation.mutate({
      assessmentId: activeAssessmentId,
      answers: selectedAnswers,
      score
    });
  };

  // Calculate current block index
  const currentIndex = blocks && activeBlockId 
    ? blocks.findIndex(b => b.id === activeBlockId)
    : 0;

  // Format minutes into hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  // Loading state
  const isLoading = isLoadingCourse || isLoadingUnits;

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
          {isLoading ? (
            // Loading state
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Skeleton className="h-96 md:col-span-1" />
                <Skeleton className="h-96 md:col-span-3" />
              </div>
            </div>
          ) : course ? (
            <div>
              {/* Course Header */}
              <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-neutrals-800">{course.name}</h1>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center text-sm text-neutrals-600">
                        <span className="material-icons text-sm mr-1">schedule</span>
                        <span>{formatDuration(course.duration || 0)}</span>
                      </div>
                      <div className="flex items-center text-sm text-neutrals-600">
                        <span className="material-icons text-sm mr-1">category</span>
                        <span>{course.level}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    {courseProgress && (
                      <div className="flex items-center">
                        <span className="text-sm text-neutrals-600 mr-2">Progress: {courseProgress.percentComplete}%</span>
                        <Progress value={courseProgress.percentComplete} className="w-32 h-2" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-neutrals-600">{course.description || "This course will help you develop essential skills to become an exceptional Abu Dhabi ambassador."}</p>
              </div>

              {/* Course Content */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Units Navigation - Enhanced Design */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-6 h-fit">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                      <span className="material-icons text-primary">menu_book</span>
                    </div>
                    <h2 className="font-heading text-xl font-bold text-gray-800">Course Content</h2>
                  </div>
                  <Accordion type="single" collapsible defaultValue="unit-0" className="space-y-4">
                    {units && units.map((unit, index) => (
                      <AccordionItem key={unit.id} value={`unit-${index}`} className="border border-gray-200 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
                        <AccordionTrigger 
                          className={`${activeUnitId === unit.id ? 'text-primary font-semibold bg-primary/5' : 'text-gray-700'} px-4 py-3 text-sm hover:bg-gray-50 rounded-xl transition-all duration-200 mb-2`}
                          onClick={() => {
                            setActiveUnitId(unit.id);
                            // Clear active block so the first one in this unit will be selected
                            setActiveBlockId(null);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <span className="text-primary text-xs font-bold">{index + 1}</span>
                            </div>
                            <span className="text-left">{unit.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-4 pb-3 space-y-2">
                            {isLoadingBlocks && activeUnitId === unit.id ? (
                              <Skeleton className="h-20 w-full" />
                            ) : (
                              <>
                                {blocks && activeUnitId === unit.id && blocks.map(block => (
                                  <div 
                                    key={block.id} 
                                    className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                      activeBlockId === block.id 
                                        ? 'bg-primary/10 border-primary/30 text-primary shadow-md' 
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                    onClick={() => setActiveBlockId(block.id)}
                                  >
                                    <div className="flex items-center">
                                      <div className={`p-1.5 rounded-md mr-3 ${
                                        activeBlockId === block.id ? 'bg-primary/20' : 'bg-white'
                                      }`}>
                                        {block.type === 'video' && <span className="material-icons text-sm">videocam</span>}
                                        {block.type === 'text' && <span className="material-icons text-sm">article</span>}
                                        {block.type === 'interactive' && <span className="material-icons text-sm">quiz</span>}
                                        {block.type === 'image' && <span className="material-icons text-sm">image</span>}
                                      </div>
                                      <div className="flex-1">
                                        <span className="text-sm font-medium line-clamp-1">{block.title}</span>
                                        <div className="flex items-center mt-1">
                                          <span className="material-icons text-xs text-gray-500 mr-1">schedule</span>
                                          <span className="text-xs text-gray-500">{block.xpPoints} XP</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Handle loading state for assessments */}
                                {isLoadingAssessments && activeUnitId === unit.id ? (
                                  <Skeleton className="h-10 w-full mt-2" />
                                ) : (
                                  <>
                                    {/* Check if we have assessments and show them */}
                                    {assessments && activeUnitId === unit.id && (
                                      <>
                                        {/* If there are no assessments for this unit, don't render anything */}
                                        {assessments.length === 0 && unit.id === 8 && (
                                          <div 
                                            className="px-3 py-2 rounded-md cursor-pointer hover:bg-neutrals-100 flex items-center mt-2"
                                            onClick={() => {
                                              // Navigate to the specific assessment for Unit 4
                                              handleStartAssessment(3); // Using the known assessment ID
                                            }}
                                          >
                                            <span className="material-icons text-sm mr-2 text-warning">quiz</span>
                                            <span className="text-sm font-medium">Final Assessment</span>
                                          </div>
                                        )}
                                        
                                        {/* Map through available assessments */}
                                        {assessments.map(assessment => (
                                          <div 
                                            key={assessment.id} 
                                            className="px-3 py-2 rounded-md cursor-pointer hover:bg-neutrals-100 flex items-center mt-2"
                                            onClick={() => handleStartAssessment(assessment.id)}
                                          >
                                            <span className="material-icons text-sm mr-2 text-warning">quiz</span>
                                            <span className="text-sm font-medium">{assessment.title}</span>
                                          </div>
                                        ))}
                                      </>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {/* Learning Content - Enhanced Design */}
                <div className="lg:col-span-3">
                  {isLoadingBlocks ? (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8 h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Loading content...</p>
                      </div>
                    </div>
                  ) : !blocks || blocks.length === 0 ? (
                    // Handle units with no learning blocks (like Unit 4 with only assessments)
                    <div className="bg-gradient-to-br from-white to-secondary/10 rounded-2xl shadow-xl border border-secondary/10 p-8">
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <span className="material-icons text-3xl text-white">assignment</span>
                        </div>
                        <h2 className="font-heading text-3xl font-bold mb-4 text-gray-800">Assessment Unit</h2>
                        <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                          This unit contains an assessment to test your knowledge and skills.
                        </p>
                        {assessments && assessments.length > 0 && (
                          <Button 
                            size="lg"
                            onClick={() => handleStartAssessment(assessments[0].id)}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3 text-lg font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
                          >
                            <span className="material-icons mr-3">quiz</span>
                            Start Assessment
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : !activeBlockId ? (
                    // If no block is selected but blocks exist, select the first one
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-8 h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Loading content...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                      {blocks.map(block => (
                        <div key={block.id} className={activeBlockId === block.id ? '' : 'hidden'}>
                          {/* Enhanced Header */}
                          <div className="bg-gradient-to-r from-primary/5 to-secondary/10 p-8 border-b border-gray-100">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h2 className="font-heading text-2xl font-bold mb-3 text-gray-800">{block.title}</h2>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center bg-white/90 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                                      <span className="material-icons text-primary text-sm">
                                        {block.type === 'video' ? 'videocam' : 
                                         block.type === 'text' ? 'article' : 
                                         block.type === 'image' ? 'image' : 'quiz'}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 capitalize">{block.type.replace('_', ' ')}</span>
                                  </div>
                                  <div className="flex items-center bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full shadow-md">
                                    <span className="material-icons text-sm mr-1">stars</span>
                                    <span className="text-sm font-semibold">{block.xpPoints} XP</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Content Area */}
                          <div className="p-8">
                            {block.type === 'video' && block.videoUrl && (
                              <div className="mb-8">
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                                  <iframe 
                                    className="w-full h-full"
                                    src={block.videoUrl.includes('youtube.com/embed') ? block.videoUrl : block.videoUrl.includes('youtu.be') ? 
                                      `https://www.youtube.com/embed/${block.videoUrl.split('youtu.be/')[1].split('?')[0]}` : block.videoUrl}
                                    title={block.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              </div>
                            )}

                            {block.type === 'text' && block.content && (
                              <div className="mb-8">
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-md">
                                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatContent(block.content) }}></div>
                                </div>
                              </div>
                            )}

                            {block.type === 'interactive' && (
                              <div className="mb-8">
                                <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl p-8 border border-secondary/10 shadow-md">
                                  <div className="bg-white rounded-xl shadow-md border border-gray-100">
                                    {block.interactiveData ? (
                                      <InteractiveContentRenderer interactiveData={block.interactiveData} />
                                    ) : (
                                      <div className="p-8 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <span className="material-icons text-gray-400">interactive</span>
                                        </div>
                                        <p className="font-medium">No interactive content available</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {block.type === 'image' && block.imageUrl && (
                              <div className="mb-8">
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                                  <div className="rounded-xl overflow-hidden">
                                    <img 
                                      src={block.imageUrl} 
                                      alt={block.title}
                                      className="w-full h-auto object-contain max-h-96 mx-auto"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Navigation Controls */}
                          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200 mb-8 ml-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (currentIndex > 0) {
                                  setActiveBlockId(blocks[currentIndex - 1].id);
                                }
                              }}
                              disabled={currentIndex === 0}
                            >
                              <span className="material-icons mr-2">arrow_back</span>
                              Previous
                            </Button>
                            
                            {currentIndex < blocks.length - 1 ? (
                              <Button
                                onClick={() => {
                                  handleCompleteBlock(block.id);
                                }}
                                disabled={completeBlockMutation.isPending}
                                className="mr-2"
                              >
                                {completeBlockMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    Mark as Complete
                                    <span className="material-icons ml-2">arrow_forward</span>
                                  </>
                                )}
                              </Button>
                            ) : (
                              assessments && assessments.length > 0 ? (
                                <Button
                                  onClick={() => handleStartAssessment(assessments[0].id)}
                                  disabled={completeBlockMutation.isPending}
                                className="mr-2"

                                >
                                  {completeBlockMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      Take Assessment
                                      <span className="material-icons ml-2">quiz</span>
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => {
                                    // First mark the current block as complete
                                    handleCompleteBlock(block.id);
                                    
                                    // Find the next unit to navigate to
                                    if (units && activeUnitId) {
                                      const currentUnitIndex = units.findIndex(u => u.id === activeUnitId);
                                      
                                      // If there's a next unit, navigate to it
                                      if (currentUnitIndex < units.length - 1) {
                                        const nextUnit = units[currentUnitIndex + 1];
                                        
                                        // Set the next unit as active after a short delay to allow the completion to process
                                        setTimeout(() => {
                                          setActiveUnitId(nextUnit.id);
                                          setActiveBlockId(null); // Reset block so the first one in the new unit is selected
                                        }, 500);
                                      }
                                    }
                                  }}
                                  disabled={completeBlockMutation.isPending}
                                  className="mr-2"
                                >
                                  {completeBlockMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      Complete Unit & Continue
                                      <span className="material-icons ml-2">check_circle</span>
                                    </>
                                  )}
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center h-64">
              <span className="material-icons text-4xl text-neutrals-400 mb-2">error_outline</span>
              <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
              <p className="text-neutrals-600">The course you're looking for could not be found or may have been removed.</p>
              <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
            </div>
          )}
        </main>

        <MobileNav />
      </div>

      {/* Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {isLoadingQuestions || !activeAssessmentId ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assessments && questions ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {assessmentSubmitted ? "Assessment Results" : assessments.find(a => a.id === activeAssessmentId)?.title || "Assessment"}
                </DialogTitle>
                <DialogDescription>
                  {assessmentSubmitted 
                    ? "Review your assessment results below"
                    : `Answer all questions to complete this assessment. Passing score: ${assessments.find(a => a.id === activeAssessmentId)?.passingScore || 70}%`
                  }
                </DialogDescription>
              </DialogHeader>

              {assessmentSubmitted && assessmentResult ? (
                <div className="py-4">
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white mb-4 ${
                      assessmentResult.passed ? "bg-success" : "bg-danger"
                    }`}>
                      <span className="material-icons text-4xl">
                        {assessmentResult.passed ? "check_circle" : "cancel"}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-1">
                      {assessmentResult.passed ? "Congratulations!" : "Try Again"}
                    </h3>
                    <p className="text-neutrals-600 mb-2">
                      {assessmentResult.message}
                    </p>
                    <div className="flex items-center">
                      <span className="text-lg font-bold mr-2">Score: {assessmentResult.attempt.score}%</span>
                      {assessmentResult.passed && (
                        <span className="text-success flex items-center">
                          <span className="material-icons text-sm mr-1">add_circle</span>
                          +{assessments.find(a => a.id === activeAssessmentId)?.xpPoints || 50} XP
                        </span>
                      )}
                    </div>
                    
                    {/* Certificate Generation Button */}
                    {assessmentResult.passed && courseProgress?.completed && (
                      <div className="mt-6">
                        <Button 
                          onClick={() => generateCertificate(courseId)}
                          size="lg"
                          className="bg-primary hover:bg-primary/90"
                        >
                          <span className="material-icons mr-2">military_tech</span>
                          Generate Certificate
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Review Your Answers</h4>
                    {questions.map((question, index) => {
                      const userAnswer = assessmentResult.attempt.answers[question.id];
                      const isCorrect = userAnswer === question.correctAnswer;
                      
                      return (
                        <Card key={question.id} className={`border ${isCorrect ? 'border-success bg-success/5' : 'border-danger bg-danger/5'}`}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-start">
                              <span className={`material-icons text-sm mr-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                                {isCorrect ? 'check_circle' : 'cancel'}
                              </span>
                              <span>Question {index + 1}: {question.questionText}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            {question.questionType === 'mcq' && question.options && Array.isArray(question.options) ? (
                              <div className="space-y-2">
                                {question.options.map((option: string, optIndex: number) => (
                                  <div 
                                    key={optIndex} 
                                    className={`p-2 rounded-md ${
                                      optIndex.toString() === question.correctAnswer ? 'bg-success/10 border border-success' : 
                                      optIndex.toString() === userAnswer && optIndex.toString() !== question.correctAnswer ? 'bg-danger/10 border border-danger' : 
                                      'bg-neutrals-50 border border-neutrals-200'
                                    }`}
                                  >
                                    {option}
                                    {optIndex.toString() === question.correctAnswer && (
                                      <span className="ml-2 text-success text-sm">(Correct Answer)</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (!question.questionType || question.questionType === 'true_false') ? (
                              <div className="space-y-2">
                                <div 
                                  className={`p-2 rounded-md ${
                                    (question.correctAnswer === '0' || question.correctAnswer === 'True') ? 'bg-success/10 border border-success' : 
                                    (userAnswer === '0' && question.correctAnswer !== '0' && question.correctAnswer !== 'True') ? 'bg-danger/10 border border-danger' : 
                                    'bg-neutrals-50 border border-neutrals-200'
                                  }`}
                                >
                                  True
                                  {(question.correctAnswer === '0' || question.correctAnswer === 'True') && (
                                    <span className="ml-2 text-success text-sm">(Correct Answer)</span>
                                  )}
                                </div>
                                <div 
                                  className={`p-2 rounded-md ${
                                    (question.correctAnswer === '1' || question.correctAnswer === 'False') ? 'bg-success/10 border border-success' : 
                                    (userAnswer === '1' && question.correctAnswer !== '1' && question.correctAnswer !== 'False') ? 'bg-danger/10 border border-danger' : 
                                    'bg-neutrals-50 border border-neutrals-200'
                                  }`}
                                >
                                  False
                                  {(question.correctAnswer === '1' || question.correctAnswer === 'False') && (
                                    <span className="ml-2 text-success text-sm">(Correct Answer)</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 rounded-md bg-neutrals-50 border border-neutrals-200">
                                No options available
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Questions</TabsTrigger>
                    {questions.map((_, index) => (
                      <TabsTrigger key={index} value={`question-${index}`}>
                        {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="space-y-6">
                    {questions.map((question, index) => (
                      <Card key={question.id}>
                        <CardHeader>
                          <CardTitle className="text-base">Question {index + 1}: {question.questionText}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Handle MCQ questions */}
                          {question.questionType === 'mcq' && question.options && Array.isArray(question.options) && (
                            <RadioGroup
                              value={selectedAnswers[question.id] || ""}
                              onValueChange={(value) => setSelectedAnswers({ ...selectedAnswers, [question.id]: value })}
                            >
                              {question.options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-center space-x-2 mb-2">
                                  <RadioGroupItem value={optIndex.toString()} id={`q${question.id}-opt${optIndex}`} />
                                  <Label htmlFor={`q${question.id}-opt${optIndex}`} className="cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                          
                          {/* Handle True/False questions */}
                          {(!question.questionType || question.questionType === 'true_false') && (
                            <RadioGroup
                              value={selectedAnswers[question.id] || ""}
                              onValueChange={(value) => setSelectedAnswers({ ...selectedAnswers, [question.id]: value })}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="0" id={`q${question.id}-true`} />
                                <Label htmlFor={`q${question.id}-true`} className="cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md">
                                  True
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="1" id={`q${question.id}-false`} />
                                <Label htmlFor={`q${question.id}-false`} className="cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md">
                                  False
                                </Label>
                              </div>
                            </RadioGroup>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {questions.map((question, index) => (
                    <TabsContent key={index} value={`question-${index}`}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Question {index + 1}: {question.questionText}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Handle MCQ questions */}
                          {question.questionType === 'mcq' && question.options && Array.isArray(question.options) && (
                            <RadioGroup
                              value={selectedAnswers[question.id] || ""}
                              onValueChange={(value) => setSelectedAnswers({ ...selectedAnswers, [question.id]: value })}
                            >
                              {question.options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-center space-x-2 mb-2">
                                  <RadioGroupItem value={optIndex.toString()} id={`q${question.id}-opt${optIndex}-tab`} />
                                  <Label htmlFor={`q${question.id}-opt${optIndex}-tab`} className="cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                          
                          {/* Handle True/False questions */}
                          {(!question.questionType || question.questionType === 'true_false') && (
                            <RadioGroup
                              value={selectedAnswers[question.id] || ""}
                              onValueChange={(value) => setSelectedAnswers({ ...selectedAnswers, [question.id]: value })}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="0" id={`q${question.id}-true-tab`} />
                                <Label htmlFor={`q${question.id}-true-tab`} className="cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md">
                                  True
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="1" id={`q${question.id}-false-tab`} />
                                <Label htmlFor={`q${question.id}-false-tab`} className="cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md">
                                  False
                                </Label>
                              </div>
                            </RadioGroup>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              <DialogFooter>
                {assessmentSubmitted ? (
                  <Button onClick={() => setAssessmentDialogOpen(false)}>Close</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleSubmitAssessment}
                      disabled={Object.keys(selectedAnswers).length !== questions.length || submitAssessmentMutation.isPending}
                    >
                      {submitAssessmentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : "Submit Assessment"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-icons text-4xl text-neutrals-400 mb-2">error_outline</span>
              <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
              <p className="text-neutrals-600">The assessment could not be loaded.</p>
              <Button className="mt-4" onClick={() => setAssessmentDialogOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to format content with some basic HTML
function formatContent(content: string): string {
  // Add basic protection against XSS attacks
  // In a real application, you would use a proper sanitization library
  content = content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Convert markdown-like syntax to HTML
  content = content
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold my-4">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold my-4">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([^`]+)```/g, '<pre class="bg-neutrals-50 p-3 rounded my-4 overflow-auto"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-neutrals-50 px-1 py-0.5 rounded">$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-4 rounded-lg max-w-full">')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\> (.*$)/gm, '<blockquote class="border-l-4 border-neutrals-300 pl-4 py-1 my-4 italic">$1</blockquote>')
    .replace(/---/g, '<hr class="my-4 border-t border-neutrals-200">')
    // Convert line breaks to paragraphs
    .split(/\n\n+/).map(p => `<p class="mb-4">${p}</p>`).join('');
  
  return content;
}

interface InteractiveContentRendererProps {
  interactiveData: string | object;
}

// A specialized component to render interactive content based on type
function InteractiveContentRenderer({ interactiveData }: InteractiveContentRendererProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [gameAnswers, setGameAnswers] = useState<Record<number, number>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [gameSubmitted, setGameSubmitted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<{score: number, total: number, feedback: Record<string, string>}>({ score: 0, total: 0, feedback: {} });

  // Parse the interactiveData if it's a string
  const parsedData = typeof interactiveData === 'string' 
    ? (() => {
        try {
          return JSON.parse(interactiveData);
        } catch (e) {
          console.log("Error parsing interactive data:", e);
          return null;
        }
      })()
    : interactiveData;
    
  console.log("Interactive data:", parsedData);
  
  if (!parsedData) {
    return (
      <div className="p-4 text-center text-neutrals-500">
        Invalid interactive content format
      </div>
    );
  }

  const handleCheckboxChange = (index: number, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [index]: checked }));
  };

  const handleGameAnswerChange = (questionIndex: number, answerIndex: number) => {
    setGameAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitGame = () => {
    setGameSubmitted(true);
  };

  // Render content based on type
  if (parsedData.type === 'checklist') {
    const allChecked = parsedData.steps && 
      Array.isArray(parsedData.steps) && 
      parsedData.steps.length > 0 && 
      parsedData.steps.every((_: any, i: number) => checkedItems[i]);
    
    return (
      <div className="p-6">
        <h3 className="text-lg font-bold mb-3">{parsedData.title || 'Checklist'}</h3>
        <div className="space-y-3 mb-6">
          {parsedData.steps && Array.isArray(parsedData.steps) && parsedData.steps.map((step: string, i: number) => (
            <div key={i} className="flex items-start space-x-2">
              <input
                type="checkbox"
                id={`step-${i}`} 
                checked={checkedItems[i] || false} 
                onChange={(e) => handleCheckboxChange(i, e.target.checked)}
                className="mt-1"
              />
              <label htmlFor={`step-${i}`} className="text-base">{step}</label>
            </div>
          ))}
        </div>
        
        {allChecked && (
          <div className="bg-green-50 text-green-800 border border-green-300 p-4 rounded-md flex items-center">
            <span className="material-icons mr-2">check_circle</span>
            <span>All items completed! You are ready to proceed.</span>
          </div>
        )}
      </div>
    );
  }
  
  if (parsedData.type === 'game') {
    return (
      <div className="p-6">
        <h3 className="text-lg font-bold mb-3">{parsedData.title || 'Interactive Game'}</h3>
        
        <div className="space-y-6 mb-6">
          {parsedData.questions && Array.isArray(parsedData.questions) && parsedData.questions.map((q: any, questionIndex: number) => (
            <Card key={questionIndex}>
              <CardHeader>
                <CardTitle className="text-base">Question {questionIndex + 1}: {q.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={gameAnswers[questionIndex]?.toString() || ""}
                  onValueChange={(value) => handleGameAnswerChange(questionIndex, parseInt(value))}
                  disabled={gameSubmitted}
                >
                  {q.options && Array.isArray(q.options) && q.options.map((option: string, optIndex: number) => (
                    <div key={optIndex} className={`flex items-center space-x-2 mb-2 ${
                      gameSubmitted && optIndex === q.answer ? 'text-green-600' : 
                      gameSubmitted && gameAnswers[questionIndex] === optIndex && optIndex !== q.answer ? 'text-red-600' : ''
                    }`}>
                      <RadioGroupItem 
                        value={optIndex.toString()} 
                        id={`q${questionIndex}-opt${optIndex}`}
                      />
                      <Label 
                        htmlFor={`q${questionIndex}-opt${optIndex}`} 
                        className={`cursor-pointer flex-1 p-2 hover:bg-neutrals-50 rounded-md ${
                          gameSubmitted && optIndex === q.answer ? 'text-green-600 font-medium' : 
                          gameSubmitted && gameAnswers[questionIndex] === optIndex && optIndex !== q.answer ? 'text-red-600' : ''
                        }`}
                      >
                        {option}
                        {gameSubmitted && optIndex === q.answer && (
                          <span className="ml-2 text-green-600 text-sm">(Correct)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {!gameSubmitted && (
          <Button 
            onClick={handleSubmitGame}
            disabled={Object.keys(gameAnswers).length !== (parsedData.questions?.length || 0)}
          >
            Submit Answers
          </Button>
        )}
        
        {gameSubmitted && (
          <Button variant="outline" onClick={() => {
            setGameSubmitted(false);
            setGameAnswers({});
          }}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Handle quiz type content
  if (parsedData.title && parsedData.questions) {
    return (
      <div className="p-4">
        <h3 className="font-bold text-lg mb-4">{parsedData.title}</h3>
        <div className="space-y-6">
          {parsedData.questions.map((question: any, index: number) => (
            <div key={question.id || index} className="border border-neutrals-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">{question.question}</h4>
              
              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option: any, optionIndex: number) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id={`q-${question.id || index}-opt-${optionIndex}`} 
                        name={`question-${question.id || index}`}
                        value={optionIndex}
                        disabled={quizSubmitted}
                        checked={selectedAnswers[question.id || index] === optionIndex.toString()}
                        onChange={() => setSelectedAnswers({
                          ...selectedAnswers,
                          [question.id || index]: optionIndex.toString()
                        })}
                        className="h-4 w-4 text-primary border-neutrals-300 focus:ring-primary"
                      />
                      <label htmlFor={`q-${question.id || index}-opt-${optionIndex}`} className="text-sm">
                        {option.label ? `${option.label}. ${option.text}` : option.text}
                      </label>
                      {quizSubmitted && option.correct && (
                        <span className="text-green-600 ml-2">✓</span>
                      )}
                    </div>
                  ))}
                  {quizSubmitted && quizResults.feedback[question.id || index] && (
                    <div className={`mt-2 p-2 rounded text-sm ${
                      selectedAnswers[question.id || index] === question.options.findIndex((o: any) => o.correct).toString()
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {quizResults.feedback[question.id || index]}
                    </div>
                  )}
                </div>
              )}
              
              {question.type === 'likert_scale' && question.scale && (
                <div className="mt-3">
                  <div className="flex justify-between mb-2">
                    {Object.entries(question.scale.labels || {}).map(([value, label]) => (
                      <div key={value} className="text-center text-xs">
                        <div>{value}</div>
                        <div>{String(label)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between space-x-2">
                    {Array.from({length: question.scale.max - question.scale.min + 1}, (_, i) => i + question.scale.min).map(value => (
                      <div key={value} className="flex-1 flex justify-center">
                        <input 
                          type="radio" 
                          id={`q-${question.id || index}-val-${value}`} 
                          name={`question-${question.id || index}`}
                          value={value}
                          disabled={quizSubmitted}
                          checked={selectedAnswers[question.id || index] === value.toString()}
                          onChange={() => setSelectedAnswers({
                            ...selectedAnswers,
                            [question.id || index]: value.toString()
                          })}
                          className="h-4 w-4 text-primary border-neutrals-300 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          {!quizSubmitted ? (
            <Button 
              onClick={() => {
                setQuizSubmitted(true);
                
                // Calculate results
                let score = 0;
                const feedback: Record<string, string> = {};
                
                parsedData.questions.forEach((question: any, index: number) => {
                  const qId = question.id || index;
                  
                  if (question.type === 'multiple_choice') {
                    const correctIndex = question.options.findIndex((opt: any) => opt.correct);
                    if (correctIndex !== -1 && selectedAnswers[qId] === correctIndex.toString()) {
                      score++;
                      feedback[qId] = question.feedback?.correct || "Correct!";
                    } else {
                      feedback[qId] = question.feedback?.incorrect || "Incorrect";
                    }
                  }
                });
                
                setQuizResults({
                  score,
                  total: parsedData.questions.filter((q: any) => q.type === 'multiple_choice').length,
                  feedback
                });
              }}
            >
              Submit
            </Button>
          ) : (
            <div className="text-center p-4 bg-neutrals-50 rounded-lg w-full">
              <h3 className="font-semibold text-lg">Quiz Results</h3>
              {quizResults.total > 0 ? (
                <div className="mt-2">
                  <p>You scored {quizResults.score} out of {quizResults.total}</p>
                  <div className="mt-2">
                    <Progress value={(quizResults.score / quizResults.total) * 100} className="h-2" />
                  </div>
                </div>
              ) : (
                <p>Thank you for completing the questionnaire!</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For unknown types, render the JSON
  return (
    <div className="p-4">
      <h3 className="font-bold mb-3">Interactive Content</h3>
      <div className="bg-neutrals-50 p-3 rounded text-sm overflow-auto max-h-80">
        <pre className="text-xs">{JSON.stringify(parsedData, null, 2)}</pre>
      </div>
    </div>
  );
}
