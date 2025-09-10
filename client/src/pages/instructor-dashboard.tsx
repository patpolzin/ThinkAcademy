import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Users, BarChart3, Settings, MessageSquare, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CourseEditor } from '@/components/CourseEditor';
import { CoursePublisher } from '@/components/CoursePublisher';
import { QuizBuilder } from '@/components/QuizBuilder';
import { CourseForum } from '@/components/CourseForum';
import { useWallet } from '@/hooks/useWallet';
import type { Course } from '@shared/schema';

export function InstructorDashboard() {
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | undefined>(undefined);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Get user data from Supabase with proper permissions
  const { data: userData } = useQuery({
    queryKey: ['/api/users', address],
    enabled: isConnected && !!address,
  });

  const user = userData || {
    id: address,
    displayName: '',
    isInstructor: false
  };

  // Fetch courses for this instructor
  const { data: allCourses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: isConnected,
  });

  const courses = allCourses.filter((course: Course) => 
    course.instructorId === user?.id || course.instructorName === user?.displayName
  );

  // Analytics for instructor
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
  });

  // Course Editor View
  if (showCourseEditor) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <CourseEditor
            courseId={editingCourseId}
            onClose={() => {
              setShowCourseEditor(false);
              setEditingCourseId(undefined);
              // Refresh courses data
              queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
              queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
            }}
            currentUserId={address}
          />
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedCourse(null)}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Course Management: {selectedCourse.title}</h1>
          </div>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Quizzes
              </TabsTrigger>
              <TabsTrigger value="forum" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Forum
              </TabsTrigger>
              <TabsTrigger value="publish" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Publish
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCourse.isActive ? 'Published' : 'Draft'}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedCourse.isActive ? 'Visible to students' : 'Hidden from students'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Students Enrolled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedCourse.studentCount || 0}</div>
                    <p className="text-sm text-gray-500">Active enrollments</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(selectedCourse.lessonCount || 0) + (selectedCourse.assignmentCount || 0)}
                    </div>
                    <p className="text-sm text-gray-500">Lessons & quizzes</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Course Information</CardTitle>
                    <Button
                      onClick={() => {
                        setEditingCourseId(selectedCourse.id);
                        setShowCourseEditor(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Course
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Description</h4>
                      <p className="text-gray-600 dark:text-gray-400">{selectedCourse.description}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-medium text-sm">Category</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedCourse.category}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Difficulty</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedCourse.difficulty}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Duration</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedCourse.duration} hours</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Created</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedCourse.createdAt ? new Date(selectedCourse.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-6">
              <QuizBuilder 
                courseId={selectedCourse.id} 
                onQuizCreated={() => {
                  // Refresh course data
                  console.log('Quiz created for course:', selectedCourse.id);
                }}
              />
            </TabsContent>

            <TabsContent value="forum" className="space-y-6">
              <CourseForum 
                courseId={selectedCourse.id} 
                currentUserId={address}
              />
            </TabsContent>

            <TabsContent value="publish" className="space-y-6">
              <CoursePublisher 
                course={selectedCourse}
                onPublishStatusChange={(isPublished) => {
                  // Update the course state
                  setSelectedCourse({
                    ...selectedCourse,
                    isActive: isPublished
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Instructor Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your courses and track student progress
            </p>
          </div>
          <Button 
            onClick={() => {
              setEditingCourseId(undefined);
              setShowCourseEditor(true);
            }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Active courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce((sum: number, course: Course) => sum + (course.studentCount || 0), 0)}
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.avgCompletionRate || 0}%</div>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Average across courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Items</CardTitle>
              <Settings className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce((sum: number, course: Course) => 
                  sum + (course.lessonCount || 0) + (course.assignmentCount || 0), 0
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-400">
                Lessons & quizzes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Courses Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-600" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Courses</TabsTrigger>
                <TabsTrigger value="draft">Draft Courses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                {courses.filter((course: Course) => course.isActive).length > 0 ? (
                  <div className="grid gap-4">
                    {courses.filter((course: Course) => course.isActive).map((course: Course) => (
                      <Card key={course.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                {course.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {course.studentCount || 0} students
                                </span>
                                <span>{course.category}</span>
                                <span>{course.difficulty}</span>
                                {course.duration && <span>{course.duration} hours</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => {
                                  setEditingCourseId(course.id);
                                  setShowCourseEditor(true);
                                }}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Course
                              </Button>
                              <Button variant="outline" size="sm">
                                View Analytics
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No active courses</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first course to start teaching students
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingCourseId(undefined);
                        setShowCourseEditor(true);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="draft" className="space-y-4">
                {courses.filter((course: Course) => !course.isActive).length > 0 ? (
                  <div className="grid gap-4">
                    {courses.filter((course: Course) => !course.isActive).map((course: Course) => (
                      <Card key={course.id} className="border-dashed">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {course.description}
                              </p>
                              <div className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded inline-block">
                                Draft
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => {
                                  setEditingCourseId(course.id);
                                  setShowCourseEditor(true);
                                }}
                                variant="outline"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Content
                              </Button>
                              <Button variant="outline" size="sm">
                                Publish Course
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">No draft courses</div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}