import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, Video, FileText, MessageSquare, Users, 
  Edit2, Trash2, Plus, Eye, Play, Upload, Download,
  Calendar, Clock, Award, Settings, ChevronRight
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Course, Lesson, Quiz, Resource } from '@shared/schema';

interface CourseManagementProps {
  course: Course;
  userRole: 'instructor' | 'admin';
}

export function CourseManagement({ course, userRole }: CourseManagementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'lesson' | 'quiz' | 'resource'>('lesson');
  const queryClient = useQueryClient();

  // Fetch course content
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', course.id],
    queryFn: () => apiRequest(`/api/courses/${course.id}/lessons`),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes', course.id],
    queryFn: () => apiRequest(`/api/courses/${course.id}/quizzes`),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', course.id],
    queryFn: () => apiRequest(`/api/courses/${course.id}/resources`),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', 'course', course.id],
    queryFn: () => apiRequest(`/api/enrollments/course/${course.id}`),
  });

  // Mutations for content creation
  const createLessonMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${course.id}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', course.id] });
      setIsCreateDialogOpen(false);
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${course.id}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', course.id] });
      setIsCreateDialogOpen(false);
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${course.id}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', course.id] });
      setIsCreateDialogOpen(false);
    },
  });

  const handleCreateContent = (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    
    switch (createType) {
      case 'lesson':
        createLessonMutation.mutate({
          title: data.title,
          description: data.description,
          content: data.content,
          videoUrl: data.videoUrl,
          duration: parseInt(data.duration as string) || 0,
          order: lessons.length + 1,
          isPublished: false,
        });
        break;
      case 'quiz':
        createQuizMutation.mutate({
          title: data.title,
          description: data.description,
          questions: [],
          timeLimit: parseInt(data.timeLimit as string) || null,
          attempts: parseInt(data.attempts as string) || 3,
          passingScore: parseInt(data.passingScore as string) || 70,
          isPublished: false,
        });
        break;
      case 'resource':
        createResourceMutation.mutate({
          title: data.title,
          description: data.description,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: parseInt(data.fileSize as string) || null,
          isPublic: data.isPublic === 'on',
          uploadedBy: 'current-user', // TODO: Get from auth context
        });
        break;
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Total Students</CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{enrollments.length}</div>
          <p className="text-xs text-gray-600">Students enrolled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Lessons</CardTitle>
          <BookOpen className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{lessons.length}</div>
          <p className="text-xs text-gray-600">Course lessons</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Quizzes</CardTitle>
          <Award className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{quizzes.length}</div>
          <p className="text-xs text-gray-600">Course assessments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-black">Resources</CardTitle>
          <FileText className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{resources.length}</div>
          <p className="text-xs text-gray-600">Course materials</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderLessons = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">Course Lessons</h3>
        <Button 
          onClick={() => {
            setCreateType('lesson');
            setIsCreateDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson: Lesson) => (
          <Card key={lesson.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-black">{lesson.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {lesson.duration && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {lesson.duration} min
                      </Badge>
                    )}
                    {lesson.videoUrl && (
                      <Badge variant="secondary" className="text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    )}
                    <Badge 
                      variant={lesson.isPublished ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderQuizzes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">Course Quizzes</h3>
        <Button 
          onClick={() => {
            setCreateType('quiz');
            setIsCreateDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Quiz
        </Button>
      </div>

      <div className="grid gap-4">
        {quizzes.map((quiz: Quiz) => (
          <Card key={quiz.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-black">{quiz.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{quiz.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {quiz.questions.length} Questions
                    </Badge>
                    {quiz.timeLimit && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {quiz.timeLimit} min
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {quiz.passingScore}% to pass
                    </Badge>
                    <Badge 
                      variant={quiz.isPublished ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">Course Resources</h3>
        <Button 
          onClick={() => {
            setCreateType('resource');
            setIsCreateDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="grid gap-4">
        {resources.map((resource: Resource) => (
          <Card key={resource.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-black">{resource.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{resource.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {resource.fileType.toUpperCase()}
                    </Badge>
                    {resource.fileSize && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(resource.fileSize / 1024)} KB
                      </Badge>
                    )}
                    <Badge 
                      variant={resource.isPublic ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {resource.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCreateDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-black">
            Create {createType.charAt(0).toUpperCase() + createType.slice(1)}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleCreateContent(formData);
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Title</label>
              <Input name="title" required className="text-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Description</label>
              <Textarea name="description" className="text-black" />
            </div>
            
            {createType === 'lesson' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Content</label>
                  <Textarea name="content" rows={6} className="text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Video URL</label>
                  <Input name="videoUrl" type="url" className="text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Duration (minutes)</label>
                  <Input name="duration" type="number" className="text-black" />
                </div>
              </>
            )}

            {createType === 'quiz' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Time Limit (minutes)</label>
                  <Input name="timeLimit" type="number" className="text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Attempts Allowed</label>
                  <Input name="attempts" type="number" defaultValue="3" className="text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Passing Score (%)</label>
                  <Input name="passingScore" type="number" defaultValue="70" className="text-black" />
                </div>
              </>
            )}

            {createType === 'resource' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">File URL</label>
                  <Input name="fileUrl" type="url" required className="text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">File Type</label>
                  <Input name="fileType" required className="text-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">File Size (bytes)</label>
                  <Input name="fileSize" type="number" className="text-black" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isPublic" id="isPublic" />
                  <label htmlFor="isPublic" className="text-sm text-black">Make this resource public</label>
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Create {createType.charAt(0).toUpperCase() + createType.slice(1)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">{course.title}</h1>
        <p className="text-gray-600">{course.description}</p>
        <div className="flex items-center gap-4 mt-4">
          <Badge variant="outline" className="text-xs">
            {course.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {course.difficulty}
          </Badge>
          <Badge variant={course.isActive ? "default" : "outline"} className="text-xs">
            {course.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="lessons" className="mt-6">
          {renderLessons()}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {renderQuizzes()}
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          {renderResources()}
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Enrolled Students</h3>
            <div className="text-gray-600">
              {enrollments.length} students enrolled in this course
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {renderCreateDialog()}
    </div>
  );
}