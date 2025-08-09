import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "./WalletProvider";
import { User, Mail, Phone, BookOpen, Award, Edit2, Save, X } from "lucide-react";

interface UserProfileManagerProps {
  user: any;
}

export default function UserProfileManager({ user }: UserProfileManagerProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    contactEmail: user?.contactEmail || '',
    contactPhone: user?.contactPhone || '',
    preferredContactMethod: user?.preferredContactMethod || 'email'
  });

  // Get user progress data
  const { data: userProgress } = useQuery({
    queryKey: ['/api/users', user?.id, 'progress'],
    enabled: !!user?.id,
  });

  // Update profile mutation that saves to Supabase
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error("User ID required");
      
      return apiRequest(`/api/users/${user.id}`, 'PUT', {
        ...updates,
        // Ensure profile completion tracking
        lastLoginAt: new Date().toISOString()
      });
    },
    onSuccess: (updatedUser) => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditing(false);
      
      // Update local state with server response
      setProfileData({
        displayName: updatedUser.displayName || '',
        bio: updatedUser.bio || '',
        contactEmail: updatedUser.contactEmail || '',
        contactPhone: updatedUser.contactPhone || '',
        preferredContactMethod: updatedUser.preferredContactMethod || 'email'
      });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast({ 
        title: "Failed to update profile", 
        description: "Please try again",
        variant: "destructive" 
      });
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setProfileData({
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      contactEmail: user?.contactEmail || '',
      contactPhone: user?.contactPhone || '',
      preferredContactMethod: user?.preferredContactMethod || 'email'
    });
    setIsEditing(false);
  };

  const profileCompletionPercentage = () => {
    let completed = 0;
    if (profileData.displayName) completed += 20;
    if (profileData.bio) completed += 20;
    if (profileData.contactEmail) completed += 20;
    if (profileData.contactPhone) completed += 20;
    if (user?.profilePicture) completed += 20;
    return completed;
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Profile Information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="flex items-center space-x-2 bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Completion Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Profile Completion</span>
            <span className="text-sm text-slate-600">{profileCompletionPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${profileCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your display name"
              />
            ) : (
              <p className="text-slate-900">{profileData.displayName || 'Not set'}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.contactEmail}
                onChange={(e) => setProfileData({ ...profileData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your email"
              />
            ) : (
              <p className="text-slate-900">{profileData.contactEmail || 'Not set'}</p>
            )}
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tell us about yourself"
              />
            ) : (
              <p className="text-slate-900">{profileData.bio || 'No bio set'}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.contactPhone}
                onChange={(e) => setProfileData({ ...profileData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your phone number"
              />
            ) : (
              <p className="text-slate-900">{profileData.contactPhone || 'Not set'}</p>
            )}
          </div>

          {/* Preferred Contact Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Contact</label>
            {isEditing ? (
              <select
                value={profileData.preferredContactMethod}
                onChange={(e) => setProfileData({ ...profileData, preferredContactMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="both">Both</option>
              </select>
            ) : (
              <p className="text-slate-900 capitalize">{profileData.preferredContactMethod || 'Email'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Learning Progress</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {userProgress?.totalCoursesEnrolled || user?.totalCoursesCompleted || 0}
            </p>
            <p className="text-sm text-slate-600">Courses Enrolled</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {userProgress?.totalCoursesCompleted || user?.totalCoursesCompleted || 0}
            </p>
            <p className="text-sm text-slate-600">Courses Completed</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {userProgress?.totalCertificatesEarned || user?.totalCertificatesEarned || 0}
            </p>
            <p className="text-sm text-slate-600">Certificates Earned</p>
          </div>
        </div>
      </div>

      {/* Wallet Information */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Wallet Information</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Wallet Address</span>
            <span className="text-sm font-mono text-slate-900">
              {user?.walletAddress ? 
                `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}` : 
                'Not connected'
              }
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Account Type</span>
            <div className="flex space-x-1">
              {user?.isAdmin && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                  Admin
                </span>
              )}
              {user?.isInstructor && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                  Instructor
                </span>
              )}
              {!user?.isAdmin && !user?.isInstructor && (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                  Learner
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Last Login</span>
            <span className="text-sm text-slate-900">
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}