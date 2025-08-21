import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, BookOpen, Users, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { CourseContentManager } from '@/components/CourseContentManager';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { useWallet } from '@/hooks/useWallet';
import type { Course } from '@shared/schema';

export function InstructorDashboard() {
  const { address, isConnected } = useWallet();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
            <h1 className="text-2xl font-bold">Course Content Management</h1>
          </div>
          
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-cyan-600" />
            <h2 className="text-2xl font-bold mb-4">Course Content Manager</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comprehensive course content management system for {selectedCourse.title}
            </p>
          </div>
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
            onClick={() => setShowCreateModal(true)}
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
                                onClick={() => setSelectedCourse(course)}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                Manage Content
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
                      onClick={() => setShowCreateModal(true)}
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
                                onClick={() => setSelectedCourse(course)}
                                variant="outline"
                              >
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

        <CreateCourseModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      </div>
    </div>
  );
}