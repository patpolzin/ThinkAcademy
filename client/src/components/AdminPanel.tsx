import { useState } from "react";
import { Users, BookOpen, BarChart3, Settings, User, Mail, Calendar, Award, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminPanelProps {
  user: any;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch all users for admin management
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: user?.isAdmin
  });

  // Fetch system analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    enabled: user?.isAdmin
  });

  // Make user admin mutation
  const makeAdminMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      return apiRequest(`/api/admin/make-admin/${walletAddress}`, 'POST');
    },
    onSuccess: () => {
      toast({ title: "User promoted to admin successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => {
      toast({ title: "Failed to promote user", variant: "destructive" });
    }
  });

  // Make user instructor mutation
  const makeInstructorMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      return apiRequest(`/api/admin/make-instructor/${walletAddress}`, 'POST');
    },
    onSuccess: () => {
      toast({ title: "User promoted to instructor successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => {
      toast({ title: "Failed to promote user", variant: "destructive" });
    }
  });

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const renderAdminTabContent = () => {
    switch (activeAdminTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">System Overview</h3>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">{analytics?.totalStudents || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary-50 text-primary-500">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Active Courses</p>
                    <p className="text-2xl font-bold text-slate-900">{analytics?.activeCourses || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-500">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Enrollments</p>
                    <p className="text-2xl font-bold text-slate-900">{analytics?.totalEnrollments || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-50 text-purple-500">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Avg Completion</p>
                    <p className="text-2xl font-bold text-slate-900">{analytics?.avgCompletionRate || 0}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Recent System Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded">
                  <User className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-700">New user registration: {user?.displayName}</span>
                  <span className="text-xs text-slate-500 ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded">
                  <BookOpen className="w-5 h-5 text-slate-600" />
                  <span className="text-sm text-slate-700">Course enrollment completed</span>
                  <span className="text-xs text-slate-500 ml-auto">4 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">User Management</h3>
              <div className="flex space-x-2">
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                  Export Users
                </button>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                  Add User
                </button>
              </div>
            </div>
            
            {/* User Management Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Last Active</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((userData: any) => (
                      <tr key={userData.id} className="border-b border-slate-100">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {userData.displayName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{userData.displayName || 'Unnamed User'}</p>
                              <p className="text-sm text-slate-600">{userData.walletAddress?.slice(0, 8)}...{userData.walletAddress?.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-1">
                            {userData.isAdmin && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Admin
                              </span>
                            )}
                            {userData.isInstructor && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                Instructor
                              </span>
                            )}
                            {!userData.isAdmin && !userData.isInstructor && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                                Learner
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">
                            {userData.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            {!userData.isAdmin && (
                              <button 
                                onClick={() => makeAdminMutation.mutate(userData.walletAddress)}
                                className="text-red-600 hover:text-red-700 text-sm border border-red-300 px-2 py-1 rounded"
                                disabled={makeAdminMutation.isPending}
                              >
                                Make Admin
                              </button>
                            )}
                            {!userData.isInstructor && (
                              <button 
                                onClick={() => makeInstructorMutation.mutate(userData.walletAddress)}
                                className="text-emerald-600 hover:text-emerald-700 text-sm border border-emerald-300 px-2 py-1 rounded"
                                disabled={makeInstructorMutation.isPending}
                              >
                                Make Instructor
                              </button>
                            )}
                            <button className="text-primary-600 hover:text-primary-700 text-sm border border-primary-300 px-2 py-1 rounded">
                              View Profile
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

      case 'courses':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Course Management</h3>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Create New Course
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Course management features coming soon...</p>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">System Analytics</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">Advanced analytics dashboard coming soon...</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">System Settings</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-600">System configuration options coming soon...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeAdminTab === tab.id
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

      {/* Admin Content */}
      {renderAdminTabContent()}
    </div>
  );
}