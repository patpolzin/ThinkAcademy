import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
  points: number;
}

interface QuizBuilderProps {
  courseId: number;
  onQuizCreated?: (quiz: any) => void;
}

export function QuizBuilder({ courseId, onQuizCreated }: QuizBuilderProps) {
  const { toast } = useToast();
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      question: "",
      options: type === 'multiple-choice' ? ["", "", "", ""] : type === 'true-false' ? ["True", "False"] : [],
      correctAnswer: type === 'true-false' ? 0 : type === 'multiple-choice' ? 0 : "",
      points: 10
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateQuestionOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ""] }
        : q
    ));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter((_, idx) => idx !== optionIndex),
            correctAnswer: q.correctAnswer === optionIndex ? 0 : 
                          (typeof q.correctAnswer === 'number' && q.correctAnswer > optionIndex) ? 
                          q.correctAnswer - 1 : q.correctAnswer
          }
        : q
    ));
  };

  const handleSubmit = async () => {
    if (!quizTitle.trim()) {
      toast({ title: "Please enter a quiz title", variant: "destructive" });
      return;
    }

    if (questions.length === 0) {
      toast({ title: "Please add at least one question", variant: "destructive" });
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question.trim()) {
        toast({ title: "All questions must have text", variant: "destructive" });
        return;
      }

      if (question.type === 'multiple-choice' && question.options.some(opt => !opt.trim())) {
        toast({ title: "All multiple choice options must be filled", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          questions: questions.map(q => ({
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points
          })),
          orderIndex: 0
        })
      });

      if (response.ok) {
        const quiz = await response.json();
        toast({ title: "Quiz created successfully!" });
        onQuizCreated?.(quiz);
        
        // Reset form
        setQuizTitle("");
        setQuizDescription("");
        setQuestions([]);
      } else {
        throw new Error('Failed to create quiz');
      }
    } catch (error) {
      console.error('Quiz creation error:', error);
      toast({ title: "Failed to create quiz", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quiz Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Title *</label>
              <Input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Points</label>
              <Input value={totalPoints} readOnly className="bg-gray-50" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Enter quiz description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Questions ({questions.length})</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => addQuestion('multiple-choice')} 
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Multiple Choice
          </Button>
          <Button 
            onClick={() => addQuestion('true-false')} 
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            True/False
          </Button>
          <Button 
            onClick={() => addQuestion('short-answer')} 
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Short Answer
          </Button>
        </div>
      </div>

      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Question {index + 1}</Badge>
                <Badge variant={question.type === 'multiple-choice' ? 'default' : question.type === 'true-false' ? 'secondary' : 'outline'}>
                  {question.type === 'multiple-choice' ? 'Multiple Choice' : 
                   question.type === 'true-false' ? 'True/False' : 'Short Answer'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={question.points}
                  onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min="1"
                />
                <span className="text-sm text-gray-500">pts</span>
                <Button
                  onClick={() => removeQuestion(question.id)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Text *</label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  placeholder="Enter your question"
                  rows={2}
                />
              </div>

              {question.type === 'multiple-choice' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Answer Options *</label>
                    <Button
                      onClick={() => addOption(question.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === optIndex}
                          onChange={() => updateQuestion(question.id, { correctAnswer: optIndex })}
                          className="mr-2"
                        />
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <Button
                          onClick={() => removeOption(question.id, optIndex)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'true-false' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correct Answer</label>
                  <Select 
                    value={question.correctAnswer?.toString()} 
                    onValueChange={(value) => updateQuestion(question.id, { correctAnswer: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">True</SelectItem>
                      <SelectItem value="1">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {question.type === 'short-answer' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sample Answer (Optional)</label>
                  <Input
                    value={question.correctAnswer as string || ''}
                    onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                    placeholder="Enter a sample correct answer"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Explanation (Optional)</label>
                <Textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                  placeholder="Explain the correct answer"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {questions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No questions added yet. Click one of the buttons above to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" disabled={isSubmitting}>
          Save as Draft
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || questions.length === 0 || !quizTitle.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Quiz'}
        </Button>
      </div>
    </div>
  );
}