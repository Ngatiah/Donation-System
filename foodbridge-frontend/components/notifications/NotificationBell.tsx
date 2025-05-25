import React from 'react';
import {useNotifications} from '../../src/contexts/NotificationProvider'
import { Bell } from 'lucide-react'; // Example icon
import { toast } from 'react-hot-toast'; 
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { notifications, clearNotifications } = useNotifications();
  const unreadCount = notifications.length;
  const navigate = useNavigate()

  React.useEffect(() => {
    // Show a toast for each new notification
    if (notifications.length > 0) {
      notifications.forEach(notif => {
        if (notif.type.startsWith('match_found')) {
          toast.success(notif.message, {
            duration: 60000, // Stay on screen for 1minute
            onClick: () => {
              // Optional: navigate to relevant page or show more details
              console.log("Notification clicked:", notif.data);
              navigate('/donations-history')
            },
          });
        } else {
          toast(notif.message); // Generic toast
        }
      });
      // Optionally clear notifications after they've been displayed
      // clearNotifications(); // Only if you want them to disappear from the list after toast
    }
  }, [notifications]); // Re-run when notifications array changes

  return (
    <div className="relative">
      <Bell className="h-6 w-6 text-gray-700 cursor-pointer" onClick={()=>navigate('/donations-history')}/>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      {/* You could also render a dropdown or modal here to list all notifications */}
    </div>
  );
};

export default NotificationBell;
