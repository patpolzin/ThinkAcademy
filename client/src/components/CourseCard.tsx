import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Users, Award, Unlock, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { useLocation } from 'wouter';
import EnrollmentModal from './EnrollmentModal';

interface Course {
  id: string;
  title: string;
  instructor?: string;
  instructorName?: string;
  description: string;
  duration?: number;
  studentCount?: number;
  thumbnail?: string;
  tokenRequirement: {
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    minAmount?: number;
    tokenName?: string;
  };
  isActive?: boolean;
}

interface Enrollment {
  id: string;
  progress?: number;
  progress_percentage?: number;
  isCompleted?: boolean;
}

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  compact?: boolean;
  onEnroll?: (course: Course) => void;
}

export default function CourseCard({ course, enrollment, compact = false, onEnroll }: CourseCardProps) {
  const [, setLocation] = useLocation();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  
  // Early return if course is undefined/null
  if (!course) {
    return (
      <div className="bg-slate-100 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-slate-300 rounded mb-2"></div>
        <div className="h-3 bg-slate-300 rounded mb-4 w-3/4"></div>
        <div className="h-2 bg-slate-300 rounded"></div>
      </div>
    );
  }

  // Token access verification
  const getTokenAccess = () => {
    const tokenReq = typeof course.tokenRequirement === 'string' 
      ? JSON.parse(course.tokenRequirement) 
      : course.tokenRequirement || { type: 'NONE' };
    
    // Free courses should be accessible to all
    if (!tokenReq || tokenReq.type === 'NONE') {
      return true;
    }
    
    // For demo purposes, allow access (in production, check actual token balances)
    return true;
  };
  
  const canAccess = getTokenAccess();
  const instructor = course.instructor || course.instructorName || 'Unknown Instructor';
  const duration = course.duration || 10; // Default 10 hours
  const studentCount = course.studentCount || 0;

  const handleCourseClick = () => {
    setLocation(`/course/${course.id}`);
  };

  const getTokenRequirementDisplay = () => {
    // Handle case where tokenRequirement might be a string (from database) or undefined
    const tokenReq = typeof course.tokenRequirement === 'string' 
      ? JSON.parse(course.tokenRequirement) 
      : course.tokenRequirement || { type: 'NONE' };
    
    switch (tokenReq.type) {
      case 'NONE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <Unlock className="w-3 h-3" />
            <span>Free Access</span>
          </span>
        );
      case 'ERC20':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>{tokenReq.minAmount} {tokenReq.tokenName}</span>
          </span>
        );
      case 'NFT':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-purple-500 rounded-sm"></div>
            <span>{tokenReq.minAmount} NFT</span>
          </span>
        );
      case 'EITHER':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Token or NFT</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div 
        className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg animate-card cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={handleCourseClick}
      >
        <img 
          src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=80&fit=crop'} 
          alt={course.title}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="8" fill="%23f1f5f9"/%3E%3Ctext x="32" y="32" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="10" fill="%2364748b"%3ECourse%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className="flex-1">
          <h4 className="font-medium text-slate-900">{course.title}</h4>
          <p className="text-sm text-slate-600">by {instructor}</p>
          {enrollment && (
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${enrollment.progress_percentage || 0}%` }}
              ></div>
            </div>
          )}
        </div>
        <Button 
          size="sm" 
          className="animate-button-subtle" 
          data-testid={`button-${enrollment ? 'continue' : 'start'}-${course.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (enrollment) {
              handleCourseClick(); // Navigate to course content
            } else if (canAccess) {
              setShowEnrollmentModal(true); // Show enrollment modal
            }
          }}
          disabled={!canAccess && !enrollment}
        >
          {enrollment ? 'Continue' : (canAccess ? 'Start' : 'Locked')}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-card animate-fade-in cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCourseClick}
    >
      <div className="relative">
        <img 
          src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop'} 
          alt={course.title}
          className={`w-full h-48 object-cover transition-transform duration-300 ${
            showEnrollmentModal ? '' : 'hover:scale-105'
          }`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f1f5f9"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="16" fill="%2364748b"%3ECourse Image%3C/text%3E%3C/svg%3E';
          }}
        />
        {!canAccess && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          {getTokenRequirementDisplay()}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
        <p className="text-slate-600 text-sm mb-4">{course.description}</p>
        
        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{duration}h</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{studentCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>Certificate</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">by {instructor}</p>
          <Button 
            disabled={!canAccess && !enrollment}
            onClick={(e) => {
              e.stopPropagation();
              if (enrollment) {
                handleCourseClick(); // Navigate to course content
              } else if (canAccess) {
                setShowEnrollmentModal(true); // Show enrollment modal
              }
            }}
            data-testid={`button-${enrollment ? 'continue' : 'enroll'}-${course.id}`}
          >
            {enrollment ? 'Continue Learning' : (canAccess ? 'Enroll Now' : 'Locked')}
          </Button>
        </div>
        
        {enrollment && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">{enrollment.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${enrollment.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Enrollment Modal - Rendered as Portal */}
      {showEnrollmentModal && createPortal(
        <EnrollmentModal
          course={course}
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
        />,
        document.body
      )}
    </div>
  );
}