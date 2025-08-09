import { useState } from "react";
import { Bell, BellOff, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "./WalletProvider";

interface ReminderButtonProps {
  session: any;
  compact?: boolean;
}

export default function ReminderButton({ session, compact = false }: ReminderButtonProps) {
  const { address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReminderOptions, setShowReminderOptions] = useState(false);

  // Check if user has reminder set for this session
  const { data: reminders = [] } = useQuery({
    queryKey: ['/api/reminders/user', address],
    enabled: !!address,
  });

  const hasReminder = reminders.some((r: any) => r.sessionId === session.id);

  const createReminderMutation = useMutation({
    mutationFn: async (reminderTime: string) => {
      return apiRequest('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          userId: address,
          sessionId: session.id,
          reminderTime: new Date(reminderTime).toISOString()
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Reminder set successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      setShowReminderOptions(false);
    },
    onError: () => {
      toast({ title: "Failed to set reminder", variant: "destructive" });
    }
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async () => {
      const reminder = reminders.find((r: any) => r.sessionId === session.id);
      if (reminder) {
        return apiRequest(`/api/reminders/${reminder.id}`, {
          method: 'DELETE'
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Reminder removed!" });
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
    },
    onError: () => {
      toast({ title: "Failed to remove reminder", variant: "destructive" });
    }
  });

  const handleSetReminder = (minutesBefore: number) => {
    const sessionTime = new Date(session.scheduledTime);
    const reminderTime = new Date(sessionTime.getTime() - (minutesBefore * 60 * 1000));
    
    // Don't set reminder if it's in the past
    if (reminderTime < new Date()) {
      toast({ 
        title: "Cannot set reminder", 
        description: "The reminder time would be in the past",
        variant: "destructive" 
      });
      return;
    }

    createReminderMutation.mutate(reminderTime.toISOString());
  };

  const handleRemoveReminder = () => {
    deleteReminderMutation.mutate();
  };

  if (compact) {
    return (
      <Button
        size="sm"
        variant={hasReminder ? "default" : "outline"}
        onClick={hasReminder ? handleRemoveReminder : () => setShowReminderOptions(!showReminderOptions)}
        className="relative"
        data-testid={`button-reminder-${session.id}`}
      >
        {hasReminder ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        {showReminderOptions && !hasReminder && (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-2 min-w-[200px]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300 px-2">Set reminder:</p>
              <button
                onClick={() => handleSetReminder(15)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded"
                data-testid="reminder-15min"
              >
                15 minutes before
              </button>
              <button
                onClick={() => handleSetReminder(30)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded"
                data-testid="reminder-30min"
              >
                30 minutes before
              </button>
              <button
                onClick={() => handleSetReminder(60)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded"
                data-testid="reminder-1hour"
              >
                1 hour before
              </button>
            </div>
          </div>
        )}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant={hasReminder ? "default" : "outline"}
        onClick={hasReminder ? handleRemoveReminder : () => setShowReminderOptions(!showReminderOptions)}
        className="flex items-center space-x-2"
        data-testid={`button-reminder-${session.id}`}
      >
        {hasReminder ? (
          <>
            <BellOff className="w-4 h-4" />
            <span>Remove Reminder</span>
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            <span>Set Reminder</span>
          </>
        )}
      </Button>

      {showReminderOptions && !hasReminder && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 min-w-[280px]">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Set reminder for:</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-gray-400">
              {session.title} - {new Date(session.scheduledTime).toLocaleString()}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleSetReminder(15)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                data-testid="reminder-15min"
              >
                <Clock className="w-4 h-4" />
                <span>15 minutes before</span>
              </button>
              <button
                onClick={() => handleSetReminder(30)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                data-testid="reminder-30min"
              >
                <Clock className="w-4 h-4" />
                <span>30 minutes before</span>
              </button>
              <button
                onClick={() => handleSetReminder(60)}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                data-testid="reminder-1hour"
              >
                <Clock className="w-4 h-4" />
                <span>1 hour before</span>
              </button>
            </div>
            <button
              onClick={() => setShowReminderOptions(false)}
              className="w-full mt-3 px-3 py-2 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}