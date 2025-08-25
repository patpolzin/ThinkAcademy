import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/components/WalletProvider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, Video, FileText, MessageSquare, Users, 
  Play, Download, Clock, Award, CheckCircle, Lock,
  Star, Calendar, User, Reply, Send
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Course, Lesson, Quiz, Resource, Forum, Enrollment } from '@shared/schema';

interface StudentCourseViewProps {
  course: Course;
  userId: string;
  enrollment?: Enrollment;
}

export function StudentCourseView({ course, userId, enrollment }: StudentCourseViewProps) {
  const [activeTab, setActiveTab] = useState('lessons');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Forum | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ title: '', content: '', category: 'Discussion' });
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { address } = useWallet();

  // Check if user is enrolled
  const { data: enrollmentCheck } = useQuery({
    queryKey: ['enrollment-check', userId, course.id],
    queryFn: () => apiRequest(`/api/enrollments/${userId}/${course.id}/check`),
  });

  // Fetch course content
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', course.id],
    queryFn: () => apiRequest(`/api/courses/${course.id}/lessons`),
    enabled: enrollmentCheck?.isEnrolled,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes', course.id],
    queryFn: () => apiRequest(`/api/courses/${course.id}/quizzes`),
    enabled: enrollmentCheck?.isEnrolled,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources', course.id],
    queryFn: () => apiRequest(`/api/courses/${course.id}/resources`),
    enabled: enrollmentCheck?.isEnrolled,
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forum', course.id],
    queryFn: () => apiRequest(`/api/forums/course/${course.id}`),
    enabled: enrollmentCheck?.isEnrolled,
  });

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: () => apiRequest('/api/enrollments', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId: course.id }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-check'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: () => apiRequest(`/api/enrollments/${userId}/${course.id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-check'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const isEnrolled = enrollmentCheck?.isEnrolled;

  if (!isEnrolled) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-black">{course.title}</CardTitle>
                <p className="text-gray-600 mt-2">{course.description}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">{course.category}</Badge>
                <div className="text-sm text-gray-600">{course.difficulty}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-100">
                  <CardContent className="p-4 text-center">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <div className="text-lg font-semibold text-black">Interactive Lessons</div>
                    <div className="text-sm text-gray-600">Comprehensive video content</div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <div className="text-lg font-semibold text-black">Quizzes & Assessments</div>
                    <div className="text-sm text-gray-600">Test your knowledge</div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-100">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <div className="text-lg font-semibold text-black">Discussion Forums</div>
                    <div className="text-sm text-gray-600">Connect with peers</div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg border border-cyan-200">
                <h3 className="text-xl font-semibold text-black mb-2">Ready to start learning?</h3>
                <p className="text-gray-700 mb-4">
                  Join this course to access all lessons, quizzes, resources, and discussion forums.
                </p>
                <Button 
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderLessons = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">Course Lessons</h3>
        {enrollment && (
          <div className="text-sm text-gray-600">
            Progress: {enrollment.progress || 0}%
          </div>
        )}
      </div>

      {enrollment && (
        <Progress value={enrollment.progress || 0} className="mb-6" />
      )}

      <div className="grid gap-4">
        {lessons.map((lesson: Lesson, index: number) => (
          <Card key={lesson.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    {lesson.isPublished ? (
                      <Play className="w-5 h-5 text-cyan-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.isPublished ? (
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Start Lesson
                    </Button>
                  ) : (
                    <Badge variant="outline">Coming Soon</Badge>
                  )}
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
      <h3 className="text-lg font-semibold text-black">Course Quizzes</h3>

      <div className="grid gap-4">
        {quizzes.map((quiz: Quiz) => (
          <Card key={quiz.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.isPublished ? (
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Award className="w-4 h-4 mr-2" />
                      Take Quiz
                    </Button>
                  ) : (
                    <Badge variant="outline">Not Available</Badge>
                  )}
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
      <h3 className="text-lg font-semibold text-black">Course Resources</h3>

      <div className="grid gap-4">
        {resources.filter((r: Resource) => r.isPublic).map((resource: Resource) => (
          <Card key={resource.id} className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(resource.fileUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDiscussion = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">Course Discussion</h3>
        <Button 
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={() => setShowNewTopicModal(true)}
          data-testid="button-new-topic"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          New Topic
        </Button>
      </div>

      <div className="grid gap-4">
        {forumPosts.map((post: Forum) => (
          <Card 
            key={post.id} 
            className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedPost(post);
              setShowPostModal(true);
            }}
            data-testid={`card-forum-post-${post.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-black">{post.title}</h4>
                    <Badge 
                      variant={post.isResolved ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {post.isResolved ? 'Resolved' : 'Open'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{post.replies || 0} replies</span>
                    <span>•</span>
                    <span>by {post.user_display_name || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt || post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Create new topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (topicData: { title: string; content: string; category: string }) => {
      return apiRequest('/api/forums', {
        method: 'POST',
        body: JSON.stringify({
          ...topicData,
          courseId: course.id,
          userId: address
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forums', 'course', course.id] });
      setShowNewTopicModal(false);
      setNewTopicData({ title: '', content: '', category: 'Discussion' });
      toast({ title: "Topic created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create topic", description: error.message, variant: "destructive" });
    }
  });

  // Get forum replies query
  const { data: forumReplies = [] } = useQuery({
    queryKey: ['/api/forums', selectedPost?.id, 'replies'],
    queryFn: () => selectedPost ? apiRequest(`/api/forums/${selectedPost.id}/replies`) : Promise.resolve([]),
    enabled: !!selectedPost,
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/forums/${selectedPost?.id}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          userId: address
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forums', selectedPost?.id, 'replies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forums', 'course', course.id] });
      setReplyContent('');
      toast({ title: "Reply posted successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to post reply", description: error.message, variant: "destructive" });
    }
  });

  const handleCreateTopic = () => {
    if (!newTopicData.title.trim() || !newTopicData.content.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createTopicMutation.mutate(newTopicData);
  };

  const handleCreateReply = () => {
    if (!replyContent.trim()) {
      toast({ title: "Please enter a reply", variant: "destructive" });
      return;
    }
    createReplyMutation.mutate(replyContent);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="outline" className="text-xs">
                {course.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {course.difficulty}
              </Badge>
              {enrollment?.certificateIssued && (
                <Badge className="text-xs bg-yellow-500">
                  <Award className="w-3 h-3 mr-1" />
                  Certificate Earned
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <Button 
              variant="outline" 
              onClick={() => unenrollMutation.mutate()}
              disabled={unenrollMutation.isPending}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              {unenrollMutation.isPending ? 'Unenrolling...' : 'Unenroll'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-6">
          {renderLessons()}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {renderQuizzes()}
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          {renderResources()}
        </TabsContent>

        <TabsContent value="discussion" className="mt-6">
          {renderDiscussion()}
        </TabsContent>
      </Tabs>

      {/* New Topic Modal */}
      <Dialog open={showNewTopicModal} onOpenChange={setShowNewTopicModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Discussion Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic-title">Title</Label>
              <Input
                id="topic-title"
                value={newTopicData.title}
                onChange={(e) => setNewTopicData({ ...newTopicData, title: e.target.value })}
                placeholder="Enter topic title"
                data-testid="input-topic-title"
              />
            </div>
            <div>
              <Label htmlFor="topic-content">Content</Label>
              <Textarea
                id="topic-content"
                value={newTopicData.content}
                onChange={(e) => setNewTopicData({ ...newTopicData, content: e.target.value })}
                placeholder="Describe your question or start a discussion..."
                rows={6}
                data-testid="textarea-topic-content"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowNewTopicModal(false)}
                data-testid="button-cancel-topic"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTopic}
                disabled={createTopicMutation.isPending}
                data-testid="button-create-topic"
              >
                {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-6">
              {/* Original Post */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">{selectedPost.user_display_name || 'Anonymous'}</span>
                  <Badge variant={selectedPost.isResolved ? "default" : "secondary"} className="text-xs">
                    {selectedPost.isResolved ? 'Resolved' : 'Open'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(selectedPost.createdAt || selectedPost.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{selectedPost.content}</p>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                <h4 className="font-semibold">Replies ({forumReplies.length})</h4>
                {forumReplies.map((reply: any) => (
                  <div key={reply.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">{reply.user_display_name || 'Anonymous'}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.createdAt || reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Add a Reply</h4>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={4}
                  data-testid="textarea-reply-content"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setReplyContent('')}
                    data-testid="button-clear-reply"
                  >
                    Clear
                  </Button>
                  <Button 
                    onClick={handleCreateReply}
                    disabled={createReplyMutation.isPending}
                    data-testid="button-post-reply"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}