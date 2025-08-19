import { useState } from "react";
import { X, CheckCircle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "./WalletProvider";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
}

export default function EnrollmentModal({ isOpen, onClose, course }: EnrollmentModalProps) {
  const { address, tokenBalances } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting enrollment process for:", address, course.id);
      
      // Use wallet address directly - the backend will handle user creation
      const response = await apiRequest('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          userId: address, // Send wallet address, backend will handle conversion
          courseId: course.id,
          progress: 0,
          totalLessons: course.totalLessons || 10,
          totalAssignments: course.totalAssignments || 3
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text || response.statusText };
        }
        throw new Error(errorData.error || 'Failed to enroll');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Successfully enrolled in course!" });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onClose();
    },
    onError: (error) => {
      console.error("Enrollment error:", error);
      toast({ 
        title: "Failed to enroll in course", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  const checkTokenAccess = () => {
    // Handle case where tokenRequirement might be a string (from database) or undefined
    const tokenReq = typeof course?.tokenRequirement === 'string' 
      ? JSON.parse(course.tokenRequirement) 
      : course?.tokenRequirement || { type: 'NONE' };

    if (!tokenReq || tokenReq.type === 'NONE') {
      return { hasAccess: true, reason: 'Free access - no tokens required' };
    }

    const { type, amount, think, nft, minAmount, tokenName, contractAddress } = tokenReq;
    
    if (type === 'THINK' || type === 'ERC20') {
      const userBalance = parseFloat(tokenBalances['THINK'] || '0');
      const required = parseFloat(amount || minAmount || '0');
      return {
        hasAccess: userBalance >= required,
        reason: userBalance >= required 
          ? `You have ${userBalance} THINK tokens (need ${required})` 
          : `Need ${required} THINK tokens (you have ${userBalance})`
      };
    }
    
    if (type === 'NFT') {
      const userNFTs = parseInt(tokenBalances['NFT'] || '0');
      const required = parseInt(amount || minAmount || '1');
      return {
        hasAccess: userNFTs >= required,
        reason: userNFTs >= required 
          ? `You have ${userNFTs} THINK Agent NFTs (need ${required})` 
          : `Need ${required} THINK Agent NFTs (you have ${userNFTs})`
      };
    }

    if (type === 'EITHER') {
      const userThink = parseFloat(tokenBalances['THINK'] || '0');
      const userNFTs = parseInt(tokenBalances['NFT'] || '0');
      const requiredThink = parseFloat(think || '1000');
      const hasThink = userThink >= requiredThink;
      const hasNFT = userNFTs >= 1;
      
      return {
        hasAccess: hasThink || hasNFT,
        reason: hasThink || hasNFT
          ? `Access granted: ${hasThink ? `${userThink} THINK tokens` : ''}${hasThink && hasNFT ? ' and ' : ''}${hasNFT ? `${userNFTs} NFTs` : ''}`
          : `Need either ${requiredThink} THINK tokens OR 1 THINK Agent NFT (you have ${userThink} THINK, ${userNFTs} NFTs)`
      };
    }

    return { hasAccess: false, reason: 'Unknown token requirement' };
  };

  const { hasAccess, reason } = checkTokenAccess();

  const handleEnroll = async () => {
    if (!hasAccess) {
      toast({ 
        title: "Cannot enroll", 
        description: "You don't meet the token requirements for this course",
        variant: "destructive" 
      });
      return;
    }

    setIsEnrolling(true);
    try {
      await enrollMutation.mutateAsync();
    } finally {
      setIsEnrolling(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 relative shadow-2xl transform transition-all duration-200 ease-out scale-100 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200"
          data-testid="button-close-enrollment-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${
            hasAccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {hasAccess ? (
              <Unlock className="w-8 h-8 text-green-500" />
            ) : (
              <Lock className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Enroll in Course
          </h2>
          <h3 className="text-lg font-medium text-slate-700 dark:text-gray-300">
            {course.title}
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Course Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-gray-300">Instructor:</span>
                <span className="text-slate-900 dark:text-white">{course.instructor || course.instructorName || 'TBA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-gray-300">Duration:</span>
                <span className="text-slate-900 dark:text-white">{course.duration}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-gray-300">Category:</span>
                <span className="text-slate-900 dark:text-white">{course.category}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${
            hasAccess ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center">
              {hasAccess ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <Lock className="w-4 h-4 text-red-500 mr-2" />
              )}
              Token Requirements
            </h4>
            <p className={`text-sm ${
              hasAccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {reason}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-enrollment"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEnroll}
            disabled={!hasAccess || isEnrolling}
            className={hasAccess ? "bg-green-500 hover:bg-green-600 text-white" : ""}
            data-testid="button-confirm-enrollment"
          >
            {isEnrolling ? 'Enrolling...' : hasAccess ? 'Enroll Now' : 'Cannot Enroll'}
          </Button>
        </div>
      </div>
    </div>
  );
}