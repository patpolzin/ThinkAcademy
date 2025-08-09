import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import WalletConnect from "@/components/WalletConnect";
import CourseCard from "@/components/CourseCard";
import LiveSessionCard from "@/components/LiveSessionCard";
import CreateCourseModal from "@/components/CreateCourseModal";
import EnrollmentModal from "@/components/EnrollmentModal";
import ProfileModal from "@/components/ProfileModal";
import AuthModal from "@/components/AuthModal";
import { useWallet } from "@/components/WalletProvider";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, TrendingUp, Award, Users, Settings, Video, LayoutDashboard, User, Plus, ChevronRight } from "lucide-react";
import AdminPanel from "@/components/AdminPanel";
import InstructorPanel from "@/components/InstructorPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const { address, isConnected, tokenBalances } = useWallet();
  
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    enabled: isConnected,
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['/api/live-sessions'],
    enabled: isConnected,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['/api/enrollments/user', address],
    enabled: isConnected && !!address,
  });

  // Get user data from Supabase with proper permissions
  const { data: userData } = useQuery({
    queryKey: ['/api/users', address],
    enabled: isConnected && !!address,
  });

  const user = userData || {
    id: address,
    displayName: '',
    profilePicture: '',
    bio: '',
    isAdmin: false,
    isInstructor: false,
    tokenBalances: tokenBalances || {}
  };

  // Type the query results properly
  const typedCourses = courses as any[];
  const typedLiveSessions = liveSessions as any[];
  const typedEnrollments = enrollments as any[];

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    enabled: isConnected && userData?.isAdmin,
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'live', label: 'Live Sessions', icon: Video },
    ...(userData?.isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
    ...(userData?.isInstructor ? [{ id: 'instructor', label: 'Instructor', icon: Users }] : []),
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
                      <p className="text-black text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-black">{stat.value}</p>
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
                <h3 className="text-lg font-semibold text-black mb-4">Continue Learning</h3>
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
                    <p className="text-black text-center py-8">No enrolled courses yet</p>
                  )}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Upcoming Live Sessions</h3>
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
              <h2 className="text-2xl font-bold text-black">All Courses</h2>
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
              {typedCourses.map((course: any) => {
                const enrollment = typedEnrollments.find((e: any) => e.courseId === course.id);
                return (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    enrollment={enrollment}
                    onEnroll={(course) => {
                      setSelectedCourse(course);
                      setShowEnrollmentModal(true);
                    }}
                  />
                );
              })}
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



      case 'instructor':
        if (!userData?.isInstructor) return null;
        return <InstructorPanel user={userData} />;

      case 'admin':
        if (!userData?.isAdmin) return null;
        return <AdminPanel user={userData} />;

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
            <div className="flex items-center space-x-3">
              {isConnected && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center space-x-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  data-testid="button-profile"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
              )}
              <WalletConnect />
            </div>
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
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Welcome to <span className="text-cyan-500">U</span>THINK
              </h2>
              <p className="text-slate-600 dark:text-gray-300 text-lg mb-8">
                A token-gated learning platform where knowledge meets blockchain technology. 
                Connect your wallet using the login button in the top right to access exclusive courses and live sessions.
              </p>
              <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 mb-8">
                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                  <strong>Testing Admin/Instructor Features:</strong> Admin and instructor permissions are now controlled via Supabase database flags. Use the API endpoints to set permissions for any wallet address.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Token-Gated Courses</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300">Access exclusive courses with THINK tokens or NFTs</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Live Sessions</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300">Join interactive sessions with industry experts</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Earn Certificates</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300">Complete courses and earn blockchain-verified certificates</p>
                </div>
              </div>
            </div>
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

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}

      {showEnrollmentModal && selectedCourse && (
        <EnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => {
            setShowEnrollmentModal(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
        />
      )}
    </div>
  );
}
