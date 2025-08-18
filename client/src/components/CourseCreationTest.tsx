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
  Clock, Award, FileText, Video, Users, CheckCircle
} from 'lucide-react';
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
          lesson: {
            ...lesson,
            isPublished: true
          }
        });
      }

      // Step 3: Create quizzes
      for (const quiz of course.quizzes) {
        await createQuizMutation.mutateAsync({
          courseId,
          quiz: {
            ...quiz,
            isPublished: true
          }
        });
      }

      // Step 4: Create resources
      for (const resource of course.resources) {
        await createResourceMutation.mutateAsync({
          courseId,
          resource: {
            ...resource,
            uploadedBy: 'test-instructor'
          }
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
              className="btn-primary"
            >
              Continue Manual Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="text-slate-600 dark:text-slate-400 mb-4">Or</div>
        <Button onClick={fillSampleData} className="btn-secondary">
          <BookOpen className="w-4 h-4 mr-2" />
          Use Sample Blockchain Course Data
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Course Content Review</h2>
        <Button onClick={createFullCourse} disabled={isCreating} className="btn-primary">
          {isCreating ? 'Creating...' : 'Create Complete Course'}
          <Save className="w-4 h-4 ml-2" />
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
            {course.lessons.map((lesson, index) => (
              <Card key={index} className="card-content">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                      <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50">{lesson.title}</h4>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{lesson.description}</p>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="tab-content mt-6">
          <div className="space-y-4">
            {course.quizzes.map((quiz, index) => (
              <Card key={index} className="card-content">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="tab-content mt-6">
          <div className="space-y-4">
            {course.resources.map((resource, index) => (
              <Card key={index} className="card-content">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50">{resource.title}</h4>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{resource.description}</p>
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
                  </div>
                </CardContent>
              </Card>
            ))}
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
        <Button onClick={() => window.location.href = `/course/${createdCourseId}`} className="btn-primary">
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
        }} className="btn-secondary">
          Create Another Course
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}