import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Video, FileText, Link2, Save, X, BookOpen, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Course } from '@shared/schema';

interface CourseContentManagerProps {
  course: Course;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function CourseContentManager({ course }: CourseContentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('lessons');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch course content
  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/courses', course.id, 'lessons'],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/courses', course.id, 'quizzes'],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/courses', course.id, 'resources'],
  });

  // Mutations for creating content
  const createLessonMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${course.id}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', course.id, 'lessons'] });
      setShowAddDialog(false);
      toast({ title: 'Lesson created successfully' });
    }
  });

  const createQuizMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${course.id}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', course.id, 'quizzes'] });
      setShowAddDialog(false);
      toast({ title: 'Quiz created successfully' });
    }
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/courses/${course.id}/resources`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', course.id, 'resources'] });
      setShowAddDialog(false);
      toast({ title: 'Resource created successfully' });
    }
  });

  // Delete mutations
  const deleteLessonMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/lessons/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', course.id, 'lessons'] });
      toast({ title: 'Lesson deleted successfully' });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/quizzes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', course.id, 'quizzes'] });
      toast({ title: 'Quiz deleted successfully' });
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/resources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', course.id, 'resources'] });
      toast({ title: 'Resource deleted successfully' });
    }
  });

  const LessonForm = ({ onSubmit, initialData = {} }: any) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0,
      ...initialData
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Lesson Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter lesson title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the lesson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Video URL (Optional)</label>
          <Input
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lesson Content</label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your lesson content here..."
            rows={8}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save Lesson
          </Button>
        </div>
      </form>
    );
  };

  const QuizForm = ({ onSubmit, initialData = {} }: any) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      questions: [] as Question[],
      passingScore: 70,
      timeLimit: null,
      ...initialData
    });

    const [currentQuestion, setCurrentQuestion] = useState({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });

    const addQuestion = () => {
      if (currentQuestion.question && currentQuestion.options.some(opt => opt.trim())) {
        setFormData({
          ...formData,
          questions: [...formData.questions, { 
            ...currentQuestion, 
            id: Date.now().toString(),
            options: currentQuestion.options.filter(opt => opt.trim())
          }]
        });
        setCurrentQuestion({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        });
      }
    };

    const removeQuestion = (index: number) => {
      setFormData({
        ...formData,
        questions: formData.questions.filter((_, i) => i !== index)
      });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.questions.length === 0) {
        toast({ title: 'Please add at least one question', variant: 'destructive' });
        return;
      }
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Quiz Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter quiz title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Quiz instructions"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.passingScore}
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time Limit (minutes, optional)</label>
            <Input
              type="number"
              value={formData.timeLimit || ''}
              onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="No limit"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">Questions ({formData.questions.length})</h4>
          
          {formData.questions.map((q, index) => (
            <div key={index} className="mb-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{index + 1}. {q.question}</p>
                  <div className="mt-2 space-y-1">
                    {q.options.map((option, optIndex) => (
                      <p key={optIndex} className={`text-sm ${optIndex === q.correctAnswer ? 'text-green-600 font-medium' : ''}`}>
                        {String.fromCharCode(65 + optIndex)}. {option}
                        {optIndex === q.correctAnswer && ' ✓'}
                      </p>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
            <h5 className="font-medium">Add New Question</h5>
            
            <div>
              <Input
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                placeholder="Enter your question"
              />
            </div>

            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + index)}.</span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={currentQuestion.correctAnswer === index}
                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                    className="ml-2"
                  />
                </div>
              ))}
            </div>

            <div>
              <Textarea
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                placeholder="Explanation (optional)"
                rows={2}
              />
            </div>

            <Button type="button" onClick={addQuestion} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save Quiz
          </Button>
        </div>
      </form>
    );
  };

  const ResourceForm = ({ onSubmit, initialData = {} }: any) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      type: 'document',
      url: '',
      ...initialData
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Resource Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter resource title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this resource"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Resource Type</label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="link">External Link</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">URL</label>
          <Input
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
            type="url"
            required
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Save Resource
          </Button>
        </div>
      </form>
    );
  };

  const renderAddDialog = () => {
    const forms = {
      lessons: (
        <LessonForm onSubmit={(data: any) => createLessonMutation.mutate(data)} />
      ),
      quizzes: (
        <QuizForm onSubmit={(data: any) => createQuizMutation.mutate(data)} />
      ),
      resources: (
        <ResourceForm onSubmit={(data: any) => createResourceMutation.mutate(data)} />
      )
    };

    const titles = {
      lessons: 'Add New Lesson',
      quizzes: 'Add New Quiz',
      resources: 'Add New Resource'
    };

    return (
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{titles[activeTab as keyof typeof titles]}</DialogTitle>
          </DialogHeader>
          {forms[activeTab as keyof typeof forms]}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-cyan-600" />
                {course.title}
              </CardTitle>
              <p className="text-slate-600 dark:text-gray-400 mt-2">{course.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {course.studentCount || 0} students
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                {course.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Management Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Content Management</CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab.slice(0, -1)}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lessons" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Lessons ({lessons.length})
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quizzes ({quizzes.length})
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Resources ({resources.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="space-y-4">
              {lessons.length > 0 ? (
                lessons.map((lesson: any, index: number) => (
                  <Card key={lesson.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-cyan-100 text-cyan-800 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.description && (
                            <p className="text-sm text-slate-600 dark:text-gray-400">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            {lesson.duration && <span>{lesson.duration} minutes</span>}
                            {lesson.video_url && <span className="flex items-center gap-1"><Video className="w-3 h-3" />Video</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteLessonMutation.mutate(lesson.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No lessons created yet</p>
                  <p className="text-sm">Start by adding your first lesson to the course</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              {quizzes.length > 0 ? (
                quizzes.map((quiz: any, index: number) => (
                  <Card key={quiz.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{quiz.title}</h4>
                          {quiz.description && (
                            <p className="text-sm text-slate-600 dark:text-gray-400">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>Passing: {quiz.passing_score || 70}%</span>
                            {quiz.time_limit && <span>Time: {quiz.time_limit}min</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteQuizMutation.mutate(quiz.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No quizzes created yet</p>
                  <p className="text-sm">Add interactive quizzes to test student knowledge</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              {resources.length > 0 ? (
                resources.map((resource: any, index: number) => (
                  <Card key={resource.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{resource.title}</h4>
                          {resource.description && (
                            <p className="text-sm text-slate-600 dark:text-gray-400">{resource.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                            {resource.url && (
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                View Resource
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteResourceMutation.mutate(resource.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No resources added yet</p>
                  <p className="text-sm">Share helpful materials and links with students</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {renderAddDialog()}
    </div>
  );
}