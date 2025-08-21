import { useState, useEffect } from 'react';
import { X, BookOpen, Upload, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useWallet } from "../hooks/useWallet";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: any) => void;
}

export function CreateCourseModal({ isOpen, onClose, onSave }: CreateCourseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address, user } = useWallet();

  // Check if user has instructor/admin permissions
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    if (user) {
      setHasPermission(user.isAdmin || user.isInstructor);
    }
  }, [user]);

  // Fetch instructors list
  const { data: instructors = [] } = useQuery({
    queryKey: ['/api/users/instructors'],
    enabled: isOpen && hasPermission
  });
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    instructorId: '',
    instructorName: '',
    category: '',
    difficulty: 'Beginner',
    duration: '',
    imageUrl: '',
    tokenRequirement: {
      type: 'NONE' as 'NONE' | 'ERC20' | 'NFT' | 'EITHER',
      network: 'mainnet' as 'mainnet' | 'base',
      minAmount: '',
      tokenName: '',
      tokenAddress: '',
      options: [] as Array<{
        type: 'ERC20' | 'NFT';
        network: 'mainnet' | 'base';
        tokenName: string;
        tokenAddress: string;
        minAmount: string;
      }>
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseData) => {
      // Don't allow course creation without proper permissions
      if (!hasPermission) {
        throw new Error('Only instructors and admins can create courses');
      }

      return apiRequest('/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          duration: parseInt(data.duration) || 0,
          instructorId: parseInt(data.instructorId) || null
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Course created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create course", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSave = () => {
    if (!hasPermission) {
      toast({ 
        title: "Access denied", 
        description: "Only instructors and admins can create courses",
        variant: "destructive" 
      });
      return;
    }

    if (!courseData.title || !courseData.instructorId) {
      toast({ 
        title: "Please fill in required fields", 
        description: "Course title and instructor are required",
        variant: "destructive" 
      });
      return;
    }
    createCourseMutation.mutate(courseData);
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setCourseData({
      title: '',
      description: '',
      instructorId: '',
      instructorName: '',
      category: '',
      difficulty: 'Beginner',
      duration: '',
      imageUrl: '',
      tokenRequirement: {
        type: 'NONE',
        network: 'mainnet',
        minAmount: '',
        tokenName: '',
        tokenAddress: '',
        options: []
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Create New Course</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              data-testid="button-close-create-course-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Course Title
              </label>
              <Input
                placeholder="Enter course title"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                data-testid="input-course-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
                placeholder="Describe what students will learn..."
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                data-testid="textarea-course-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Instructor *
                </label>
                <Select
                  value={courseData.instructorId}
                  onValueChange={(value) => {
                    const instructor = instructors.find(i => i.id.toString() === value);
                    setCourseData({ 
                      ...courseData, 
                      instructorId: value,
                      instructorName: instructor?.displayName || ''
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-instructor">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.displayName} ({instructor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  placeholder="8"
                  value={courseData.duration}
                  onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                  data-testid="input-duration"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <Select
                  value={courseData.category}
                  onValueChange={(value) => setCourseData({ ...courseData, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blockchain">Blockchain</SelectItem>
                    <SelectItem value="DeFi">DeFi</SelectItem>
                    <SelectItem value="NFT">NFT</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Trading">Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty
                </label>
                <Select
                  value={courseData.difficulty}
                  onValueChange={(value) => setCourseData({ ...courseData, difficulty: value })}
                >
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


          </div>

          {/* Token Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Access Requirements</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Requirement Type
              </label>
              <Select
                value={courseData.tokenRequirement.type}
                onValueChange={(value: 'NONE' | 'ERC20' | 'NFT' | 'EITHER') => 
                  setCourseData({ 
                    ...courseData, 
                    tokenRequirement: { ...courseData.tokenRequirement, type: value }
                  })
                }
              >
                <SelectTrigger data-testid="select-token-requirement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Requirements (Free Access)</SelectItem>
                  <SelectItem value="ERC20">ERC-20 Token Required</SelectItem>
                  <SelectItem value="NFT">NFT Required</SelectItem>
                  <SelectItem value="EITHER">Either Token or NFT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {courseData.tokenRequirement.type !== 'NONE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Network
                    </label>
                    <Select
                      value={courseData.tokenRequirement.network}
                      onValueChange={(value: 'mainnet' | 'base') => 
                        setCourseData({ 
                          ...courseData, 
                          tokenRequirement: { ...courseData.tokenRequirement, network: value }
                        })
                      }
                    >
                      <SelectTrigger data-testid="select-network">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                        <SelectItem value="base">Base Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Minimum Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={courseData.tokenRequirement.minAmount}
                      onChange={(e) => 
                        setCourseData({ 
                          ...courseData, 
                          tokenRequirement: { 
                            ...courseData.tokenRequirement, 
                            minAmount: e.target.value 
                          }
                        })
                      }
                      data-testid="input-token-amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Token Name
                    </label>
                    <Input
                      placeholder="THINK"
                      value={courseData.tokenRequirement.tokenName}
                      onChange={(e) => 
                        setCourseData({ 
                          ...courseData, 
                          tokenRequirement: { 
                            ...courseData.tokenRequirement, 
                            tokenName: e.target.value 
                          }
                        })
                      }
                      data-testid="input-token-name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Token Contract Address
                  </label>
                  <Input
                    placeholder="0x..."
                    value={courseData.tokenRequirement.tokenAddress}
                    onChange={(e) => 
                      setCourseData({ 
                        ...courseData, 
                        tokenRequirement: { 
                          ...courseData.tokenRequirement, 
                          tokenAddress: e.target.value 
                        }
                      })
                    }
                    data-testid="input-token-address"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Contract address on {courseData.tokenRequirement.network === 'mainnet' ? 'Ethereum Mainnet' : 'Base Network'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Access Control Notice */}
          {!hasPermission && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-semibold">!</span>
                </div>
                <div>
                  <p className="text-amber-800 font-medium">Access Restricted</p>
                  <p className="text-amber-700 text-sm">Only instructors and administrators can create courses.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex items-center justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-course"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            data-testid="button-save-course"
          >
            Create Course
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateCourseModal;