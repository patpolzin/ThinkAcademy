import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Users, Award, Play, FileText, MessageCircle, CheckCircle, Lock, Unlock, LogOut, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/components/WalletProvider';
import { apiRequest } from '@/lib/queryClient';
import EnrollmentModal from '@/components/EnrollmentModal';
import { CourseForum } from '@/components/CourseForum';
import { LessonProgress } from '@/components/LessonProgress';
import { Link } from 'wouter';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id;
  const { address } = useWallet();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch course details
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['/api/courses', courseId],
    enabled: !!courseId,
  });

  // Check if user is enrolled and get enrollment data
  const { data: enrollmentData, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['/api/enrollments/user', address],
    enabled: !!address,
  });

  // Fetch course content
  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/courses', courseId, 'lessons'],
    enabled: !!courseId,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/courses', courseId, 'quizzes'],
    enabled: !!courseId,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/courses', courseId, 'resources'],
    enabled: !!courseId,
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['/api/forums/course', courseId],
    enabled: !!courseId,
  });

  // Check if user is enrolled in this specific course
  const enrollment = enrollmentData?.find((e: any) => e.course_id === parseInt(courseId || '0'));
  const isEnrolled = !!enrollment;
  const progressPercentage = enrollment?.progress_percentage || 0;

  // Unenroll mutation
  const unenrollMutation = useMutation({
    mutationFn: async () => {
      if (!enrollment) return;
      return apiRequest(`/api/enrollments/${enrollment.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Successfully unenrolled from course" });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to unenroll", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  if (courseLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-white">Loading course...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Course Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400">The course you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="mt-4" variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-slate-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700">
                  {course.category}
                </Badge>
                <Badge variant={course.difficulty === 'Advanced' ? 'destructive' : 'default'}>
                  {course.difficulty}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {course.title}
              </h1>
              
              <p className="text-slate-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{course.duration}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{course.studentCount || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">Certificate</span>
                </div>
              </div>
              
              <p className="text-slate-700 dark:text-gray-300 font-medium">
                Instructor: {course.instructorName || course.instructor || 'Unknown Instructor'}
              </p>

              {isEnrolled && (
                <div className="mt-6 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">Your Progress</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-bold">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              )}
            </div>
            
            <div className="lg:w-80">
              <Card className="border-2 border-slate-200 dark:border-gray-700">
                <CardContent className="p-6">
                  {!address ? (
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-700 dark:text-gray-300 mb-4 font-medium">Connect your wallet to enroll</p>
                      <Button disabled className="w-full">
                        Connect Wallet First
                      </Button>
                    </div>
                  ) : !isEnrolled ? (
                    <div className="text-center">
                      <Unlock className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-slate-700 dark:text-gray-300 mb-4 font-medium">Ready to start learning?</p>
                      <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                        Join this course to access all lessons, quizzes, resources, and discussion forums.
                      </p>
                      <Button 
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        onClick={() => setShowEnrollmentModal(true)}
                        data-testid="button-enroll-course"
                      >
                        Enroll Now
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-green-700 dark:text-green-300 font-bold mb-2">You're enrolled!</p>
                      <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                        Progress: {progressPercentage}% complete
                      </p>
                      <div className="space-y-2">
                        <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-continue-learning">
                          Continue Learning
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20" 
                          onClick={() => unenrollMutation.mutate()}
                          disabled={unenrollMutation.isPending}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          {unenrollMutation.isPending ? 'Unenrolling...' : 'Unenroll'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content */}
        {isEnrolled ? (
          <Tabs defaultValue="lessons" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 p-1 rounded-lg border border-slate-200 dark:border-gray-700">
              <TabsTrigger value="lessons" className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <Play className="w-4 h-4" />
                Lessons
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <FileText className="w-4 h-4" />
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <FileText className="w-4 h-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                <MessageCircle className="w-4 h-4" />
                Forum
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="space-y-4">
              <LessonProgress 
                courseId={parseInt(courseId || '0')} 
                userId={address || ''}
                onProgressUpdate={(progress) => {
                  // Update enrollment progress if needed
                  console.log('Course progress updated:', progress);
                }}
              />
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              <Card className="border border-slate-200 dark:border-gray-700">
                <CardHeader className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Course Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {quizzes.length > 0 ? (
                    <div className="space-y-4">
                      {quizzes.map((quiz: any, index: number) => (
                        <div
                          key={quiz.id}
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-slate-200 dark:border-gray-600"
                        >
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {quiz.title}
                            </h4>
                            {quiz.description && (
                              <p className="text-slate-600 dark:text-gray-300 mt-1">
                                {quiz.description}
                              </p>
                            )}
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                              Questions: {quiz.questions?.length || 0}
                            </p>
                          </div>
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-700 dark:text-gray-300 font-medium text-lg">No quizzes available yet</p>
                      <p className="text-slate-500 dark:text-gray-400 mt-2">Assessments will be added as the course progresses</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card className="border border-slate-200 dark:border-gray-700">
                <CardHeader className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Course Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {resources.length > 0 ? (
                    <div className="space-y-4">
                      {resources.map((resource: any) => (
                        <div
                          key={resource.id}
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-slate-200 dark:border-gray-600"
                        >
                          <FileText className="w-10 h-10 text-purple-600" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {resource.title}
                            </h4>
                            {resource.description && (
                              <p className="text-slate-600 dark:text-gray-300 mt-1">
                                {resource.description}
                              </p>
                            )}
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                              Type: {resource.fileType || resource.type || 'Document'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-700 dark:text-gray-300 font-medium text-lg">No resources available yet</p>
                      <p className="text-slate-500 dark:text-gray-400 mt-2">Downloadable materials will be added by your instructor</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forum" className="space-y-4">
              <CourseForum 
                courseId={parseInt(courseId || '0')} 
                currentUserId={address} 
              />
            </TabsContent>
          </Tabs>
        ) : (
          // Course Preview for Non-Enrolled Users
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border border-slate-200 dark:border-gray-700">
                <CardHeader className="text-center pb-3">
                  <Play className="w-12 h-12 text-cyan-600 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Comprehensive video content</h3>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-slate-600 dark:text-gray-300">
                    Engaging video lessons with step-by-step explanations
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-gray-700">
                <CardHeader className="text-center pb-3">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Test your knowledge</h3>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-slate-600 dark:text-gray-300">
                    Interactive quizzes to reinforce your learning
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-gray-700">
                <CardHeader className="text-center pb-3">
                  <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Connect with peers</h3>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-slate-600 dark:text-gray-300">
                    Join discussions and learn from other students
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Call to Action */}
            <Card className="border-2 border-dashed border-cyan-300 dark:border-cyan-700">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Ready to start learning?
                </h2>
                <p className="text-slate-600 dark:text-gray-300 mb-6">
                  Join this course to access all lessons, quizzes, resources, and discussion forums.
                </p>
                <Button 
                  onClick={() => setShowEnrollmentModal(true)}
                  size="lg"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  data-testid="button-enroll-now"
                >
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enrollment Modal */}
        {showEnrollmentModal && (
          <EnrollmentModal
            course={course}
            isOpen={showEnrollmentModal}
            onClose={() => setShowEnrollmentModal(false)}
          />
        )}
      </div>
    </div>
  );
}