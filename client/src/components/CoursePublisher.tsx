import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye, 
  Users, 
  BookOpen, 
  FileText, 
  MessageSquare,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  lessons?: any[];
  quizzes?: any[];
  resources?: any[];
}

interface CoursePublisherProps {
  course: Course;
  onPublishStatusChange?: (isPublished: boolean) => void;
}

interface PublishCheck {
  id: string;
  label: string;
  description: string;
  required: boolean;
  passed: boolean;
  icon: React.ReactNode;
}

export function CoursePublisher({ course, onPublishStatusChange }: CoursePublisherProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [publishStatus, setPublishStatus] = useState(course.isActive);

  // Calculate course completeness
  const getPublishChecks = (): PublishCheck[] => {
    const hasTitle = course.title && course.title.trim().length > 0;
    const hasDescription = course.description && course.description.trim().length > 10;
    const hasLessons = course.lessons && course.lessons.length > 0;
    const hasQuizzes = course.quizzes && course.quizzes.length > 0;
    const hasResources = course.resources && course.resources.length > 0;
    
    return [
      {
        id: "title",
        label: "Course Title",
        description: "Course has a clear, descriptive title",
        required: true,
        passed: hasTitle,
        icon: <BookOpen className="w-5 h-5" />
      },
      {
        id: "description",
        label: "Course Description",
        description: "Course has a detailed description (minimum 10 characters)",
        required: true,
        passed: hasDescription,
        icon: <FileText className="w-5 h-5" />
      },
      {
        id: "lessons",
        label: "Course Content",
        description: "Course has at least one lesson",
        required: true,
        passed: hasLessons,
        icon: <BookOpen className="w-5 h-5" />
      },
      {
        id: "assessment",
        label: "Assessment",
        description: "Course has at least one quiz or assignment",
        required: false,
        passed: hasQuizzes,
        icon: <FileText className="w-5 h-5" />
      },
      {
        id: "resources",
        label: "Learning Resources",
        description: "Course has supplementary materials",
        required: false,
        passed: hasResources,
        icon: <FileText className="w-5 h-5" />
      }
    ];
  };

  const publishChecks = getPublishChecks();
  const requiredChecks = publishChecks.filter(check => check.required);
  const optionalChecks = publishChecks.filter(check => !check.required);
  const requiredChecksPassed = requiredChecks.every(check => check.passed);
  const passedChecks = publishChecks.filter(check => check.passed).length;
  const completionPercentage = Math.round((passedChecks / publishChecks.length) * 100);

  const handlePublishToggle = async (newStatus: boolean) => {
    if (newStatus && !requiredChecksPassed) {
      toast({
        title: "Cannot publish course",
        description: "Please complete all required items before publishing.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.ok) {
        setPublishStatus(newStatus);
        onPublishStatusChange?.(newStatus);
        toast({
          title: newStatus ? "Course published!" : "Course unpublished",
          description: newStatus 
            ? "Your course is now live and visible to students." 
            : "Your course is now hidden from students."
        });
      } else {
        throw new Error('Failed to update publish status');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Error updating course",
        description: "Failed to update publish status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-6 h-6" />
                Course Publishing
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Manage your course visibility and publication status
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{completionPercentage}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${publishStatus ? 'text-green-600' : 'text-gray-600'}`}>
                  {publishStatus ? 'Published' : 'Unpublished'}
                </span>
                <Switch
                  checked={publishStatus}
                  onCheckedChange={handlePublishToggle}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Alert */}
      {publishStatus ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Course is live!</strong> Students can discover and enroll in this course.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Course is in draft mode.</strong> Only instructors can see this course.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList>
          <TabsTrigger value="checklist">Publishing Checklist</TabsTrigger>
          <TabsTrigger value="preview">Course Preview</TabsTrigger>
          <TabsTrigger value="settings">Publish Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          {/* Required Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Required Items
              </CardTitle>
              <p className="text-sm text-gray-600">
                Complete all required items to publish your course
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredChecks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`flex-shrink-0 ${check.passed ? 'text-green-500' : 'text-gray-400'}`}>
                    {check.passed ? <CheckCircle className="w-5 h-5" /> : check.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{check.label}</span>
                      {check.passed ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-200 text-red-600">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Optional Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Recommended Items
              </CardTitle>
              <p className="text-sm text-gray-600">
                These items improve the student learning experience
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {optionalChecks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`flex-shrink-0 ${check.passed ? 'text-green-500' : 'text-gray-400'}`}>
                    {check.passed ? <CheckCircle className="w-5 h-5" /> : check.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{check.label}</span>
                      {check.passed ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-200 text-blue-600">
                          Optional
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Student View Preview
              </CardTitle>
              <p className="text-gray-600">This is how students will see your course</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-xl font-bold mb-2">{course.title || "Untitled Course"}</h3>
                <p className="text-gray-600 mb-4">{course.description || "No description provided"}</p>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{course.lessons?.length || 0}</div>
                    <div className="text-sm text-gray-500">Lessons</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{course.quizzes?.length || 0}</div>
                    <div className="text-sm text-gray-500">Quizzes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{course.resources?.length || 0}</div>
                    <div className="text-sm text-gray-500">Resources</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Publication Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Status</label>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Switch
                    checked={publishStatus}
                    onCheckedChange={handlePublishToggle}
                    disabled={isUpdating || (!publishStatus && !requiredChecksPassed)}
                  />
                  <div>
                    <div className="font-medium">
                      {publishStatus ? "Published" : "Draft"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {publishStatus 
                        ? "Course is visible to students and open for enrollment"
                        : "Course is hidden from students and not accepting enrollment"
                      }
                    </div>
                  </div>
                </div>
              </div>

              {!requiredChecksPassed && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Complete all required items in the Publishing Checklist before you can publish this course.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Publishing Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={publishStatus}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview as Student
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!publishStatus}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Manage Course Forum
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}