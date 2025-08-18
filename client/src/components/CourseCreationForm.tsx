import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, BookOpen, FileText, Users, Clock, Coins } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructorId: number;
  duration: number;
  tokenRequirement: {
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    tokenName?: string;
    minAmount?: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video';
  url: string;
  description?: string;
}

interface Instructor {
  id: number;
  displayName: string;
  email: string;
}

export function CourseCreationForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CourseFormData>();
  const { toast } = useToast();
  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch available instructors
    const fetchInstructors = async () => {
      try {
        const response = await apiRequest('/api/users/instructors', 'GET');
        setInstructors(response);
      } catch (error) {
        console.error('Failed to fetch instructors:', error);
      }
    };

    fetchInstructors();
  }, []);

  const addLesson = () => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: "",
      content: "",
      order: lessons.length + 1
    };
    setLessons([...lessons, newLesson]);
  };

  const removeLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const addQuiz = () => {
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      title: "",
      questions: []
    };
    setQuizzes([...quizzes, newQuiz]);
  };

  const removeQuiz = (id: string) => {
    setQuizzes(quizzes.filter(q => q.id !== id));
  };

  const updateQuiz = (id: string, updates: Partial<Quiz>) => {
    setQuizzes(quizzes.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addResource = () => {
    const newResource: Resource = {
      id: Date.now().toString(),
      title: "",
      type: "link",
      url: ""
    };
    setResources([...resources, newResource]);
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setResources(resources.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      // Create the course
      const courseResponse = await apiRequest('/api/courses', 'POST', {
        ...data,
        lessonCount: lessons.length,
        assignmentCount: quizzes.length,
        isActive: true
      });

      if (courseResponse.ok) {
        const course = await courseResponse.json();
        
        // Create lessons, quizzes, and resources
        await Promise.all([
          ...lessons.map(lesson => 
            apiRequest('/api/lessons', 'POST', { ...lesson, courseId: course.id })
          ),
          ...quizzes.map(quiz => 
            apiRequest('/api/quizzes', 'POST', { ...quiz, courseId: course.id })
          ),
          ...resources.map(resource => 
            apiRequest('/api/resources', 'POST', { ...resource, courseId: course.id })
          )
        ]);

        toast({ title: "Course created successfully!" });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      toast({ title: "Failed to create course", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tokenRequirementType = watch('tokenRequirement.type') || 'NONE';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Create New Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Course Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Title</label>
                <Input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter course title"
                  data-testid="input-course-title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web3">Web3</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select onValueChange={(value) => setValue('difficulty', value)}>
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (hours)</label>
                <Input
                  type="number"
                  {...register('duration', { required: 'Duration is required', min: 1 })}
                  placeholder="Course duration in hours"
                  data-testid="input-duration"
                />
                {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Instructor</label>
                <Select onValueChange={(value) => setValue('instructorId', parseInt(value))}>
                  <SelectTrigger data-testid="select-instructor">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.displayName} ({instructor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Enter course description"
                  rows={3}
                  data-testid="textarea-description"
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              </div>
            </div>

            {/* Token Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Coins className="w-4 h-4" />
                  Token Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Access Type</label>
                  <Select onValueChange={(value) => setValue('tokenRequirement.type', value as any)}>
                    <SelectTrigger data-testid="select-token-type">
                      <SelectValue placeholder="Select access type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Free Access</SelectItem>
                      <SelectItem value="ERC20">ERC-20 Token Required</SelectItem>
                      <SelectItem value="NFT">NFT Required</SelectItem>
                      <SelectItem value="EITHER">Either Token or NFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tokenRequirementType !== 'NONE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Name</label>
                      <Input
                        {...register('tokenRequirement.tokenName')}
                        placeholder="e.g., THINK, UTHINK NFT"
                        data-testid="input-token-name"
                      />
                    </div>
                    {tokenRequirementType === 'ERC20' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Minimum Amount</label>
                        <Input
                          {...register('tokenRequirement.minAmount')}
                          placeholder="e.g., 100"
                          data-testid="input-min-amount"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Content */}
            <Tabs defaultValue="lessons" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lessons" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Lessons ({lessons.length})
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Quizzes ({quizzes.length})
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Resources ({resources.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lessons" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Course Lessons</h3>
                  <Button type="button" onClick={addLesson} variant="outline" data-testid="button-add-lesson">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
                {lessons.map((lesson, index) => (
                  <Card key={lesson.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="secondary">Lesson {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLesson(lesson.id)}
                          data-testid={`button-remove-lesson-${lesson.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                          placeholder="Lesson title"
                          data-testid={`input-lesson-title-${lesson.id}`}
                        />
                        <Textarea
                          value={lesson.content}
                          onChange={(e) => updateLesson(lesson.id, { content: e.target.value })}
                          placeholder="Lesson content"
                          rows={3}
                          data-testid={`textarea-lesson-content-${lesson.id}`}
                        />
                        <Input
                          value={lesson.videoUrl || ''}
                          onChange={(e) => updateLesson(lesson.id, { videoUrl: e.target.value })}
                          placeholder="Video URL (optional)"
                          data-testid={`input-lesson-video-${lesson.id}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="quizzes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Course Quizzes</h3>
                  <Button type="button" onClick={addQuiz} variant="outline" data-testid="button-add-quiz">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quiz
                  </Button>
                </div>
                {quizzes.map((quiz, index) => (
                  <Card key={quiz.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="secondary">Quiz {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuiz(quiz.id)}
                          data-testid={`button-remove-quiz-${quiz.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={quiz.title}
                        onChange={(e) => updateQuiz(quiz.id, { title: e.target.value })}
                        placeholder="Quiz title"
                        data-testid={`input-quiz-title-${quiz.id}`}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Course Resources</h3>
                  <Button type="button" onClick={addResource} variant="outline" data-testid="button-add-resource">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </div>
                {resources.map((resource, index) => (
                  <Card key={resource.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="secondary">Resource {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResource(resource.id)}
                          data-testid={`button-remove-resource-${resource.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={resource.title}
                          onChange={(e) => updateResource(resource.id, { title: e.target.value })}
                          placeholder="Resource title"
                          data-testid={`input-resource-title-${resource.id}`}
                        />
                        <Select
                          value={resource.type}
                          onValueChange={(value) => updateResource(resource.id, { type: value as any })}
                        >
                          <SelectTrigger data-testid={`select-resource-type-${resource.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="link">External Link</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={resource.url}
                          onChange={(e) => updateResource(resource.id, { url: e.target.value })}
                          placeholder="Resource URL"
                          className="md:col-span-2"
                          data-testid={`input-resource-url-${resource.id}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-create-course">
                {isSubmitting ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}