import React, { useEffect, useState } from "react";
import CustomAvatar from "../UI/Avatar";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import NotificationBell from "../notifications/NotificationBell";
import UploadedDonations from "../donations/UploadedDonations";
import AllMatches from "../donations/AllMatches";
import { DropdownMenu } from "@radix-ui/themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
interface TopUser {
  name: string;
  total_quantity_kg: number;
}

interface Profile {
  role: string;
  donor_name: string;
  recipient_name: string;
  required_food_type?: string;
  required_quantity?: number;
}

interface DonationMatch {
  id: number;
  donor_name: string;
  recipient_name: string;
  food_type: string;
  matched_quantity: number;
  food_description: string;
  expiry_date: string;
  created_at: string;
  is_claimed: boolean;
}

interface Donation {
  id: number;
  food_type: string;
  quantity: number;
  expiry_date: string;
  food_description?: string;
  created_at: string;
}

interface DashboardStatistics {
  role: string;
  total_donations?: number;
  claimed_donations?: number;
  donations_today?: number;
  total_donors?: number;
  total_recipients?: number;
  average_donation?: number;
  total_platform_received?: number;
  platform_received_today?: number;
}

interface DashboardData {
  profile: Profile;
  all_matches_history: DonationMatch[];
  donations: Donation[];
  topUsers: TopUser[];
  stats: DashboardStatistics;
}
const Dashboard: React.FC = () => {
  // ... (keep all your existing state and data fetching logic)
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  // Helper to fetch all dashboard data
  const fetchAllDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);

      // 1. Fetch Profile Data
      const profileRes = await fetch(
        "http://localhost:8003/FoodBridge/donations/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      const responseData = await profileRes.json();
      if (!profileRes.ok) {
        setError(responseData?.detail || "Failed to fetch user profile");
        return;
      }

      // Extract the actual profile object from the response
      const userProfile: Profile = {
        role: responseData.profile.role,
        donor_name: responseData.profile.donor_name,
        recipient_name: responseData.profile.recipient_name,
        required_food_type: responseData.profile.required_food_type,
        required_quantity: responseData.profile.required_quantity,
      };

      let donationData: Donation[] = [];
      let allMatchesHistoryData: DonationMatch[] = [];
      let topUsersData: TopUser[] = [];
      let statsData: DashboardStatistics[] = [];

      // 2. Fetch User's Donations (for donor) if applicable
      if (userProfile.role === "donor") {
        const donorDonationsRes = await fetch(
          "http://localhost:8003/FoodBridge/donations/create-donations/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        );
        const donorDonationsJson = await donorDonationsRes.json();
        if (!donorDonationsRes.ok)
          throw new Error(
            donorDonationsJson?.detail || "Failed to fetch donor's donations"
          );
        donationData = donorDonationsJson;
      } else if (userProfile.role === "recipient") {
        const matchHistoryRes = await fetch(
          "http://localhost:8003/FoodBridge/donations/donation-history/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        );
        const matchHistoryJson = await matchHistoryRes.json();
        if (!matchHistoryRes.ok) {
          console.error(
            "Failed to fetch match history:",
            matchHistoryJson?.detail
          );
          allMatchesHistoryData = [];
        } else {
          allMatchesHistoryData = matchHistoryJson || [];
        }
      }

      // 3. Fetch Top Users Data
      const topUsersRes = await fetch(
        "http://localhost:8003/FoodBridge/donations/top-users/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      const topUsersJson = await topUsersRes.json();
      if (!topUsersRes.ok) {
        console.error(
          "Failed to fetch top users:",
          topUsersJson?.error || topUsersJson?.detail
        );
      } else {
        if (userProfile.role === "donor" && topUsersJson.top_recipients) {
          topUsersData = topUsersJson.top_recipients;
        } else if (
          userProfile.role === "recipient" &&
          topUsersJson.top_donors
        ) {
          topUsersData = topUsersJson.top_donors;
        }
      }

      // FETCH STATS
      try {
        const statsRes = await fetch(
          "http://localhost:8003/FoodBridge/donations/statistics/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        );

        const statsJson = await statsRes.json();

        if (!statsRes.ok) {
          console.error(
            "Failed to fetch statistics:",
            statsJson?.detail || statsJson?.error
          );
        } else {
          statsData = statsJson;
        }
      } catch (statsError) {
        console.error("Error fetching statistics:", statsError);
      }

      setDashData({
        profile: userProfile,
        donations: donationData,
        all_matches_history: allMatchesHistoryData,
        topUsers: topUsersData,
        stats: statsData,
      });
    } catch (err: any) {
      console.error("Dashboard data fetch error:", err);
      setError(
        err.message || "An error occurred while fetching dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllDashboardData();
    } else {
      setLoading(false);
      setError("Authentication token not found. Please log in.");
    }
  }, [token]);

  const handleClaimSuccess = (claimedMatchId: number) => {
    setDashData((prevDashData) => {
      if (!prevDashData) return null;
      // Update the is_claimed status to true for the specific match
      const updatedMatches = prevDashData.all_matches_history.map((match) =>
        match.id === claimedMatchId ? { ...match, is_claimed: true } : match
      );
      return { ...prevDashData, all_matches_history: updatedMatches };
    });
  };

  const StatsCard = ({
    title,
    value,
    color,
  }: {
    title: string;
    value: number;
    color: string;
  }) => (
    <div
      className={`bg-white rounded-xl p-3 md:p-4 text-center border-t-4 ${color} shadow-sm`}
    >
      <h4 className="text-xs md:text-sm font-medium text-gray-500">{title}</h4>
      <p className="text-xl md:text-2xl font-bold">{value}</p>
    </div>
  );
  //   if (loading)
  //     return (
  //       <div className="animate-pulse text-gray-500">Loading dashboard...</div>
  //     );
  //   if (error) return <div>Error: {error}</div>;
  //   if (!dashData) return null;
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mx-6 my-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );

  if (!dashData) return null;
  const { profile, all_matches_history, donations, topUsers, stats } = dashData;
  const role = profile.role;
  // const name = profile.name;
  console.log("Current user role:", role);

  if (!role) {
    return (
      <div>Error: User role not found in profile data. Please log in.</div>
    );
  }

  // Filter unclaimed matches for recipients specifically for the dashboard display
  // const unclaimedRecipientMatches = all_matches_history.filter(match =>
  //    profile &&  match.recipient_name  profile.recipient_name && !match.is_claimed
  // );
  const unclaimedRecipientMatches = all_matches_history.filter(
    (match) => match.recipient_name && !match.is_claimed
  );

  const visibleDonatons = donations.slice(0, 3);

  // Prepare chart data from stats
  const chartData = [
    { name: "Total", value: stats?.total_donations || 0 },
    { name: "Today", value: stats?.donations_today || 0 },
    { name: "Claimed", value: stats?.claimed_donations || 0 },
    { name: "Avg", value: stats?.average_donation || 0 },
    { name: "Recipients", value: stats?.total_recipients || 0 },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mx-6 my-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );

  if (!dashData) return null;

  return (
    <main className="flex-1 p-4 md:p-6  min-h-screen">
      {/* Header Section */}
      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-4 rounded-xl shadow-sm gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Welcome back,{" "}
              {role === "recipient"
                ? profile.recipient_name
                : profile.donor_name}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {role === "donor"
                ? "Your contributions are making a difference"
                : "Find available donations below"}
            </p>
          </div>
        
          {role === "donor" && (
            <Link to="/donate" className="w-full md:w-auto">
              <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm md:text-base">
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                <span>New Donation</span>
              </button>
            </Link>
          )}

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <NotificationBell />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <CustomAvatar />
              </DropdownMenu.Trigger>
              <div className="flex items-center gap-2 cursor-pointer">
                <CustomAvatar />
                <span className="font-medium text-gray-700 hidden md:inline">
                  //{" "}
                  {role == "recipient"
                    ? dashData.profile.recipient_name
                    : dashData.profile.donor_name}
                </span>
              </div>
              <DropdownMenu.Content className="min-w-[200px] bg-white rounded-md shadow-lg z-50">
                <DropdownMenu.Item
                  className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                  onClick={() => navigate("/view-profile")}
                >
                  Profile
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="border-t border-gray-200 my-1" />
                <DropdownMenu.Item
                  className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                  onClick={() => navigate("/logout")}
                >
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      </div> */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-4 rounded-xl shadow-sm gap-4">
        {/* Welcome text and mobile controls */}
        <div className="w-full">
          <div className="flex justify-between items-start w-full">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                Welcome back,{" "}
                {role === "recipient"
                  ? profile.recipient_name
                  : profile.donor_name}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {role === "donor"
                  ? "Your contributions are making a difference"
                  : "Find available donations below"}
              </p>
            </div>

            {/* Mobile view - notification and avatar only */}
            <div className="flex items-center gap-2 md:hidden">
              <NotificationBell />
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <CustomAvatar />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="min-w-[200px] bg-white rounded-md shadow-lg z-50">
                  <DropdownMenu.Item
                    className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                    onClick={() => navigate("/view-profile")}
                  >
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="border-t border-gray-200 my-1" />
                  <DropdownMenu.Item
                    className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                    onClick={() => navigate("/logout")}
                  >
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>

          {/* New Donation Button - below text on mobile */}
          {role === "donor" && (
            <Link
              to="/donate"
              className="w-full mt-4 md:mt-0 md:w-auto block md:inline"
            >
              <button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm md:text-base">
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                <span>New Donation</span>
              </button>
            </Link>
          )}
        </div>

        {/* Desktop view - notification and profile */}
        <div className="hidden md:flex items-center gap-4">
          <NotificationBell />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <div className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <CustomAvatar />
                <span className="font-medium text-gray-700">
                  {role === "recipient"
                    ? profile.recipient_name
                    : profile.donor_name}
                </span>
              </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="min-w-[200px] bg-white rounded-md shadow-lg z-50">
              <DropdownMenu.Item
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                onClick={() => navigate("/view-profile")}
              >
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="border-t border-gray-200 my-1" />
              <DropdownMenu.Item
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
                onClick={() => navigate("/logout")}
              >
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Donations Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {role === "donor" ? "Your Donations" : "Available Donations"}
            </h2>
            <Link
              to="/view-more"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              See More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {role === "donor" ? (
            donations.length > 0 ? (
              <UploadedDonations donations={visibleDonatons} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>You haven't added any donations yet.</p>
                <Link
                  to="/donate"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Click "New Donation" to get started!
                </Link>
              </div>
            )
          ) : (
            <AllMatches
              profile={dashData.profile}
              initialMatches={unclaimedRecipientMatches}
              onClaimSuccess={handleClaimSuccess}
            />
          )}
        </div>

        {/* Top Users Section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {role === "donor" ? "Top Recipients" : "Top Donors"}
          </h3>

          {topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                >
                  <CustomAvatar />
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-800">{user.name}</h4>
                    <p className="text-sm text-gray-500">
                      {user.total_quantity_kg}kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No {role === "donor" ? "recipients" : "donors"} data available
            </div>
          )}
        </div>
      </div>
      {/* Statistics Chart */}
      <section className="mt-6 mb-8">
        {" "}
        {/* Added margin-bottom */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Donation Statistics
          </h3>
          <div className="h-48">
            {" "}
            {/* Reduced height from h-64 */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="url(#colorGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3B82F6" /> {/* Blue */}
                    <stop offset="100%" stopColor="#10B981" /> {/* Green */}
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Stats Cards with dual-colored borders */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-6">
          {" "}
          {/* Added margin-top */}
          <StatsCard
            title="Total Donations"
            value={stats?.total_donations || 0}
            color="border-t-blue-600 border-r-green-600"
          />
          <StatsCard
            title="Today's Donations"
            value={stats?.donations_today || 0}
            color="border-t-green-600 border-r-blue-600"
          />
          <StatsCard
            title="Claimed Donations"
            value={stats?.claimed_donations || 0}
            color="border-t-blue-500 border-r-green-500"
          />
          <StatsCard
            title="Avg. Donations"
            value={stats?.average_donation || 0}
            color="border-t-green-500 border-r-blue-500"
          />
          <StatsCard
            title={role === "donor" ? "Total Recipients" : "Total Donors"}
            value={
              role === "donor"
                ? stats?.total_recipients || 0
                : stats?.total_donors || 0
            }
            color="border-t-blue-400 border-r-green-400"
          />
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
