import React, { useState, useEffect } from 'react';
import CustomAvatar from '../../UI/Avatar';
import { ChevronDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from '../../UI/DropdownMenu';
// import { useDonationActions } from '../hooks/useDonationsActions';
import NotificationBell from '../../notifications/NotificationBell';

// --- INTERFACES ---
interface User {
    name: string;
    role: string;
    email: string;
}

interface DashboardStatistics {
    role: string; // 'donor', 'recipient', 'admin'
    total_donations?: number; // Total donations relevant to the user/platform
    donations_today?: number; // Donations relevant today
    total_donors?: number; // Total donors registered (for admin/recipient)
    total_recipients?: number; // Total recipients registered (for admin/donor)
    average_donation?: number; // Average donation quantity
    total_platform_received?: number; // Total received by platform (for admin)
    platform_received_today?: number; // Received by platform today (for admin)
}

interface TopUser {
    name: string;
    total_quantity_kg: number;
}

interface Profile {
    user: User;
    role: string;
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
    match_score?: number;
    status: 'pending' | 'accepted' | 'declined' | 'fulfilled' | 'declined_by_system';
    created_at?: string;
}

interface Donation {
    id: number;
    food_type: string;
    quantity: number;
    expiry_date: string;
    food_description?: string;
    status: 'pending' | 'matched' | 'declined_by_recipient' | 'fulfilled' | 'unavailable'; 
    created_at?: string;
}

interface DashboardData {
    profile: Profile;
    uploaded_donations?: Donation[]; 
    available_donations?: Donation[];
    matches: DonationMatch[];
    topUsers: TopUser[];
    stats: DashboardStatistics;
    message?: string;
}

const Dashboard: React.FC = () => {
    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore(state => state.token);
    const [error, setError] = useState<string | null>(null);
    

     useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          setError(null);
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
    
          const dashboardState: DashboardData = {
                profile: profileData.profile,
                matches: profileData.matches || [],
                topUsers: [], 
                stats: {} as DashboardStatistics,
                message : profileData.message
            };


    
          if (profileData?.profile?.role === 'donor') {
            dashboardState.uploaded_donations = profileData.uploaded_donations || []
           
          } else if (profileData?.profile?.role === 'recipient') {
            dashboardState.available_donations = profileData.available_donations || []
            // if (dashboardState.available_donations.length === 0 && dashboardState.matches.length === 0) {
                    //     setNoDataMessage(dashboardState.message || "No available donations or existing matches at this time.");
                    // }
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
                 } else {
                       if (profileData?.profile?.role === 'donor' && topUsersJson.top_recipients) {
                            dashboardState.topUsers = topUsersJson.top_recipients;
                       
                          } else if (profileData?.profile?.role === 'recipient' && topUsersJson.top_donors) {
                            dashboardState.topUsers = topUsersJson.top_donors;
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
                    dashboardState.stats = statsJson as DashboardStatistics;
                }
            } catch (statsError) {
                console.error("Error fetching statistics:", statsError);
            }
    
    
          setDashData(dashboardState);
    
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
     
     const { profile,uploaded_donations,topUsers,available_donations} = dashData;
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
                <DropdownMenu >
                    <DropdownMenuTrigger>
                            <ChevronDown className='h-8 w-8 px-1'/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            Recipient
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
             
            <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
            {/*  uploaded donations by donor */}
            {role === 'donor' && uploaded_donations?.map((donation) => (
            <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
                <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                <h3 className="font-semibold">{donation.food_type}</h3>
                <div className="text-sm">Quantity: <strong>{donation.quantity}</strong></div>
                <div className="text-sm">Expires: <strong>{new Date(donation.expiry_date).toLocaleDateString()}</strong></div>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
               
        </div>
            ))}
               
          {/* available donations for recipient  */}
            {role === 'recipient' && available_donations?.map((donation) => (
            <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
                <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                <h3 className="font-semibold">{donation.food_type}</h3>
                <div className="text-sm">Quantity: <strong>{donation.quantity}</strong></div>
                <div className="text-sm">Expires: <strong>{new Date(donation.expiry_date).toLocaleDateString()}</strong></div>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
               
            </div>
            ))}


            </div>

               {/* Top Users list based on role */}
              <div className="p-4 col-span-1">                              
              <h3 className="font-semibold mb-2">
              {role === 'donor' ? 'Top Recipients' : 'Top Donors'}</h3>
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