import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Clock, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: number;
  title: string;
  description?: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  orderIndex: number;
}

interface LessonProgressData {
  id: string;
  lessonId: number;
  userId: string;
  isCompleted: boolean;
  watchTime: number;
  completedAt?: Date;
  lastAccessedAt: Date;
}

interface LessonProgressProps {
  courseId: number;
  userId: string;
  onProgressUpdate?: (progress: number) => void;
}

export function LessonProgress({ courseId, userId, onProgressUpdate }: LessonProgressProps) {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<number, LessonProgressData>>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
    fetchProgress();
  }, [courseId, userId]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons`);
      if (response.ok) {
        const data = await response.json();
        setLessons(data.sort((a: Lesson, b: Lesson) => a.orderIndex - b.orderIndex));
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({ title: "Failed to load lessons", variant: "destructive" });
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/progress/course/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        const progressMap: Record<number, LessonProgressData> = {};
        data.forEach((p: LessonProgressData) => {
          progressMap[p.lessonId] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLessonProgress = async (lessonId: number, updates: Partial<LessonProgressData>) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...updates,
          lastAccessedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const updatedProgress = await response.json();
        setProgress(prev => ({
          ...prev,
          [lessonId]: updatedProgress
        }));

        // Calculate overall progress
        const totalLessons = lessons.length;
        const completedLessons = Object.values({
          ...progress,
          [lessonId]: updatedProgress
        }).filter(p => p.isCompleted).length;
        
        const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        onProgressUpdate?.(overallProgress);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({ title: "Failed to update progress", variant: "destructive" });
    }
  };

  const markLessonComplete = async (lessonId: number) => {
    const lessonProgress = progress[lessonId];
    const isCompleting = !lessonProgress?.isCompleted;

    await updateLessonProgress(lessonId, {
      isCompleted: isCompleting,
      completedAt: isCompleting ? new Date() : undefined
    });

    if (isCompleting) {
      toast({ title: "Lesson completed!", description: "Great job! Keep up the good work." });
    }
  };

  const startLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    
    // Track that the lesson was accessed
    updateLessonProgress(lesson.id, {
      lastAccessedAt: new Date()
    });
  };

  const calculateCourseProgress = () => {
    if (lessons.length === 0) return 0;
    const completedLessons = lessons.filter(lesson => progress[lesson.id]?.isCompleted).length;
    return Math.round((completedLessons / lessons.length) * 100);
  };

  const getNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
    return currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  };

  const getPreviousLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
    return currentIndex > 0 ? lessons[currentIndex - 1] : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (currentLesson) {
    const lessonProgress = progress[currentLesson.id];
    const nextLesson = getNextLesson();
    const previousLesson = getPreviousLesson();

    return (
      <div className="space-y-6">
        {/* Lesson Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {currentLesson.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={lessonProgress?.isCompleted ? "default" : "secondary"}>
                    Lesson {lessons.findIndex(l => l.id === currentLesson.id) + 1} of {lessons.length}
                  </Badge>
                  {currentLesson.duration && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {currentLesson.duration} min
                    </Badge>
                  )}
                  {lessonProgress?.isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => setCurrentLesson(null)}>
                Back to Course
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Video Player (if available) */}
        {currentLesson.videoUrl && (
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={currentLesson.videoUrl}
                  controls
                  className="w-full h-full"
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    updateLessonProgress(currentLesson.id, {
                      watchTime: Math.floor(video.currentTime)
                    });
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lesson Content */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
            {currentLesson.description && (
              <p className="text-gray-600">{currentLesson.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
            </div>
          </CardContent>
        </Card>

        {/* Lesson Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {previousLesson && (
                  <Button
                    variant="outline"
                    onClick={() => startLesson(previousLesson)}
                  >
                    ← Previous Lesson
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={lessonProgress?.isCompleted ? "outline" : "default"}
                  onClick={() => markLessonComplete(currentLesson.id)}
                >
                  {lessonProgress?.isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Incomplete
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
                
                {nextLesson && (
                  <Button
                    onClick={() => startLesson(nextLesson)}
                  >
                    Next Lesson →
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courseProgress = calculateCourseProgress();

  return (
    <div className="space-y-6">
      {/* Course Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Progress
            </CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {courseProgress}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={courseProgress} className="h-3 mb-2" />
          <p className="text-sm text-gray-600">
            {lessons.filter(l => progress[l.id]?.isCompleted).length} of {lessons.length} lessons completed
          </p>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.map((lesson, index) => {
          const lessonProgress = progress[lesson.id];
          const isCompleted = lessonProgress?.isCompleted;
          const isAccessed = lessonProgress?.lastAccessedAt;

          return (
            <Card
              key={lesson.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isCompleted ? 'border-green-200 bg-green-50' : ''
              }`}
              onClick={() => startLesson(lesson)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{lesson.title}</h4>
                    {lesson.description && (
                      <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {lesson.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {lesson.duration} minutes
                        </div>
                      )}
                      {isAccessed && (
                        <div className="text-sm text-gray-500">
                          Last accessed: {new Date(lessonProgress.lastAccessedAt).toLocaleDateString()}
                        </div>
                      )}
                      {lessonProgress?.watchTime && lesson.duration && (
                        <div className="text-sm text-gray-500">
                          Progress: {Math.round((lessonProgress.watchTime / (lesson.duration * 60)) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    <Play className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lessons.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No lessons available yet.</p>
            <p className="text-sm">The instructor is preparing course content. Check back soon!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}