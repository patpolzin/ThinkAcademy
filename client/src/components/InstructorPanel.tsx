import { useState, useEffect } from "react";
import { BookOpen, Users, BarChart3, Settings, Plus, Edit, Trash2, Video, FileText, Award } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InstructorPanelProps {
  user: any;
}

export default function InstructorPanel({ user }: InstructorPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeInstructorTab, setActiveInstructorTab] = useState('overview');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseDraft, setCourseDraft] = useState<any>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [allDrafts, setAllDrafts] = useState<any[]>([]);

  // Load course drafts from localStorage on component mount
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      const savedDrafts = localStorage.getItem('course_drafts');
      const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];
      setAllDrafts(drafts);
      
      // Load the most recent draft for editing
      const recentDraft = localStorage.getItem('current_draft');
      if (recentDraft) {
        setCourseDraft(JSON.parse(recentDraft));
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  const saveDraft = (draftData: any, showToast: boolean = true) => {
    try {
      const timestamp = new Date().toISOString();
      const draft = {
        ...draftData,
        id: Date.now().toString(),
        savedAt: timestamp,
        title: draftData.title || 'Untitled Course'
      };

      // Save current draft
      localStorage.setItem('current_draft', JSON.stringify(draft));
      
      // Add to drafts list
      const existingDrafts = JSON.parse(localStorage.getItem('course_drafts') || '[]');
      const updatedDrafts = [draft, ...existingDrafts.slice(0, 9)]; // Keep only 10 drafts
      localStorage.setItem('course_drafts', JSON.stringify(updatedDrafts));
      
      setAllDrafts(updatedDrafts);
      setCourseDraft(draft);
      
      if (showToast) {
        toast({ title: "Course draft saved successfully!" });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showToast) {
        toast({ title: "Failed to save draft", variant: "destructive" });
      }
    }
  };

  const loadDraft = (draft: any) => {
    setCourseDraft(draft);
    localStorage.setItem('current_draft', JSON.stringify(draft));
    setShowDraftList(false);
    setShowCreateCourse(true);
    toast({ title: "Draft loaded successfully!" });
  };

  const deleteDraft = (draftId: string) => {
    try {
      const updatedDrafts = allDrafts.filter(d => d.id !== draftId);
      localStorage.setItem('course_drafts', JSON.stringify(updatedDrafts));
      setAllDrafts(updatedDrafts);
      toast({ title: "Draft deleted successfully!" });
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  // Fetch instructor's courses only
  const { data: instructorCourses = [] } = useQuery({
    queryKey: ['/api/instructor/courses', user?.walletAddress],
    enabled: user?.isInstructor && !!user?.walletAddress
  });

  // Fetch instructor analytics
  const { data: instructorStats } = useQuery({
    queryKey: ['/api/instructor/analytics', user?.walletAddress],
    enabled: user?.isInstructor && !!user?.walletAddress
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      return apiRequest('/api/courses', 'POST', {
        ...courseData,
        instructor: user?.displayName || user?.walletAddress,
        instructorWallet: user?.walletAddress,
        createdBy: user?.walletAddress
      });
    },
    onSuccess: () => {
      toast({ title: "Course created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      localStorage.removeItem('current_draft'); // Clear current draft after successful creation
      setCourseDraft(null);
      setShowCreateCourse(false);
      loadDrafts(); // Refresh drafts list
    },
    onError: () => {
      toast({ title: "Failed to create course", variant: "destructive" });
    }
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ courseId, updates }: { courseId: string; updates: any }) => {
      return apiRequest(`/api/courses/${courseId}`, 'PUT', updates);
    },
    onSuccess: () => {
      toast({ title: "Course updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setEditingCourse(null);
    },
    onError: () => {
      toast({ title: "Failed to update course", variant: "destructive" });
    }
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return apiRequest(`/api/courses/${courseId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({ title: "Course deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: () => {
      toast({ title: "Failed to delete course", variant: "destructive" });
    }
  });

  const instructorTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'analytics', label: 'Performance', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderInstructorTabContent = () => {
    switch (activeInstructorTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Instructor Dashboard</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateCourse(true)}
                  className="flex items-center space-x-2 bg-primary-600 text-black px-4 py-2 rounded-lg hover:bg-primary-700"
                  data-testid="button-create-course-instructor"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
                {allDrafts.length > 0 && (
                  <button
                    onClick={() => setShowDraftList(true)}
                    className="flex items-center space-x-2 bg-slate-200 text-black px-4 py-2 rounded-lg hover:bg-slate-300"
                    data-testid="button-view-drafts"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Drafts ({allDrafts.length})</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Instructor Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">My Courses</p>
                    <p className="text-2xl font-bold text-slate-900">{instructorCourses.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary-50 text-primary-500">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900">{instructorStats?.totalStudents || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-500">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Avg Completion</p>
                    <p className="text-2xl font-bold text-slate-900">{instructorStats?.avgCompletion || 0}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-50 text-purple-500">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">-</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded">
                  <Users className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-700">New student enrolled in your course</span>
                  <span className="text-xs text-slate-500 ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded">
                  <Award className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-700">Student completed course assessment</span>
                  <span className="text-xs text-slate-500 ml-auto">4 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">My Courses</h3>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            </div>
            
            {/* Course Management Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Students</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructorCourses.map((course: any) => (
                      <tr key={course.id} className="border-b border-slate-100">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{course.title}</p>
                            <p className="text-sm text-slate-600">{course.description?.slice(0, 60)}...</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-900">{course.enrolledCount || 0}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${course.avgProgress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 mt-1">{course.avgProgress || 0}% avg</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            course.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setEditingCourse(course)}
                              className="text-primary-600 hover:text-primary-700 text-sm border border-primary-300 px-2 py-1 rounded"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this course?')) {
                                  deleteCourseMutation.mutate(course.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-sm border border-red-300 px-2 py-1 rounded"
                              disabled={deleteCourseMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button className="text-emerald-600 hover:text-emerald-700 text-sm border border-emerald-300 px-2 py-1 rounded">
                              <Video className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Student Management</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Student progress tracking and communication features coming soon...</p>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Performance Analytics</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Detailed analytics and reporting features coming soon...</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Instructor Settings</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Instructor preferences and configuration options coming soon...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user?.isInstructor) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Instructor Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {instructorTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveInstructorTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeInstructorTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Instructor Content */}
      {renderInstructorTabContent()}

      {/* Create Course Modal */}
      {/* Draft List Modal */}
      {showDraftList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Course Drafts</h3>
              <button
                onClick={() => setShowDraftList(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            
            {allDrafts.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No drafts saved yet.</p>
            ) : (
              <div className="space-y-3">
                {allDrafts.map((draft) => (
                  <div key={draft.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{draft.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {draft.description?.slice(0, 100)}...
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>Category: {draft.category}</span>
                          <span>Level: {draft.difficulty}</span>
                          <span>Saved: {new Date(draft.savedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => loadDraft(draft)}
                          className="bg-primary-600 text-black px-3 py-1 rounded text-sm hover:bg-primary-700"
                          data-testid={`button-load-draft-${draft.id}`}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          data-testid={`button-delete-draft-${draft.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Course</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const courseData = {
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                difficulty: formData.get('difficulty'),
                duration: formData.get('duration'),
                tokenRequirement: {
                  type: formData.get('tokenType'),
                  minAmount: formData.get('tokenAmount') || 0,
                  tokenName: 'THINK'
                },
                isActive: true
              };
              
              // Save to drafts for persistence
              saveDraft(courseData, false);
              
              // Then create the course
              createCourseMutation.mutate(courseData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    defaultValue={courseDraft?.title || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                    placeholder="Enter course title"
                    data-testid="input-course-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    defaultValue={courseDraft?.description || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
                    placeholder="Course description"
                    data-testid="input-course-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      name="category"
                      defaultValue={courseDraft?.category || ''}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black bg-white"
                    >
                      <option value="Programming" className="text-black">Programming</option>
                      <option value="Design" className="text-black">Design</option>
                      <option value="Business" className="text-black">Business</option>
                      <option value="Marketing" className="text-black">Marketing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <select
                      name="difficulty"
                      defaultValue={courseDraft?.difficulty || ''}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black bg-white"
                    >
                      <option value="Beginner" className="text-black">Beginner</option>
                      <option value="Intermediate" className="text-black">Intermediate</option>
                      <option value="Advanced" className="text-black">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Token Requirement</label>
                    <select
                      name="tokenType"
                      defaultValue={courseDraft?.tokenType || ''}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black bg-white"
                    >
                      <option value="NONE" className="text-black">Free Access</option>
                      <option value="ERC20" className="text-black">THINK Tokens</option>
                      <option value="NFT" className="text-black">THINK NFT</option>
                      <option value="EITHER" className="text-black">Either Token</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Amount</label>
                    <input
                      name="tokenAmount"
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      const formData = new FormData(form);
                      const draftData = {
                        title: formData.get('title'),
                        description: formData.get('description'),
                        category: formData.get('category'),
                        difficulty: formData.get('difficulty'),
                        duration: formData.get('duration'),
                        tokenType: formData.get('tokenType'),
                        tokenAmount: formData.get('tokenAmount')
                      };
                      saveDraft(draftData);
                    }
                  }}
                  className="text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
                  data-testid="button-save-draft"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="bg-primary-600 text-black px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  data-testid="button-create-course-submit"
                >
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCourse(false)}
                  className="text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
                  data-testid="button-cancel-course"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}