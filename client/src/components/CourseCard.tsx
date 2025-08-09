import { Clock, Users, Award, Unlock, Lock } from 'lucide-react';
import { Button } from './ui/button';

interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  duration: number;
  studentCount: number;
  thumbnail: string;
  tokenRequirement: {
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    minAmount?: number;
    tokenName?: string;
  };
  isActive: boolean;
}

interface Enrollment {
  id: string;
  progress: number;
  isCompleted: boolean;
}

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  compact?: boolean;
}

export default function CourseCard({ course, enrollment, compact = false }: CourseCardProps) {
  const canAccess = true; // Mock access check - replace with actual token verification

  const getTokenRequirementDisplay = () => {
    switch (course.tokenRequirement.type) {
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
            <span>{course.tokenRequirement.minAmount} {course.tokenRequirement.tokenName}</span>
          </span>
        );
      case 'NFT':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-purple-500 rounded-sm"></div>
            <span>{course.tokenRequirement.minAmount} NFT</span>
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
      <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
        <img 
          src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=80&fit=crop'} 
          alt={course.title}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h4 className="font-medium text-slate-900">{course.title}</h4>
          <p className="text-sm text-slate-600">by {course.instructor}</p>
          {enrollment && (
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${enrollment.progress}%` }}
              ></div>
            </div>
          )}
        </div>
        <Button size="sm" data-testid={`button-continue-${course.id}`}>
          {enrollment ? 'Continue' : 'Start'}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img 
          src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop'} 
          alt={course.title}
          className="w-full h-48 object-cover"
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
            <span>{course.duration}h</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{course.studentCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>Certificate</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">by {course.instructor}</p>
          <Button 
            disabled={!canAccess}
            data-testid={`button-enroll-${course.id}`}
          >
            {enrollment ? 'Continue' : canAccess ? 'Enroll' : 'Locked'}
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
    </div>
  );
}