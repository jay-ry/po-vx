import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export function RecommendedCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const { data: progress } = useQuery<any[]>({
    queryKey: ["/api/progress"],
    initialData: [], // Provide empty array as initial data
  });
  
  // Create progress mutation with a more specific key to avoid conflicts
  // We're just using this as a placeholder to maintain the structure
  // The actual functionality is now in the handleEnroll function
  const progressMutation = useMutation({
    mutationKey: ["enrollCourse"],
    mutationFn: async (courseId: number) => {
      console.log("Enrolling in course:", courseId);
      // We're not actually calling the API anymore, just returning success
      return { success: true, courseId, redirected: true };
    },
    onSuccess: (data, variables) => {
      console.log("Enrollment successful:", data);
    },
    onError: (error: any) => {
      console.error("Enrollment failed:", error);
      
      toast({
        title: "Enrollment failed",
        description: error.message || "Failed to enroll in course. Please try again.",
        variant: "destructive"
      });
      
      // If not authenticated, redirect to login
      if (error.message === "Not authenticated" || error.message?.includes("log in")) {
        // Redirect to auth page
        toast({
          title: "Authentication required",
          description: "Please log in to enroll in courses",
          variant: "destructive"
        });
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
      }
    }
  });
  
  // Filter out courses that the user has already started
  const enrolledCourseIds = progress ? progress.map((p: any) => p.courseId) : [];
  
  // Recommend courses the user hasn't started yet
  const recommendedCourses = courses
    ? courses
        .filter(course => !enrolledCourseIds.includes(course.id))
        .slice(0, 4)
    : [];
  
  const handleEnroll = (courseId: number) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in or register to enroll in a course",
        variant: "destructive"
      });
      
      // Redirect to auth page after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1500);
      return;
    }
    
    // Show success toast
    toast({
      title: "Starting course",
      description: "Taking you to the course page now",
    });
    
    // Skip enrollment and go directly to course page
    setTimeout(() => {
      window.location.href = `/courses/${courseId}`;
    }, 500);
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-neutrals-800">Recommended For You</h2>
        <div className="flex space-x-2">
          <button className="p-1.5 rounded-full text-neutrals-600 hover:bg-neutrals-200 transition-colors">
            <span className="material-icons">chevron_left</span>
          </button>
          <button className="p-1.5 rounded-full text-neutrals-600 hover:bg-neutrals-200 transition-colors">
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))
        ) : recommendedCourses.length > 0 ? (
          // Course cards
          recommendedCourses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-32 bg-neutrals-300 relative">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-light text-white">
                    <span className="material-icons text-4xl">school</span>
                  </div>
                )}
                {course.id % 2 === 0 && (
                  <div className="absolute top-2 right-2 bg-primary rounded-lg px-2 py-1 text-xs font-medium text-white">
                    New
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center text-xs text-neutrals-600 mb-2">
                  <span className="material-icons text-xs mr-1">category</span>
                  <span>{course.level}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{course.name}</h3>
                <p className="text-sm text-neutrals-600 mb-3 line-clamp-2">
                  {course.description || "Learn essential skills and knowledge in this comprehensive course designed for Abu Dhabi frontliners."}
                </p>
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <Link href={`/courses/${course.id}`}>
                      <Button
                        variant="default"
                        className="w-full bg-primary hover:bg-primary-dark text-white shadow"
                      >
                        View Course
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link href="/auth">
                      <Button
                        variant="outline"
                        className="w-full bg-neutrals-100 hover:bg-neutrals-200 text-primary"
                      >
                        Login to Enroll
                      </Button>
                    </Link>
                    
                    <Link href={`/courses/${course.id}`}>
                      <Button
                        variant="link"
                        className="w-full text-primary hover:text-primary/90"
                      >
                        Preview Course
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="col-span-4 bg-white rounded-xl shadow-md p-6 text-center">
            <div className="flex flex-col items-center">
              <span className="material-icons text-4xl text-neutrals-400 mb-2">check_circle</span>
              <h3 className="text-lg font-semibold mb-2">You're all caught up!</h3>
              <p className="text-neutrals-600">You've enrolled in all available courses. Check back later for new content.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
