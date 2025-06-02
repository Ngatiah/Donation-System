import React, { useState, useEffect } from 'react';
import CustomAvatar from '../UI/Avatar'
import {  Plus } from 'lucide-react'
import { Link,useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../notifications/NotificationBell'
import UploadedDonations from '../donations/UploadedDonations';
import AllMatches from '../donations/AllMatches'; 
import {DropdownMenu,Button} from '@radix-ui/themes'
interface TopUser {
    name: string;
    total_quantity_kg: number;
}

interface Profile {
    role: string;
    donor_name:string;
    recipient_name:string;
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
    stats : DashboardStatistics

}

const Dashboard: React.FC = () => {
    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = useAuthStore(state => state.token);
    const navigate = useNavigate()


    // Helper to fetch all dashboard data
    const fetchAllDashboardData = async () => {
        try {
            setError(null);
            setLoading(true);

            // 1. Fetch Profile Data
            const profileRes = await fetch("http://localhost:8003/FoodBridge/donations/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            const responseData = await profileRes.json();
            if (!profileRes.ok) {
                setError(responseData?.detail || "Failed to fetch user profile");
                return;
            }

            // Extract the actual profile object from the response
            const userProfile: Profile = {
                role: responseData.profile.role,
                donor_name: responseData.profile.donor_name,
                recipient_name :responseData.profile.recipient_name,
                required_food_type: responseData.profile.required_food_type,
                required_quantity: responseData.profile.required_quantity,
            };


            let donationData: Donation[] = [];
            let allMatchesHistoryData: DonationMatch[] = [];
            let topUsersData: TopUser[] = [];
            let statsData : DashboardStatistics[] = []


            // 2. Fetch User's Donations (for donor) if applicable
            if (userProfile.role === 'donor') {
                    const donorDonationsRes = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Token ${token}`,
                        },
                    });
                    const donorDonationsJson = await donorDonationsRes.json();
                    if (!donorDonationsRes.ok) throw new Error(donorDonationsJson?.detail || "Failed to fetch donor's donations");
                    donationData = donorDonationsJson;
            }

         else if(userProfile.role === 'recipient')  { 
            const matchHistoryRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-history/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            const matchHistoryJson = await matchHistoryRes.json();
            if (!matchHistoryRes.ok) {
                console.error("Failed to fetch match history:", matchHistoryJson?.detail);
                allMatchesHistoryData = [];
            } else {
                allMatchesHistoryData = matchHistoryJson || [];
            }
}

            // 3. Fetch Top Users Data
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
                if (userProfile.role === 'donor' && topUsersJson.top_recipients) {
                    topUsersData = topUsersJson.top_recipients;
                } else if (userProfile.role === 'recipient' && topUsersJson.top_donors) {
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
                    statsData = statsJson;
                }
            } catch (statsError) {
                console.error("Error fetching statistics:", statsError);
            }

            setDashData({
                profile :userProfile,
                donations: donationData,
                all_matches_history: allMatchesHistoryData,
                topUsers: topUsersData,
                stats : statsData
            });

        } catch (err: any) {
            console.error("Dashboard data fetch error:", err);
            setError(err.message || "An error occurred while fetching dashboard data.");
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
        setDashData(prevDashData => {
            if (!prevDashData) return null;
            // Update the is_claimed status to true for the specific match
            const updatedMatches = prevDashData.all_matches_history.map(match =>
                match.id === claimedMatchId ? { ...match, is_claimed: true } : match
            );
            return { ...prevDashData, all_matches_history: updatedMatches };
        });
    };


    if (loading) return <div className="animate-pulse text-gray-500">Loading dashboard...</div>
    if (error) return <div>Error: {error}</div>;
    if (!dashData) return null;

    const { profile, all_matches_history, donations, topUsers ,stats} = dashData;
    const role = profile.role;
    // const name = profile.name;
    console.log("Current user role:", role);

    if (!role) {
      return <div>Error: User role not found in profile data. Please log in.</div>;
    }

    // Filter unclaimed matches for recipients specifically for the dashboard display
    // const unclaimedRecipientMatches = all_matches_history.filter(match =>
    //    profile &&  match.recipient_name  profile.recipient_name && !match.is_claimed
    // );
    const unclaimedRecipientMatches = all_matches_history.filter(match =>
       match.recipient_name && !match.is_claimed
    );
    
    const visibleDonatons = donations.slice(0,3)


    return (
        <main className="flex-1 p-6 w-full">
            <div className="flex items-center w-full justify-end">
                <div className="flex items-center space-x-4 ml-4">
                    
                    <Link to="/donate">
                    {role === 'donor' &&
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <span>New Donation</span>
                            <Plus className='h-5 w-5' />
                        </button>
                    }
                </Link>

                    <NotificationBell />

                    {/* Avatar with Dropdown */}
                    <div className="relative group flex flex-cols items-center justify-center gap-1">
                        <CustomAvatar />
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <Button variant='soft'>
                                {role == 'recipient' ? profile.recipient_name : profile.donor_name}
                                <DropdownMenu.TriggerIcon/>
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                <DropdownMenu.Item onClick={()=>navigate('/view-profile')}>
                                  Profile
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator/>
                                <DropdownMenu.Item onClick={()=>navigate('/logout')}>
                                    Logout
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>

                        </DropdownMenu.Root>
                        
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <section className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="p-4 col-span-3">

                <div className='flex justify-between items-center'>
                    <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">
                         {role === 'donor' ? 'Your Donations' : 'Available Donations'}
                    </h2>
                    <Link className="text-2xl/10 font-bold mb-4 px-2 text-sky-400 hover:underline" to="/view-more">See More</Link>
                </div>

                {/* render donations or matches */}
                <div>
                    {role === 'donor' && <UploadedDonations donations={visibleDonatons}/>}

                    {/* unclaimed donation matches for recipient - */}
                    {role === 'recipient' && (
                        // Pass only the unclaimed matches to AllMatches for the dashboard preview
                        <AllMatches
                            profile={profile}
                            initialMatches={unclaimedRecipientMatches} 
                            // initialMatches={all_matches_history} 
                            onClaimSuccess={handleClaimSuccess}
                        />
                    )}
               </div>

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

            </section>

            {/* Statistics and other sections (assuming these are placeholders) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded shadow col-span-2">
                    <h3 className="font-semibold mb-2">Statistics</h3>
                    <div className="h-48 bg-gray-200 flex items-center justify-center">[Chart Placeholder]</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1">
                    <div className="bg-white p-4 rounded shadow text-left">
                        <h3 className="font-semibold">Maize</h3>
                        <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                        <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
                    </div>
                    <div className="bg-white p-4 rounded shadow text-left">
                        <h3 className="font-semibold">Maize</h3>
                        <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                        <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
                    </div>
                    <div className="bg-white p-4 rounded shadow text-left">
                        <h3 className="font-semibold">Maize</h3>
                        <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                        <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
                    </div>
                    <div className="bg-white p-4 rounded shadow text-left">
                        <h3 className="font-semibold">Maize</h3>
                        <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                        <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
                    </div>
                </div>
            </section>

            
        {/* donations,users and match stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {stats?.role === 'donor' && "Your Total Donations"}
                {stats?.role === 'recipient' && "Total Donations Received"}
                {stats?.role === 'admin' && "Platform Total Donations"}
                
            </h4>
            <p className="text-lg font-bold">
                {stats.total_donations !== undefined ?
                `${stats.total_donations}` : 'N/A'}
            </p>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {stats?.role === 'donor' && "Total Donations Today"}
                {stats?.role === 'recipient' && "Donations Received Today"}
                {stats?.role === 'admin' && "Platform Donations Today"}
            </h4>
            <p className="text-lg font-bold">
                {stats.donations_today !== undefined ?
                `${stats.donations_today}` : 'N/A'}
            </p>
        </div>

         <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {stats?.role === 'donor' && "Total Claimed Donations"}
                {stats?.role === 'recipient' && "Total Claimed Donations"}
                {stats?.role === 'admin' && "Platform Total Claimed Donations"}
                
            </h4>
            <p className="text-lg font-bold">
                {stats.total_donations !== undefined ?
                `${stats.claimed_donations}` : 'N/A'}
            </p>
        </div>

        <div className="bg-white p-4 rounded shadow text-center">
            <h4 className="text-sm text-gray-500">
                {stats?.role === 'donor' && "Avg. Donations"}
                {stats?.role === 'recipient' && "Avg. Donations Received"}
                {stats?.role === 'admin' && "Platform Avg. Donations"}
            </h4>
            <p className="text-lg font-bold">
                {stats.average_donation !== undefined ?
                `${stats.average_donation}` : 'N/A'}
            </p>
        </div>

        {/* Conditional display for Total Donors/Recipients based on role */}
        {/* Donors see Total Recipients */}
        {stats?.role === 'donor' && (
            <div className="bg-white p-4 rounded shadow text-center">
                <h4 className="text-sm text-gray-500">Total Recipients</h4>
                <p className="text-lg font-bold">
                    {stats.total_recipients !== undefined ?
                    stats.total_recipients.toLocaleString() : 'N/A'}
                </p>
            </div>
        )}

        {/* Recipients see Total Donors */}
        {stats?.role === 'recipient' && (
            <div className="bg-white p-4 rounded shadow text-center">
                <h4 className="text-sm text-gray-500">Total Donors</h4>
                <p className="text-lg font-bold">
                    {stats.total_donors !== undefined ?
                    stats.total_donors.toLocaleString() : 'N/A'}
                </p>
            </div>
        )}



        {/* Additional Admin-specific stats - These remain ONLY for admin */}
        {stats?.role === 'admin' && (
            <>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Platform Total Received</h4>
                    <p className="text-lg font-bold">
                        {stats.total_platform_received !== undefined ?
                        `${stats.total_platform_received.toFixed(2)}kg` : 'N/A'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Platform Received Today</h4>
                    <p className="text-lg font-bold">
                        {stats.platform_received_today !== undefined ?
                        `${stats.platform_received_today.toFixed(2)}kg` : 'N/A'}
                    </p>
                </div>
                {/* Admin sees both total donors and total recipients */}
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Total Donors Registered</h4>
                    <p className="text-lg font-bold">
                        {stats.total_donors !== undefined ?
                        stats.total_donors.toLocaleString() : 'N/A'}
                    </p>
                </div>
                <div className="bg-white p-4 rounded shadow text-center">
                    <h4 className="text-sm text-gray-500">Total Recipients Registered</h4>
                    <p className="text-lg font-bold">
                        {stats.total_recipients !== undefined ?
                        stats.total_recipients.toLocaleString() : 'N/A'}
                    </p>
                </div>
            </>
        )}
    </section>

        </main>
    );
};

export default Dashboard;