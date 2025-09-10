import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Plus, Reply, Clock, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  isResolved: boolean;
  replies: number;
  lastReplyAt: Date | null;
  createdAt: Date;
  userId: string;
  user?: {
    displayName: string;
    profilePicture?: string;
  };
}

interface ForumReply {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  user?: {
    displayName: string;
    profilePicture?: string;
  };
}

interface CourseForumProps {
  courseId: number;
  currentUserId?: string;
}

const CATEGORIES = [
  "Discussion",
  "Question",
  "Announcement",
  "Technical Issue",
  "Assignment Help",
  "General"
];

export function CourseForum({ courseId, currentUserId }: CourseForumProps) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // New post form
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Discussion");
  
  // Reply form
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [courseId]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/forums/course/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
          lastReplyAt: post.lastReplyAt ? new Date(post.lastReplyAt) : null
        })));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({ title: "Failed to load forum posts", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async (postId: string) => {
    try {
      const response = await fetch(`/api/forums/${postId}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.map((reply: any) => ({
          ...reply,
          createdAt: new Date(reply.createdAt)
        })));
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast({ title: "Failed to load replies", variant: "destructive" });
    }
  };

  const createPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsCreatingPost(true);
    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userId: currentUserId,
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory
        })
      });

      if (response.ok) {
        toast({ title: "Post created successfully!" });
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostCategory("Discussion");
        setIsPostDialogOpen(false);
        fetchPosts();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: "Failed to create post", variant: "destructive" });
    } finally {
      setIsCreatingPost(false);
    }
  };

  const createReply = async () => {
    if (!replyContent.trim() || !selectedPost) {
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await fetch(`/api/forums/${selectedPost.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: replyContent
        })
      });

      if (response.ok) {
        toast({ title: "Reply posted!" });
        setReplyContent("");
        fetchReplies(selectedPost.id);
        fetchPosts(); // Refresh to update reply count
      } else {
        throw new Error('Failed to create reply');
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({ title: "Failed to post reply", variant: "destructive" });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const openPost = (post: ForumPost) => {
    setSelectedPost(post);
    fetchReplies(post.id);
  };

  const filteredPosts = posts.filter(post => 
    selectedCategory === "all" || post.category === selectedCategory
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Question": return "bg-blue-100 text-blue-800";
      case "Announcement": return "bg-purple-100 text-purple-800";
      case "Technical Issue": return "bg-red-100 text-red-800";
      case "Assignment Help": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Course Forum
          </h2>
          <p className="text-gray-600">Discuss course content and ask questions</p>
        </div>
        
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Enter post title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your post content..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPost} disabled={isCreatingPost}>
                  {isCreatingPost ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          All ({posts.length})
        </Button>
        {CATEGORIES.map(category => {
          const count = posts.filter(p => p.category === category).length;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({count})
            </Button>
          );
        })}
      </div>

      {/* Posts List */}
      {selectedPost ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedPost(null)}>
            ← Back to Forum
          </Button>
          
          {/* Post Detail */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedPost.title}
                    {selectedPost.isResolved && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getCategoryColor(selectedPost.category)}>
                      {selectedPost.category}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      {selectedPost.user?.displayName || 'Anonymous'}
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(selectedPost.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{selectedPost.content}</div>
            </CardContent>
          </Card>

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Replies ({replies.length})
            </h3>
            
            {replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={reply.user?.profilePicture} />
                      <AvatarFallback>
                        {reply.user?.displayName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {reply.user?.displayName || 'Anonymous'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{reply.content}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Reply Form */}
            {currentUserId && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Add Reply</label>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={createReply} 
                        disabled={isSubmittingReply || !replyContent.trim()}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        {isSubmittingReply ? "Posting..." : "Post Reply"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4" onClick={() => openPost(post)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{post.title}</h3>
                        {post.isResolved && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          {post.user?.displayName || 'Anonymous'}
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post.replies} replies
                        </div>
                        {post.lastReplyAt && (
                          <div className="flex items-center gap-1">
                            Last reply {formatDistanceToNow(post.lastReplyAt, { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No posts in this category yet.</p>
                <p className="text-sm">Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}