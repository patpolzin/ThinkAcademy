import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, BookOpen, FileText, Users, Clock, Coins, Save, Globe, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuizBuilder } from "./QuizBuilder";
import { CourseForum } from "./CourseForum";

interface Course {
  id?: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  instructorName: string;
  instructorId?: string;
  tokenRequirement: {
    type: 'NONE' | 'HOLD' | 'SPEND';
    amount?: number;
    tokenAddress?: string;
    tokenSymbol?: string;
  };
  isActive: boolean;
}

interface Lesson {
  id?: number;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  orderIndex: number;
}

interface Resource {
  id?: number;
  title: string;
  description: string;
  fileUrl?: string;
  fileType: string;
  isPublic: boolean;
}

interface CourseEditorProps {
  courseId?: number;
  onClose: () => void;
  currentUserId?: string;
}

export function CourseEditor({ courseId, onClose, currentUserId }: CourseEditorProps) {
  const { toast } = useToast();
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    category: 'Technology',
    difficulty: 'Beginner',
    duration: 1,
    instructorName: '',
    instructorId: currentUserId,
    tokenRequirement: { type: 'NONE' },
    isActive: false
  });
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState('basics');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const [courseRes, lessonsRes, resourcesRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/lessons`),
        fetch(`/api/courses/${courseId}/resources`)
      ]);

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse({
          ...courseData,
          tokenRequirement: typeof courseData.tokenRequirement === 'string' 
            ? JSON.parse(courseData.tokenRequirement) 
            : courseData.tokenRequirement || { type: 'NONE' }
        });
      }

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData);
      }

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setResources(resourcesData);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast({ title: "Failed to load course", variant: "destructive" });
    }
  };

  const saveCourse = async (publish = false) => {
    if (publish) setIsPublishing(true);
    else setIsSaving(true);

    try {
      let savedCourse;
      
      if (courseId) {
        // Update existing course
        const response = await fetch(`/api/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...course,
            isActive: publish,
            lessonCount: lessons.length,
            assignmentCount: 0 // Will be updated when quizzes are added
          })
        });
        
        if (!response.ok) throw new Error('Failed to update course');
        savedCourse = await response.json();
      } else {
        // Create new course
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...course,
            isActive: publish,
            lessonCount: lessons.length,
            assignmentCount: 0
          })
        });
        
        if (!response.ok) throw new Error('Failed to create course');
        savedCourse = await response.json();
        setCourse(prev => ({ ...prev, id: savedCourse.id }));
      }

      // Save lessons
      for (const lesson of lessons) {
        if (lesson.id) {
          // Update existing lesson
          await fetch(`/api/lessons/${lesson.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...lesson,
              courseId: savedCourse.id
            })
          });
        } else {
          // Create new lesson
          const response = await fetch(`/api/courses/${savedCourse.id}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...lesson,
              courseId: savedCourse.id
            })
          });
          
          if (response.ok) {
            const newLesson = await response.json();
            setLessons(prev => prev.map(l => 
              l.orderIndex === lesson.orderIndex ? { ...l, id: newLesson.id } : l
            ));
          }
        }
      }

      // Save resources
      for (const resource of resources) {
        if (resource.id) {
          // Update existing resource
          await fetch(`/api/resources/${resource.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...resource,
              courseId: savedCourse.id
            })
          });
        } else {
          // Create new resource
          const response = await fetch(`/api/courses/${savedCourse.id}/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...resource,
              courseId: savedCourse.id
            })
          });
          
          if (response.ok) {
            const newResource = await response.json();
            setResources(prev => prev.map(r => 
              r === resource ? { ...r, id: newResource.id } : r
            ));
          }
        }
      }

      setLastSaved(new Date());
      toast({ 
        title: publish ? "Course published!" : "Course saved!",
        description: publish ? "Your course is now live and visible to students." : "Changes saved as draft."
      });

      if (publish) {
        setCourse(prev => ({ ...prev, isActive: true }));
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ 
        title: "Failed to save course", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      title: `Lesson ${lessons.length + 1}`,
      description: '',
      content: '',
      duration: 30,
      orderIndex: lessons.length
    };
    setLessons([...lessons, newLesson]);
  };

  const updateLesson = (index: number, updates: Partial<Lesson>) => {
    setLessons(lessons.map((lesson, i) => 
      i === index ? { ...lesson, ...updates } : lesson
    ));
  };

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const addResource = () => {
    const newResource: Resource = {
      title: 'New Resource',
      description: '',
      fileType: 'document',
      isPublic: true
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (index: number, updates: Partial<Resource>) => {
    setResources(resources.map((resource, i) => 
      i === index ? { ...resource, ...updates } : resource
    ));
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const canPublish = () => {
    return course.title.trim() !== '' && 
           course.description.trim().length > 10 && 
           lessons.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {courseId ? `Editing: ${course.title || 'Untitled Course'}` : 'Create New Course'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Badge variant={course.isActive ? 'default' : 'secondary'}>
              {course.isActive ? 'Published' : 'Draft'}
            </Badge>
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="outline" 
            onClick={() => saveCourse(false)}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => saveCourse(true)}
            disabled={isPublishing || !canPublish()}
          >
            <Globe className="w-4 h-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish Course'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basics">Course Info</TabsTrigger>
          <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
          <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
          <TabsTrigger value="tokens">Token Access</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Title *</label>
                  <Input
                    value={course.title}
                    onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter course title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (hours)</label>
                  <Input
                    type="number"
                    value={course.duration}
                    onChange={(e) => setCourse(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={course.description}
                  onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will learn in this course"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={course.category} 
                    onValueChange={(value) => setCourse(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select 
                    value={course.difficulty} 
                    onValueChange={(value) => setCourse(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Instructor Name</label>
                <Input
                  value={course.instructorName}
                  onChange={(e) => setCourse(prev => ({ ...prev, instructorName: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Course Lessons</h3>
            <Button onClick={addLesson} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          {lessons.map((lesson, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="secondary">Lesson {index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLesson(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <Input
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, { title: e.target.value })}
                    placeholder="Lesson title"
                  />
                  <Input
                    value={lesson.description}
                    onChange={(e) => updateLesson(index, { description: e.target.value })}
                    placeholder="Lesson description"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={lesson.videoUrl || ''}
                      onChange={(e) => updateLesson(index, { videoUrl: e.target.value })}
                      placeholder="Video URL (optional)"
                    />
                    <Input
                      type="number"
                      value={lesson.duration || ''}
                      onChange={(e) => updateLesson(index, { duration: parseInt(e.target.value) || 0 })}
                      placeholder="Duration (minutes)"
                    />
                  </div>
                  <Textarea
                    value={lesson.content}
                    onChange={(e) => updateLesson(index, { content: e.target.value })}
                    placeholder="Lesson content (supports HTML)"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {lessons.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No lessons yet. Add your first lesson to get started.</p>
                <Button onClick={addLesson} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Lesson
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Course Resources</h3>
            <Button onClick={addResource} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>

          {resources.map((resource, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="secondary">Resource {index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResource(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <Input
                    value={resource.title}
                    onChange={(e) => updateResource(index, { title: e.target.value })}
                    placeholder="Resource title"
                  />
                  <Input
                    value={resource.description}
                    onChange={(e) => updateResource(index, { description: e.target.value })}
                    placeholder="Resource description"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={resource.fileUrl || ''}
                      onChange={(e) => updateResource(index, { fileUrl: e.target.value })}
                      placeholder="File URL"
                    />
                    <Select 
                      value={resource.fileType} 
                      onValueChange={(value) => updateResource(index, { fileType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="link">External Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {resources.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No resources yet. Add supplementary materials for your students.</p>
                <Button onClick={addResource} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Resource
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Token Access Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Access Type</label>
                <Select 
                  value={course.tokenRequirement.type} 
                  onValueChange={(value: 'NONE' | 'HOLD' | 'SPEND') => 
                    setCourse(prev => ({ 
                      ...prev, 
                      tokenRequirement: { ...prev.tokenRequirement, type: value } 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Free Access</SelectItem>
                    <SelectItem value="HOLD">Must Hold Tokens</SelectItem>
                    <SelectItem value="SPEND">Pay with Tokens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {course.tokenRequirement.type !== 'NONE' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Amount</label>
                      <Input
                        type="number"
                        value={course.tokenRequirement.amount || ''}
                        onChange={(e) => setCourse(prev => ({ 
                          ...prev, 
                          tokenRequirement: { 
                            ...prev.tokenRequirement, 
                            amount: parseInt(e.target.value) || 0 
                          } 
                        }))}
                        placeholder="Required amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Symbol</label>
                      <Input
                        value={course.tokenRequirement.tokenSymbol || ''}
                        onChange={(e) => setCourse(prev => ({ 
                          ...prev, 
                          tokenRequirement: { 
                            ...prev.tokenRequirement, 
                            tokenSymbol: e.target.value 
                          } 
                        }))}
                        placeholder="e.g., ETH, BTC"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Contract Address</label>
                    <Input
                      value={course.tokenRequirement.tokenAddress || ''}
                      onChange={(e) => setCourse(prev => ({ 
                        ...prev, 
                        tokenRequirement: { 
                          ...prev.tokenRequirement, 
                          tokenAddress: e.target.value 
                        } 
                      }))}
                      placeholder="0x..."
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Course Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{course.title || 'Untitled Course'}</h3>
                  <p className="text-gray-600 mb-4">{course.description || 'No description provided'}</p>
                  <div className="flex gap-2 mb-4">
                    <Badge variant="secondary">{course.category}</Badge>
                    <Badge variant={course.difficulty === 'Advanced' ? 'destructive' : 'default'}>
                      {course.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{lessons.length}</div>
                    <div className="text-sm text-gray-500">Lessons</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{course.duration}h</div>
                    <div className="text-sm text-gray-500">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{resources.length}</div>
                    <div className="text-sm text-gray-500">Resources</div>
                  </div>
                </div>

                {!canPublish() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Ready to Publish?</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {!course.title.trim() && <li>• Add a course title</li>}
                      {course.description.trim().length <= 10 && <li>• Write a detailed description (more than 10 characters)</li>}
                      {lessons.length === 0 && <li>• Add at least one lesson</li>}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}