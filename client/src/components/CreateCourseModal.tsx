import { useState } from 'react';
import { X, BookOpen, Upload, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: any) => void;
}

export default function CreateCourseModal({ isOpen, onClose, onSave }: CreateCourseModalProps) {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    duration: '',
    tokenRequirement: {
      type: 'NONE' as 'NONE' | 'ERC20' | 'NFT' | 'EITHER',
      minAmount: '',
      tokenName: ''
    },
    content: []
  });

  const handleSave = () => {
    onSave(courseData);
    onClose();
    // Reset form
    setCourseData({
      title: '',
      description: '',
      instructor: '',
      category: '',
      duration: '',
      tokenRequirement: {
        type: 'NONE',
        minAmount: '',
        tokenName: ''
      },
      content: []
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
                  Instructor
                </label>
                <Input
                  placeholder="Instructor name"
                  value={courseData.instructor}
                  onChange={(e) => setCourseData({ ...courseData, instructor: e.target.value })}
                  data-testid="input-instructor"
                />
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
                  <SelectItem value="ai-agents">AI Agents</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="nfts">NFTs</SelectItem>
                  <SelectItem value="blockchain">Blockchain</SelectItem>
                  <SelectItem value="smart-contracts">Smart Contracts</SelectItem>
                </SelectContent>
              </Select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {courseData.tokenRequirement.type === 'ERC20' && (
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
                )}
              </div>
            )}
          </div>

          {/* Course Thumbnail */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Course Thumbnail</h3>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Upload course thumbnail</p>
              <p className="text-sm text-slate-500">PNG, JPG up to 2MB</p>
              <Button variant="outline" className="mt-4" data-testid="button-upload-thumbnail">
                Choose File
              </Button>
            </div>
          </div>
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