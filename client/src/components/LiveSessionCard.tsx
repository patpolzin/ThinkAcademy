import { Calendar, Clock, Users, Video, Play, Lock } from 'lucide-react';
import { Button } from './ui/button';

interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  description: string;
  scheduledFor: string;
  duration: number;
  currentAttendees: number;
  maxAttendees: number;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  tokenRequirement: {
    type: 'NONE' | 'ERC20' | 'NFT' | 'EITHER';
    minAmount?: number;
    tokenName?: string;
  };
}

interface LiveSessionCardProps {
  session: LiveSession;
  compact?: boolean;
}

export default function LiveSessionCard({ session, compact = false }: LiveSessionCardProps) {
  const canAccess = true; // Mock access check - replace with actual token verification
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusDisplay = () => {
    switch (session.status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>LIVE</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            <Calendar className="w-3 h-3" />
            <span>Scheduled</span>
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
            <Video className="w-3 h-3" />
            <span>Recording</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTokenRequirementDisplay = () => {
    switch (session.tokenRequirement.type) {
      case 'NONE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <span>Free</span>
          </span>
        );
      case 'ERC20':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>{session.tokenRequirement.minAmount} {session.tokenRequirement.tokenName}</span>
          </span>
        );
      case 'NFT':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-purple-500 rounded-sm"></div>
            <span>{session.tokenRequirement.minAmount} NFT</span>
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
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Video className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-slate-900">{session.title}</h4>
            {getStatusDisplay()}
          </div>
          <p className="text-sm text-slate-600">{formatDate(session.scheduledFor)}</p>
          <p className="text-xs text-slate-500">by {session.instructor}</p>
        </div>
        <Button 
          size="sm"
          disabled={!canAccess}
          data-testid={`button-join-${session.id}`}
        >
          {session.status === 'LIVE' ? 'Join' : session.status === 'ENDED' ? 'Watch' : 'Remind'}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative bg-gradient-to-br from-primary-500 to-purple-600 p-6 text-white">
        {!canAccess && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusDisplay()}
              {getTokenRequirementDisplay()}
            </div>
            <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
            <p className="text-primary-100 text-sm">{session.description}</p>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(session.scheduledFor)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{session.duration}h</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{session.currentAttendees}/{session.maxAttendees}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>by {session.instructor}</span>
          </div>
        </div>
        
        <Button 
          className="w-full"
          disabled={!canAccess}
          data-testid={`button-join-session-${session.id}`}
        >
          {session.status === 'LIVE' ? (
            <>
              <Play className="w-4 h-4 mr-2" />
              Join Live Session
            </>
          ) : session.status === 'ENDED' ? (
            <>
              <Video className="w-4 h-4 mr-2" />
              Watch Recording
            </>
          ) : canAccess ? (
            'Set Reminder'
          ) : (
            'Access Locked'
          )}
        </Button>
      </div>
    </div>
  );
}