import CustomAvatar from "../UI/Avatar";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPen } from "react-icons/fa";
// import {AiFillMail} from 'react-icons/ai'
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
  // user: User;
  // name:string;
  role: string;
  contact_phone: string;
  // required_food_type: string;
  required_quantity: string;
  donor_profile?: DonorProfile;
  recipient_profile?: RecipientProfile;
}

const Profile: React.FC<ProfileData> = () => {
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

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return null;

  const { role, contact_phone, recipient_profile, donor_profile } = profile;
  const reqFood = recipient_profile?.required_food_type;
  const reqQuantity = recipient_profile?.required_quantity;
  const name = recipient_profile
    ? recipient_profile.recipient_name
    : donor_profile
    ? donor_profile.donor_name
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Main Content */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-lg border border-green-100">
          {/* Profile Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <CustomAvatar />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      role === "donor"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {role}
                  </span>
                  <span className="text-gray-600 text-sm flex items-center">
                    📞 {contact_phone}
                  </span>
                </div>
                {recipient_profile && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-green-700">
                        Food Needed:
                      </span>{" "}
                      {reqFood}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-green-700">
                        Quantity:
                      </span>{" "}
                      {reqQuantity}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Link
              to="/edit-profile"
              className="p-2 rounded-full hover:bg-blue-50 transition-colors"
            >
              <FaPen className="h-4 w-4 text-blue-600 hover:text-blue-800" />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-8 border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  Continue your impact
                </p>
                <p className="text-gray-700">
                  Complete the two hours design sprint
                </p>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 px-4 py-2 rounded-md text-white font-medium transition-all">
                Jump to project
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Pending",
                value: "3",
                bg: "bg-amber-100",
                text: "text-amber-800",
              },
              {
                label: "Accepted",
                value: "40%",
                bg: "bg-blue-100",
                text: "text-blue-800",
              },
              {
                label: "Completed",
                value: "6",
                bg: "bg-green-100",
                text: "text-green-800",
              },
              {
                label: "Declined",
                value: "2",
                bg: "bg-red-100",
                text: "text-red-800",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className={`${stat.bg} p-4 rounded-lg border ${stat.bg
                  .replace("bg-", "border-")
                  .replace("-100", "-200")} text-center`}
              >
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.text}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Tasks Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Active Tasks
            </h2>
            <div className="space-y-3">
              {[
                { task: "Start the design sprint", progress: 43, members: 7 },
                { task: "Complete Travto docs", progress: 26, members: 2 },
                { task: "A/B Testing with team", progress: 32, members: 1 },
              ].map((task, index) => (
                <div
                  key={index}
                  className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                        {task.task}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        👥 {task.members} members
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            task.progress > 50 ? "bg-green-500" : "bg-blue-500"
                          } transition-all duration-500`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          task.progress > 50
                            ? "text-green-700"
                            : "text-blue-700"
                        }`}
                      >
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Stats */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mb-3 border border-blue-200">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                70%
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Performance Score
            </h3>
            <p className="text-sm bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent font-medium mt-1">
              🎯 Fantastic job!
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Performance
              </p>
              <p className="text-sm font-semibold text-green-600 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                +12% improvement
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm font-medium text-green-800 mb-1">
                Success Rate
              </p>
              <p className="text-sm font-semibold text-blue-600">
                85% completion
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Activity</p>
              <p className="text-sm font-semibold text-green-700">
                12 tasks this week
              </p>
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
