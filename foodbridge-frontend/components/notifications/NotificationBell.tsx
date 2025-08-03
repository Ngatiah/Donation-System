// import React,{useRef} from 'react';
// import {useNotifications} from '../../src/contexts/NotificationProvider'
// import { Bell } from 'lucide-react'; // Example icon
// import { toast } from 'react-hot-toast'; 
// import { useNavigate } from 'react-router-dom';

// const NotificationBell: React.FC = () => {
//   const { notifications, clearNotifications } = useNotifications();
//   const unreadCount = notifications.length;
//   const navigate = useNavigate()


//   React.useEffect(() => {
//     // Show a toast for each new notification
//     if (notifications.length > 0) {
//       notifications.forEach(notif => {
//         if (notif.type.startsWith('match_found')) {
//           toast.success(notif.message, {
//             duration: 30000, // Stay on screen for 1/2 minute
//             onClick: () => {
//               // Optional: navigate to relevant page or show more details
//               console.log("Notification clicked:", notif.data);
//               navigate('/donations-history')
            
//             },
//           });
//         } else {
//           toast(notif.message); // Generic toast
//         }
//       });
//       // setTimeout(()=>{
//       //   clearNotifications(); 
//       // },30000)
//     }
//   }, [notifications]); // Re-run when notifications array changes

//   return (
//     <div className="relative">
//       <Bell className="h-6 w-6 text-gray-700 cursor-pointer" onClick={()=>navigate('/donations-history')}/>
//       {unreadCount > 0 && (
//         <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
//           {unreadCount}
//         </span>
//       )}
//       {/* You could also render a dropdown or modal here to list all notifications */}
//     </div>
//   );
// };

// export default NotificationBell;

import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../../src/contexts/NotificationProvider';
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast'; 
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { notifications, clearNotifications } = useNotifications();
  const unreadCount = notifications.length;
  const navigate = useNavigate();

  // Use a ref to keep track of toast IDs already shown, to prevent re-toasting
  const toastedNotificationIds = useRef(new Set<number>());

  useEffect(() => {
    // Iterate over current notifications from context
    notifications.forEach(notif => {
      // Only show toast if its ID hasn't been added to our 'toasted' set yet
      if (!toastedNotificationIds.current.has(notif.id)) {
        // Determine the toast function (success or generic)
        const toastFn = notif.type.startsWith('match_found') ? toast.success : toast;

        // Show the toast and capture its ID if you need to dismiss it manually later
        const toastId = toastFn(notif.message, {
          duration: 8000, // Toast disappears after 15 seconds automatically
          onClick: () => {
            // console.log("Notification toast clicked:", notif.data);
            navigate('/donations-history');
            // dismiss the specific toast instance when it's clicked
            toast.dismiss(toastId); 
          },
          // onDismiss: () => {
          //   // This callback fires when the toast naturally disappears or is dismissed.
          //   // If you want to clear specific notifications from your context when they fade out,
          //   // you'd need a `removeNotification(id)` in your context and call it here.
          //   // For now, `clearNotifications()` on bell click handles removal from context.
          // }
        });

        // Add the notification ID to our ref set so we don't re-toast it on next render
        toastedNotificationIds.current.add(notif.id);
      }
    });

    // No global setTimeout for clearing notifications from context here.
    // The `clearNotifications()` on bell click handles removing badges.
    // `react-hot-toast` handles its own toast display duration.

  }, [notifications, navigate]); // Dependencies: re-run when notifications array changes, or navigate changes

  return (
    <div className="relative">
      <Bell
        className="h-6 w-6 text-gray-700 cursor-pointer"
        onClick={() => {
          navigate('/donations-history');
          // When the bell is clicked, clear all notifications from the context
          // This will remove the badge and make `unreadCount` zero
          clearNotifications();
          // Also clear our ref to ensure if new notifications come in later,
          // they'll be toasted again (if they match the criteria)
          toastedNotificationIds.current.clear();
        }}
      />
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