// import React from 'react';
import React,{useState,useEffect} from 'react';
import CustomAvatar from '../../UI/Avatar'
import {ChevronDown,Plus} from 'lucide-react'
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../../UI/DropdownMenu'
// import { useDonationActions } from '../hooks/useDonationsActions';
import NotificationBell from '../../notifications/NotificationBell'
interface User{
    name : string;
    role : string;
    email:string;
}

interface DashboardStatistics {
    role: string;
    total_donations?: number;      
    donations_today?: number;     
    total_donors?: number;
    total_recipients?: number;
    average_donation?: number;     
    total_platform_received?: number;
    platform_received_today?: number;
}
interface TopUser {
    name: string;
    total_quantity_kg: number;
}

interface Profile{
    user: User;
    role:string;
    required_food_type?:string;
    required_quantity?: number;
}

interface DonationMatch{
    id:number;
    donor_name : string;
    recipient_name:string;
    food_type:string;
    matched_quantity:string,
    food_description:string;
    expiry_date: string;
    match_score?: number;
    // status: 'pending' | 'accepted' | 'declined' | 'fulfilled';
}

interface Donation {
    id : number;
    food_type: string;
    quantity: number;
    expiry_date: string;
    food_description?: string;
    // status: 'pending' | 'matched' | 'declined_by_recipient' | 'fulfilled';
}

interface DashboardData{
    profile : Profile;
    matches : DonationMatch[];
    donations : Donation[];
    topUsers: TopUser[];
    stats : DashboardStatistics
}


const Dashboard : React.FC = () => {

    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
    const token = useAuthStore(state => state.token);

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setError(null);
      setNoMatchesMessage(null);
      setLoading(true); 
      const res = await fetch("http://localhost:8003/FoodBridge/donations/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      const profileData = await res.json();
      console.log("Fetched profileData:", profileData);

      if (!res.ok) {
        setError(profileData?.detail || "Failed to fetch profile and donation matches data");
        return;
      }

      let donationData: Donation[] = [];
      let matchData: DonationMatch[] = [];
      let topUsersData: TopUser[] = [];
      let statsData : DashboardStatistics | undefined;

      if (profileData?.profile?.role === 'donor') {
        const donorRes = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        const donorDonations = await donorRes.json();
        if (!donorRes.ok) throw new Error(donorDonations?.detail || "Failed to fetch donations");
        donationData = donorDonations;
      } else if (profileData?.profile?.role === 'recipient') {
        const recipientProfile = profileData.profile; // Get recipient profile
        if (!recipientProfile) {
            throw new Error("Recipient profile not available for matching.");
        }

        // console.log("Recipient Profile received:", recipientProfile); // ADD THIS LINE
        // console.log("Required Food Type:", recipientProfile.required_food_type); // ADD THIS LINE
        // console.log("Required Quantity:", recipientProfile.required_quantity); // ADD THIS LINE

         // Ensure required_quantity is treated as a number
            // const quantityToSend = typeof recipientProfile.required_quantity === 'string'
            // ? parseFloat(recipientProfile.required_quantity)
            // : recipientProfile.required_quantity;

        const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-matches/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        //   body: JSON.stringify({
        //     recipient_food_type: recipientProfile.required_food_type,
        //     required_quantity: quantityToSend,
        // }),
        });

        const recipientMatches = await matchRes.json();
        // if (!matchRes.ok) throw new Error(recipientMatches?.detail || "Failed to fetch matches");
        if (!matchRes.ok) {
            if (matchRes.status === 404 && recipientMatches?.message) {
                setNoMatchesMessage(recipientMatches.message);
                matchData = []; 
            } else if (matchRes.status === 204 && recipientMatches?.message) {
                setNoMatchesMessage(recipientMatches.message);
                matchData = [];
            }
            else {
                // For other errors, set the general error state
                setError(recipientMatches?.detail || "Failed to fetch matches");
                matchData = [];
            }
        } else {
            // If response is OK, set matches data
            const receivedMatches : DonationMatch[]= recipientMatches.matches;
            const uniqueMatches = Array.from(
              new Map(receivedMatches.map((item : DonationMatch) => [item.id, item])).values()
            );
            matchData = uniqueMatches
              }
      }

        // --- FETCH TOP USERS DATA ---
        const topUsersRes = await fetch("http://localhost:8003/FoodBridge/donations/top-users/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
        },
         });

        const topUsersJson = await topUsersRes.json();
             if (!topUsersRes.ok) {
                    console.error("Failed to fetch top users:", topUsersJson?.error || topUsersJson?.detail);
                    // Optionally set an error specifically for top users, or just skip
             } else {
                    // Decide which list to use based on the logged-in user's role
                   if (profileData?.profile?.role === 'donor' && topUsersJson.top_recipients) {
                        topUsersData = topUsersJson.top_recipients;
                   
                      } else if (profileData?.profile?.role === 'recipient' && topUsersJson.top_donors) {
                        topUsersData = topUsersJson.top_donors;
        }
      }

        // FETCH STATS
        try {
            const statsRes = await fetch("http://localhost:8003/FoodBridge/donations/statistics/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            });

            const statsJson = await statsRes.json();

            if (!statsRes.ok) {
                console.error("Failed to fetch statistics:", statsJson?.detail || statsJson?.error);
            } else {
                statsData = statsJson as DashboardStatistics;
            }
        } catch (statsError) {
            console.error("Error fetching statistics:", statsError);
        }



      setDashData({ ...profileData, donations: donationData, matches: matchData,topUsers: topUsersData,stats : statsData });

        } catch (err) {
          console.error("Profile fetch error:", err);
          setError("An error occurred while fetching profile");
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, [token]);



    if (loading) return <div className="animate-pulse text-gray-500">Loading dashboard...</div>
     if (error) return <div>Error: {error}</div>;
     if (!dashData) return null;
     
     const { profile,matches ,donations,topUsers} = dashData;
     if (!profile?.role) {
        return <div>Error: User role not found in profile data</div>;
      }
     const role = profile.role.toLowerCase();
     console.log("role",role);

     

  return (
    <main className="flex-1 p-6 overflow-auto">
        {/* <!-- Navbar --> */}
        <div className="flex items-center w-full justify-end">
            
            <div className="flex items-center space-x-4 ml-4">
            <Link to="/donate">
              {role === 'donor' && <button className="bg-blue-600 text-white px-4 py-2 rounded">New Donation<span className="ml-2 items-center flex"><Plus className='h-8 w-8'/></span>
              </button>}
            </Link>

            <NotificationBell/>

              {/* <!-- Avatar Dropdown --> */}
              <div className="relative group flex flex-cols">
                <CustomAvatar/>
                {/* <span className="font-semibold text-gray-800 hidden md:inline">{profile.user.name}</span> */}
                <DropdownMenu >
                    <DropdownMenuTrigger>
                            <ChevronDown className='h-8 w-8 px-1'/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            Recipient
                            {/* {name} */}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
              </div>
            </div>
          </div>

      {/* Main Content */}
      {/* <!-- Donations --> */}
      <section className="mb-8">
          <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">{role === 'donor' ? 'Your Donations' : 'Available Donations'}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
             
              {/* render donations based on role */}
            <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
            {/*  uploaded donations by donor */}
            {role === 'donor' && donations?.map((donation) => (
            <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
                <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                <h3 className="font-semibold">{donation.food_type}</h3>
                <div className="text-sm">Quantity: <strong>{donation.quantity}</strong></div>
                <div className="text-sm">Expires: <strong>{new Date(donation.expiry_date).toLocaleDateString()}</strong></div>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
               
            // </div>
            ))}
               
            {/* matched donations for recipient  */}
          {role === 'recipient' && (
              <>
                {matches?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 col-span-3"> 
                    {matches.map((match, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl shadow-lg text-left">
                        {/* <img src="/images/food-placeholder.jpg" alt={`${match.food_type} image`} className="rounded-md mb-3 w-full h-40 object-cover" /> */}
                        <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                        <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
                        <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
                        <p className="text-sm text-gray-700">Quantity: {match.matched_quantity}</p>
                        <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                        
                      </div>
                    ))}
                  </div>
                ) : (
                  // Display message when no matches are found
                  <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700">
                    <p className="text-lg font-medium">
                        {noMatchesMessage || "No available donations found matching your criteria at this time. Please check back later or update your required food type."}
                    </p>
                    {/* Optional: Add a link to update profile if needed */}
                    {/* <Link to="/profile-settings" className="text-blue-600 hover:underline mt-4 inline-block">Update Profile</Link> */}
                  </div>
                )}
              </>
            )}

            </div>

               {/* Top Users list based on role */}
              <div className="p-4 col-span-1">                              
              <h3 className="font-semibold mb-2">
              {role === 'donor' ? 'Top Recipients' : 'Top Donors'}                </h3>
              <ul className="space-y-2">
                 {topUsers.length > 0 ? (
                                topUsers.map((user, i) => (
                                    <li key={i} className="flex justify-between items-center p-4 rounded border border-gray-200">
                                        <CustomAvatar />
                                        <span className='text-base p-2'>{user.name}</span>
                                        <span className='text-base p-2'>{user.total_quantity_kg}kg</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-gray-500 text-center">No top {role === 'donor' ? 'recipients' : 'donors'} data available.</li>
                            )}
              </ul>
              </div>
              
          </div>
      </section>

      {/* <!-- Statistics and Donors --> */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* <!-- Statistics Chart --> */}
          <div className="bg-white p-4 rounded shadow col-span-2">
              <h3 className="font-semibold mb-2">Statistics</h3>
              <div className="h-48 bg-gray-200 flex items-center justify-center">[Chart Placeholder]</div>
        
          </div>

          {/* total donations with their statuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1">
          <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              
          </div>
      </section>

      {/* <!-- Summary --> */}
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Always render these, but adjust labels based on role */}
        <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {dashData.stats?.role === 'donor' && "Your Total Donations"}
                {dashData.stats?.role === 'recipient' && "Total Donations Received"}
                {dashData.stats?.role === 'admin' && "Platform Total Donations"}
            </h4>
            <p className="text-lg font-bold">
                {dashData.stats.total_donations !== undefined ?
                `${dashData.stats.total_donations}` : 'N/A'}
            </p>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {dashData.stats?.role === 'donor' && "Total Donations Today"}
                {dashData.stats?.role === 'recipient' && "Donations Received Today"}
                {dashData.stats?.role === 'admin' && "Platform Donations Today"}
            </h4>
            <p className="text-lg font-bold">
                {dashData.stats.donations_today !== undefined ?
                `${dashData.stats.donations_today}` : 'N/A'}
            </p>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {dashData.stats?.role === 'donor' && "Avg. Donations"}
                {dashData.stats?.role === 'recipient' && "Avg. Donations Received"}
                {dashData.stats?.role === 'admin' && "Platform Avg. Donations"}
            </h4>
            <p className="text-lg font-bold">
                {dashData.stats.average_donation !== undefined ?
                `${dashData.stats.average_donation}` : 'N/A'}
            </p>
        </div>

        {/* Conditional display for Total Donors/Recipients based on role */}
        {/* Donors see Total Recipients */}
        {dashData.stats?.role === 'donor' && (
            <div className="bg-white p-4 rounded shadow text-center">
                <h4 className="text-sm text-gray-500">Total Recipients</h4>
                <p className="text-lg font-bold">
                    {dashData.stats.total_recipients !== undefined ?
                    dashData.stats.total_recipients.toLocaleString() : 'N/A'}
                </p>
            </div>
        )}

        {/* Recipients see Total Donors */}
        {dashData.stats?.role === 'recipient' && (
            <div className="bg-white p-4 rounded shadow text-center">
                <h4 className="text-sm text-gray-500">Total Donors</h4>
                <p className="text-lg font-bold">
                    {dashData.stats.total_donors !== undefined ?
                    dashData.stats.total_donors.toLocaleString() : 'N/A'}
                </p>
            </div>
        )}


        {/* Additional Admin-specific stats - These remain ONLY for admin */}
        {dashData.stats?.role === 'admin' && (
            <>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Platform Total Received</h4>
                    <p className="text-lg font-bold">
                        {dashData.stats.total_platform_received !== undefined ?
                        `${dashData.stats.total_platform_received.toFixed(2)}kg` : 'N/A'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Platform Received Today</h4>
                    <p className="text-lg font-bold">
                        {dashData.stats.platform_received_today !== undefined ?
                        `${dashData.stats.platform_received_today.toFixed(2)}kg` : 'N/A'}
                    </p>
                </div>
                {/* Admin sees both total donors and total recipients */}
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Total Donors Registered</h4>
                    <p className="text-lg font-bold">
                        {dashData.stats.total_donors !== undefined ?
                        dashData.stats.total_donors.toLocaleString() : 'N/A'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Total Recipients Registered</h4>
                    <p className="text-lg font-bold">
                        {dashData.stats.total_recipients !== undefined ?
                        dashData.stats.total_recipients.toLocaleString() : 'N/A'}
                    </p>
                </div>
            </>
        )}
    </section>
    </main>
  );
};

export default Dashboard;


// import React, { useState, useEffect } from 'react';
// import CustomAvatar from '../UI/Avatar';
// import { ChevronDown, Plus } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { useAuthStore } from '../../store/authStore';
// import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from '../UI/DropdownMenu';
// import { useDonationActions } from '../hooks/useDonationsActions';
// import NotificationBell from '../notifications/NotificationBell';

// // --- INTERFACES ---
// interface User {
//     name: string;
//     role: string;
//     email: string;
// }

// interface DashboardStatistics {
//     role: string; // 'donor', 'recipient', 'admin'
//     total_donations?: number; // Total donations relevant to the user/platform
//     donations_today?: number; // Donations relevant today
//     total_donors?: number; // Total donors registered (for admin/recipient)
//     total_recipients?: number; // Total recipients registered (for admin/donor)
//     average_donation?: number; // Average donation quantity
//     total_platform_received?: number; // Total received by platform (for admin)
//     platform_received_today?: number; // Received by platform today (for admin)
// }

// // Defines the structure for top users (donors or recipients)
// interface TopUser {
//     name: string;
//     total_quantity_kg: number;
// }

// interface Profile {
//     user: User;
//     role: string;
//     required_food_type?: string; // Specific for recipients
//     required_quantity?: number;   // Specific for recipients
// }

// interface DonationMatch {
//     id: number;
//     donor_name: string;
//     recipient_name: string;
//     food_type: string;
//     matched_quantity: number;
//     food_description: string;
//     expiry_date: string;
//     match_score?: number;
//     status: 'pending' | 'accepted' | 'declined' | 'fulfilled' | 'declined_by_system';
//     created_at?: string;
// }

// interface Donation {
//     id: number;
//     food_type: string;
//     quantity: number;
//     expiry_date: string;
//     food_description?: string;
//     status: 'pending' | 'matched' | 'declined_by_recipient' | 'fulfilled' | 'unavailable'; 
//     created_at?: string;
// }

// // Defines the overall structure of data received from the dashboard API
// interface DashboardData {
//     profile: Profile;
//     uploaded_donations?: Donation[]; // For donor's donations
//     available_donations?: Donation[]; // For recipient's available (AI-scored) donations to request
//     matches: DonationMatch[];
//     topUsers: TopUser[];
//     stats: DashboardStatistics;
// }

// const Dashboard: React.FC = () => {
//     const [dashData, setDashData] = useState<DashboardData | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [fetchError, setFetchError] = useState<string | null>(null);
//     const [noAvailableDonationsMessage, setNoAvailableDonationsMessage] = useState<string | null>(null);
//     const token = useAuthStore(state => state.token);

//     // handle donation/matches actions (status updates) 
//     const {
//         updateMatchStatus,
//         updateDonationStatus,
//         loading: actionLoading, 
//         error: actionError,  
//         clearError: clearActionError
//     } = useDonationActions();

//     const fetchDashboardData = async () => {
//         try {
//             setFetchError(null); 
//             setNoAvailableDonationsMessage(null);
//             setLoading(true); // Start loading

//             // Fetch main dashboard data (profile, donations/offers, matches)
//             const res = await fetch("http://localhost:8003/FoodBridge/donations/", {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Token ${token}`,
//                 },
//             });

//             const profileData = await res.json();
//             console.log("Fetched profileData:", profileData);

//             if (!res.ok) {
//                 // If response is not OK, set fetch error and return
//                 setFetchError(profileData?.detail || "Failed to fetch profile and dashboard data");
//                 return;
//             }

//             // Initialize dashboard state with common data received
//             const dashboardState: DashboardData = {
//                 profile: profileData.profile,
//                 matches: profileData.matches || [], // Matches (offers, accepted, fulfilled, etc.)
//                 topUsers: [], // Will be populated next
//                 stats: {} as DashboardStatistics // Will be populated next
//             };

//             // Assign role-specific donation lists based on the backend response
//             if (profileData?.profile?.role === 'donor') {
//                 dashboardState.uploaded_donations = profileData.uploaded_donations || [];
//             } else if (profileData?.profile?.role === 'recipient') {
//                 dashboardState.available_donations = profileData.available_donations || []; // For recipient, these are raw Donation objects
//                 if (dashboardState.available_donations.length === 0) {
//                     // Set a message if no available donations are found for recipient
//                     setNoAvailableDonationsMessage(profileData?.message || "No available donations found matching your criteria at this time.");
//                 }
//             }

//             // --- FETCH TOP USERS DATA (Separate endpoint call) ---
//             const topUsersRes = await fetch("http://localhost:8003/FoodBridge/donations/top-users/", {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Token ${token}`,
//                 },
//             });

//             const topUsersJson = await topUsersRes.json();
//             if (!topUsersRes.ok) {
//                 console.error("Failed to fetch top users:", topUsersJson?.error || topUsersJson?.detail);
//             } else {
//                 // Assign top users based on the user's role
//                 if (profileData?.profile?.role === 'donor' && topUsersJson.top_recipients) {
//                     dashboardState.topUsers = topUsersJson.top_recipients;
//                 } else if (profileData?.profile?.role === 'recipient' && topUsersJson.top_donors) {
//                     dashboardState.topUsers = topUsersJson.top_donors;
//                 }
//             }

//             // --- FETCH STATISTICS (Separate endpoint call) ---
//             try {
//                 const statsRes = await fetch("http://localhost:8003/FoodBridge/donations/statistics/", {
//                     method: "GET",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Token ${token}`,
//                     },
//                 });

//                 const statsJson = await statsRes.json();

//                 if (!statsRes.ok) {
//                     console.error("Failed to fetch statistics:", statsJson?.detail || statsJson?.error);
//                 } else {
//                     dashboardState.stats = statsJson as DashboardStatistics;
//                 }
//             } catch (statsError) {
//                 console.error("Error fetching statistics:", statsError);
//             }

//             // Set the complete dashboard data state
//             setDashData(dashboardState);

//         } catch (err) {
//             console.error("Dashboard fetch error:", err);
//             setFetchError("An error occurred while fetching dashboard data");
//         } finally {
//             setLoading(false); // End loading regardless of success or failure
//         }
//     };

//     // --- useEffect hook to trigger data fetching ---
//     // Fetches data on component mount and whenever the token, actionLoading, or actionError changes
//     // This ensures the dashboard refreshes after a match status update.
//     useEffect(() => {
//         fetchDashboardData();
//     }, [token, actionLoading, actionError]);

//     // --- Action Handlers ---

//     // Handler for recipient to accept, decline, or fulfill a DonationMatch
//     const handleRecipientMatchAction = async (matchId: number, newStatus: 'accepted' | 'declined' | 'fulfilled') => {
//         try {
//             clearActionError(); // Clear any previous action errors
//             await updateMatchStatus(matchId, newStatus); // Call the hook function
//             // The useEffect will trigger a re-fetch due to actionLoading changing
//         } catch (err) {
//             console.error("Error in handleRecipientMatchAction:", err);
//             // Error state will be handled by actionError from the hook
//         }
//     };

//     // Handler for donor to mark their own donation as 'unavailable'
//     const handleDonorDonationAction = async (donationId: number, newStatus: 'unavailable') => {
//         try {
//             clearActionError(); // Clear any previous action errors
//             await updateDonationStatus(donationId, newStatus); // Call the hook function
//             // The useEffect will trigger a re-fetch due to actionLoading changing
//         } catch (err) {
//             console.error("Error in handleDonorDonationAction:", err);
//             // Error state will be handled by actionError from the hook
//         }
//     };

//     // --- Render Logic ---
//     // Show loading indicator if initial data or an action is in progress
//     if (loading || actionLoading) return <div className="animate-pulse text-gray-500 text-center py-8">Loading dashboard...</div>;
//     // Show fetch error if any occurred
//     if (fetchError) return <div className="text-red-600 text-center py-8">Error: {fetchError}</div>;
//     // Show action-specific error if any occurred, with a dismiss button
//     if (actionError) return <div className="text-red-600 text-center py-8">Action Error: {actionError} <button onClick={clearActionError} className="underline ml-2">Dismiss</button></div>;
//     // If no data and no error, return null (shouldn't happen under normal circumstances)
//     if (!dashData) return null;

//     // Destructure data from the dashboard state
//     const { profile, matches, topUsers, stats } = dashData;
//     // Safely access role-specific donation lists, defaulting to empty arrays
//     const uploadedDonations = dashData.uploaded_donations || [];
//     const availableDonations = dashData.available_donations || []; // For recipient's initial available donations

//     // Check if user role is available
//     if (!profile?.role) {
//         return <div className="text-red-600 text-center py-8">Error: User role not found in profile data.</div>;
//     }
//     const role = profile.role.toLowerCase(); // Ensure role is lowercase for consistent comparison

//     // --- Filtering matches for display based on current user's role and match status ---

//     // For Recipient: Matches awaiting their acceptance/decline
//     const recipientPendingMatches = matches.filter(match => match.status === 'pending');
//     // For Recipient: Matches they have accepted, ready for pickup
//     const recipientAcceptedMatches = matches.filter(match => match.status === 'accepted');
//     // For Recipient & Donor: Matches that are completed (fulfilled) or resolved (declined by either party or system)
//     const completedOrDeclinedMatches = matches.filter(match =>
//         match.status === 'fulfilled' || match.status === 'declined' || match.status === 'declined_by_system'
//     );

//     // For Donor: Active matches (pending recipient's decision or accepted by recipient)
//     const donorActiveMatches = matches.filter(match => ['pending', 'accepted'].includes(match.status));

//     return (
//         <main className="flex-1 p-6 overflow-auto">
//             {/* Header and User Controls */}
//             <div className="flex items-center w-full justify-end">
//                 <div className="flex items-center space-x-4 ml-4">
//                     {/* New Donation button only for donors */}
//                     <Link to="/donate">
//                         {role === 'donor' && (
//                             <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
//                                 New Donation<Plus className='h-5 w-5 ml-2' />
//                             </button>
//                         )}
//                     </Link>
//                     <NotificationBell /> {/* Notification bell component */}
//                     <div className="relative group flex items-center">
//                         <CustomAvatar /> {/* User avatar */}
//                         <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                                 <ChevronDown className='h-5 w-5 ml-1 cursor-pointer' />
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent className="w-48">
//                                 {/* Optional: Display user profile details */}
//                                 {/* <DropdownMenuItem className="font-semibold">{profile.user.name}</DropdownMenuItem> */}
//                                 {/* <DropdownMenuItem className="text-sm text-gray-600 capitalize">{profile.role}</DropdownMenuItem> */}
//                                 {/* <DropdownMenuItem className="text-xs text-gray-500">{profile.user.email}</DropdownMenuItem> */}
//                                 <DropdownMenuItem>My Profile</DropdownMenuItem> {/* Example dropdown item */}
//                                 {/* Add Logout or other profile actions here */}
//                             </DropdownMenuContent>
//                         </DropdownMenu>
//                     </div>
//                 </div>
//             </div>

//             {/* --- Donor Dashboard Sections --- */}
//             {role === 'donor' && (
//                 <>
//                     <section className="mb-8">
//                         <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Your Uploaded Donations</h2>
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                             {uploadedDonations.length > 0 ? (
//                                 uploadedDonations.map((donation, i) => (
//                                     <div key={donation.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>
//                                         <div className="text-sm text-gray-700">Quantity: <strong>{donation.quantity} kg</strong></div>
//                                         <div className="text-sm text-gray-700">Expires: <strong>{new Date(donation.expiry_date).toLocaleDateString()}</strong></div>
//                                         <div className="text-sm text-gray-700">Status: <strong className={`capitalize ${
//                                             donation.status === 'pending' ? 'text-blue-600' :
//                                             donation.status === 'matched' ? 'text-orange-600' :
//                                             donation.status === 'fulfilled' ? 'text-green-600' :
//                                             (donation.status === 'declined_by_recipient' || donation.status === 'unavailable') ? 'text-red-600' :
//                                             'text-gray-700'
//                                         }`}>{donation.status.replace(/_/g, ' ')}</strong></div>
//                                         {/* Donor action to mark pending donation as unavailable */}
//                                         {donation.status === 'pending' && (
//                                             <button
//                                                 onClick={() => handleDonorDonationAction(donation.id, 'unavailable')}
//                                                 className="mt-3 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
//                                             >
//                                                 Mark Unavailable
//                                             </button>
//                                         )}
//                                     </div>
//                                 ))
//                             ) : (
//                                 <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 col-span-full">
//                                     <p className="text-lg font-medium">You haven't uploaded any donations yet.</p>
//                                     <Link to="/donate" className="text-blue-600 hover:underline mt-4 inline-block">Make your first donation!</Link>
//                                 </div>
//                             )}
//                         </div>
//                     </section>

//                     {/* Donor's Active Matches (Pending or Accepted by Recipient) */}
//                     {donorActiveMatches.length > 0 && (
//                         <section className="mb-8">
//                             <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Outgoing Match Requests</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                                 {donorActiveMatches.map((match, i) => (
//                                     <div key={match.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="matched donation" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
//                                         <p className="text-sm text-gray-700">Recipient: <span className="font-medium">{match.recipient_name}</span></p>
//                                         <p className="text-sm text-gray-700">Matched Quantity: {match.matched_quantity} kg</p>
//                                         <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                                         {match.expiry_date && <p className="text-sm text-gray-600">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>}
//                                         {match.created_at && <p className="text-sm text-gray-600">Offered On: {new Date(match.created_at).toLocaleDateString()}</p>}
//                                         <p className="text-sm text-gray-700">Status: <strong className={`capitalize ${
//                                             match.status === 'pending' ? 'text-blue-600' : 'text-green-600'
//                                         }`}>{match.status.replace(/_/g, ' ')}</strong></p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </section>
//                     )}

//                     {/* Donor's Match History (Declined or Fulfilled) */}
//                     {completedOrDeclinedMatches.length > 0 && (
//                         <section className="mb-8">
//                             <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Match History</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                                 {completedOrDeclinedMatches.map((match, i) => (
//                                     <div key={match.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="matched donation" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
//                                         <p className="text-sm text-gray-700">Recipient: <span className="font-medium">{match.recipient_name}</span></p>
//                                         <p className="text-sm text-gray-700">Matched Quantity: {match.matched_quantity} kg</p>
//                                         <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                                         {match.expiry_date && <p className="text-sm text-gray-600">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>}
//                                         {match.created_at && <p className="text-sm text-gray-600">Match Date: {new Date(match.created_at).toLocaleDateString()}</p>}
//                                         <p className="text-sm text-gray-700">Status: <strong className={`capitalize ${
//                                             match.status === 'fulfilled' ? 'text-purple-600' : 'text-red-600'
//                                         }`}>{match.status.replace(/_/g, ' ')}</strong></p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </section>
//                     )}
//                 </>
//             )}

//             {/* --- Recipient Dashboard Sections --- */}
//             {role === 'recipient' && (
//                 <>
//                     {/* Section 1: Available Donations (to request) - Reverted to showing Donation objects */}
//                     <section className="mb-8">
//                         <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">New Donations Available for You</h2>
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                             {availableDonations.length > 0 ? (
//                                 availableDonations.map((donation, i) => (
//                                     <div key={donation.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="donation image" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>
//                                         <p className="text-sm text-gray-700">Quantity: {donation.quantity} kg</p>
//                                         <p className="text-sm text-gray-600 italic mt-1">{donation.food_description}</p>
//                                         <p className="text-sm text-gray-600">Expires: {new Date(donation.expiry_date).toLocaleDateString()}</p>
//                                         <button
//                                             className="mt-3 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
//                                             disabled={true} // Still disabled until match creation/request logic is implemented
//                                         >
//                                             Request (Coming Soon)
//                                         </button>
//                                     </div>
//                                 ))
//                             ) : (
//                                 <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 col-span-full">
//                                     <p className="text-lg font-medium">
//                                         {noAvailableDonationsMessage || "No new donations found matching your criteria at this time. Please check back later or update your required food type."}
//                                     </p>
//                                 </div>
//                             )}
//                         </div>
//                     </section>

//                     {/* Section 2: Pending Match Offers (from backend, to accept/decline) */}
//                     {recipientPendingMatches.length > 0 && (
//                         <section className="mb-8">
//                             <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">New Match Offers for You</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                                 {recipientPendingMatches.map((match, i) => (
//                                     <div key={match.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="matched donation" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
//                                         <p className="text-sm text-gray-700">Donor: <span className="font-medium">{match.donor_name}</span></p>
//                                         <p className="text-sm text-gray-700">Offered Quantity: {match.matched_quantity} kg</p>
//                                         <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                                         {match.expiry_date && <p className="text-sm text-gray-600">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>}
//                                         {match.created_at && <p className="text-sm text-gray-600">Offer Date: {new Date(match.created_at).toLocaleDateString()}</p>}
//                                         <p className="text-sm text-gray-700">Status: <strong className={`capitalize text-blue-600`}>Pending</strong></p>

//                                         {/* Recipient Match Actions for pending offers */}
//                                         <div className="mt-3 flex space-x-2">
//                                             <button
//                                                 onClick={() => handleRecipientMatchAction(match.id, 'accepted')}
//                                                 className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
//                                             >
//                                                 Accept Offer
//                                             </button>
//                                             <button
//                                                 onClick={() => handleRecipientMatchAction(match.id, 'declined')}
//                                                 className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
//                                             >
//                                                 Decline Offer
//                                             </button>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </section>
//                     )}

//                     {/* Section 3: Accepted Matches (Ready for Pickup) */}
//                     {recipientAcceptedMatches.length > 0 && (
//                         <section className="mb-8">
//                             <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Your Accepted Matches (Ready for Pickup)</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                                 {recipientAcceptedMatches.map((match, i) => (
//                                     <div key={match.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="matched donation" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
//                                         <p className="text-sm text-gray-700">Donor: <span className="font-medium">{match.donor_name}</span></p>
//                                         <p className="text-sm text-gray-700">Matched Quantity: {match.matched_quantity} kg</p>
//                                         <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                                         {match.expiry_date && <p className="text-sm text-gray-600">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>}
//                                         {match.created_at && <p className="text-sm text-gray-600">Accepted On: {new Date(match.created_at).toLocaleDateString()}</p>}
//                                         <p className="text-sm text-gray-700">Status: <strong className={`capitalize text-green-600`}>Accepted</strong></p>

//                                         <button
//                                             onClick={() => handleRecipientMatchAction(match.id, 'fulfilled')}
//                                             className="mt-3 bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition-colors"
//                                         >
//                                             Mark as Picked Up
//                                         </button>
//                                     </div>
//                                 ))}
//                             </div>
//                         </section>
//                     )}

//                     {/* Section 4: Match History (Fulfilled/Declined/Declined by System) */}
//                     {completedOrDeclinedMatches.length > 0 && (
//                         <section className="mb-8">
//                             <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">Match History</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                                 {completedOrDeclinedMatches.map((match, i) => (
//                                     <div key={match.id || i} className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                                         <img src="/images/download (1).jpeg" alt="matched donation" className="rounded-md mb-3 w-full h-32 object-cover" />
//                                         <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
//                                         <p className="text-sm text-gray-700">Donor: <span className="font-medium">{match.donor_name}</span></p>
//                                         <p className="text-sm text-gray-700">Matched Quantity: {match.matched_quantity} kg</p>
//                                         <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                                         {match.expiry_date && <p className="text-sm text-gray-600">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>}
//                                         {match.created_at && <p className="text-sm text-gray-600">Match Date: {new Date(match.created_at).toLocaleDateString()}</p>}
//                                         <p className="text-sm text-gray-700">Status: <strong className={`capitalize ${
//                                             match.status === 'fulfilled' ? 'text-purple-600' : 'text-red-600'
//                                         }`}>{match.status.replace(/_/g, ' ')}</strong></p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </section>
//                     )}
//                 </>
//             )}

//             {/* --- General Sections (Top Users and Statistics) --- */}
//             <section className="mb-8">
//                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
//                     {/* Top Users List */}
//                     <div className="p-4 col-span-1 bg-white rounded-lg shadow border border-gray-200">
//                         <h3 className="font-semibold mb-3 text-xl text-gray-800 border-b pb-2">
//                             {role === 'donor' ? 'Top Recipients' : 'Top Donors'}
//                         </h3>
//                         <ul className="space-y-3">
//                             {topUsers.length > 0 ? (
//                                 topUsers.map((user, i) => (
//                                     <li key={i} className="flex justify-between items-center p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
//                                         <div className="flex items-center">
//                                             <CustomAvatar /> {/* Consider passing user.name or a relevant prop here */}
//                                             <span className='text-base ml-3 font-medium text-gray-800'>{user.name}</span>
//                                         </div>
//                                         <span className='text-base font-semibold text-indigo-700'>{user.total_quantity_kg}kg</span>
//                                     </li>
//                                 ))
//                             ) : (
//                                 <li className="text-sm text-gray-500 text-center py-4">No top {role === 'donor' ? 'recipients' : 'donors'} data available.</li>
//                             )}
//                         </ul>
//                     </div>

//                     {/* Statistics Section (Chart Placeholder and Sample Cards) */}
//                     <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="bg-white p-4 rounded-lg shadow col-span-full border border-gray-200">
//                             <h3 className="font-semibold mb-3 text-xl text-gray-800 border-b pb-2">Platform Overview</h3>
//                             <div className="h-48 bg-gray-100 flex items-center justify-center rounded-md text-gray-400">
//                                 [Chart Placeholder: Visualizing overall platform data, e.g., donation trends]
//                             </div>
//                         </div>
//                         {/* Example donation cards - these should ideally be dynamic based on more backend data or specific use cases */}
//                         <div className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                             <h3 className="font-semibold text-lg">Maize</h3>
//                             <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
//                             <div className="text-sm text-gray-700">Quantity: <strong>150,512kg</strong></div>
//                             <button className="mt-3 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
//                         </div>
//                         <div className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                             <h3 className="font-semibold text-lg">Rice</h3>
//                             <div className="text-sm text-gray-600 mb-2 font-medium">Kasarani</div>
//                             <div className="text-sm text-gray-700">Quantity: <strong>80,000kg</strong></div>
//                             <button className="mt-3 bg-orange-500 text-white px-3 py-1 rounded text-sm">Matched</button>
//                         </div>
//                         <div className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                             <h3 className="font-semibold text-lg">Beans</h3>
//                             <div className="text-sm text-gray-600 mb-2 font-medium">Rongai</div>
//                             <div className="text-sm text-gray-700">Quantity: <strong>120,000kg</strong></div>
//                             <button className="mt-3 bg-green-500 text-white px-3 py-1 rounded text-sm">Fulfilled</button>
//                         </div>
//                         <div className="bg-white p-4 rounded-lg shadow text-left border border-gray-200">
//                             <h3 className="font-semibold text-lg">Wheat Flour</h3>
//                             <div className="text-sm text-gray-600 mb-2 font-medium">Donholm</div>
//                             <div className="text-sm text-gray-700">Quantity: <strong>95,000kg</strong></div>
//                             <button className="mt-3 bg-red-500 text-white px-3 py-1 rounded text-sm">Unavailable</button>
//                         </div>
//                     </div>
//                 </div>
//             </section>


//             {/* --- Global Statistics Cards --- */}
//             <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
//                 <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                     <h4 className="text-sm text-gray-500 font-medium mb-1">
//                         {stats?.role === 'donor' && "Your Total Donations"}
//                         {stats?.role === 'recipient' && "Total Donations Received"}
//                         {stats?.role === 'admin' && "Platform Total Donations"}
//                     </h4>
//                     <p className="text-2xl font-bold text-indigo-700">
//                         {stats?.total_donations !== undefined ?
//                             `${stats.total_donations.toLocaleString()}` : 'N/A'}
//                     </p>
//                 </div>

//                 <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                     <h4 className="text-sm text-gray-500 font-medium mb-1">
//                         {stats?.role === 'donor' && "Donations Today"}
//                         {stats?.role === 'recipient' && "Received Today"}
//                         {stats?.role === 'admin' && "Platform Donations Today"}
//                     </h4>
//                     <p className="text-2xl font-bold text-green-600">
//                         {stats?.donations_today !== undefined ?
//                             `${stats.donations_today.toLocaleString()}` : 'N/A'}
//                     </p>
//                 </div>

//                 <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                     <h4 className="text-sm text-gray-500 font-medium mb-1">
//                         {stats?.role === 'donor' && "Avg. Donated Quantity"}
//                         {stats?.role === 'recipient' && "Avg. Received Quantity"}
//                         {stats?.role === 'admin' && "Platform Avg. Donation"}
//                     </h4>
//                     <p className="text-2xl font-bold text-purple-700">
//                         {stats?.average_donation !== undefined ?
//                             `${stats.average_donation.toFixed(2)} kg` : 'N/A'}
//                     </p>
//                 </div>

//                 {stats?.role === 'donor' && (
//                     <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                         <h4 className="text-sm text-gray-500 font-medium mb-1">Total Recipients Impacted</h4>
//                         <p className="text-2xl font-bold text-blue-700">
//                             {stats?.total_recipients !== undefined ?
//                                 stats.total_recipients.toLocaleString() : 'N/A'}
//                         </p>
//                     </div>
//                 )}

//                 {stats?.role === 'recipient' && (
//                     <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                         <h4 className="text-sm text-gray-500 font-medium mb-1">Total Donors Helped</h4>
//                         <p className="text-2xl font-bold text-blue-700">
//                             {stats?.total_donors !== undefined ?
//                                 stats.total_donors.toLocaleString() : 'N/A'}
//                         </p>
//                     </div>
//                 )}

//                 {/* Admin-specific statistics */}
//                 {stats?.role === 'admin' && (
//                     <>
//                         <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                             <h4 className="text-sm text-gray-500 font-medium mb-1">Platform Total Received</h4>
//                             <p className="text-2xl font-bold text-gray-800">
//                                 {stats?.total_platform_received !== undefined ?
//                                     `${stats.total_platform_received.toFixed(2)} kg` : 'N/A'}
//                             </p>
//                         </div>
//                         <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                             <h4 className="text-sm text-gray-500 font-medium mb-1">Platform Received Today</h4>
//                             <p className="text-2xl font-bold text-gray-800">
//                                 {stats?.platform_received_today !== undefined ?
//                                     `${stats.platform_received_today.toFixed(2)} kg` : 'N/A'}
//                             </p>
//                         </div>
//                         <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                             <h4 className="text-sm text-gray-500 font-medium mb-1">Total Donors Registered</h4>
//                             <p className="text-2xl font-bold text-gray-800">
//                                 {stats?.total_donors !== undefined ?
//                                     stats.total_donors.toLocaleString() : 'N/A'}
//                             </p>
//                         </div>
//                         <div className="bg-white p-4 rounded-lg shadow text-center border border-gray-200">
//                             <h4 className="text-sm text-gray-500 font-medium mb-1">Total Recipients Registered</h4>
//                             <p className="text-2xl font-bold text-gray-800">
//                                 {stats?.total_recipients !== undefined ?
//                                     stats.total_recipients.toLocaleString() : 'N/A'}
//                             </p>
//                         </div>
//                     </>
//                 )}
//             </section>
//         </main>
//     );
// };

// export default Dashboard;









   