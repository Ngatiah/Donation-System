import React, { useState, useEffect } from "react";
import CustomAvatar from "../UI/Avatar";
import { Menu, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import NotificationBell from "../notifications/NotificationBell";
import UploadedDonations from "../donations/UploadedDonations";
import AllMatches from "../donations/AllMatches";
import { DropdownMenu, Button } from "@radix-ui/themes";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Pie } from "react-chartjs-2";
// import {handleDownloadReport} from '../lib/actions/report'

ChartJS.register(ArcElement, Tooltip, Legend);

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
  is_missed: boolean;
  is_donation_deleted?: boolean;
}

interface Donation {
  id: number;
  food_type: string;
  quantity: number;
  expiry_date: string;
  food_description?: string;
  created_at: string;
  donor_name: string;
  is_claimed: boolean;
  is_deleted: boolean;
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

const Dashboard: React.FC = ({}) => {
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

  const handleDonationUpdated = (updatedDonation: Donation) => {
    setDashData((prevDashData) => {
      if (!prevDashData) return null;
      const updatedDonationsList = prevDashData.donations.map((d) =>
        d.id === updatedDonation.id ? updatedDonation : d
      );
      return { ...prevDashData, donations: updatedDonationsList };
    });
  };

  const handleDonationDeleted = (deletedDonationId: number) => {
    setDashData((prevDashData) => {
      if (!prevDashData) return null;
      const filteredDonations = prevDashData.donations.filter(
        (d) => d.id !== deletedDonationId
      );
      return { ...prevDashData, donations: filteredDonations };
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mx-4 my-4 md:mx-6">
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

  // filtering unclaimed matches
  const unclaimedAndUnmissedRecipientMatches = all_matches_history.filter(
    (match) =>
      match.recipient_name &&
      !match.is_claimed &&
      !match.is_missed &&
      !match.is_donation_deleted
  );

  const visibleDonations = donations
    .filter((donation) => !donation.is_deleted)
    .slice(0, 4);
  function getPieDataFromStats(stats: DashboardStatistics, role: string) {
    if (!stats) return null;

    const baseColors = [
      "rgba(52, 152, 219, 0.7)", // Soft blue
      "rgba(46, 204, 113, 0.7)", // Soft green
      "rgba(155, 89, 182, 0.7)", // Soft purple
      "rgba(241, 196, 15, 0.7)", // Soft yellow
      "rgba(230, 126, 34, 0.7)", // Soft orange
    ];
    if (role === "donor") {
      // const claimed = stats.claimed_donations || 0;
      // const total = stats.total_donations || 0;
      // const unclaimed = total - claimed;

      return {
        labels: [
          "Total Donations Contributed",
          "Total Donations Today",
          "Claimed Donations",
          "Total Recipients",
          "Avg. Donations Contributed",
        ],
        datasets: [
          {
            data: [
              // claimed,
              // unclaimed
              stats.total_donations || 0,
              stats.donations_today || 0,
              stats.claimed_donations || 0,
              stats.total_recipients,
              stats.average_donation || 0,
            ],
            backgroundColor: baseColors,
            borderColor: baseColors.map((color) => color.replace("0.7", "1")),
            borderWidth: 1,
          },
        ],
      };
    } else if (role === "admin") {
      return {
        labels: [
          "Total Platform Received",
          "Received Today",
          "Total Donors",
          "Total Recipients",
          "Avg. Donations",
        ],
        datasets: [
          {
            data: [
              stats.total_platform_received || 0,
              stats.platform_received_today || 0,
              stats.total_donors || 0,
              stats.total_recipients || 0,
              stats.average_donation || 0,
            ],
            backgroundColor: baseColors,
            borderColor: baseColors.map((color) => color.replace("0.7", "1")),
            borderWidth: 1,
          },
        ],
      };
    } else if (role === "recipient") {
      return {
        labels: [
          "Total Received",
          "Total Received Today",
          "Claimed Today",
          "Total Donors",
          "Avg. Donations Received",
        ],
        datasets: [
          {
            data: [
              stats.total_donations || 0,
              stats.donations_today || 0,
              stats.claimed_donations || 0,
              stats.total_donors || 0,
              stats.average_donation || 0,
            ],
            // backgroundColor: ['#8bc34a', '#ffc107'],
            backgroundColor: baseColors,
            borderColor: baseColors.map((color) => color.replace("0.7", "1")),
            borderWidth: 1,
          },
        ],
      };
    } else return null;
  }

  const chartData = getPieDataFromStats(stats, profile.role);
  const hasChartData =
    chartData && chartData.datasets[0].data.some((val) => val > 0);
  return (
    <div className="flex-1 w-full min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-6 overflow-x-hidden">
      {/* Top Navigation */}
      <header className="bg-white rounded-xl shadow-md p-4 mb-4 md:mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="mb-3 md:mb-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Welcome back,{" "}
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              {role === "recipient"
                ? profile.recipient_name
                : profile.donor_name}
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {role === "donor"
              ? "Your contributions are making a difference"
              : "Find available donations below"}
          </p>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          <NotificationBell />

          {role === "donor" && (
            <Link to="/donate" className="hidden sm:inline-block">
              <button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-all shadow-md hover:shadow-lg active:scale-95">
                <Plus className="mr-1 md:mr-2" size={16} />
                <span className="text-sm md:text-base">New Donation</span>
              </button>
            </Link>
          )}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-full p-1 transition-colors">
                <CustomAvatar />
                <span className="hidden md:inline font-medium text-gray-700">
                  {role === "recipient"
                    ? profile.recipient_name
                    : profile.donor_name}
                </span>
              </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="min-w-[180px] bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <DropdownMenu.Item
                onClick={() => navigate("/view-profile")}
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
              >
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="border-t border-gray-200 my-1" />
              <DropdownMenu.Item
                onClick={() => navigate("/logout")}
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
              >
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Mobile New Donation Button */}
      {role === "donor" && (
        <div className="sm:hidden mb-4">
          <Link to="/donate">
            <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95">
              <Plus className="mr-2" size={18} />
              New Donation
            </button>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4 md:space-y-6">
        {/* Donations Section */}
        <div className="bg-white rounded-xl shadow-md p-2 md:p-4 transition-all hover:shadow-lg">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {role === "donor" ? "Your Donations" : "Available Donations"}
            </h2>
            <Link
              to="/view-more"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-sm md:text-base"
            >
              See More
              <svg
                className="w-4 h-4"
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
            <UploadedDonations
              donations={visibleDonations}
              onDonationDeleted={handleDonationDeleted}
              onDonationUpdated={handleDonationUpdated}
              auth={{ token: token }}
            />
          ) : (
            <AllMatches
              profile={profile}
              initialMatches={unclaimedAndUnmissedRecipientMatches}
              onClaimSuccess={handleClaimSuccess}
            />
          )}
        </div>
        {/* Top Users Section */}
        <div className="bg-white space-y-4 rounded-xl shadow-md p-4 md:p-6 transition-all hover:shadow-lg">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">
            {role === "donor" ? "Top Recipients" : "Top Donors"}
          </h2>
          {topUsers.length > 0 ? (
            <ul className="space-y-2 md:space-y-3">
              {topUsers.slice(0, 5).map((user, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 md:p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    /* Add click handler if needed */
                  }}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <CustomAvatar />
                      <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <span className="ml-3 font-medium text-gray-700 truncate max-w-[120px] md:max-w-[180px]">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-gray-600 font-medium">
                    {user.total_quantity_kg} kg
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <svg
                className="w-12 h-12 mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p className="text-center text-sm md:text-base">
                No {role === "donor" ? "recipients" : "donors"} data available
                yet
              </p>
            </div>
          )}
        </div>

        {/* Doughnut Chart Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 transition-all hover:shadow-lg">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">
            Donation Statistics
          </h2>
          <div className="h-64">
            {chartData ? (
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: window.innerWidth < 768 ? "bottom" : "right",
                      labels: {
                        usePointStyle: true,
                        padding: 10,
                        font: {
                          size: window.innerWidth < 768 ? 10 : 12,
                        },
                      },
                    },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function (context) {
                          return `${context.label}: ${context.raw}`;
                        },
                      },
                    },
                  },
                  cutout: "60%",
                  animation: {
                    animateScale: true,
                    animateRotate: true,
                  },
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <div className="w-32 h-3 border-t-42 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeWidth="1.5"
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeWidth="1.5"
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </div>
                <p className="text-center text-sm md:text-base">
                  No donation data available yet. <br />
                  {role === "donor"
                    ? "Start donating to see statistics!"
                    : "Check back later for updates."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4  hover:shadow-lg hover:-translate-y-1">
            <h4 className="text-xs md:text-sm text-gray-500 mb-1">
              {role === "donor" ? "Total Donations" : "Total Received"}
            </h4>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {stats.total_donations || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4  hover:shadow-lg hover:-translate-y-1">
            <h4 className="text-xs md:text-sm text-gray-500 mb-1">
              {role === "donor" ? "Today's Donations" : "Received Today"}
            </h4>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {stats.donations_today || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4  hover:shadow-lg hover:-translate-y-1">
            <h4 className="text-xs md:text-sm text-gray-500 mb-1">
              {role === "donor" ? "Claimed Donations" : "Claimed Today"}
            </h4>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {stats.claimed_donations || 0}
            </p>
          </div>
        </div>

        {/* Additional Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Average Donations */}
          <div className="bg-white rounded-xl shadow-md p-3 md:p-4  border-t-4 hover:shadow-lg hover:-translate-y-1">
            <h4 className="text-xs md:text-sm text-gray-500 mb-1">
              {role === "donor" ? "Avg. Donations" : "Avg. Received"}
            </h4>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {stats.average_donation !== undefined
                ? stats.average_donation
                : "N/A"}
            </p>
          </div>

          {/* Conditional display for Total Donors/Recipients based on role */}
          {role === "donor" && (
            <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4  hover:shadow-lg hover:-translate-y-1">
              <h4 className="text-xs md:text-sm text-gray-500 mb-1">
                Total Recipients
              </h4>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {stats.total_recipients !== undefined
                  ? stats.total_recipients
                  : "N/A"}
              </p>
            </div>
          )}

          {role === "recipient" && (
            <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4 border-gradient bg-gradient-to-r from-blue-500 to-green-500 transition-all hover:shadow-lg hover:-translate-y-1">
              <h4 className="text-xs md:text-sm text-gray-500 mb-1">
                Total Donors
              </h4>
              <p className="text-xl md:text-2xl font-bold text-gray-800">
                {stats.total_donors !== undefined ? stats.total_donors : "N/A"}
              </p>
            </div>
          )}

          {/* Admin-specific stats */}
          {role === "admin" && (
            <>
              <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4 border-gradient bg-gradient-to-r from-blue-500 to-green-500 transition-all hover:shadow-lg hover:-translate-y-1">
                <h4 className="text-xs md:text-sm text-gray-500 mb-1">
                  Platform Total
                </h4>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {stats.total_platform_received !== undefined
                    ? `${stats.total_platform_received.toFixed(0)}kg`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4 border-gradient bg-gradient-to-r from-blue-500 to-green-500 transition-all hover:shadow-lg hover:-translate-y-1">
                <h4 className="text-xs md:text-sm text-gray-500 mb-1">
                  Today's Platform
                </h4>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {stats.platform_received_today !== undefined
                    ? `${stats.platform_received_today.toFixed(0)}kg`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4 border-gradient bg-gradient-to-r from-blue-500 to-green-500 transition-all hover:shadow-lg hover:-translate-y-1">
                <h4 className="text-xs md:text-sm text-gray-500 mb-1">
                  Total Donors
                </h4>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {stats.total_donors !== undefined
                    ? stats.total_donors
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 md:p-4 border-t-4 border-gradient bg-gradient-to-r from-blue-500 to-green-500 transition-all hover:shadow-lg hover:-translate-y-1">
                <h4 className="text-xs md:text-sm text-gray-500 mb-1">
                  Total Recipients
                </h4>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {stats.total_recipients !== undefined
                    ? stats.total_recipients
                    : "N/A"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
//   return (
//     <div className="flex-1 w-full min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 overflow-x-hidden">
//       {/* Top Navigation */}
//       <header className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
//         <div className="mb-4 md:mb-0">
//           <h1 className="text-2xl font-bold text-gray-800">
//             Welcome back,{" "}
//             <span className="text-blue-600">
//               {role === "recipient"
//                 ? profile.recipient_name
//                 : profile.donor_name}
//             </span>
//           </h1>
//           <p className="text-gray-600">
//             {role === "donor"
//               ? "Your contributions are making a difference"
//               : "Find available donations below"}
//           </p>
//         </div>

//         <div className="flex items-center space-x-4">
//           <NotificationBell />
//           <DropdownMenu.Root>
//             <DropdownMenu.Trigger>
//               <div className="flex items-center space-x-2 cursor-pointer">
//                 <CustomAvatar />
//                 <span className="hidden md:inline font-medium text-gray-700">
//                   {role === "recipient"
//                     ? profile.recipient_name
//                     : profile.donor_name}
//                 </span>
//               </div>
//             </DropdownMenu.Trigger>
//             <DropdownMenu.Content className="min-w-[180px] bg-white rounded-md shadow-lg z-50 border border-gray-200">
//               <DropdownMenu.Item
//                 onClick={() => navigate("/view-profile")}
//                 className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
//               >
//                 Profile
//               </DropdownMenu.Item>
//               <DropdownMenu.Separator className="border-t border-gray-200 my-1" />
//               <DropdownMenu.Item
//                 onClick={() => navigate("/logout")}
//                 className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
//               >
//                 Logout
//               </DropdownMenu.Item>
//             </DropdownMenu.Content>
//           </DropdownMenu.Root>
//         </div>
//       </header>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left Column */}
//         <div className="lg:col-span-2 space-y-6">
//           {/* Donations Section */}
//           <div className="bg-white rounded-xl shadow-md p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-800">
//                 {role === "donor" ? "Your Donations" : "Available Donations"}
//               </h2>
//               <Link
//                 to="/view-more"
//                 className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
//               >
//                 See More
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 5l7 7-7 7"
//                   />
//                 </svg>
//               </Link>
//             </div>

//             {role === "donor" ? (
//               <>
//                 <UploadedDonations
//                   donations={visibleDonations}
//                   onDonationDeleted={handleDonationDeleted}
//                   onDonationUpdated={handleDonationUpdated}
//                   auth={{ token: token }}
//                 />
//                 <Link to="/donate" className="inline-block mt-4">
//                   <button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-all shadow-md hover:shadow-lg">
//                     <Plus className="mr-2" size={18} />
//                     New Donation
//                   </button>
//                 </Link>
//               </>
//             ) : (
//               <AllMatches
//                 profile={profile}
//                 initialMatches={unclaimedAndUnmissedRecipientMatches}
//                 onClaimSuccess={handleClaimSuccess}
//               />
//             )}
//           </div>
//           {/* Stats Cards */}
//           {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-500">
//               <h4 className="text-sm text-gray-500 mb-1">Total Donations</h4>
//               <p className="text-2xl font-bold text-gray-800">
//                 {stats.total_donations || 0}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-green-500">
//               <h4 className="text-sm text-gray-500 mb-1">Today's Donations</h4>
//               <p className="text-2xl font-bold text-gray-800">
//                 {stats.donations_today || 0}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-400">
//               <h4 className="text-sm text-gray-500 mb-1">
//                 {role === "donor" ? "Total Recipients" : "Total Donors"}
//               </h4>
//               <p className="text-2xl font-bold text-gray-800">
//                 {role === "donor"
//                   ? stats.total_recipients || 0
//                   : stats.total_donors || 0}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-6">
//           <div className="bg-white rounded-xl shadow-md p-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               {role === "donor" ? "Top Recipients" : "Top Donors"}
//             </h2>
//             {topUsers.length > 0 ? (
//               <ul className="space-y-3">
//                 {topUsers.map((user, index) => (
//                   <li
//                     key={index}
//                     className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
//                   >
//                     <div className="flex items-center">
//                       <CustomAvatar />
//                       <span className="ml-3 font-medium text-gray-700">
//                         {user.name}
//                       </span>
//                     </div>
//                     <span className="text-gray-600">
//                       {user.total_quantity_kg} kg
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-center py-4">
//                 No {role === "donor" ? "recipients" : "donors"} data available
//               </p>
//             )}
//           </div>

//           <div className="bg-white rounded-xl shadow-md p-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               Donation Statistics
//             </h2>
//             <div className="h-64">
//               {hasChartData ? (
//                 <Pie
//                   data={chartData}
//                   options={{
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                       legend: {
//                         position: "right",
//                         labels: {
//                           usePointStyle: true,
//                           padding: 20,
//                         },
//                       },
//                     },
//                   }}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center text-gray-400">
//                   No data available
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard; */}
//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-500">
//               <h4 className="text-sm text-gray-500 mb-1">
//                 {role === "donor" ? "Total Donations" : "Total Received"}
//               </h4>
//               <p className="text-2xl font-bold text-gray-800">
//                 {stats.total_donations || 0}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-green-500">
//               <h4 className="text-sm text-gray-500 mb-1">
//                 {role === "donor" ? "Today's Donations" : "Received Today"}
//               </h4>
//               <p className="text-2xl font-bold text-gray-800">
//                 {stats.donations_today || 0}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-purple-500">
//               <h4 className="text-sm text-gray-500 mb-1">
//                 {role === "donor" ? "Claimed Donations" : "Claimed Today"}
//               </h4>
//               <p className="text-2xl font-bold text-gray-800">
//                 {stats.claimed_donations || 0}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Right Column - 1/3 width */}
//         <div className="space-y-6">
//           {/* Top Users */}
//           <div className="bg-white rounded-xl shadow-md p-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               {role === "donor" ? "Top Recipients" : "Top Donors"}
//             </h2>
//             {topUsers.length > 0 ? (
//               <ul className="space-y-3">
//                 {topUsers.map((user, index) => (
//                   <li
//                     key={index}
//                     className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
//                   >
//                     <div className="flex items-center">
//                       <CustomAvatar />
//                       <span className="ml-3 font-medium text-gray-700">
//                         {user.name}
//                       </span>
//                     </div>
//                     <span className="text-gray-600">
//                       {user.total_quantity_kg} kg
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-center py-4">
//                 No {role === "donor" ? "recipients" : "donors"} data available
//               </p>
//             )}
//           </div>

//           {/* Doughnut Chart */}
//           <div className="bg-white rounded-xl shadow-md p-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               Donation Statistics
//             </h2>
//             <div className="h-64">
//               {chartData ? (
//                 <Doughnut
//                   data={chartData}
//                   options={{
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                       legend: {
//                         position: "right",
//                         labels: {
//                           usePointStyle: true,
//                           padding: 20,
//                         },
//                       },
//                     },
//                   }}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center text-gray-400">
//                   No data available
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Additional Statistics Section */}
//       <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
//         {/* Average Donations */}
//         <div className="bg-white rounded-xl shadow-md p-4 text-center">
//           <h4 className="text-sm text-gray-500">
//             {role === "donor" ? "Avg. Donations" : "Avg. Donations Received"}
//           </h4>
//           <p className="text-lg font-bold">
//             {stats.average_donation !== undefined
//               ? stats.average_donation
//               : "N/A"}
//           </p>
//         </div>

//         {/* Conditional display for Total Donors/Recipients based on role */}
//         {role === "donor" && (
//           <div className="bg-white rounded-xl shadow-md p-4 text-center">
//             <h4 className="text-sm text-gray-500">Total Recipients</h4>
//             <p className="text-lg font-bold">
//               {stats.total_recipients !== undefined
//                 ? stats.total_recipients
//                 : "N/A"}
//             </p>
//           </div>
//         )}

//         {role === "recipient" && (
//           <div className="bg-white rounded-xl shadow-md p-4 text-center">
//             <h4 className="text-sm text-gray-500">Total Donors</h4>
//             <p className="text-lg font-bold">
//               {stats.total_donors !== undefined ? stats.total_donors : "N/A"}
//             </p>
//           </div>
//         )}

//         {/* Admin-specific stats */}
//         {role === "admin" && (
//           <>
//             <div className="bg-white rounded-xl shadow-md p-4 text-center">
//               <h4 className="text-sm text-gray-500">Platform Total Received</h4>
//               <p className="text-lg font-bold">
//                 {stats.total_platform_received !== undefined
//                   ? `${stats.total_platform_received.toFixed(2)}kg`
//                   : "N/A"}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 text-center">
//               <h4 className="text-sm text-gray-500">Platform Received Today</h4>
//               <p className="text-lg font-bold">
//                 {stats.platform_received_today !== undefined
//                   ? `${stats.platform_received_today.toFixed(2)}kg`
//                   : "N/A"}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 text-center">
//               <h4 className="text-sm text-gray-500">Total Donors Registered</h4>
//               <p className="text-lg font-bold">
//                 {stats.total_donors !== undefined ? stats.total_donors : "N/A"}
//               </p>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4 text-center">
//               <h4 className="text-sm text-gray-500">
//                 Total Recipients Registered
//               </h4>
//               <p className="text-lg font-bold">
//                 {stats.total_recipients !== undefined
//                   ? stats.total_recipients
//                   : "N/A"}
//               </p>
//             </div>
//           </>
//         )}
//       </section>
//     </div>
//   );
// };

// export default Dashboard;

//   const displayName =
//     role === "recipient" ? profile.recipient_name : profile.donor_name;
//   return (
//     <div className="flex-1 w-full min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 overflow-x-hidden">
//       {/* Top Navigation */}
//       <header className="bg-white rounded-xl shadow-md p-4 mb-3 flex justify-between items-center">
//         <div>
//           <h1 className="text-xl font-bold text-gray-800">
//             Welcome back, <span className="text-blue-600">{displayName}</span>
//           </h1>
//           <p className="text-sm text-gray-600">
//             {role === "donor"
//               ? "Your contributions are making a difference"
//               : role === "recipient"
//               ? "Find available donations below"
//               : "Admin Dashboard"}
//           </p>
//         </div>

//         <div className="flex items-center space-x-2">
//           {role === "donor" && (
//             <Link to="/donate">
//               <button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center">
//                 <Plus className="mr-1" size={16} />
//                 <span className="hidden sm:inline">New Donation</span>
//               </button>
//             </Link>
//           )}

//           <NotificationBell />

//           <DropdownMenu.Root>
//             <DropdownMenu.Trigger>
//               <div className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 rounded-full p-1">
//                 <CustomAvatar />
//                 <span className="hidden md:inline font-medium text-gray-700 ml-1">
//                   {displayName}
//                 </span>
//               </div>
//             </DropdownMenu.Trigger>
//             <DropdownMenu.Content className="min-w-[180px] bg-white rounded-md shadow-lg z-50 border border-gray-200">
//               <DropdownMenu.Item
//                 onClick={() => navigate("/view-profile")}
//                 className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
//               >
//                 Profile
//               </DropdownMenu.Item>
//               <DropdownMenu.Separator className="border-t border-gray-200 my-1" />
//               <DropdownMenu.Item
//                 onClick={() => navigate("/logout")}
//                 className="px-4 py-2 text-gray-700 hover:bg-blue-50 cursor-pointer"
//               >
//                 Logout
//               </DropdownMenu.Item>
//             </DropdownMenu.Content>
//           </DropdownMenu.Root>
//         </div>
//       </header>

//       {/* Mobile New Donation Button - Only for donors */}
//       {role === "donor" && (
//         <Link to="/donate" className="sm:hidden block mb-3 w-full">
//           <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center">
//             <Plus className="mr-2" size={16} />
//             New Donation
//           </button>
//         </Link>
//       )}

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//         {/* Left Column - Donations and Top Users */}
//         <div className="lg:col-span-2 space-y-3">
//           {/* Donations Section */}
//           {role !== "admin" && (
//             <div className="bg-white rounded-xl shadow-md p-4">
//               <div className="flex justify-between items-center mb-2">
//                 <h2 className="text-lg font-semibold text-gray-800">
//                   {role === "donor" ? "Your Donations" : "Available Donations"}
//                 </h2>
//                 <Link
//                   to="/view-more"
//                   className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
//                 >
//                   View All
//                   <svg
//                     className="w-4 h-4 ml-1"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M9 5l7 7-7 7"
//                     />
//                   </svg>
//                 </Link>
//               </div>

//               {role === "donor" ? (
//                 <UploadedDonations
//                   donations={visibleDonations}
//                   onDonationDeleted={handleDonationDeleted}
//                   onDonationUpdated={handleDonationUpdated}
//                   auth={{ token: token }}
//                 />
//               ) : (
//                 <AllMatches
//                   profile={profile}
//                   initialMatches={unclaimedAndUnmissedRecipientMatches}
//                   onClaimSuccess={handleClaimSuccess}
//                 />
//               )}
//             </div>
//           )}

//           {/* Top Users Section - Beside donations as requested */}
//           <div className="bg-white rounded-xl shadow-md p-4">
//             <h2 className="text-lg font-semibold text-gray-800 mb-2">
//               {role === "donor"
//                 ? "Top Recipients"
//                 : role === "recipient"
//                 ? "Top Donors"
//                 : "Top Contributors"}
//             </h2>
//             {topUsers.length > 0 ? (
//               <ul className="space-y-2">
//                 {topUsers.map((user, index) => (
//                   <li
//                     key={index}
//                     className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
//                   >
//                     <div className="flex items-center">
//                       <CustomAvatar />
//                       <span className="ml-2 text-sm font-medium text-gray-700">
//                         {user.name}
//                       </span>
//                     </div>
//                     <span className="text-sm text-gray-600">
//                       {user.total_quantity_kg} kg
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-center py-3 text-sm">
//                 {role === "admin"
//                   ? "No contributor data available"
//                   : `No ${
//                       role === "donor" ? "recipients" : "donors"
//                     } data available`}
//               </p>
//             )}
//           </div>

//           {/* Stats Cards with gradient borders */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//             <div
//               className="bg-white rounded-xl shadow-md p-3 border-l-4"
//               style={{
//                 borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//               }}
//             >
//               <h4 className="text-xs text-gray-500 mb-1">
//                 {role === "donor"
//                   ? "Total Donations"
//                   : role === "recipient"
//                   ? "Total Received"
//                   : "Total Matches"}
//               </h4>
//               <p className="text-xl font-bold text-gray-800">
//                 {role === "admin"
//                   ? all_matches_history.length
//                   : stats.total_donations || 0}
//               </p>
//             </div>
//             <div
//               className="bg-white rounded-xl shadow-md p-3 border-l-4"
//               style={{
//                 borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//               }}
//             >
//               <h4 className="text-xs text-gray-500 mb-1">
//                 {role === "donor"
//                   ? "Today's Donations"
//                   : role === "recipient"
//                   ? "Received Today"
//                   : "Today's Matches"}
//               </h4>
//               <p className="text-xl font-bold text-gray-800">
//                 {stats.donations_today || 0}
//               </p>
//             </div>
//             <div
//               className="bg-white rounded-xl shadow-md p-3 border-l-4"
//               style={{
//                 borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//               }}
//             >
//               <h4 className="text-xs text-gray-500 mb-1">
//                 {role === "donor"
//                   ? "Claimed Donations"
//                   : role === "recipient"
//                   ? "Claimed Today"
//                   : "Claimed Matches"}
//               </h4>
//               <p className="text-xl font-bold text-gray-800">
//                 {stats.claimed_donations || 0}
//               </p>
//             </div>
//           </div>

//           {/* Admin-specific stats - Exactly as you specified */}
//           {role === "admin" && (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
//               <div
//                 className="bg-white rounded-xl shadow-md p-3 text-center border-l-4"
//                 style={{
//                   borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//                 }}
//               >
//                 <h4 className="text-xs text-gray-500">
//                   Platform Total Received
//                 </h4>
//                 <p className="text-lg font-bold">
//                   {stats.total_platform_received !== undefined
//                     ? `${stats.total_platform_received.toFixed(2)}kg`
//                     : "N/A"}
//                 </p>
//               </div>
//               <div
//                 className="bg-white rounded-xl shadow-md p-3 text-center border-l-4"
//                 style={{
//                   borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//                 }}
//               >
//                 <h4 className="text-xs text-gray-500">
//                   Platform Received Today
//                 </h4>
//                 <p className="text-lg font-bold">
//                   {stats.platform_received_today !== undefined
//                     ? `${stats.platform_received_today.toFixed(2)}kg`
//                     : "N/A"}
//                 </p>
//               </div>
//               <div
//                 className="bg-white rounded-xl shadow-md p-3 text-center border-l-4"
//                 style={{
//                   borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//                 }}
//               >
//                 <h4 className="text-xs text-gray-500">
//                   Total Donors Registered
//                 </h4>
//                 <p className="text-lg font-bold">
//                   {stats.total_donors !== undefined
//                     ? stats.total_donors
//                     : "N/A"}
//                 </p>
//               </div>
//               <div
//                 className="bg-white rounded-xl shadow-md p-3 text-center border-l-4"
//                 style={{
//                   borderImage: "linear-gradient(to bottom, #3b82f6, #10b981) 1",
//                 }}
//               >
//                 <h4 className="text-xs text-gray-500">
//                   Total Recipients Registered
//                 </h4>
//                 <p className="text-lg font-bold">
//                   {stats.total_recipients !== undefined
//                     ? stats.total_recipients
//                     : "N/A"}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Right Column - Chart */}
//         <div className="space-y-3">
//           {/* Doughnut Chart */}
//           <div className="bg-white rounded-xl shadow-md p-4">
//             <h2 className="text-lg font-semibold text-gray-800 mb-2">
//               {role === "admin" ? "Platform Statistics" : "Donation Statistics"}
//             </h2>
//             <div className="h-48">
//               {chartData ? (
//                 <Doughnut
//                   data={chartData}
//                   options={{
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                       legend: {
//                         position: "bottom",
//                         labels: {
//                           usePointStyle: true,
//                           padding: 10,
//                         },
//                       },
//                     },
//                   }}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">
//                   No data available
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
