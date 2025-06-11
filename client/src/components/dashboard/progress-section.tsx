import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Course, UserProgress } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function ProgressSection() {
  const [activeCourses, setActiveCourses] = useState<(Course & { progress?: UserProgress })[]>([]);

  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: progress, isLoading: isLoadingProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  useEffect(() => {
    if (courses) {
      // If there's no progress data or it's empty, show the first 3 courses anyway
      if (!progress || progress.length === 0) {
        console.log("No progress data found, showing first 3 courses", courses);
        const firstThreeCourses = courses.slice(0, 3).map(course => ({
          ...course,
          progress: {
            courseId: course.id,
            percentComplete: 0,
            completed: false,
            lastAccessed: new Date(),
            userId: 0,
            id: 0,
            createdAt: null
          }
        }));
        setActiveCourses(firstThreeCourses);
      } else {
        // Find courses that have progress (including completed courses)
        const inProgressCourses = courses
          .map(course => {
            const courseProgress = progress.find(p => p.courseId === course.id);
            return { ...course, progress: courseProgress };
          })
          .filter(course => course.progress) // Include all courses with progress
          .sort((a, b) => {
            // Sort by last accessed time, most recent first
            const timeA = a.progress?.lastAccessed ? new Date(a.progress.lastAccessed).getTime() : 0;
            const timeB = b.progress?.lastAccessed ? new Date(b.progress.lastAccessed).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 3); // Take top 3
        
        // If no courses have progress, show the first 3 available courses
        if (inProgressCourses.length === 0) {
          const firstThreeCourses = courses.slice(0, 3).map(course => ({
            ...course,
            progress: {
              courseId: course.id,
              percentComplete: 0,
              completed: false,
              lastAccessed: new Date(),
              userId: 0,
              id: 0,
              createdAt: null
            }
          }));
          setActiveCourses(firstThreeCourses);
        } else {
          setActiveCourses(inProgressCourses);
        }

        console.log("Active courses:", inProgressCourses);
        console.log("All progress data:", progress);
      }
    }
  }, [courses, progress]);

  const isLoading = isLoadingCourses || isLoadingProgress;

  // Format minutes into hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-neutrals-800">Your Progress</h2>
        <Link href="/courses">
          <a className="text-primary flex items-center text-sm font-medium hover:underline">
            View all courses
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </a>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-2 w-full mb-3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : activeCourses.length > 0 ? (
          // Course cards
          activeCourses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-32 bg-neutrals-300 relative">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-light text-white">
                    <span className="material-icons text-4xl">school</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-lg px-2 py-1 text-xs font-medium text-primary">
                  <span className="material-icons text-xs mr-1 align-middle">schedule</span>
                  <span>{formatDuration(course.duration || 0)}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center text-xs text-neutrals-600 mb-2">
                  <span className="material-icons text-xs mr-1">category</span>
                  <span>{course.level}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{course.name}</h3>
                <div className="w-full bg-neutrals-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-secondary h-2 rounded-full" 
                    style={{ width: `${course.progress?.percentComplete || 0}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutrals-600">
                    {course.progress?.percentComplete || 0}% Complete
                  </span>
                  <Link href={`/courses/${course.id}`}>
                    <a className="bg-primary hover:bg-primary-light text-white font-medium text-sm py-1 px-3 rounded transition-colors">
                      Continue
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="col-span-3 bg-white rounded-xl shadow-md p-6 text-center">
            <div className="flex flex-col items-center">
              <span className="material-icons text-4xl text-neutrals-400 mb-2">school</span>
              <h3 className="text-lg font-semibold mb-2">No courses in progress</h3>
              <p className="text-neutrals-600 mb-4">Start your learning journey by enrolling in a course.</p>
              <Link href="/courses">
                <a className="bg-primary hover:bg-primary-light text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors">
                  <span className="material-icons mr-2">search</span>
                  <span>Browse Courses</span>
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
