import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, Plus, Save, Eye, Edit2, Trash2, 
  Clock, Award, FileText, Video, Users, CheckCircle, ExternalLink, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentLesson {
  id?: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
}

interface ContentQuiz {
  id?: string;
  title: string;
  description: string;
  questions: ContentQuestion[];
  timeLimit?: number;
  attempts: number;
  passingScore: number;
}

interface ContentQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  type: 'multiple-choice' | 'true-false';
}

interface ContentResource {
  id?: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  isPublic: boolean;
  url?: string;
}

interface CourseContent {
  lessons: ContentLesson[];
  quizzes: ContentQuiz[];
  resources: ContentResource[];
}

interface CourseContentBuilderProps {
  courseData: CourseContent;
  onUpdate: (content: CourseContent) => void;
}

export function CourseContentBuilder({ courseData, onUpdate }: CourseContentBuilderProps) {
  const [activeModal, setActiveModal] = useState<{
    type: 'lesson' | 'quiz' | 'resource';
    mode: 'create' | 'edit';
    data: any;
  } | null>(null);
  const { toast } = useToast();

  // Content management functions
  const moveLesson = (fromIndex: number, toIndex: number) => {
    const newLessons = [...courseData.lessons];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    onUpdate({ ...courseData, lessons: newLessons });
  };

  const moveQuiz = (fromIndex: number, toIndex: number) => {
    const newQuizzes = [...courseData.quizzes];
    const [movedQuiz] = newQuizzes.splice(fromIndex, 1);
    newQuizzes.splice(toIndex, 0, movedQuiz);
    onUpdate({ ...courseData, quizzes: newQuizzes });
  };

  const moveResource = (fromIndex: number, toIndex: number) => {
    const newResources = [...courseData.resources];
    const [movedResource] = newResources.splice(fromIndex, 1);
    newResources.splice(toIndex, 0, movedResource);
    onUpdate({ ...courseData, resources: newResources });
  };

  const deleteLesson = (index: number) => {
    const newLessons = courseData.lessons.filter((_, i) => i !== index);
    onUpdate({ ...courseData, lessons: newLessons });
    toast({
      title: "Lesson Deleted",
      description: "The lesson has been removed from the course.",
    });
  };

  const deleteQuiz = (index: number) => {
    const newQuizzes = courseData.quizzes.filter((_, i) => i !== index);
    onUpdate({ ...courseData, quizzes: newQuizzes });
    toast({
      title: "Quiz Deleted",
      description: "The quiz has been removed from the course.",
    });
  };

  const deleteResource = (index: number) => {
    const newResources = courseData.resources.filter((_, i) => i !== index);
    onUpdate({ ...courseData, resources: newResources });
    toast({
      title: "Resource Deleted", 
      description: "The resource has been removed from the course.",
    });
  };

  // Modal for creating/editing lessons
  const LessonModal = () => {
    const isEdit = activeModal?.mode === 'edit';
    const lessonData = activeModal?.data || {};
    const [formData, setFormData] = useState({
      title: lessonData.title || '',
      description: lessonData.description || '',
      content: lessonData.content || '',
      videoUrl: lessonData.videoUrl || '',
      duration: lessonData.duration || 15,
    });

    const handleSave = () => {
      const newLesson = {
        ...formData,
        order: isEdit ? lessonData.order : courseData.lessons.length + 1,
      };

      if (isEdit) {
        const newLessons = [...courseData.lessons];
        newLessons[lessonData.index] = newLesson;
        onUpdate({ ...courseData, lessons: newLessons });
      } else {
        onUpdate({ ...courseData, lessons: [...courseData.lessons, newLesson] });
      }

      setActiveModal(null);
      toast({
        title: isEdit ? "Lesson Updated" : "Lesson Created",
        description: `Lesson "${formData.title}" has been ${isEdit ? 'updated' : 'added to the course'}.`,
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

  // Modal for creating/editing resources
  const ResourceModal = () => {
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
        const newResources = [...courseData.resources];
        newResources[resourceData.index] = newResource;
        onUpdate({ ...courseData, resources: newResources });
      } else {
        onUpdate({ ...courseData, resources: [...courseData.resources, newResource] });
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

  // Modal for creating/editing quizzes
  const QuizModal = () => {
    const isEdit = activeModal?.mode === 'edit';
    const quizData = activeModal?.data || {};
    const [formData, setFormData] = useState({
      title: quizData.title || '',
      description: quizData.description || '',
      timeLimit: quizData.timeLimit || 0,
      attempts: quizData.attempts || 3,
      passingScore: quizData.passingScore || 70,
      questions: quizData.questions || [{ 
        question: '', 
        options: ['', '', '', ''], 
        correctAnswer: 0, 
        explanation: '', 
        type: 'multiple-choice' as const 
      }],
    });

    const addQuestion = () => {
      setFormData({
        ...formData,
        questions: [...formData.questions, {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
          type: 'multiple-choice' as const
        }]
      });
    };

    const updateQuestion = (index: number, updates: Partial<ContentQuestion>) => {
      const newQuestions = [...formData.questions];
      newQuestions[index] = { ...newQuestions[index], ...updates };
      setFormData({ ...formData, questions: newQuestions });
    };

    const removeQuestion = (index: number) => {
      const newQuestions = formData.questions.filter((_: ContentQuestion, i: number) => i !== index);
      setFormData({ ...formData, questions: newQuestions });
    };

    const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
      const newQuestions = [...formData.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
      setFormData({ ...formData, questions: newQuestions });
    };

    const handleSave = () => {
      const newQuiz = {
        ...formData,
      };

      if (isEdit) {
        const newQuizzes = [...courseData.quizzes];
        newQuizzes[quizData.index] = newQuiz;
        onUpdate({ ...courseData, quizzes: newQuizzes });
      } else {
        onUpdate({ ...courseData, quizzes: [...courseData.quizzes, newQuiz] });
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
                  placeholder="Chapter 1 Quiz"
                  data-testid="input-quiz-title"
                />
              </div>
              <div>
                <Label htmlFor="quiz-time-limit">Time Limit (minutes, 0 = unlimited)</Label>
                <Input
                  id="quiz-time-limit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="180"
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
                placeholder="Test your understanding of blockchain fundamentals"
                data-testid="textarea-quiz-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiz-attempts">Allowed Attempts</Label>
                <Input
                  id="quiz-attempts"
                  type="number"
                  value={formData.attempts}
                  onChange={(e) => setFormData({ ...formData, attempts: parseInt(e.target.value) || 1 })}
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

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Questions</Label>
                <Button 
                  type="button" 
                  onClick={addQuestion} 
                  variant="outline" 
                  size="sm"
                  data-testid="button-add-question"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {formData.questions.map((question: ContentQuestion, qIndex: number) => (
                <Card key={qIndex} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Label className="font-medium">Question {qIndex + 1}</Label>
                      {formData.questions.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-remove-question-${qIndex}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor={`question-${qIndex}`}>Question Text</Label>
                      <Textarea
                        id={`question-${qIndex}`}
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                        placeholder="What is the primary purpose of blockchain technology?"
                        data-testid={`textarea-question-${qIndex}`}
                      />
                    </div>

                    <div>
                      <Label>Question Type</Label>
                      <Select 
                        value={question.type} 
                        onValueChange={(value: 'multiple-choice' | 'true-false') => 
                          updateQuestion(qIndex, { 
                            type: value,
                            options: value === 'true-false' ? ['True', 'False'] : ['', '', '', ''],
                            correctAnswer: 0
                          })
                        }
                      >
                        <SelectTrigger data-testid={`select-question-type-${qIndex}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="true-false">True/False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Answer Options</Label>
                      <div className="space-y-2">
                        {question.options.map((option: string, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => updateQuestion(qIndex, { correctAnswer: oIndex })}
                              data-testid={`radio-correct-answer-${qIndex}-${oIndex}`}
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              disabled={question.type === 'true-false'}
                              data-testid={`input-option-${qIndex}-${oIndex}`}
                            />
                            <span className="text-sm text-slate-500">
                              {question.correctAnswer === oIndex ? '(Correct)' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`explanation-${qIndex}`}>Explanation (Optional)</Label>
                      <Textarea
                        id={`explanation-${qIndex}`}
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                        placeholder="Explain why this is the correct answer..."
                        data-testid={`textarea-explanation-${qIndex}`}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.title.trim() || formData.questions.some((q: ContentQuestion) => !q.question.trim() || q.options.some((o: string) => !o.trim()))}
            >
              {isEdit ? 'Update' : 'Create'} Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lessons" className="text-slate-700 dark:text-slate-300">
            Lessons ({courseData.lessons.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="text-slate-700 dark:text-slate-300">
            Quizzes ({courseData.quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-slate-700 dark:text-slate-300">
            Resources ({courseData.resources.length})
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
            
            {courseData.lessons.length === 0 ? (
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
              courseData.lessons.map((lesson, index) => (
                <Card key={index} className="card-content animate-card animate-fade-in group">
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
                          {index < courseData.lessons.length - 1 && (
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
            
            {courseData.quizzes.length === 0 ? (
              <Card className="card-content border-dashed border-2 border-slate-300 dark:border-slate-600">
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No quizzes yet</h4>
                  <p className="text-slate-500 dark:text-slate-500 mb-4">Create assessments to test student knowledge</p>
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
              courseData.quizzes.map((quiz, index) => (
                <Card key={index} className="card-content animate-card animate-fade-in group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center animate-bounce-subtle">
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
                          {index < courseData.quizzes.length - 1 && (
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
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                <strong>{quiz.questions.length}</strong> questions
                                {quiz.questions.length > 0 && (
                                  <span className="ml-2">
                                    • Types: {Array.from(new Set(quiz.questions.map(q => q.type))).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                <Award className="w-3 h-3 mr-1" />
                                {quiz.questions.length} questions
                              </Badge>
                              {quiz.timeLimit && quiz.timeLimit > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {quiz.timeLimit} min
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                Pass: {quiz.passingScore}%
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {quiz.attempts} attempts
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
            
            {courseData.resources.length === 0 ? (
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
              courseData.resources.map((resource, index) => (
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
                          {index < courseData.resources.length - 1 && (
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

      {/* Modals */}
      <LessonModal />
      <QuizModal />
      <ResourceModal />
    </div>
  );
}