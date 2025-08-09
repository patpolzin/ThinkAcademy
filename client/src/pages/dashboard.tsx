import { useState } from "react";
import Navigation from "@/components/Navigation";
import WalletConnect from "@/components/WalletConnect";
import CourseCard from "@/components/CourseCard";
import LiveSessionCard from "@/components/LiveSessionCard";
import CreateCourseModal from "@/components/CreateCourseModal";
import AuthModal from "@/components/AuthModal";
import { useWallet } from "@/components/WalletProvider";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, TrendingUp, Award, Users, Settings, Video, LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const { address, isConnected, tokenBalances } = useWallet();
  
  // Mock user object for now
  const user = {
    id: address,
    isAdmin: address ? address.toLowerCase().endsWith('000') : false, // Simple admin check
    tokenBalances: tokenBalances
  };

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: isConnected,
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['/api/live-sessions'],
    enabled: isConnected,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['/api/enrollments/user', user?.id],
    enabled: isConnected && !!user?.id,
  });

  // Type the query results properly
  const typedCourses = courses as any[];
  const typedLiveSessions = liveSessions as any[];
  const typedEnrollments = enrollments as any[];

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    enabled: isConnected && user?.isAdmin,
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'live', label: 'Live Sessions', icon: Video },
    ...(user?.isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  const stats = [
    {
      title: "Enrolled Courses",
      value: typedEnrollments.length.toString(),
      icon: BookOpen,
      color: "bg-primary-50 text-primary-500"
    },
    {
      title: "Avg. Progress",
      value: typedEnrollments.length > 0 ? `${Math.round(typedEnrollments.reduce((acc: any, e: any) => acc + (e.progress || 0), 0) / typedEnrollments.length)}%` : "0%",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-500"
    },
    {
      title: "Certificates",
      value: typedEnrollments.filter((e: any) => (e.progress || 0) >= 100).length.toString(),
      icon: Award,
      color: "bg-purple-50 text-purple-500"
    },
    {
      title: "THINK Tokens",
      value: user?.tokenBalances?.THINK ? Math.floor(parseFloat(user.tokenBalances.THINK)).toString() : "0",
      icon: () => <div className="w-6 h-6 bg-emerald-500 rounded-full" />,
      color: "bg-emerald-50"
    }
  ];

  const adminStats = analytics && typeof analytics === 'object' ? [
    {
      title: "Total Students",
      value: (analytics as any)?.totalStudents?.toString() || "0",
      icon: Users,
      color: "bg-primary-50 text-primary-500"
    },
    {
      title: "Active Courses",
      value: (analytics as any)?.activeCourses?.toString() || "0",
      icon: BookOpen,
      color: "bg-emerald-50 text-emerald-500"
    },
    {
      title: "Completion Rate",
      value: `${(analytics as any)?.avgCompletionRate || 0}%`,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-500"
    },
    {
      title: "Total Enrollments",
      value: (analytics as any)?.totalEnrollments?.toString() || "0",
      icon: Users,
      color: "bg-blue-50 text-blue-500"
    }
  ] : [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
                  <p className="text-cyan-100 text-lg">Continue your Web3 learning journey</p>
                </div>
                <div className="hidden md:block">
                  <img 
                    src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=150&fit=crop" 
                    alt="AI robot teaching" 
                    className="rounded-xl opacity-90" 
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                      {typeof stat.icon === 'function' ? 
                        <stat.icon /> : 
                        <stat.icon className="w-6 h-6" />
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Courses and Live Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Continue Learning */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Continue Learning</h3>
                <div className="space-y-4">
                  {typedEnrollments.slice(0, 2).map((enrollment: any) => (
                    <CourseCard 
                      key={enrollment.id} 
                      course={enrollment.course} 
                      enrollment={enrollment}
                      compact={true}
                    />
                  ))}
                  {typedEnrollments.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No enrolled courses yet</p>
                  )}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Live Sessions</h3>
                <div className="space-y-4">
                  {typedLiveSessions.slice(0, 2).map((session: any) => (
                    <LiveSessionCard 
                      key={session.id} 
                      session={session}
                      compact={true}
                    />
                  ))}
                  {typedLiveSessions.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No upcoming sessions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">All Courses</h2>
              <div className="flex items-center space-x-4">
                <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>All Categories</option>
                  <option>AI Agents</option>
                  <option>DeFi</option>
                  <option>NFTs</option>
                </select>
                <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option>All Requirements</option>
                  <option>THINK Tokens</option>
                  <option>NFT Required</option>
                  <option>Free Access</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedCourses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
              {typedCourses.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No courses available</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'live':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Live Sessions</h2>
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option>All Sessions</option>
                <option>Live Now</option>
                <option>Upcoming</option>
                <option>Past Recordings</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {typedLiveSessions.map((session: any) => (
                <LiveSessionCard key={session.id} session={session} />
              ))}
              {typedLiveSessions.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500">No live sessions scheduled</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'admin':
        if (!user?.isAdmin) return null;
        
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
              <button 
                onClick={() => setShowCreateCourse(true)}
                className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                data-testid="button-create-course"
              >
                <BookOpen className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Management Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 text-sm font-medium text-slate-600">Course</th>
                      <th className="text-left py-3 text-sm font-medium text-slate-600">Token Requirement</th>
                      <th className="text-left py-3 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typedCourses.map((course: any) => (
                      <tr key={course.id} className="border-b border-slate-100">
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-slate-900">{course.title}</p>
                            <p className="text-sm text-slate-600">by {course.instructor}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          {course.tokenRequirement.type === 'NONE' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Free Access
                            </span>
                          ) : course.tokenRequirement.type === 'ERC20' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span>{course.tokenRequirement.minAmount} {course.tokenRequirement.tokenName}</span>
                            </span>
                          ) : course.tokenRequirement.type === 'NFT' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              <div className="w-2 h-2 bg-purple-500 rounded-sm"></div>
                              <span>{course.tokenRequirement.minAmount} NFT</span>
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Either Token
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-cyan-500 hover:text-cyan-600 text-sm">Edit</button>
                            <button className="text-slate-500 hover:text-slate-600 text-sm">Analytics</button>
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                <span className="text-cyan-500">U</span>THINK
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <Navigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? renderTabContent() : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Connect to <span className="text-cyan-400">U</span>THINK
            </h2>
            <p className="text-slate-600 dark:text-gray-300 mb-8">Connect your wallet to access token-gated courses and live sessions</p>
            <WalletConnect />
          </div>
        )}
      </main>

      {showCreateCourse && (
        <CreateCourseModal 
          isOpen={showCreateCourse}
          onClose={() => setShowCreateCourse(false)}
          onSave={(courseData) => {
            console.log('New course created:', courseData);
          }}
        />
      )}
    </div>
  );
}
