import { Trophy, Star, Target, TrendingUp, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  coursesCompleted: number;
  currentStreak: number;
  totalHours: number;
}

interface GameifiedProgressProps {
  userStats: UserStats;
  achievements: Achievement[];
  className?: string;
}

const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000];

export function GameifiedProgress({ userStats, achievements, className = "" }: GameifiedProgressProps) {
  const currentLevelXP = levelThresholds[userStats.level - 1] || 0;
  const nextLevelXP = levelThresholds[userStats.level] || levelThresholds[levelThresholds.length - 1];
  const progressInLevel = userStats.xp - currentLevelXP;
  const xpForCurrentLevel = nextLevelXP - currentLevelXP;
  const levelProgress = (progressInLevel / xpForCurrentLevel) * 100;

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const inProgressAchievements = achievements.filter(a => !a.unlocked && a.progress);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level and XP Progress */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-cyan-800">
            <Star className="w-5 h-5 text-cyan-500" />
            <span>Level {userStats.level}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">{userStats.xp} XP</span>
              <span className="text-slate-600">{userStats.xpToNext} XP to next level</span>
            </div>
            <Progress 
              value={levelProgress} 
              className="h-3 bg-slate-200"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Level {userStats.level}</span>
              <span>Level {userStats.level + 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-slate-900">{userStats.coursesCompleted}</span>
            </div>
            <p className="text-sm text-slate-600">Courses Completed</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-slate-900">{userStats.currentStreak}</span>
            </div>
            <p className="text-sm text-slate-600">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-slate-900">{userStats.totalHours}</span>
            </div>
            <p className="text-sm text-slate-600">Hours Learned</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-slate-900">{unlockedAchievements.length}</span>
            </div>
            <p className="text-sm text-slate-600">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {unlockedAchievements.slice(0, 3).map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <IconComponent className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{achievement.title}</h4>
                      <p className="text-sm text-slate-600">{achievement.description}</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Unlocked!
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements in Progress */}
      {inProgressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Achievements in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressAchievements.slice(0, 3).map((achievement) => {
                const IconComponent = achievement.icon;
                const progress = (achievement.progress! / achievement.maxProgress!) * 100;
                return (
                  <div key={achievement.id} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-100 rounded-full">
                        <IconComponent className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{achievement.title}</h4>
                        <p className="text-sm text-slate-600">{achievement.description}</p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-200" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to generate mock achievements for demo
export function generateMockAchievements(userStats: UserStats): Achievement[] {
  return [
    {
      id: 'first-course',
      title: 'First Steps',
      description: 'Complete your first course',
      icon: Trophy,
      unlocked: userStats.coursesCompleted > 0,
      progress: Math.min(userStats.coursesCompleted, 1),
      maxProgress: 1
    },
    {
      id: 'course-master',
      title: 'Course Master',
      description: 'Complete 5 courses',
      icon: Award,
      unlocked: userStats.coursesCompleted >= 5,
      progress: userStats.coursesCompleted,
      maxProgress: 5
    },
    {
      id: 'streak-week',
      title: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      icon: Zap,
      unlocked: userStats.currentStreak >= 7,
      progress: userStats.currentStreak,
      maxProgress: 7
    },
    {
      id: 'hours-25',
      title: 'Time Investor',
      description: 'Complete 25 hours of learning',
      icon: TrendingUp,
      unlocked: userStats.totalHours >= 25,
      progress: userStats.totalHours,
      maxProgress: 25
    },
    {
      id: 'level-5',
      title: 'Rising Star',
      description: 'Reach level 5',
      icon: Star,
      unlocked: userStats.level >= 5,
      progress: userStats.level,
      maxProgress: 5
    }
  ];
}

// Helper function to calculate user stats from enrollments
export function calculateUserStats(enrollments: any[]): UserStats {
  const completedCourses = enrollments.filter(e => e.certificate_issued || e.progress_percentage === 100).length;
  const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0);
  const totalHours = Math.floor(totalProgress / 10); // Rough estimate
  const xp = (completedCourses * 100) + Math.floor(totalProgress / 5);
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = (level * 100) - xp;
  
  return {
    level,
    xp,
    xpToNext,
    coursesCompleted: completedCourses,
    currentStreak: Math.min(completedCourses * 2, 14), // Mock streak based on completion
    totalHours
  };
}