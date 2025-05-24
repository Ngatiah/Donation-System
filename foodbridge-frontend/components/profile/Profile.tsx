import CustomAvatar from "../UI/Avatar";
import React,{useState,useEffect} from "react";
import { Link } from "react-router-dom";
import {FaPen} from 'react-icons/fa'
import {AiFillMail} from 'react-icons/ai'
import { useAuthStore } from "../../store/authStore";

// interface User{
//   name : string;
//   role : string;
//   email:string;

// }
// interface ProfileData{
//   user : User;
//   contact_phone : string;
//   required_food_type : string;
// }

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  
}

interface DonorProfile {
  contact_phone: string;

}

interface RecipientProfile {
  contact_phone: string;
  required_food_type: string;
  required_quantity: string;
}

interface ProfileData {
  user: User;
  role: string;
  contact_phone: string;
  required_food_type: string;
  required_quantity: string;
  donor_profile?: DonorProfile;
  recipient_profile?: RecipientProfile;
}


const Profile: React.FC<ProfileData> = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8003/FoodBridge/donations/view-profile/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

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
  
  const { user, contact_phone, required_food_type, required_quantity, donor_profile, recipient_profile } = profile;
  const { name, role, email } = user;


  return (
    <div className="w-screen text-gray-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section */}
        <div className="col-span-2  rounded-2xl p-6 shadow-lg">
          {/* <h2 className="text-lg mb-4">🌞 Good Morning, Harish</h2> */}

          {/* Profile Card */}
          <div className="flex items-center justify-between rounded-xl p-4">
            <div className="flex items-center gap-4">
              <CustomAvatar/>
              <div>
                <h3 className="text-xl font-bold">{name}</h3>
                {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}

                <p className="text-sm text-gray-300 capitalize">{role}</p>
                {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}

                <p className="text-sm text-gray-400">📞 {contact_phone}</p>
                {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}

                {/* <p className="text-sm text-gray-400">📍 Hyderabad</p> */}
                <p className="text-sm text-gray-400 flex justify-between items-center"><span><AiFillMail className="h-4 w-4"/>{email}</span></p>
                <p className="text-sm text-gray-400 flex justify-between items-center">{required_food_type}</p>

              </div>
            </div>
            <Link to="/edit-profile" className="text-blue-400 text-xl">
              {/* <FaLinkedin /> */}
              <FaPen className="h-4 w-4"/>
            </Link>
          </div>

          {/* Project Resume Button */}
          <div className="mt-4  rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Start where you left 👋</p>
              <p className="text-sm">Complete the two hours design sprint</p>
            </div>
            <button className="bg-blue-600 px-4 py-2 rounded-md text-white text-sm hover:bg-blue-500">
              Jump to the project
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 my-6 text-center">
            <div className=" rounded-xl p-4">
              <p className="text-sm">Pending Donations</p>
              <h3 className="text-2xl font-bold">3</h3>
            </div>
            <div className=" rounded-xl p-4">
              <p className="text-sm">Accepted Donations</p>
              <h3 className="text-2xl font-bold">40%</h3>
            </div>
            <div className="rounded-xl p-4">
              <p className="text-sm">Completed Donations</p>
              <h3 className="text-2xl font-bold">6</h3>
            </div>
            <div className=" rounded-xl p-4">
              <p className="text-sm">Declined Tasks</p>
              <h3 className="text-2xl font-bold">2</h3>
            </div>
          </div>

          {/* Task List */}
          <div>
            <h4 className="text-lg font-semibold mb-2">Complete Due Tasks</h4>
            {[
              {
                task: "Start the two hours design sprint",
                progress: 43,
                members: 7,
              },
              {
                task: "Complete the Documentation of Travto app",
                progress: 26,
                members: 2,
              },
              {
                task: "Do A/B Testing on bench with team members",
                progress: 32,
                members: 1,
              },
            ].map((task, index) => (
              <div
                key={index}
                className=" mb-3 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <p className="text-sm">
                    {index + 1}. {task.task}
                  </p>
                  <p className="text-xs text-gray-400">
                    👥 {task.members} members
                  </p>
                </div>
                <div className="w-20 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 text-xs text-center py-0.5"
                    style={{ width: `${task.progress}%` }}
                  >
                    {task.progress}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className=" rounded-2xl p-6 shadow-lg">
          <div className="text-center">
            <h3 className="text-xl font-bold">70% Score</h3>
            <p className="text-sm text-gray-400 mt-1">🎯 Fantastic job</p>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-semibold mb-4">📊 Statistics</h4>
            <div className="space-y-4">
              <div className=" p-4 rounded-lg">
                <p className="text-sm text-gray-400">Performance</p>
                <p className="text-xs text-blue-400">📈 +12%</p>
              </div>
              <div className="p-4 rounded-lg">
                <p className="text-sm text-gray-400">Success</p>
                <p className="text-xs text-green-400">🚀 Keep going</p>
              </div>
              <div className="p-4 rounded-lg">
                <p className="text-sm text-gray-400">Innovation</p>
                <p className="text-xs text-purple-400">📉 Work in progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
