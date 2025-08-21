import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Plus, Save, Eye, Edit2, Trash2, 
  Clock, Award, FileText, Video, Users, CheckCircle, ExternalLink, Upload
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TestCourse {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructorName: string;
  lessons: TestLesson[];
  quizzes: TestQuiz[];
  resources: TestResource[];
}

interface TestLesson {
  id?: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
}

interface TestQuiz {
  id?: string;
  title: string;
  description: string;
  questions: TestQuestion[];
  timeLimit?: number;
  attempts: number;
  passingScore: number;
}

interface TestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface TestResource {
  id?: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  isPublic: boolean;
}

export function CourseCreationTest() {
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState<TestCourse>({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    instructorName: 'Test Instructor',
    lessons: [],
    quizzes: [],
    resources: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string>('');
  const [activeModal, setActiveModal] = useState<{
    type: 'lesson' | 'quiz' | 'resource';
    mode: 'create' | 'edit';
    data: any;
  } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutations for creating course content
  const createCourseMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (result) => {
      setCreatedCourseId(result.id);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: "Course Created Successfully",
        description: `Course "${course.title}" has been created.`,
      });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ courseId, lesson }: { courseId: string; lesson: TestLesson }) => 
      apiRequest(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(lesson),
      }),
  });

  const createQuizMutation = useMutation({
    mutationFn: ({ courseId, quiz }: { courseId: string; quiz: TestQuiz }) => 
      apiRequest(`/api/courses/${courseId}/quizzes`, {
        method: 'POST',
        body: JSON.stringify(quiz),
      }),
  });

  const createResourceMutation = useMutation({
    mutationFn: ({ courseId, resource }: { courseId: string; resource: TestResource }) => 
      apiRequest(`/api/courses/${courseId}/resources`, {
        method: 'POST',
        body: JSON.stringify(resource),
      }),
  });

  const fillSampleData = () => {
    setCourse({
      title: 'Introduction to Blockchain Technology',
      description: 'A comprehensive course covering the fundamentals of blockchain technology, including cryptocurrencies, smart contracts, and decentralized applications.',
      category: 'Technology',
      difficulty: 'beginner',
      instructorName: 'UTHINK Expert',
      lessons: [
        {
          title: 'What is Blockchain?',
          description: 'Introduction to the basic concepts of blockchain technology',
          content: 'Blockchain is a distributed ledger technology that maintains a continuously growing list of records, called blocks, which are linked and secured using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data.',
          videoUrl: 'https://example.com/video1',
          duration: 15,
          order: 1
        },
        {
          title: 'Understanding Cryptocurrencies',
          description: 'Deep dive into digital currencies and how they work',
          content: 'Cryptocurrencies are digital or virtual currencies that use cryptography for security. They are decentralized and operate independently of traditional banking systems.',
          videoUrl: 'https://example.com/video2',
          duration: 20,
          order: 2
        },
        {
          title: 'Smart Contracts Explained',
          description: 'Learn about self-executing contracts with terms directly written into code',
          content: 'Smart contracts are self-executing contracts with the terms of the agreement directly written into lines of code. They automatically execute when predetermined conditions are met.',
          videoUrl: 'https://example.com/video3',
          duration: 25,
          order: 3
        }
      ],
      quizzes: [
        {
          title: 'Blockchain Basics Quiz',
          description: 'Test your understanding of basic blockchain concepts',
          questions: [
            {
              question: 'What is a blockchain?',
              options: [
                'A centralized database',
                'A distributed ledger technology',
                'A type of cryptocurrency',
                'A programming language'
              ],
              correctAnswer: 1,
              explanation: 'A blockchain is a distributed ledger technology that maintains records across multiple computers.'
            },
            {
              question: 'What provides security in blockchain?',
              options: [
                'Passwords',
                'Cryptography',
                'Firewalls',
                'Antivirus software'
              ],
              correctAnswer: 1,
              explanation: 'Cryptographic hashing and digital signatures provide security in blockchain networks.'
            }
          ],
          timeLimit: 10,
          attempts: 3,
          passingScore: 70
        },
        {
          title: 'Cryptocurrency Knowledge Check',
          description: 'Assess your knowledge of digital currencies',
          questions: [
            {
              question: 'What makes cryptocurrencies decentralized?',
              options: [
                'Government control',
                'Bank oversight',
                'No central authority',
                'Corporate management'
              ],
              correctAnswer: 2,
              explanation: 'Cryptocurrencies operate without a central authority like banks or governments.'
            }
          ],
          timeLimit: 5,
          attempts: 2,
          passingScore: 80
        }
      ],
      resources: [
        {
          title: 'Blockchain Whitepaper Collection',
          description: 'Essential whitepapers including Bitcoin and Ethereum',
          fileUrl: 'https://example.com/whitepapers.pdf',
          fileType: 'pdf',
          isPublic: true
        },
        {
          title: 'Cryptocurrency Price Tracker',
          description: 'Excel template for tracking cryptocurrency prices',
          fileUrl: 'https://example.com/tracker.xlsx',
          fileType: 'xlsx',
          isPublic: true
        },
        {
          title: 'Smart Contract Examples',
          description: 'Sample smart contract code in Solidity',
          fileUrl: 'https://example.com/contracts.zip',
          fileType: 'zip',
          isPublic: false
        }
      ]
    });
    setStep(2);
  };

  // Content management functions
  const moveLesson = (fromIndex: number, toIndex: number) => {
    const newLessons = [...course.lessons];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    setCourse({ ...course, lessons: newLessons });
  };

  const moveQuiz = (fromIndex: number, toIndex: number) => {
    const newQuizzes = [...course.quizzes];
    const [movedQuiz] = newQuizzes.splice(fromIndex, 1);
    newQuizzes.splice(toIndex, 0, movedQuiz);
    setCourse({ ...course, quizzes: newQuizzes });
  };

  const moveResource = (fromIndex: number, toIndex: number) => {
    const newResources = [...course.resources];
    const [movedResource] = newResources.splice(fromIndex, 1);
    newResources.splice(toIndex, 0, movedResource);
    setCourse({ ...course, resources: newResources });
  };

  const deleteLesson = (index: number) => {
    const newLessons = course.lessons.filter((_, i) => i !== index);
    setCourse({ ...course, lessons: newLessons });
    toast({
      title: "Lesson Deleted",
      description: "The lesson has been removed from the course.",
    });
  };

  const deleteQuiz = (index: number) => {
    const newQuizzes = course.quizzes.filter((_, i) => i !== index);
    setCourse({ ...course, quizzes: newQuizzes });
    toast({
      title: "Quiz Deleted",
      description: "The quiz has been removed from the course.",
    });
  };

  const deleteResource = (index: number) => {
    const newResources = course.resources.filter((_, i) => i !== index);
    setCourse({ ...course, resources: newResources });
    toast({
      title: "Resource Deleted", 
      description: "The resource has been removed from the course.",
    });
  };

  const createFullCourse = async () => {
    setIsCreating(true);
    try {
      // Step 1: Create the course
      const newCourse = await createCourseMutation.mutateAsync({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        instructorName: course.instructorName,
        tokenRequirement: { type: 'NONE' },
        isActive: true
      });

      const courseId = newCourse.id;

      // Step 2: Create lessons
      for (const lesson of course.lessons) {
        await createLessonMutation.mutateAsync({
          courseId,
          lesson
        });
      }

      // Step 3: Create quizzes
      for (const quiz of course.quizzes) {
        await createQuizMutation.mutateAsync({
          courseId,
          quiz
        });
      }

      // Step 4: Create resources
      for (const resource of course.resources) {
        await createResourceMutation.mutateAsync({
          courseId,
          resource
        });
      }

      setStep(3);
      toast({
        title: "Complete Course Created!",
        description: `Course with ${course.lessons.length} lessons, ${course.quizzes.length} quizzes, and ${course.resources.length} resources.`,
      });

    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error Creating Course",
        description: "There was an error creating the complete course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Course Creation Test</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Test the complete LMS functionality by creating a sample course with lessons, quizzes, and resources.
        </p>
      </div>

      <Card className="card-content">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Manual Course Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Course Title</label>
            <Input 
              value={course.title}
              onChange={(e) => setCourse({...course, title: e.target.value})}
              className="input-field"
              placeholder="Enter course title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <Textarea 
              value={course.description}
              onChange={(e) => setCourse({...course, description: e.target.value})}
              className="input-field"
              placeholder="Enter course description"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <Select value={course.category} onValueChange={(value) => setCourse({...course, category: value})}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
              <Select value={course.difficulty} onValueChange={(value) => setCourse({...course, difficulty: value})}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setStep(2)} 
              disabled={!course.title || !course.description}
              className="btn-primary animate-button animate-glow ripple-effect"
            >
              Continue Manual Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="text-slate-600 dark:text-slate-400 mb-4">Or</div>
        <Button onClick={fillSampleData} className="btn-secondary animate-button-subtle animate-glow">
          <BookOpen className="w-4 h-4 mr-2 animate-rotate" />
          Use Sample Blockchain Course Data
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Course Content Review</h2>
        <Button onClick={createFullCourse} disabled={isCreating} className="btn-primary animate-button animate-glow ripple-effect">
          {isCreating ? 'Creating...' : 'Create Complete Course'}
          <Save className={`w-4 h-4 ml-2 ${isCreating ? 'animate-spin-slow' : ''}`} />
        </Button>
      </div>

      <Card className="card-content">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">{course.title}</CardTitle>
          <p className="text-slate-700 dark:text-slate-300">{course.description}</p>
          <div className="flex gap-2 mt-2">
            <Badge className="badge-secondary">{course.category}</Badge>
            <Badge className="badge-secondary">{course.difficulty}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lessons" className="text-slate-700 dark:text-slate-300">
            Lessons ({course.lessons.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="text-slate-700 dark:text-slate-300">
            Quizzes ({course.quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-slate-700 dark:text-slate-300">
            Resources ({course.resources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="tab-content mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Lessons</h3>
              <Button 
                onClick={() => setActiveModal({ type: 'lesson', mode: 'create', data: null })}
                className="btn-primary animate-button"
                data-testid="button-create-lesson"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Lesson
              </Button>
            </div>
            
            {course.lessons.length === 0 ? (
              <Card className="card-content border-dashed border-2 border-slate-300 dark:border-slate-600">
                <CardContent className="p-8 text-center">
                  <Video className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No lessons yet</h4>
                  <p className="text-slate-500 dark:text-slate-500 mb-4">Create your first lesson to get started</p>
                  <Button 
                    onClick={() => setActiveModal({ type: 'lesson', mode: 'create', data: null })}
                    variant="outline"
                    data-testid="button-create-first-lesson"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Lesson
                  </Button>
                </CardContent>
              </Card>
            ) : (
              course.lessons.map((lesson, index) => (
                <Card key={index} className="card-content animate-card animate-fade-in group" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center animate-bounce-subtle">
                          <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveLesson(index, index - 1)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-move-lesson-up-${index}`}
                            >
                              ↑
                            </Button>
                          )}
                          {index < course.lessons.length - 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveLesson(index, index + 1)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-move-lesson-down-${index}`}
                            >
                              ↓
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-50">{lesson.title}</h4>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{lesson.description}</p>
                            {lesson.videoUrl && (
                              <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                                  <Video className="w-8 h-8 text-slate-400" />
                                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Video: {lesson.videoUrl}</span>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {lesson.duration} min
                              </Badge>
                              {lesson.videoUrl && (
                                <Badge variant="secondary" className="text-xs">
                                  <Video className="w-3 h-3 mr-1" />
                                  Video
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveModal({ type: 'lesson', mode: 'edit', data: { ...lesson, index } })}
                              data-testid={`button-edit-lesson-${index}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteLesson(index)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-lesson-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="tab-content mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Quizzes</h3>
              <Button 
                onClick={() => setActiveModal({ type: 'quiz', mode: 'create', data: null })}
                className="btn-primary animate-button"
                data-testid="button-create-quiz"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Quiz
              </Button>
            </div>
            
            {course.quizzes.length === 0 ? (
              <Card className="card-content border-dashed border-2 border-slate-300 dark:border-slate-600">
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No quizzes yet</h4>
                  <p className="text-slate-500 dark:text-slate-500 mb-4">Create your first quiz to test student knowledge</p>
                  <Button 
                    onClick={() => setActiveModal({ type: 'quiz', mode: 'create', data: null })}
                    variant="outline"
                    data-testid="button-create-first-quiz"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              course.quizzes.map((quiz, index) => (
                <Card key={index} className="card-content group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveQuiz(index, index - 1)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-move-quiz-up-${index}`}
                            >
                              ↑
                            </Button>
                          )}
                          {index < course.quizzes.length - 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveQuiz(index, index + 1)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-move-quiz-down-${index}`}
                            >
                              ↓
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-50">{quiz.title}</h4>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{quiz.description}</p>
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
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveModal({ type: 'quiz', mode: 'edit', data: { ...quiz, index } })}
                              data-testid={`button-edit-quiz-${index}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteQuiz(index)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-quiz-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="tab-content mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Resources</h3>
              <Button 
                onClick={() => setActiveModal({ type: 'resource', mode: 'create', data: null })}
                className="btn-primary animate-button"
                data-testid="button-create-resource"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Resource
              </Button>
            </div>
            
            {course.resources.length === 0 ? (
              <Card className="card-content border-dashed border-2 border-slate-300 dark:border-slate-600">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No resources yet</h4>
                  <p className="text-slate-500 dark:text-slate-500 mb-4">Add resources like PDFs, links, and files for students</p>
                  <Button 
                    onClick={() => setActiveModal({ type: 'resource', mode: 'create', data: null })}
                    variant="outline"
                    data-testid="button-create-first-resource"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Resource
                  </Button>
                </CardContent>
              </Card>
            ) : (
              course.resources.map((resource, index) => (
                <Card key={index} className="card-content group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          {resource.fileType === 'link' ? (
                            <ExternalLink className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveResource(index, index - 1)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-move-resource-up-${index}`}
                            >
                              ↑
                            </Button>
                          )}
                          {index < course.resources.length - 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveResource(index, index + 1)}
                              className="h-6 w-6 p-0"
                              data-testid={`button-move-resource-down-${index}`}
                            >
                              ↓
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-50">{resource.title}</h4>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{resource.description}</p>
                            {resource.fileType === 'link' && resource.url && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(resource.url, '_blank')}
                                  className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open Link
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {resource.fileType.toUpperCase()}
                              </Badge>
                              <Badge 
                                variant={resource.isPublic ? "default" : "outline"} 
                                className="text-xs"
                              >
                                {resource.isPublic ? 'Public' : 'Private'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveModal({ type: 'resource', mode: 'edit', data: { ...resource, index } })}
                              data-testid={`button-edit-resource-${index}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteResource(index)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-resource-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Course Created Successfully!</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Your complete course has been created with all lessons, quizzes, and resources.
        </p>
      </div>
      <Card className="card-content">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Course Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{course.lessons.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{course.quizzes.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Quizzes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{course.resources.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Resources</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => window.location.href = `/course/${createdCourseId}`} className="btn-primary animate-button animate-glow ripple-effect">
          <Eye className="w-4 h-4 mr-2" />
          View Course
        </Button>
        <Button onClick={() => {
          setStep(1);
          setCourse({
            title: '',
            description: '',
            category: '',
            difficulty: '',
            instructorName: 'Test Instructor',
            lessons: [],
            quizzes: [],
            resources: []
          });
          setCreatedCourseId('');
        }} className="btn-secondary animate-button-subtle">
          Create Another Course
        </Button>
      </div>
    </div>
  );

  // Modal state for lessons
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    duration: 15,
  });

  // Modal state for quizzes
  const [quizFormData, setQuizFormData] = useState({
    title: '',
    description: '',
    timeLimit: 10,
    attempts: 3,
    passingScore: 70,
    questions: [],
  });

  // Modal state for resources
  const [resourceFormData, setResourceFormData] = useState({
    title: '',
    description: '',
    fileType: 'link',
    url: '',
    fileUrl: '',
    isPublic: true,
  });

    const handleSave = () => {
      const newLesson = {
        ...lessonFormData,
        order: isEdit ? lessonData.order : course.lessons.length + 1,
      };

      if (isEdit) {
        const newLessons = [...course.lessons];
        newLessons[lessonData.index] = newLesson;
        setCourse({ ...course, lessons: newLessons });
      } else {
        setCourse({ ...course, lessons: [...course.lessons, newLesson] });
      }

      setActiveModal(null);
      setLessonFormData({ title: '', description: '', content: '', videoUrl: '', duration: 15 });
      toast({
        title: isEdit ? "Lesson Updated" : "Lesson Created",
        description: `Lesson "${lessonFormData.title}" has been ${isEdit ? 'updated' : 'added to the course'}.`,
      });
    };

    return (
      <Dialog open={activeModal?.type === 'lesson'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Introduction to Blockchain"
                data-testid="input-lesson-title"
              />
            </div>
            <div>
              <Label htmlFor="lesson-description">Description</Label>
              <Textarea
                id="lesson-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of what students will learn"
                data-testid="textarea-lesson-description"
              />
            </div>
            <div>
              <Label htmlFor="lesson-content">Lesson Content</Label>
              <Textarea
                id="lesson-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Detailed lesson content, instructions, and learning materials"
                className="min-h-[120px]"
                data-testid="textarea-lesson-content"
              />
            </div>
            <div>
              <Label htmlFor="lesson-video">Video URL (Optional)</Label>
              <Input
                id="lesson-video"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or embedded video URL"
                data-testid="input-lesson-video"
              />
              {formData.videoUrl && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Video className="w-4 h-4" />
                    <span>Video will be embedded in the lesson</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="lesson-duration">Duration (minutes)</Label>
              <Input
                id="lesson-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 15 })}
                min="1"
                max="180"
                data-testid="input-lesson-duration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title.trim()}>
              {isEdit ? 'Update' : 'Create'} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Current question state
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    type: 'multiple-choice' as 'multiple-choice' | 'true-false',
  });

  // Modal for creating/editing lessons  
  const LessonModal = () => {
    const isEdit = activeModal?.mode === 'edit';
    const lessonData = activeModal?.data || {};

    const handleSave = () => {
      const newLesson = {
        ...lessonFormData,
        order: isEdit ? lessonData.order : course.lessons.length + 1,
      };

      if (isEdit) {
        const newLessons = [...course.lessons];
        newLessons[lessonData.index] = newLesson;
        setCourse({ ...course, lessons: newLessons });
      } else {
        setCourse({ ...course, lessons: [...course.lessons, newLesson] });
      }

      setActiveModal(null);
      setLessonFormData({ title: '', description: '', content: '', videoUrl: '', duration: 15 });
      toast({
        title: isEdit ? "Lesson Updated" : "Lesson Created",
        description: `Lesson "${lessonFormData.title}" has been ${isEdit ? 'updated' : 'added to the course'}.`,
      });
    };

    return (
      <Dialog open={activeModal?.type === 'lesson'} onOpenChange={() => {
        setActiveModal(null);
        setLessonFormData({ title: '', description: '', content: '', videoUrl: '', duration: 15 });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                placeholder="Introduction to Blockchain"
                data-testid="input-lesson-title"
              />
            </div>
            <div>
              <Label htmlFor="lesson-description">Description</Label>
              <Textarea
                id="lesson-description"
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                placeholder="Brief overview of what students will learn"
                data-testid="textarea-lesson-description"
              />
            </div>
            <div>
              <Label htmlFor="lesson-content">Lesson Content</Label>
              <Textarea
                id="lesson-content"
                value={lessonFormData.content}
                onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                placeholder="Detailed lesson content, instructions, and learning materials"
                className="min-h-[120px]"
                data-testid="textarea-lesson-content"
              />
            </div>
            <div>
              <Label htmlFor="lesson-video">Video URL (Optional)</Label>
              <Input
                id="lesson-video"
                value={lessonFormData.videoUrl}
                onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or embedded video URL"
                data-testid="input-lesson-video"
              />
              {lessonFormData.videoUrl && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Video className="w-4 h-4" />
                    <span>Video will be embedded in the lesson</span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="lesson-duration">Duration (minutes)</Label>
              <Input
                id="lesson-duration"
                type="number"
                value={lessonFormData.duration}
                onChange={(e) => setLessonFormData({ ...lessonFormData, duration: parseInt(e.target.value) || 15 })}
                min="1"
                max="180"
                data-testid="input-lesson-duration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActiveModal(null);
              setLessonFormData({ title: '', description: '', content: '', videoUrl: '', duration: 15 });
            }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!lessonFormData.title.trim()}>
              {isEdit ? 'Update' : 'Create'} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Modal for creating/editing quizzes
  const QuizModal = () => {
    const isEdit = activeModal?.mode === 'edit';
    const quizData = activeModal?.data || {};

    const addQuestion = () => {
      if (currentQuestion.type === 'true-false') {
        const truefalseQuestion = {
          ...currentQuestion,
          options: ['True', 'False'],
        };
        setFormData({
          ...formData,
          questions: [...formData.questions, truefalseQuestion],
        });
      } else {
        setFormData({
          ...formData,
          questions: [...formData.questions, currentQuestion],
        });
      }
      
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        type: 'multiple-choice',
      });
    };

    const handleSave = () => {
      const newQuiz = {
        ...formData,
      };

      if (isEdit) {
        const newQuizzes = [...course.quizzes];
        newQuizzes[quizData.index] = newQuiz;
        setCourse({ ...course, quizzes: newQuizzes });
      } else {
        setCourse({ ...course, quizzes: [...course.quizzes, newQuiz] });
      }

      setActiveModal(null);
      toast({
        title: isEdit ? "Quiz Updated" : "Quiz Created",
        description: `Quiz "${formData.title}" has been ${isEdit ? 'updated' : 'added to the course'}.`,
      });
    };

    return (
      <Dialog open={activeModal?.type === 'quiz'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Blockchain Basics Quiz"
                  data-testid="input-quiz-title"
                />
              </div>
              <div>
                <Label htmlFor="quiz-time-limit">Time Limit (minutes)</Label>
                <Input
                  id="quiz-time-limit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="120"
                  data-testid="input-quiz-time-limit"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="quiz-description">Description</Label>
              <Textarea
                id="quiz-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Test your understanding of blockchain concepts"
                data-testid="textarea-quiz-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiz-attempts">Maximum Attempts</Label>
                <Input
                  id="quiz-attempts"
                  type="number"
                  value={formData.attempts}
                  onChange={(e) => setFormData({ ...formData, attempts: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="10"
                  data-testid="input-quiz-attempts"
                />
              </div>
              <div>
                <Label htmlFor="quiz-passing-score">Passing Score (%)</Label>
                <Input
                  id="quiz-passing-score"
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
                  min="0"
                  max="100"
                  data-testid="input-quiz-passing-score"
                />
              </div>
            </div>

            {/* Current Questions */}
            {formData.questions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Questions ({formData.questions.length})</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {formData.questions.map((q, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{index + 1}. {q.question}</p>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Correct: {q.options[q.correctAnswer]}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newQuestions = formData.questions.filter((_, i) => i !== index);
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Question */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Add Question</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question-type">Question Type</Label>
                  <Select 
                    value={currentQuestion.type} 
                    onValueChange={(value: 'multiple-choice' | 'true-false') => 
                      setCurrentQuestion({ ...currentQuestion, type: value, correctAnswer: 0 })
                    }
                  >
                    <SelectTrigger data-testid="select-question-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True or False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="question-text">Question</Label>
                  <Textarea
                    id="question-text"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    placeholder="What is a blockchain?"
                    data-testid="textarea-question"
                  />
                </div>

                {currentQuestion.type === 'multiple-choice' ? (
                  <>
                    <div>
                      <Label>Answer Options</Label>
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = e.target.value;
                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                              }}
                              placeholder={`Option ${index + 1}`}
                              data-testid={`input-option-${index}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant={currentQuestion.correctAnswer === index ? "default" : "outline"}
                              onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                              data-testid={`button-correct-${index}`}
                            >
                              {currentQuestion.correctAnswer === index ? "Correct" : "Mark Correct"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <Label>Correct Answer</Label>
                    <Select 
                      value={currentQuestion.correctAnswer.toString()} 
                      onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(value) })}
                    >
                      <SelectTrigger data-testid="select-true-false-answer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">True</SelectItem>
                        <SelectItem value="1">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="question-explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="question-explanation"
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                    placeholder="Explain why this is the correct answer"
                    data-testid="textarea-explanation"
                  />
                </div>

                <Button
                  type="button"
                  onClick={addQuestion}
                  disabled={!currentQuestion.question.trim() || (currentQuestion.type === 'multiple-choice' && currentQuestion.options.some(opt => !opt.trim()))}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title.trim() || formData.questions.length === 0}>
              {isEdit ? 'Update' : 'Create'} Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Modal for creating/editing resources
  const renderResourceModal = () => {
    const isEdit = activeModal?.mode === 'edit';
    const resourceData = activeModal?.data || {};
    const [formData, setFormData] = useState({
      title: resourceData.title || '',
      description: resourceData.description || '',
      fileType: resourceData.fileType || 'link',
      url: resourceData.url || '',
      fileUrl: resourceData.fileUrl || '',
      isPublic: resourceData.isPublic ?? true,
    });

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // In a real implementation, this would upload to object storage
        const fakeUrl = `https://storage.example.com/${file.name}`;
        setFormData({ 
          ...formData, 
          fileUrl: fakeUrl,
          fileType: file.type.includes('pdf') ? 'pdf' : file.type.includes('json') ? 'json' : 'file'
        });
        toast({
          title: "File Selected",
          description: `${file.name} is ready to upload.`,
        });
      }
    };

    const handleSave = () => {
      const newResource = {
        ...formData,
        fileUrl: formData.fileType === 'link' ? formData.url : formData.fileUrl,
      };

      if (isEdit) {
        const newResources = [...course.resources];
        newResources[resourceData.index] = newResource;
        setCourse({ ...course, resources: newResources });
      } else {
        setCourse({ ...course, resources: [...course.resources, newResource] });
      }

      setActiveModal(null);
      toast({
        title: isEdit ? "Resource Updated" : "Resource Created",
        description: `Resource "${formData.title}" has been ${isEdit ? 'updated' : 'added to the course'}.`,
      });
    };

    return (
      <Dialog open={activeModal?.type === 'resource'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Resource' : 'Create New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resource-title">Resource Title</Label>
              <Input
                id="resource-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Blockchain Whitepaper Collection"
                data-testid="input-resource-title"
              />
            </div>
            <div>
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Essential reading materials for blockchain fundamentals"
                data-testid="textarea-resource-description"
              />
            </div>
            <div>
              <Label htmlFor="resource-type">Resource Type</Label>
              <Select 
                value={formData.fileType} 
                onValueChange={(value) => setFormData({ ...formData, fileType: value })}
              >
                <SelectTrigger data-testid="select-resource-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">External Link</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="json">JSON File</SelectItem>
                  <SelectItem value="file">Other File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.fileType === 'link' ? (
              <div>
                <Label htmlFor="resource-url">Website URL</Label>
                <Input
                  id="resource-url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/resource"
                  data-testid="input-resource-url"
                />
                {formData.url && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <ExternalLink className="w-4 h-4" />
                      <span>Link will open in new tab</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="resource-file">Upload File</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="resource-file"
                    type="file"
                    onChange={handleFileUpload}
                    accept={formData.fileType === 'pdf' ? '.pdf' : formData.fileType === 'json' ? '.json' : '*'}
                    data-testid="input-resource-file"
                  />
                  <Button type="button" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
                {formData.fileUrl && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span>File ready: {formData.fileUrl.split('/').pop()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="resource-public"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                data-testid="checkbox-resource-public"
              />
              <Label htmlFor="resource-public">Make this resource publicly accessible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.title.trim() || (formData.fileType === 'link' ? !formData.url.trim() : !formData.fileUrl)}
            >
              {isEdit ? 'Update' : 'Create'} Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      
      {/* Modals */}
      {activeModal && activeModal.type === 'lesson' && renderLessonModal()}
      {activeModal && activeModal.type === 'quiz' && renderQuizModal()}
      {activeModal && activeModal.type === 'resource' && renderResourceModal()}
    </div>
  );
}