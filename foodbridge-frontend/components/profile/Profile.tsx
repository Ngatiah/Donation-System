

import CustomAvatar from "../UI/Avatar";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPen } from "react-icons/fa";
import { useAuthStore } from "../../store/authStore";

interface DonorProfile {
  contact_phone: string;
  donor_name: string;
}

interface RecipientProfile {
  contact_phone: string;
  required_food_type: string;
  required_quantity: string;
  recipient_name: string;
}

interface ProfileData {
  role: string;
  email: string;
  contact_phone: string;
  required_quantity: string;
  donor_profile?: DonorProfile;
  recipient_profile?: RecipientProfile;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          "http://localhost:8003/FoodBridge/donations/view-profile/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data?.detail || "Failed to fetch profile");
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("An error occurred while fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mx-4 my-6">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );

  if (!profile) return null;

  const { role, contact_phone, recipient_profile, donor_profile, email } =
    profile;
  const reqFood = recipient_profile?.required_food_type;
  const reqQuantity = recipient_profile?.required_quantity;
  const name = recipient_profile
    ? recipient_profile.recipient_name
    : donor_profile
    ? donor_profile.donor_name
    : "";

  // Stats data - would normally come from API
  const stats = [
    {
      title: "Pending Donations",
      value: 3,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Accepted Donations",
      value: "12",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Completed Donations",
      value: 6,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Impact",
      value: "50+",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const tasks = [
    {
      task: "Complete your profile setup",
      progress: profile.contact_phone ? 100 : 40,
      members: 1,
      icon: "📝",
    },
    {
      task: "Make your first donation",
      progress: role === "donor" ? 75 : 0,
      members: 1,
      icon: "🍞",
    },
    {
      task: "Connect with local organizations",
      progress: 25,
      members: 3,
      icon: "🤝",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600">
            Manage your account and view your impact
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <CustomAvatar />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            role === "donor"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {role.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">{email}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/edit-profile"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <FaPen className="h-4 w-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">{contact_phone}</p>
                  </div>
                  {recipient_profile && (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">
                          Food Preferences
                        </p>
                        <p className="font-medium">
                          {Array.isArray(reqFood)
                            ? reqFood.join(", ")
                            : reqFood}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">
                          Required Quantity
                        </p>
                        <p className="font-medium">{reqQuantity} kg</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      stat.color.split(" ")[1]
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Your Progress
                </h3>
                <div className="space-y-4">
                  {tasks.map((task, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{task.icon}</span>
                          <div>
                            <p className="font-medium">{task.task}</p>
                            <p className="text-xs text-gray-500">
                              {task.members}{" "}
                              {task.members === 1 ? "member" : "members"}{" "}
                              working
                            </p>
                          </div>
                        </div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              task.progress === 100
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {task.progress}%
                        </span>
                      </div>
                      {index < tasks.length - 1 && (
                        <div className="border-t border-gray-100 mx-3 group-last:hidden"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Impact Summary */}
          <div className="space-y-6">
            {/* Impact Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Your Impact
                </h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset={283 - 283 * 0.7}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold text-blue-600">
                        70%
                      </span>
                      <span className="text-sm text-gray-500">Completion</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-gray-600">
                  You're making great progress! Keep going to maximize your
                  impact.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    to={
                      role === "donor" ? "/create-donation" : "/find-donations"
                    }
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white text-center rounded-lg hover:from-blue-600 hover:to-green-600 transition-colors"
                  >
                    {role === "donor"
                      ? "Create New Donation"
                      : "Find Donations"}
                  </Link>
                  <Link
                    to="/donations-history"
                    className="block w-full px-4 py-3 bg-gray-100 text-gray-800 text-center rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View History
                  </Link>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Achievements
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    🏆 First Donation
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    🌟 Super Helper
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    ♻️ Eco Warrior
                  </div>
                  {role === "donor" && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      🍞 Food Hero
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

// return (
//   <div className="w-screen text-gray-800 p-6 font-sans">
//     <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
//       {/* Left Section */}
//       <div className="col-span-2  rounded-2xl p-6 shadow-lg">
//         {/* <h2 className="text-lg mb-4">🌞 Good Morning, Harish</h2> */}

//         {/* Profile Card */}
//         <div className="flex items-center justify-between rounded-xl p-4">
//           <div className="flex items-center gap-4">
//             <CustomAvatar/>
//             <div>
//               <h3 className="text-xl font-bold">{name}</h3>
//               {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}

//               <p className="text-sm text-gray-300 capitalize">{role}</p>
//               {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}

//               <p className="text-sm text-gray-400">📞 {contact_phone}</p>
//               {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}

//               {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}
//               {/* <p className="text-sm text-gray-400 flex justify-between items-center"><span><AiFillMail className="h-4 w-4"/>{email}</span></p> */}
//                {recipient_profile && (
//                   <>
//                     <p className="text-sm text-gray-400">{Array.isArray(reqFood) ? reqFood.join(", ") : reqFood}</p>
//                     <p className="text-sm text-gray-400">Required Quantity: {reqQuantity}</p>
//                   </>
//                 )}

//             </div>
//           </div>
//           <Link to="/edit-profile" className="text-blue-400 text-xl">
//             {/* <FaLinkedin /> */}
//             <FaPen className="h-4 w-4"/>
//           </Link>
//         </div>

//         {/* Project Resume Button */}
//         <div className="mt-4  rounded-xl p-4 flex justify-between items-center">
//           <div>
//             <p className="text-sm text-gray-400">Start where you left 👋</p>
//             <p className="text-sm">Complete the two hours design sprint</p>
//           </div>
//           <button className="bg-blue-600 px-4 py-2 rounded-md text-white text-sm hover:bg-blue-500">
//             Jump to the project
//           </button>
//         </div>

//         {/* Stats Summary */}
//         <div className="grid grid-cols-4 gap-4 my-6 text-center">
//           <div className=" rounded-xl p-4">
//             <p className="text-sm">Pending Donations</p>
//             <h3 className="text-2xl font-bold">3</h3>
//           </div>
//           <div className=" rounded-xl p-4">
//             <p className="text-sm">Accepted Donations</p>
//             <h3 className="text-2xl font-bold">40%</h3>
//           </div>
//           <div className="rounded-xl p-4">
//             <p className="text-sm">Completed Donations</p>
//             <h3 className="text-2xl font-bold">6</h3>
//           </div>
//           <div className=" rounded-xl p-4">
//             <p className="text-sm">Declined Tasks</p>
//             <h3 className="text-2xl font-bold">2</h3>
//           </div>
//         </div>

//         {/* Task List */}
//         <div>
//           <h4 className="text-lg font-semibold mb-2">Complete Due Tasks</h4>
//           {[
//             {
//               task: "Start the two hours design sprint",
//               progress: 43,
//               members: 7,
//             },
//             {
//               task: "Complete the Documentation of Travto app",
//               progress: 26,
//               members: 2,
//             },
//             {
//               task: "Do A/B Testing on bench with team members",
//               progress: 32,
//               members: 1,
//             },
//           ].map((task, index) => (
//             <div
//               key={index}
//               className=" mb-3 p-4 rounded-xl flex justify-between items-center"
//             >
//               <div>
//                 <p className="text-sm">
//                   {index + 1}. {task.task}
//                 </p>
//                 <p className="text-xs text-gray-400">
//                   👥 {task.members} members
//                 </p>
//               </div>
//               <div className="w-20 rounded-full overflow-hidden">
//                 <div
//                   className="bg-blue-500 text-xs text-center py-0.5"
//                   style={{ width: `${task.progress}%` }}
//                 >
//                   {task.progress}%
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Right Section */}
//       <div className=" rounded-2xl p-6 shadow-lg">
//         <div className="text-center">
//           <h3 className="text-xl font-bold">70% Score</h3>
//           <p className="text-sm text-gray-400 mt-1">🎯 Fantastic job</p>
//         </div>

//         <div className="mt-6">
//           <h4 className="text-md font-semibold mb-4">📊 Statistics</h4>
//           <div className="space-y-4">
//             <div className=" p-4 rounded-lg">
//               <p className="text-sm text-gray-400">Performance</p>
//               <p className="text-xs text-blue-400">📈 +12%</p>
//             </div>
//             <div className="p-4 rounded-lg">
//               <p className="text-sm text-gray-400">Success</p>
//               <p className="text-xs text-green-400">🚀 Keep going</p>
//             </div>
//             <div className="p-4 rounded-lg">
//               <p className="text-sm text-gray-400">Innovation</p>
//               <p className="text-xs text-purple-400">📉 Work in progress</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );
// };
