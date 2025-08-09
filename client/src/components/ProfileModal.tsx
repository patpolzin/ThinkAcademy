import { useState } from "react";
import { X, User, Upload, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "./WalletProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return apiRequest(`/api/users/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({ ...profileData, profilePicture: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  // Calculate certificates from enrollments
  const certificates = user?.enrollments?.filter((e: any) => e.certificateIssued) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-close-profile-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Edit Profile
          </h2>
          <p className="text-slate-600 dark:text-gray-300">Customize your UTHINK profile</p>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 dark:bg-gray-700 mx-auto mb-4">
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-4 right-0 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full cursor-pointer">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-profile-picture"
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <Input
                placeholder="Enter your display name"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                data-testid="input-display-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
                rows={3}
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                data-testid="textarea-bio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Wallet Address
              </label>
              <Input
                value={address || ''}
                disabled
                className="bg-slate-100 dark:bg-gray-600"
                data-testid="input-wallet-address"
              />
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Your wallet address cannot be changed
              </p>
            </div>
          </div>

          {/* Certificates Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-500" />
              Certificates ({certificates.length})
            </h3>
            
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {cert.course?.title || 'Course Certificate'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-gray-300">
                          Completed: {new Date(cert.certificateIssuedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Award className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-gray-300">No certificates earned yet</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">Complete courses to earn certificates</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel-profile"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}